import { strict as assert } from 'node:assert'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { render } from '../scripts/report.mjs'

const packageRoot = fileURLToPath(new URL('..', import.meta.url))
const node = process.execPath

const session = {
  app: 'Demo',
  platform: 'macos',
  levels: ['L1', 'L2', 'L3'],
  tester: 'QA',
  createdAt: '2026-10-04T01:00:00.000Z',
  gate: {
    confirmed: true,
    mouse: true,
    keyboard: 'L2',
    screenRecording: true,
    screenshot: true,
    cursorIncluded: true,
    microphone: false,
    osPermission: true,
    complianceAcknowledged: true,
    dataBoundary: 'demo account only',
    blockers: [],
  },
}

const findings = [
  {
    id: 'F-001',
    at: '2026-10-04T01:10:00.000Z',
    level: 'L1',
    platform: 'macos',
    element: 'E-07 导出按钮 / Export button',
    content: '工具栏与菜单 Toolbar & menus',
    criteria: '不看 tooltip 也能理解图标含义',
    title_zh: '导出按钮点击无反应',
    title_en: 'Export button does nothing',
    steps_zh: '移动鼠标到导出按钮，单击',
    steps_en: 'Move the mouse to Export, click',
    expected_zh: '弹出导出面板',
    expected_en: 'Export dialog opens',
    actual_zh: '无任何反应',
    actual_en: 'Nothing happens',
    modes: 'L1 fail / L2 fail / L3 pass',
    severity: 'S2',
    kind: 'defect',
    evidence: ['evidence/2026-10-04T01-10-00-L1-after.png'],
    impact: '主流程受阻',
    suggestion: '检查导出按钮的点击热区',
  },
  {
    id: 'F-002',
    at: '2026-10-04T01:20:00.000Z',
    level: 'L3',
    platform: 'macos',
    element: 'E-11 同步开关 / Sync toggle',
    title_zh: '无法判定开关状态',
    title_en: 'Toggle state undetermined',
    steps_zh: '单击开关',
    steps_en: 'Click the toggle',
    expected_zh: '开关变为开启',
    expected_en: 'Toggle turns on',
    actual_zh: '截图模糊，无法判定',
    actual_en: 'Screenshot unusable',
    modes: '',
    severity: 'U',
    kind: 'unverified',
    evidence: [],
    impact: '证据不足',
    suggestion: '补拍清晰截图',
  },
]

const evidence = [
  {
    at: '2026-10-04T01:10:00.000Z',
    kind: 'screenshot',
    file: 'evidence/2026-10-04T01-10-00-L1-after.png',
    label: 'L1-after',
    note: '',
  },
]

const compliance = [
  { at: '2026-10-04T01:05:00.000Z', kind: 'scan', clean: true, processHits: [], textHits: [] },
]

test('the report is bilingual and carries every required section', () => {
  const markdown = render(session, findings, evidence, { elements: 12, cases: 30, personas: 3, scenarios: 4, journeySteps: 5 }, compliance)
  for (const heading of [
    '基本信息 / Basics',
    '权限记录 / Permission record',
    '覆盖 / Coverage',
    '用户模拟覆盖 / User-simulation coverage',
    '测试内容分布 / Content coverage',
    '结论摘要 / Verdict summary',
    '发现一览 / Findings at a glance',
    '发现详情 / Finding details',
    '未验证项 / Unverified items',
    '证据索引 / Evidence index',
    '输入注入监控 / Injection watch',
    '合规声明 / Compliance statement',
    '修复建议顺序 / Suggested fix order',
  ]) {
    assert.ok(markdown.includes(heading), `missing ${heading}`)
  }
  for (const numbered of ['## 1. ', '## 7. ', '## 13. ']) {
    assert.ok(markdown.includes(numbered), `section numbering lost ${numbered}`)
  }
  assert.ok(markdown.includes('导出按钮点击无反应'), 'Chinese title missing')
  assert.ok(markdown.includes('Export button does nothing'), 'English title missing')
  assert.ok(markdown.includes('L1 fail / L2 fail / L3 pass'), 'cross-mode difference missing')
  assert.ok(markdown.includes('F-001'), 'finding id missing')
  assert.ok(markdown.includes('no injected pointer, touch or key events'), 'compliance statement missing')
})

test('findings are grouped by content area with their criteria', () => {
  const markdown = render(session, findings, evidence, { elements: 1, cases: 1, personas: 1, scenarios: 1, journeySteps: 1, contentAreas: 15 }, compliance)
  assert.ok(markdown.includes('| 测试内容 Content area |'), 'content table missing')
  assert.ok(markdown.includes('工具栏与菜单 Toolbar & menus'), 'content area missing')
  assert.ok(markdown.includes('不看 tooltip 也能理解图标含义'), 'criteria missing')
})

test('unverified findings never read as a pass', () => {
  const markdown = render(session, findings, evidence, { elements: 1, cases: 1, personas: 1, scenarios: 1, journeySteps: 1 }, compliance)
  assert.ok(markdown.includes('无法判定开关状态'))
  assert.ok(markdown.includes('未验证 Unverified'))
  assert.ok(markdown.includes('无画面不得写成通过'), 'R5 warning missing')
})

test('an unconfirmed gate invalidates the verdict', () => {
  const open = { ...session, gate: { ...session.gate, confirmed: false, blockers: ['取证权限未回答 / capture permission unanswered'] } }
  const markdown = render(open, [], [], { elements: 0, cases: 0 }, [])
  assert.ok(markdown.includes('本报告不构成测试结论'), 'gate warning missing')
  assert.ok(markdown.includes('capture permission unanswered'))
})

test('a clean watchdog run is reported as a lead, never as proof', () => {
  const markdown = render(session, findings, evidence, { elements: 1, cases: 1, personas: 1, scenarios: 1, journeySteps: 1 }, compliance)
  assert.ok(markdown.includes('不构成'))
  assert.ok(markdown.includes('watches** injection directives'))
})

test('the report CLI writes report.md from a real session', () => {
  const dir = mkdtempSync(join(tmpdir(), 'observed-ui-report-'))
  try {
    const target = join(dir, 'session')
    assert.equal(spawnSync(node, ['scripts/session.mjs', 'init', target, '--platform', 'windows', '--app', 'Demo'], { cwd: packageRoot }).status, 0)
    assert.equal(
      spawnSync(node, ['scripts/session.mjs', 'gate', target, '--mouse', 'yes', '--keyboard', 'L1', '--screen-recording', 'yes', '--screenshot', 'yes', '--compliance', 'yes'], { cwd: packageRoot }).status,
      0,
    )
    const built = spawnSync(node, ['scripts/report.mjs', 'build', target], { cwd: packageRoot, encoding: 'utf8' })
    assert.equal(built.status, 0, built.stderr)
    const report = readFileSync(join(target, 'report.md'), 'utf8')
    assert.ok(report.includes('Observed UI Test Report'))
    assert.ok(existsSync(join(target, 'report.md')))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
