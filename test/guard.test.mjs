import { strict as assert } from 'node:assert'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { scanForInjectionApis } from '../lib/self-check.js'
import { PLAN_TOKENS, PROCESS_TOKENS, scanSessionText } from '../scripts/guard.mjs'
import { sanitize } from '../scripts/capture.mjs'

const packageRoot = fileURLToPath(new URL('..', import.meta.url))

test('no shipped code can inject input', () => {
  assert.deepEqual(scanForInjectionApis(packageRoot), [])
})

test('capture.mjs offers capture commands only — never an input command', () => {
  const source = readFileSync(join(packageRoot, 'scripts/capture.mjs'), 'utf8')
  for (const command of ['check', 'shot', 'record']) {
    assert.ok(source.includes(`command === '${command}'`), `missing command ${command}`)
  }
  for (const banned of ['SendInput', 'CGEventPost', 'mouse_event', 'adb shell input', 'input tap']) {
    assert.ok(!source.includes(banned), `capture.mjs must not reference ${banned}`)
  }
})

test('the watchdog knows the injection directives it is watching for', () => {
  assert.ok(PLAN_TOKENS.includes('CGEventPost'))
  assert.ok(PLAN_TOKENS.includes('adb shell input'))
  assert.ok(PLAN_TOKENS.includes('element.click()'))
  assert.ok(PROCESS_TOKENS.some(([token]) => token === 'cliclick'))
  assert.ok(PROCESS_TOKENS.some(([token]) => token === 'pyautogui'))
})

test('scanSessionText flags a plan that names a banned directive', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'observed-ui-guard-'))
  try {
    writeFileSync(
      join(dir, 'matrix.md'),
      '# matrix\n\n| C-001 | 用 cliclick 点击导出 |\n\n步骤：adb shell input tap 100 200\n',
    )
    writeFileSync(join(dir, 'elements.md'), '# elements\n\n正常文本，没有指令。\n')
    const hits = await scanSessionText(dir)
    const tokens = hits.map((hit) => hit.token)
    assert.ok(tokens.includes('cliclick'), 'cliclick must be flagged')
    assert.ok(tokens.includes('adb shell input'), 'adb input must be flagged')
    assert.ok(hits.every((hit) => hit.file.endsWith('.md')), 'hits carry their file')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('scanSessionText stays silent on a clean session', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'observed-ui-guard-clean-'))
  try {
    writeFileSync(join(dir, 'matrix.md'), '# matrix\n\n| C-001 | 鼠标移动到按钮并单击 |\n')
    assert.deepEqual(await scanSessionText(dir), [])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('evidence labels are sanitised for filenames', () => {
  assert.equal(sanitize('L1-07 after / 导出'), 'L1-07_after_')
  assert.equal(sanitize('L2/03'), 'L2_03')
})
