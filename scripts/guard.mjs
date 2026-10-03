#!/usr/bin/env node
/**
 * guard.mjs — injection WATCHDOG for observed-UI-test sessions.
 *
 * It observes input-injection directives; it never performs one. Everything here is a read:
 * process listing, and text scanning of the session's own plan and findings. There is no
 * pointer, touch or key event, no accessibility control, no automation driver, and no
 * subcommand that could produce one.
 *
 * 只"看"注入，不"做"注入：本工具扫描进程与计划文本，把违规线索记成合规证据。
 *
 * Why it exists / 为什么需要它：
 *   测试纪律要求"机器上不允许有自动化工具在跑"。这个守门器把这条纪律变成可检查的事实：
 *   跑测试之前扫一遍，测试期间每隔几秒盯一遍，任何疑似注入工具出现就写进 evidence/compliance.jsonl，
 *   最终出现在报告里。它不能证明"绝对没有注入"，但能让偷用注入留下痕迹。
 *
 * Usage / 用法:
 *   node scripts/guard.mjs scan  [<session>] [--json]
 *   node scripts/guard.mjs watch <session> --seconds 300 [--interval 5]
 */

import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { appendFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

/** Tokens that betray an input-injection or UI-automation surface. */
const PROCESS_TOKENS = [
  ['cliclick', 'macOS 命令行合成鼠标/按键 / CLI pointer and key injection'],
  ['pyautogui', 'Python 合成输入 / synthetic input'],
  ['autohotkey', 'Windows 宏与合成输入 / macro and synthetic input'],
  ['ahk_', 'AutoHotkey 运行进程 / AutoHotkey host'],
  ['appium', 'UI 自动化框架 / UI automation framework'],
  ['webdriveragent', 'iOS 自动化驱动 / iOS automation driver'],
  ['wda-runner', 'iOS 自动化驱动 / iOS automation driver'],
  ['idb', 'iOS 注入式交互 / iOS injected interaction'],
  ['scrcpy', 'Android 投屏控制 / Android mirroring with control'],
  ['xdotool', 'X11 合成输入 / X11 synthetic input'],
  ['wtype', 'Wayland 合成输入 / Wayland synthetic input'],
  ['ydotool', 'Wayland 合成输入 / Wayland synthetic input'],
  ['playwright', '浏览器自动化 / browser automation'],
  ['puppeteer', '浏览器自动化 / browser automation'],
  ['selenium', '浏览器自动化 / browser automation'],
  ['chromedriver', '浏览器自动化 / browser automation'],
  ['geckodriver', '浏览器自动化 / browser automation'],
  ['wda', 'iOS 自动化驱动 / iOS automation driver'],
  ['robotframework', '自动化测试框架 / automation framework'],
  ['sikuli', '图像识别点击 / image-driven clicking'],
  ['macrodroid', 'Android 宏 / Android macro'],
  ['nircmd', 'Windows 合成输入 / Windows synthetic input'],
  ['xcodebuild', '可能是 XCUITest 自动化 / possibly XCUITest automation'],
  ['remote-debugging-port', '浏览器 CDP 自动化入口 / browser CDP automation endpoint'],
  ['--headless', '无头浏览器（无法作为真实界面证据）/ headless browser (no real UI evidence)'],
]

/** Directive names banned inside a written test plan. */
const PLAN_TOKENS = [
  'CGEventPost',
  'CGEventCreateMouseEvent',
  'CGWarpMouseCursorPosition',
  'IOHIDPostEvent',
  'cliclick',
  'AXUIElementPerformAction',
  'kAXPressAction',
  'XCUIElement',
  'SendInput',
  'mouse_event',
  'keybd_event',
  'SetCursorPos',
  'WM_LBUTTONDOWN',
  'SendKeys',
  'InvokePattern',
  'adb shell input',
  'input tap',
  'dispatchEvent',
  'dispatchMouseEvent',
  'element.click()',
  'page.click',
  'pyautogui',
  'AutoHotkey',
  'osascript -e',
  "System Events",
]

const isMain = () =>
  process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)

const nowIso = () => new Date().toISOString()

function listProcesses() {
  if (process.platform === 'win32') {
    const shell = findOnPath('pwsh') ?? findOnPath('powershell')
    if (shell === null) return []
    const result = spawnSync(shell, [
      '-NoProfile',
      '-Command',
      'Get-CimInstance Win32_Process | ForEach-Object { "$($_.ProcessId) $($_.CommandLine)" }',
    ], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
    if (result.status !== 0 || !result.stdout) return []
    return result.stdout
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const space = line.indexOf(' ')
        return { pid: Number(line.slice(0, space)), command: space > 0 ? line.slice(space + 1) : line }
      })
  }
  const result = spawnSync('ps', ['-ax', '-o', 'pid=,args='], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
  if (result.status !== 0 || !result.stdout) return []
  return result.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const space = line.indexOf(' ')
      return { pid: Number(line.slice(0, space)), command: space > 0 ? line.slice(space + 1) : line }
    })
}

function findOnPath(command) {
  const probe = process.platform === 'win32' ? 'where' : 'which'
  const result = spawnSync(probe, [command], { encoding: 'utf8' })
  return result.status === 0 ? String(result.stdout).trim().split('\n')[0].trim() : null
}

/** Read-only scan: which running processes look like input-injection surfaces. */
function scanProcesses() {
  const hits = []
  for (const process_ of listProcesses()) {
    const haystack = process_.command.toLowerCase()
    for (const [token, reason] of PROCESS_TOKENS) {
      if (haystack.includes(token.toLowerCase())) {
        hits.push({ kind: 'process', pid: process_.pid, command: process_.command.slice(0, 240), token, reason })
      }
    }
  }
  return hits
}

/** Read-only scan: does the session's own written plan name a banned directive? */
async function scanSessionText(dir) {
  const hits = []
  let entries = []
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return hits
  }
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue
    const file = join(dir, entry.name)
    const lines = (await readFile(file, 'utf8')).split('\n')
    for (const [index, line] of lines.entries()) {
      for (const token of PLAN_TOKENS) {
        if (line.includes(token)) {
          hits.push({ kind: 'plan-text', file: entry.name, line: index + 1, token, text: line.trim().slice(0, 200) })
        }
      }
    }
  }
  if (existsSync(join(dir, 'findings.jsonl'))) {
    const lines = (await readFile(join(dir, 'findings.jsonl'), 'utf8')).split('\n')
    for (const [index, line] of lines.entries()) {
      for (const token of PLAN_TOKENS) {
        if (line.includes(token)) {
          hits.push({ kind: 'finding-text', file: 'findings.jsonl', line: index + 1, token, text: line.trim().slice(0, 200) })
        }
      }
    }
  }
  return hits
}

async function appendCompliance(dir, records) {
  if (records.length === 0) return
  await mkdir(join(dir, 'evidence'), { recursive: true })
  await appendFile(
    join(dir, 'evidence', 'compliance.jsonl'),
    records.map((record) => JSON.stringify(record)).join('\n') + '\n',
    'utf8',
  )
}

function printHits(hits, label) {
  if (hits.length === 0) {
    process.stdout.write(`  ${label}: 未发现 / none found\n`)
    return
  }
  for (const hit of hits) {
    if (hit.kind === 'process') {
      process.stdout.write(`  [疑似注入进程 / suspected injection process] pid=${hit.pid} token=${hit.token} — ${hit.reason}\n`)
      process.stdout.write(`      ${hit.command}\n`)
    } else {
      process.stdout.write(`  [计划里出现被禁指令 / banned directive in text] ${hit.file}:${hit.line} token=${hit.token}\n`)
      process.stdout.write(`      ${hit.text}\n`)
    }
  }
}

async function cmdScan(positionals) {
  process.stdout.write('输入注入观察 / injection watch (read-only; observes, never performs)\n')
  const hits = scanProcesses()
  printHits(hits, '运行中的注入类工具 injection tooling in processes')

  let sessionHits = []
  const target = positionals[0]
  if (target) {
    const dir = resolve(target)
    if (!existsSync(join(dir, 'session.json'))) {
      throw new Error(`not an observed-UI-test session (no session.json): ${dir}`)
    }
    sessionHits = await scanSessionText(dir)
    printHits(sessionHits, '测试文本里的被禁指令 banned directives in session text')
    const record = {
      at: nowIso(),
      kind: 'scan',
      processHits: hits,
      textHits: sessionHits,
      clean: hits.length === 0 && sessionHits.length === 0,
    }
    await appendCompliance(dir, [record])
    await writeFile(join(dir, 'evidence', 'compliance-scan.json'), JSON.stringify(record, null, 2) + '\n', 'utf8')
    process.stdout.write(`  已写入 / written: ${join(dir, 'evidence', 'compliance.jsonl')}\n`)
  }

  process.stdout.write('\n人工核对 / manual checks:\n')
  process.stdout.write('  - macOS 辅助功能/输入监控权限是否授予了非必要应用（本方法不需要控制权限）\n')
  process.stdout.write('  - 键盘宏、按键精灵、RPA、浏览器自动化扩展是否已退出\n')
  process.stdout.write('  - 被测机器上的远程控制软件是否已关闭\n')
  process.stdout.write(
    `\n结论 / result: ${hits.length + sessionHits.length === 0 ? '未见注入线索 (not proof of absence)' : '发现疑似注入线索，需人工确认并记录 / suspected injection found, confirm by hand'}\n`,
  )
  return hits.length + sessionHits.length === 0 ? 0 : 1
}

async function cmdWatch(positionals, values) {
  const dir = resolve(positionals[0] ?? '')
  if (!existsSync(join(dir, 'session.json'))) {
    throw new Error(`not an observed-UI-test session (no session.json): ${dir}`)
  }
  const seconds = Number(values.seconds ?? 300)
  const interval = Math.max(1, Number(values.interval ?? 5))
  if (!Number.isFinite(seconds) || seconds < 1) throw new Error('--seconds must be a positive number')

  const seen = new Set()
  const startedAt = Date.now()
  process.stdout.write(
    `开始监视注入线索 / watching for injection for ${seconds}s (every ${interval}s). ` +
      `本进程只读进程表，不注入任何输入。\n`,
  )
  let total = 0
  while ((Date.now() - startedAt) / 1000 < seconds) {
    const hits = scanProcesses()
    const fresh = hits.filter((hit) => {
      const key = `${hit.pid}|${hit.token}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    if (fresh.length > 0) {
      total += fresh.length
      printHits(fresh, '新发现 / newly seen')
      await appendCompliance(dir, fresh.map((hit) => ({ at: nowIso(), kind: 'process', ...hit })))
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, interval * 1000))
  }
  if (total === 0) {
    await appendCompliance(dir, [{ at: nowIso(), kind: 'watch', seconds, interval, clean: true }])
  }
  process.stdout.write(
    `监视结束 / watch finished. 新线索 new hits: ${total}. 记录 / log: evidence/compliance.jsonl\n`,
  )
  return total === 0 ? 0 : 1
}

async function main() {
  const { positionals, values } = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    options: {
      seconds: { type: 'string' },
      interval: { type: 'string' },
    },
  })
  const command = positionals.shift() ?? 'scan'
  try {
    if (command === 'scan') return await cmdScan(positionals)
    if (command === 'watch') return await cmdWatch(positionals, values)
    if (command === 'help' || command === '--help' || command === '-h') {
      process.stdout.write(
        'guard.mjs — observe injection directives (read-only)\n\n' +
          '  scan  [<session>]\n  watch <session> --seconds 300 [--interval 5]\n',
      )
      return 0
    }
    process.stderr.write(`unknown command: ${command}\n`)
    return 2
  } catch (error) {
    process.stderr.write(`error: ${error.message}\n`)
    return 2
  }
}

if (isMain()) {
  process.exitCode = await main()
}

export { PLAN_TOKENS, PROCESS_TOKENS, scanProcesses, scanSessionText }
