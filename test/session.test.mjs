import { strict as assert } from 'node:assert'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const packageRoot = fileURLToPath(new URL('..', import.meta.url))
const node = process.execPath

function run(args, cwd = packageRoot) {
  return spawnSync(node, args, { encoding: 'utf8', cwd })
}

function withSession(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'observed-ui-session-'))
  const target = join(dir, 'session')
  try {
    const init = run(['scripts/session.mjs', 'init', target, '--platform', 'macos', '--app', 'Demo', '--tester', 'QA'])
    assert.equal(init.status, 0, init.stderr)
    return fn(target)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

test('init scaffolds a bilingual session without touching the network or the screen', () => {
  withSession((target) => {
    for (const file of [
      'session.json', 'permissions.md', 'elements.md', 'matrix.md',
      'personas.md', 'scenarios.md', 'journey.md', 'heuristics.md', 'content.md',
      'findings.jsonl', 'report.md',
    ]) {
      assert.ok(existsSync(join(target, file)), `missing ${file}`)
    }
    const personas = readFileSync(join(target, 'personas.md'), 'utf8')
    assert.ok(personas.includes('P-01'), 'persona template needs a first row')
    assert.ok(personas.includes('scaffolding'), 'persona discipline note missing')
    assert.ok(readFileSync(join(target, 'journey.md'), 'utf8').includes('出错与恢复'), 'journey stages missing')
    assert.ok(readFileSync(join(target, 'heuristics.md'), 'utf8').includes('HICCUPPS'), 'heuristics pointer missing')
    const content = readFileSync(join(target, 'content.md'), 'utf8')
    for (const area of ['窗口与界面尺寸', '鼠标速度与指针', '工具栏与菜单', '跨设备一致性']) {
      assert.ok(content.includes(area), `content.md must track ${area}`)
    }
    assert.ok(content.includes('尺寸与速度专项记录'), 'size/pointer measurement table missing')
    assert.ok(content.includes('十分钟快扫'), 'ten-minute sweep missing')
    assert.ok(existsSync(join(target, 'evidence')))
    const permissions = readFileSync(join(target, 'permissions.md'), 'utf8')
    assert.ok(permissions.includes('鼠标'), 'the questionnaire must ask about the mouse')
    assert.ok(permissions.includes('Mouse'), 'the questionnaire must have an English copy')
    assert.ok(permissions.includes('屏幕录制'), 'the questionnaire must ask about screen recording')
    assert.ok(permissions.includes('Screen recording'))
    const session = JSON.parse(readFileSync(join(target, 'session.json'), 'utf8'))
    assert.equal(session.gate.confirmed, false)
    assert.deepEqual(session.levels, ['L1', 'L2', 'L3'])
    assert.ok(session.gate.blockers.length > 0)
  })
})

test('the gate blocks until capture permission exists', () => {
  withSession((target) => {
    const blocked = run([
      'scripts/session.mjs', 'gate', target,
      '--mouse', 'yes', '--keyboard', 'L1',
      '--screen-recording', 'no', '--screenshot', 'no', '--compliance', 'yes',
    ])
    assert.equal(blocked.status, 1, 'a session with no capture permission must not pass the gate')
    assert.ok(blocked.stdout.includes('NOT CONFIRMED'))
    const session = JSON.parse(readFileSync(join(target, 'session.json'), 'utf8'))
    assert.equal(session.gate.confirmed, false)
    assert.ok(session.gate.blockers.some((line) => line.includes('无画面')))

    const passed = run([
      'scripts/session.mjs', 'gate', target,
      '--mouse', 'yes', '--keyboard', 'L2',
      '--screen-recording', 'yes', '--screenshot', 'yes',
      '--microphone', 'no', '--os-permission', 'yes', '--cursor', 'yes',
      '--compliance', 'yes', '--data-boundary', 'demo account only',
    ])
    assert.equal(passed.status, 0, passed.stdout + passed.stderr)
    assert.ok(passed.stdout.includes('CONFIRMED'))
    const after = JSON.parse(readFileSync(join(target, 'session.json'), 'utf8'))
    assert.equal(after.gate.confirmed, true)
    assert.equal(after.gate.keyboard, 'L2')
    assert.equal(after.gate.dataBoundary, 'demo account only')
  })
})

test('a denied compliance statement keeps the gate closed', () => {
  withSession((target) => {
    const result = run([
      'scripts/session.mjs', 'gate', target,
      '--mouse', 'yes', '--keyboard', 'L1',
      '--screen-recording', 'yes', '--screenshot', 'yes', '--compliance', 'no',
    ])
    assert.equal(result.status, 1)
    assert.ok(result.stdout.includes('合规'))
  })
})

test('findings are appended with stable ids and counted by status', () => {
  withSession((target) => {
    run(['scripts/session.mjs', 'gate', target, '--mouse', 'yes', '--keyboard', 'L1', '--screen-recording', 'yes', '--screenshot', 'yes', '--compliance', 'yes'])
    const first = run([
      'scripts/session.mjs', 'finding', target, '--json',
      JSON.stringify({ level: 'L1', title_zh: '按钮无反应', title_en: 'Button dead', severity: 'S2', kind: 'defect', element: 'E-01' }),
    ])
    assert.equal(first.status, 0, first.stderr)
    const second = run([
      'scripts/session.mjs', 'finding', target, '--json',
      JSON.stringify([
        { level: 'L2', title_zh: '焦点丢失', title_en: 'Focus lost', severity: 'S3', kind: 'defect' },
        { level: 'L3', title_zh: '未验证项', title_en: 'Unverified', severity: 'U', kind: 'unverified' },
      ]),
    ])
    assert.equal(second.status, 0, second.stderr)

    const lines = readFileSync(join(target, 'findings.jsonl'), 'utf8').trim().split('\n')
    assert.equal(lines.length, 3)
    assert.equal(JSON.parse(lines[0]).id, 'F-001')
    assert.equal(JSON.parse(lines[1]).id, 'F-002')
    assert.equal(JSON.parse(lines[2]).id, 'F-003')
    assert.equal(JSON.parse(lines[0]).platform, 'macos', 'platform defaults to the session platform')

    const status = run(['scripts/session.mjs', 'status', target])
    assert.equal(status.status, 0)
    assert.ok(status.stdout.includes('S2=1'))
    assert.ok(status.stdout.includes('unverified=1'))
  })
})

test('a finding can carry content area and criteria, and the report groups by them', () => {
  withSession((target) => {
    run(['scripts/session.mjs', 'gate', target, '--mouse', 'yes', '--keyboard', 'L1', '--screen-recording', 'yes', '--screenshot', 'yes', '--compliance', 'yes'])
    const written = run([
      'scripts/session.mjs', 'finding', target, '--json',
      JSON.stringify({
        title_zh: '最小窗口下导出按钮被裁', title_en: 'Export hidden at minimum window size',
        severity: 'S2', kind: 'defect', level: 'L1',
        content: '窗口与界面尺寸 Window & screen size',
        criteria: '最小尺寸下主按钮仍完整可见',
      }),
    ])
    assert.equal(written.status, 0, written.stderr)
    const record = JSON.parse(readFileSync(join(target, 'findings.jsonl'), 'utf8').trim())
    assert.equal(record.content, '窗口与界面尺寸 Window & screen size')
    assert.equal(record.criteria, '最小尺寸下主按钮仍完整可见')
  })
})

test('a finding can carry persona, scenario, heuristic and reproduction fields', () => {
  withSession((target) => {
    run(['scripts/session.mjs', 'gate', target, '--mouse', 'yes', '--keyboard', 'L1', '--screen-recording', 'yes', '--screenshot', 'yes', '--compliance', 'yes'])
    const written = run([
      'scripts/session.mjs', 'finding', target, '--json',
      JSON.stringify({
        title_zh: '新手找不到导出入口', title_en: 'Novice cannot find export',
        severity: 'S3', kind: 'defect', level: 'L1',
        persona: 'P-01 新手 Novice', scenario: 'S-01 首次导出 First export',
        task_outcome: 'fail', heuristic: '可发现性 Discoverability',
        tour: '地标巡游 Landmark tour', repro_rate: '3/3', minimized: '打开菜单 → 找不到导出',
      }),
    ])
    assert.equal(written.status, 0, written.stderr)
    const record = JSON.parse(readFileSync(join(target, 'findings.jsonl'), 'utf8').trim())
    assert.equal(record.persona, 'P-01 新手 Novice')
    assert.equal(record.task_outcome, 'fail')
    assert.equal(record.tour, '地标巡游 Landmark tour')
    assert.equal(record.repro_rate, '3/3')
  })
})

test('bad input is rejected instead of silently recorded', () => {
  withSession((target) => {
    const badLevel = run(['scripts/session.mjs', 'gate', target, '--keyboard', 'L9'])
    assert.equal(badLevel.status, 2)
    const badSeverity = run([
      'scripts/session.mjs', 'finding', target, '--json',
      JSON.stringify({ title_zh: 'x', severity: 'S9' }),
    ])
    assert.equal(badSeverity.status, 2)
    const noTitle = run(['scripts/session.mjs', 'finding', target, '--json', JSON.stringify({ severity: 'S1' })])
    assert.equal(noTitle.status, 2)
  })
})

test('init refuses to overwrite an existing session without --force', () => {
  withSession((target) => {
    const again = run(['scripts/session.mjs', 'init', target, '--platform', 'macos', '--app', 'Demo'])
    assert.equal(again.status, 2)
    assert.ok(again.stderr.includes('--force'))
  })
})
