#!/usr/bin/env node
/**
 * capture.mjs — read-only screen capture for observed-UI-test sessions.
 *
 * READ-ONLY BY CONSTRUCTION. This file contains no pointer, touch or key events, no
 * accessibility control, no automation driver, and no "input" subcommand. It only
 * records what is already on the screen, so the evidence chain stays legitimate and
 * the tester remains the only hand on the machine.
 *
 * 只读捕获：本文件不含任何输入注入能力，也不提供任何"输入"子命令。
 *
 * Usage / 用法:
 *   node scripts/capture.mjs check
 *   node scripts/capture.mjs shot   <session> --label L1-07-after [--target macos|ios-sim|android|windows]
 *                                                    [--window] [--note "..."]
 *   node scripts/capture.mjs record <session> --label L1 --seconds 60 [--target ...] [--note "..."]
 */

import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { appendFile, mkdir, open, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const TARGETS = ['macos', 'windows', 'ios-sim', 'android']

const stamp = () => new Date().toISOString().replace(/[:.]/g, '-')
const isMain = () =>
  process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)

function usage() {
  return `observed-ui-test capture tool (read-only; never injects input)

  check
  shot   <session> --label <label> [--target ${TARGETS.join('|')}] [--window] [--note "..."]
  record <session> --label <label> --seconds <n> [--target ${TARGETS.join('|')}] [--note "..."]

Targets default to the host: ${process.platform === 'darwin' ? 'macos' : process.platform === 'win32' ? 'windows' : 'macos'}.

This tool captures only. For the banned list of input-injecting directives see the
observed-ui-test skill: BANNED-INPUTS.md.
`
}

function which(command) {
  const probe = process.platform === 'win32' ? 'where' : 'which'
  const result = spawnSync(probe, [command], { encoding: 'utf8' })
  return result.status === 0 ? String(result.stdout).trim().split('\n')[0].trim() : null
}

function defaultTarget() {
  if (process.platform === 'darwin') return 'macos'
  if (process.platform === 'win32') return 'windows'
  return 'macos'
}

async function requireSession(dir) {
  const file = join(dir, 'session.json')
  if (!existsSync(file)) {
    throw new Error(`not an observed-UI-test session (no session.json): ${dir}`)
  }
  return JSON.parse(await readFile(file, 'utf8'))
}

async function noteEvidence(dir, record) {
  await mkdir(join(dir, 'evidence'), { recursive: true })
  await appendFile(join(dir, 'evidence', 'index.jsonl'), JSON.stringify(record) + '\n', 'utf8')
}

function describeTools() {
  const rows = [
    ['screencapture', which('screencapture'), 'macOS 截屏/录屏 (screenshot + video)'],
    ['xcrun', which('xcrun'), 'iOS/iPadOS 模拟器捕获 (simctl screenshot/recordVideo)'],
    ['adb', which('adb'), 'Android 只读捕获 (screencap/screenrecord)'],
    [
      'powershell',
      which('powershell') ?? which('pwsh'),
      'Windows 只读截屏 (System.Drawing screen capture)',
    ],
  ]
  return rows
}

async function cmdCheck() {
  const lines = [
    '只读捕获自检 / read-only capture self-check',
    `主机 platform: ${process.platform}  默认目标 default target: ${defaultTarget()}`,
    '',
    '工具 tool                   路径 path                         用途 purpose',
  ]
  for (const [name, path, purpose] of describeTools()) {
    lines.push(`  ${name.padEnd(24)} ${(path ?? '(unavailable)').padEnd(32)} ${purpose}`)
  }
  lines.push('')
  lines.push('合规 / compliance:')
  lines.push('  - 本工具只读屏，不注入鼠标/触摸/按键 / capture only, no pointer, touch or key events')
  lines.push('  - macOS 首次截屏会触发「屏幕录制」权限提示；授予后需重启应用')
  lines.push('    macOS triggers the Screen Recording prompt; restart the app after granting')
  lines.push('  - iPhone/iPad 真机请用控制中心录屏或 QuickTime 连续互通')
  lines.push('  - Windows 录屏请人工按 Win+G（Game Bar）；截屏由本工具完成')
  lines.push('')
  lines.push('下一步 / next: node scripts/capture.mjs shot <session> --label permission-probe')
  process.stdout.write(lines.join('\n') + '\n')
  return 0
}

function runWithTimeout(command, args, seconds, options = {}) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, { stdio: options.stdio ?? 'inherit' })
    const timer = setTimeout(() => {
      child.kill('SIGINT')
    }, Math.max(1, seconds) * 1000)
    child.on('error', (error) => {
      clearTimeout(timer)
      rejectPromise(error)
    })
    child.on('exit', (code, signal) => {
      clearTimeout(timer)
      resolvePromise({ code, signal })
    })
  })
}

function runSync(command, args) {
  return spawnSync(command, args, { encoding: 'utf8' })
}

async function captureStill(target, file, options) {
  if (target === 'macos') {
    const args = options.window ? ['-x', '-w', file] : ['-x', file]
    if (options.window) {
      process.stdout.write('请用鼠标点击要截取的窗口 / click the window to capture…\n')
    }
    const result = runSync('screencapture', args)
    if (result.status !== 0) {
      throw new Error(`screencapture failed: ${result.stderr || result.status}`)
    }
    return
  }
  if (target === 'ios-sim') {
    const result = runSync('xcrun', ['simctl', 'io', 'booted', 'screenshot', file])
    if (result.status !== 0) {
      throw new Error(`simctl screenshot failed: ${result.stderr || result.status}`)
    }
    return
  }
  if (target === 'android') {
    const handle = await open(file, 'w')
    try {
      const result = await new Promise((resolvePromise) => {
        const child = spawn('adb', ['exec-out', 'screencap', '-p'], { stdio: ['ignore', handle.fd, 'inherit'] })
        child.on('error', () => resolvePromise({ status: 1 }))
        child.on('exit', (code) => resolvePromise({ status: code }))
      })
      if (result.status !== 0) throw new Error('adb screencap failed')
    } finally {
      await handle.close()
    }
    return
  }
  if (target === 'windows') {
    const script = [
      'Add-Type -AssemblyName System.Drawing,System.Windows.Forms;',
      '$b = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds;',
      '$bmp = New-Object System.Drawing.Bitmap $b.Width, $b.Height;',
      '$g = [System.Drawing.Graphics]::FromImage($bmp);',
      '$g.CopyFromScreen($b.Location, [System.Drawing.Point]::Empty, $b.Size);',
      `$bmp.Save('${file.replace(/'/g, "''")}');`,
    ].join(' ')
    const shell = which('pwsh') ?? which('powershell')
    if (shell === null) throw new Error('no PowerShell available for Windows capture')
    const result = runSync(shell, ['-NoProfile', '-Command', script])
    if (result.status !== 0) throw new Error(`PowerShell capture failed: ${result.stderr || result.status}`)
    return
  }
  throw new Error(`unsupported target: ${target}`)
}

async function captureVideo(target, file, seconds) {
  if (target === 'macos') {
    const result = await runWithTimeout('screencapture', ['-v', file], seconds)
    if (result.code !== 0 && result.code !== null) {
      throw new Error(`screencapture -v exited with ${result.code}`)
    }
    return
  }
  if (target === 'ios-sim') {
    const result = await runWithTimeout(
      'xcrun',
      ['simctl', 'io', 'booted', 'recordVideo', '--codec', 'h264', file],
      seconds,
    )
    if (result.code !== 0 && result.code !== null) {
      throw new Error(`simctl recordVideo exited with ${result.code}`)
    }
    return
  }
  if (target === 'android') {
    const remote = `/sdcard/observed-ui-test-${Date.now()}.mp4`
    const result = runSync('adb', [
      'shell',
      'screenrecord',
      '--time-limit',
      String(seconds),
      remote,
    ])
    if (result.status !== 0) throw new Error(`adb screenrecord failed: ${result.stderr}`)
    const pull = runSync('adb', ['pull', remote, file])
    if (pull.status !== 0) throw new Error(`adb pull failed: ${pull.stderr}`)
    runSync('adb', ['shell', 'rm', '-f', remote])
    return
  }
  if (target === 'windows') {
    throw new Error(
      'Windows 录屏需人工触发 / record Windows video by hand: press Win+G (Xbox Game Bar) and save to the session evidence folder.',
    )
  }
  throw new Error(`unsupported target: ${target}`)
}

async function cmdShot(positionals, values) {
  const dir = resolve(positionals[0] ?? '')
  const session = await requireSession(dir)
  const label = values.label ?? 'shot'
  if (!values.label) throw new Error('shot needs --label (use the case id, e.g. L1-07-after)')
  const target = values.target ?? defaultTarget()
  if (!TARGETS.includes(target)) throw new Error(`--target must be one of ${TARGETS.join(', ')}`)
  const file = join(dir, 'evidence', `${stamp()}-${sanitize(label)}.png`)

  await mkdir(join(dir, 'evidence'), { recursive: true })
  await captureStill(target, file, { window: values.window === true })

  await noteEvidence(dir, {
    kind: 'screenshot',
    file: relativeTo(dir, file),
    label,
    at: new Date().toISOString(),
    target,
    platform: session.platform,
    note: values.note ?? '',
  })

  process.stdout.write(`截图已保存 / screenshot saved: ${file}\n`)
  process.stdout.write('用观察者的眼睛读图 / read it with the observer:\n')
  process.stdout.write(`  read_image ${file}\n`)
  process.stdout.write('然后逐元素描述画面，不要凭记忆 / describe the pixels, not your memory.\n')
  return 0
}

async function cmdRecord(positionals, values) {
  const dir = resolve(positionals[0] ?? '')
  const session = await requireSession(dir)
  const label = values.label ?? 'record'
  const seconds = Number(values.seconds ?? 30)
  if (!Number.isFinite(seconds) || seconds < 1) throw new Error('--seconds must be a positive number')
  const target = values.target ?? defaultTarget()
  if (!TARGETS.includes(target)) throw new Error(`--target must be one of ${TARGETS.join(', ')}`)
  const extension = target === 'macos' ? 'mov' : 'mp4'
  const file = join(dir, 'evidence', `${stamp()}-${sanitize(label)}.${extension}`)

  await mkdir(join(dir, 'evidence'), { recursive: true })
  process.stdout.write(`开始录制 / recording ${seconds}s … 现在开始操作并口述动作。/ narrate as you act.\n`)
  await captureVideo(target, file, seconds)

  await noteEvidence(dir, {
    kind: 'recording',
    file: relativeTo(dir, file),
    label,
    at: new Date().toISOString(),
    seconds,
    target,
    platform: session.platform,
    note: values.note ?? '',
  })

  process.stdout.write(`录屏已保存 / recording saved: ${file}\n`)
  process.stdout.write('记下关键时间点（mm:ss）写进缺陷证据 / note mm:ss timestamps in each finding.\n')
  return 0
}

const sanitize = (label) => String(label).replace(/[^\w.-]+/g, '_').slice(0, 60)
const relativeTo = (dir, file) => file.slice(dir.length + 1)

async function main() {
  const { positionals, values } = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    options: {
      label: { type: 'string' },
      target: { type: 'string' },
      seconds: { type: 'string' },
      note: { type: 'string' },
      window: { type: 'boolean', default: false },
    },
  })
  const command = positionals.shift() ?? 'check'
  try {
    if (command === 'check') return await cmdCheck()
    if (command === 'shot') return await cmdShot(positionals, values)
    if (command === 'record') return await cmdRecord(positionals, values)
    if (command === 'help' || command === '--help' || command === '-h') {
      process.stdout.write(usage())
      return 0
    }
    process.stderr.write(`unknown command: ${command}\n\n${usage()}`)
    return 2
  } catch (error) {
    process.stderr.write(`error: ${error.message}\n`)
    return 2
  }
}

if (isMain()) {
  process.exitCode = await main()
}

export { cmdCheck, cmdRecord, cmdShot, sanitize }
