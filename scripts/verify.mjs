#!/usr/bin/env node
/**
 * verify.mjs — offline, read-only verification of this plugin.
 *
 * It never touches the screen, the network or an input device. It checks that:
 *   1. the plugin mounts and publishes every skill through the ctx.skills seam;
 *   2. every SKILL.md has valid, bilingual frontmatter;
 *   3. every relative markdown link resolves;
 *   4. no shipped code contains an input-injection API;
 *   5. the session / gate / finding / guard / report CLIs work end to end in a temp directory.
 *
 * 离线自检：挂载、技能元数据、相对链接、注入 API 扫描、脚本端到端冒烟。
 *
 * Usage / 用法: node scripts/verify.mjs
 */

import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  checkContentRequirements,
  checkRelativeLinks,
  checkSkills,
  mentionsGuardObservation,
  scanForInjectionApis,
} from '../lib/self-check.js'
import { apply } from '../lib/index.js'

const packageRoot = fileURLToPath(new URL('..', import.meta.url))
const results = []

async function check(name, run) {
  try {
    const detail = await run()
    results.push({ name, ok: true, detail: detail ?? '' })
  } catch (error) {
    results.push({ name, ok: false, detail: error.message })
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const node = process.execPath
const run = (args, options = {}) =>
  spawnSync(node, args, { encoding: 'utf8', cwd: packageRoot, ...options })

await check('mount: plugin publishes every skill through ctx.skills', async () => {
  let provider
  const ctx = { skills: { registerProvider: (factory) => { provider = factory() } } }
  apply(ctx, {})
  assert(provider !== undefined, 'registerProvider was not called')
  const candidates = await provider.list()
  const names = candidates.map((candidate) => candidate.name)
  assert(candidates.length >= 3, `expected at least 3 skills, got ${names.join(', ')}`)
  for (const skill of ['observed-ui-test', 'observed-test-plan', 'software-design-test']) {
    assert(names.includes(skill), `${skill} skill missing`)
  }
  for (const candidate of candidates) {
    assert('rank' in candidate, 'rank should exist on the internal candidate')
    assert(candidate.provider === 'software-design-test', 'wrong provider name')
  }
  return `${names.join(', ')} (${candidates.length} skills)`
})

await check('mount: provider.get returns body without leaking rank/locator', async () => {
  let provider
  apply({ skills: { registerProvider: (factory) => { provider = factory() } } }, {})
  const candidates = await provider.list()
  for (const candidate of candidates) {
    const loaded = await provider.get(candidate, {})
    assert(typeof loaded.content === 'string' && loaded.content.length > 100, `${candidate.name}: empty body`)
    assert(!('locator' in loaded), `${candidate.name}: locator leaked`)
    assert(!('rank' in loaded), `${candidate.name}: rank leaked`)
  }
  return 'bodies load, internals stay internal'
})

await check('skills: frontmatter is valid and bilingual', () => {
  const { problems, skills } = checkSkills(packageRoot)
  assert(problems.length === 0, problems.join('\n  '))
  return skills.map((skill) => skill.name).join(', ')
})

await check('links: every relative markdown link resolves', () => {
  const problems = checkRelativeLinks(packageRoot)
  assert(problems.length === 0, problems.join('\n  '))
  return 'all relative links resolve'
})

await check('ban: shipped code contains no input-injection API', () => {
  const problems = scanForInjectionApis(packageRoot)
  assert(problems.length === 0, problems.join('\n  '))
  return 'lib/ and scripts/ are injection-free'
})

await check('content: method requirements are documented bilingually', () => {
  const problems = checkContentRequirements(packageRoot)
  assert(problems.length === 0, problems.join('\n  '))
  assert(mentionsGuardObservation(packageRoot), 'guard.mjs observation wording missing')
  return 'three modes, gate, banned list and guard are documented'
})

await check('cli: session init / gate / finding / guard / report end to end', () => {
  const dir = mkdtempSync(join(tmpdir(), 'observed-ui-test-'))
  try {
    const target = join(dir, 'session')

    let result = run(['scripts/session.mjs', 'init', target, '--platform', 'macos', '--app', 'Demo'])
    assert(result.status === 0, `init failed: ${result.stderr}`)
    for (const file of ['session.json', 'permissions.md', 'elements.md', 'matrix.md', 'findings.jsonl', 'report.md']) {
      assert(existsSync(join(target, file)), `init did not create ${file}`)
    }
    assert(existsSync(join(target, 'evidence')), 'init did not create evidence/')

    // The gate blocks while capture permission is missing.
    result = run(['scripts/session.mjs', 'gate', target, '--mouse', 'yes', '--keyboard', 'L1', '--screen-recording', 'no', '--screenshot', 'no', '--compliance', 'yes'])
    assert(result.status === 1, `gate should block without capture permission, got ${result.status}`)
    assert(result.stdout.includes('NOT CONFIRMED'), 'gate did not report NOT CONFIRMED')

    // Denied mouse is fatal.
    result = run(['scripts/session.mjs', 'gate', target, '--mouse', 'no', '--keyboard', 'L1', '--screen-recording', 'yes', '--screenshot', 'yes', '--compliance', 'yes'])
    assert(result.status === 1, 'gate should block when the mouse is denied')

    // Full answer passes.
    result = run(['scripts/session.mjs', 'gate', target, '--mouse', 'yes', '--keyboard', 'L2', '--screen-recording', 'yes', '--screenshot', 'yes', '--microphone', 'no', '--os-permission', 'yes', '--cursor', 'yes', '--compliance', 'yes', '--data-boundary', 'demo account only'])
    assert(result.status === 0, `gate should confirm: ${result.stdout}${result.stderr}`)
    assert(result.stdout.includes('CONFIRMED'), 'gate did not confirm')

    result = run(['scripts/session.mjs', 'status', target])
    assert(result.status === 0 && result.stdout.includes('已通过'), 'status did not report a confirmed gate')

    const finding = JSON.stringify({
      level: 'L1',
      element: 'E-07 toolbar export button',
      title_zh: '导出按钮点击无反应',
      title_en: 'Export button does nothing',
      steps_zh: '移动鼠标到导出按钮，单击',
      steps_en: 'Move the mouse to Export, click',
      expected_zh: '弹出导出面板',
      expected_en: 'Export dialog opens',
      actual_zh: '无任何反应，无按下态',
      actual_en: 'Nothing happens, no pressed state',
      severity: 'S2',
      kind: 'defect',
      modes: 'L1 fail / L2 fail / L3 pass',
      evidence: ['evidence/x.png'],
    })
    result = run(['scripts/session.mjs', 'finding', target, '--json', finding])
    assert(result.status === 0, `finding failed: ${result.stderr}`)
    assert(result.stdout.includes('F-001'), 'finding did not get an id')

    result = run(['scripts/guard.mjs', 'scan', target])
    assert(result.status === 0 || result.status === 1, `guard scan crashed: ${result.stderr}`)
    assert(result.stdout.includes('输入注入观察'), 'guard scan output missing')
    assert(existsSync(join(target, 'evidence', 'compliance.jsonl')), 'guard did not log compliance')

    result = run(['scripts/report.mjs', 'build', target])
    assert(result.status === 0, `report failed: ${result.stderr}`)
    const report = readFileSync(join(target, 'report.md'), 'utf8')
    assert(report.includes('Observed UI Test Report'), 'report missing title')
    assert(report.includes('F-001'), 'report missing the finding')
    assert(report.includes('导出按钮点击无反应'), 'report missing the Chinese title')
    assert(report.includes('输入注入监控'), 'report missing the injection-watch section')
    assert(report.includes('No internal pointer directives were used'), 'report missing compliance statement')

    return 'init → gate(block/confirm) → finding → guard → report all behave'
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

await check('cli: capture.mjs exposes no input subcommand and checks availability', () => {
  const result = run(['scripts/capture.mjs', 'check'])
  assert(result.status === 0, `capture check failed: ${result.stderr}`)
  assert(result.stdout.includes('只读捕获自检'), 'capture check output missing')
  const source = readFileSync(join(packageRoot, 'scripts/capture.mjs'), 'utf8')
  for (const forbidden of ['SendInput', 'CGEventPost', 'adb shell input', 'input tap']) {
    assert(!source.includes(forbidden), `capture.mjs must not mention ${forbidden}`)
  }
  for (const command of ['shot', 'record', 'check']) {
    assert(source.includes(`command === '${command}'`), `capture.mjs lost its ${command} command`)
  }
  assert(!/command === 'input'/.test(source), 'capture.mjs must not gain an input command')
  return 'read-only capture CLI verified'
})

const failed = results.filter((result) => !result.ok)
for (const result of results) {
  process.stdout.write(`${result.ok ? 'PASS' : 'FAIL'}  ${result.name}\n`)
  if (result.detail) {
    for (const line of String(result.detail).split('\n')) {
      process.stdout.write(`        ${line}\n`)
    }
  }
}
process.stdout.write(
  `\n${results.length - failed.length}/${results.length} checks passed` +
    ` — 注入能力: 无 / capability to inject input: none\n`,
)
process.exitCode = failed.length === 0 ? 0 : 1
