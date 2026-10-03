#!/usr/bin/env node
/**
 * report.mjs — assemble a bilingual observed-UI-test report from a session directory.
 *
 * Input: session.json (permission gate + scope) and findings.jsonl (one finding per line).
 * Output: report.md, regenerated. Nothing here detects assertions for you: the report says
 * "unverified" wherever the evidence is missing, exactly as R5 requires.
 *
 * 读取 session.json 与 findings.jsonl，生成中英对照报告。证据不足一律写成"未验证"。
 *
 * Usage / 用法:
 *   node scripts/report.mjs build <session> [--out report.md] [--stdout]
 */

import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const SEVERITIES = ['S1', 'S2', 'S3', 'S4', 'U']
const KINDS = ['defect', 'observation', 'suspicion', 'unverified']
const LEVELS = ['L1', 'L2', 'L3']

const SEVERITY_LABEL = {
  S1: 'S1 阻断 Blocking',
  S2: 'S2 严重 Major',
  S3: 'S3 次要 Minor',
  S4: 'S4 打磨 Polish',
  U: 'U 无法判定 Undetermined',
}

const KIND_LABEL = {
  defect: '缺陷 Defect',
  observation: '观察 Observation',
  suspicion: '疑点 Suspicion',
  unverified: '未验证 Unverified',
}

const isMain = () =>
  process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)

const tri = (value) => (value === null || value === undefined ? '(未答 unanswered)' : value ? 'yes' : 'no')

function countBy(items, key, keys) {
  const result = Object.fromEntries(keys.map((k) => [k, 0]))
  for (const item of items) {
    const value = item[key]
    if (value !== undefined && result[value] !== undefined) result[value] += 1
    else result[value] = (result[value] ?? 0) + 1
  }
  return result
}

async function readFindings(dir) {
  const file = join(dir, 'findings.jsonl')
  if (!existsSync(file)) return []
  const rows = []
  for (const line of (await readFile(file, 'utf8')).split('\n')) {
    const text = line.trim()
    if (text.length > 0) rows.push(JSON.parse(text))
  }
  return rows
}

async function readEvidenceIndex(dir) {
  const file = join(dir, 'evidence', 'index.jsonl')
  if (!existsSync(file)) return []
  const rows = []
  for (const line of (await readFile(file, 'utf8')).split('\n')) {
    const text = line.trim()
    if (text.length > 0) rows.push(JSON.parse(text))
  }
  return rows
}

/** Injection-watchdog records written by guard.mjs. */
async function readCompliance(dir) {
  const file = join(dir, 'evidence', 'compliance.jsonl')
  if (!existsSync(file)) return []
  const rows = []
  for (const line of (await readFile(file, 'utf8')).split('\n')) {
    const text = line.trim()
    if (text.length > 0) rows.push(JSON.parse(text))
  }
  return rows
}

/**
 * Count data rows in the FIRST markdown table of a file (0 when the file is absent).
 * Stops at the first non-table line after the table body starts, so a later table in the same
 * document (for example content.md's measurement table) is not added to the count.
 */
async function countTableRows(file) {
  if (!existsSync(file)) return 0
  const lines = (await readFile(file, 'utf8')).split('\n')
  let state = 'seek'
  let rows = 0
  for (const line of lines) {
    const isRow = line.trim().startsWith('|')
    if (state === 'seek') {
      if (isRow) state = 'header'
      continue
    }
    if (state === 'header') {
      state = 'body'
      continue
    }
    if (!isRow) break
    if (/^\s*\|[\s:|-]+\|\s*$/.test(line)) continue
    rows += 1
  }
  return rows
}

function render(session, findings, evidence, planned, compliance = []) {
  const bySeverity = countBy(findings, 'severity', SEVERITIES)
  const byKind = countBy(findings, 'kind', KINDS)
  const byLevel = countBy(findings, 'level', LEVELS)
  const gate = session.gate
  const out = []
  let sectionNo = 0
  /** Push a numbered bilingual section heading plus its blank line. */
  const section = (title) => {
    sectionNo += 1
    out.push(`## ${sectionNo}. ${title}`)
    out.push('')
  }

  out.push('# 观察式界面测试报告 / Observed UI Test Report')
  out.push('')
  if (!gate.confirmed) {
    out.push(
      '> **警告 / WARNING**：权限闸门未通过，本报告不构成测试结论。' +
        'The permission gate is not confirmed; this report is not a test verdict.',
    )
    out.push('>')
    for (const blocker of gate.blockers ?? []) out.push(`> - 阻塞 / blocker：${blocker}`)
    out.push('')
  }

  section('基本信息 / Basics')
  out.push('| 项目 Item | 内容 Value |')
  out.push('| --- | --- |')
  out.push(`| 被测应用 App | ${session.app} |`)
  out.push(`| 平台 Platform | ${session.platform} |`)
  out.push(`| 级别 Levels | ${session.levels.join(', ')} |`)
  out.push(`| 操作者 Operator | ${session.tester || '(未填 unset)'} |`)
  out.push(`| 会话创建 Created | ${session.createdAt} |`)
  out.push(`| 报告生成 Generated | ${new Date().toISOString()} |`)
  out.push('')

  section('权限记录 / Permission record')
  out.push('| 权限 Permission | 用户答复 Answer |')
  out.push('| --- | --- |')
  out.push(`| 鼠标 Mouse | ${tri(gate.mouse)} |`)
  out.push(`| 键盘 Keyboard | ${gate.keyboard ?? '(未答)'} |`)
  out.push(`| 屏幕录制 Screen recording | ${tri(gate.screenRecording)} |`)
  out.push(`| 录屏含光标 Cursor in recording | ${tri(gate.cursorIncluded)} |`)
  out.push(`| 截屏 Screenshot | ${tri(gate.screenshot)} |`)
  out.push(`| 麦克风 Microphone | ${tri(gate.microphone)} |`)
  out.push(`| 系统捕获权限 OS capture permission | ${tri(gate.osPermission)} |`)
  out.push(`| 合规确认 Compliance | ${tri(gate.complianceAcknowledged)} |`)
  out.push(`| 数据边界 Data boundary | ${gate.dataBoundary || '(未填 unset)'} |`)
  out.push(`| 闸门结果 Gate | ${gate.confirmed ? '通过 CONFIRMED' : '未通过 NOT CONFIRMED'} |`)
  out.push('')
  const gaps = []
  if (gate.screenRecording === false) gaps.push('无录屏 → 过程类缺陷无法取证 / no recording')
  if (gate.screenshot === false) gaps.push('无截屏 → 无法留证 / no screenshots')
  if (gate.keyboard === 'L1') gaps.push('仅 L1 → L2/L3 未覆盖 / L1 only, L2/L3 uncovered')
  if (gate.microphone === false) gaps.push('无麦克风 → 时间点靠手写 / no narration')
  if (gaps.length > 0) {
    out.push('**覆盖缺口 / Coverage gaps:**')
    for (const gap of gaps) out.push(`- ${gap}`)
    out.push('')
  }

  section('覆盖 / Coverage')
  out.push('| 维度 Dimension | 计划 Planned | 实际 Actual |')
  out.push('| --- | --- | --- |')
  out.push(`| 元素 Elements | ${planned.elements ?? 0} | (由观察者核对 / verify by observer) |`)
  out.push(`| 用例 Cases | ${planned.cases ?? 0} | ${findings.length} 条发现 findings |`)
  out.push(`| 模式 Modes | ${session.levels.join(' / ')} | ${LEVELS.map((l) => `${l}=${byLevel[l] ?? 0}`).join(' ')} |`)
  out.push(`| 证据 Evidence | - | ${evidence.length} 个文件 files |`)
  out.push('')

  section('用户模拟覆盖 / User-simulation coverage')
  const personas = [...new Set(findings.map((item) => item.persona).filter(Boolean))]
  const scenarios = [...new Set(findings.map((item) => item.scenario).filter(Boolean))]
  const outcomes = countBy(
    findings.filter((item) => item.task_outcome),
    'task_outcome',
    ['pass', 'partial', 'fail', 'blocked', 'unverified'],
  )
  out.push('| 维度 Dimension | 计划 Planned | 实际 Actual |')
  out.push('| --- | --- | --- |')
  out.push(`| 人物 Personas | ${planned.personas ?? 0} | ${personas.length}${personas.length > 0 ? `：${personas.join(' · ')}` : ''} |`)
  out.push(`| 场景 Scenarios | ${planned.scenarios ?? 0} | ${scenarios.length}${scenarios.length > 0 ? `：${scenarios.join(' · ')}` : ''} |`)
  out.push(`| 旅程检查点 Journey checkpoints | ${planned.journeySteps ?? 0} | (由观察者核对 / verify by observer) |`)
  out.push(`| 测试内容类别 Content areas | ${planned.contentAreas ?? 0} | (见 content.md / see content.md) |`)
  out.push('')
  out.push(
    `任务结果 Task outcomes: ${['pass', 'partial', 'fail', 'blocked', 'unverified']
      .map((key) => `${key}=${outcomes[key] ?? 0}`)
      .join(' · ')}`,
  )
  out.push('')
  if (personas.length > 0) {
    out.push('| 人物 Persona | 发现 Findings | 最坏级别 Worst severity |')
    out.push('| --- | --- | --- |')
    for (const persona of personas) {
      const owned = findings.filter((item) => item.persona === persona)
      const order = ['S1', 'S2', 'S3', 'S4', 'U']
      const worst = order.find((severity) => owned.some((item) => item.severity === severity)) ?? '—'
      out.push(`| ${persona} | ${owned.map((item) => item.id).join(', ')} | ${worst} |`)
    }
    out.push('')
  }
  out.push(
    '> 人物与场景只是**观察的架子**：模拟出来的人物不能当成真实用户证据，' +
      '一条缺陷仍然必须由画面与真实操作步骤支撑。',
  )
  out.push(
    '> Personas and scenarios are **scaffolding for observation** only: a simulated persona is never ' +
      'evidence about real users, and every defect still needs a picture and real steps.',
  )
  out.push('')

  section('测试内容分布 / Content coverage')
  const areas = [...new Set(findings.map((item) => item.content).filter(Boolean))]
  if (areas.length === 0) {
    out.push('（尚无带 content 字段的发现 / no finding carries a content area yet）')
    out.push('')
    out.push('> 每条违反落盘时带上 `content`（类别，如「窗口与界面尺寸 Window size」）与 `criteria`（判据），')
    out.push('> 这一节会直接告诉你问题集中在哪一类。')
    out.push('')
  } else {
    out.push('| 测试内容 Content area | 发现 Findings | 最坏级别 Worst severity | 判据 Criteria |')
    out.push('| --- | --- | --- | --- |')
    const order = ['S1', 'S2', 'S3', 'S4', 'U']
    for (const area of areas) {
      const owned = findings.filter((item) => item.content === area)
      const worst = order.find((severity) => owned.some((item) => item.severity === severity)) ?? '—'
      const criteria = [...new Set(owned.map((item) => item.criteria).filter(Boolean))].join('；')
      out.push(`| ${area} | ${owned.map((item) => item.id).join(', ')} | ${worst} | ${criteria || '—'} |`)
    }
    out.push('')
    const uncovered = Math.max(0, (planned.contentAreas ?? 0) - areas.length)
    out.push(
      `覆盖 / Coverage: ${areas.length} 类有发现，${uncovered} 类未登记（未登记 ≠ 已通过）。` +
        ' / areas with findings vs areas not logged — not logged is not a pass.',
    )
    out.push('')
  }

  section('结论摘要 / Verdict summary')
  out.push('| 级别 Severity | 数量 Count |')
  out.push('| --- | --- |')
  for (const severity of SEVERITIES) {
    out.push(`| ${SEVERITY_LABEL[severity]} | ${bySeverity[severity] ?? 0} |`)
  }
  out.push('')
  out.push(`类型分类 / Kinds: ${KINDS.map((k) => `${KIND_LABEL[k]}=${byKind[k] ?? 0}`).join(' · ')}`)
  out.push('')
  const blocking = (bySeverity.S1 ?? 0) + (bySeverity.S2 ?? 0)
  out.push(
    blocking > 0
      ? `一句话结论 / Verdict: 存在 ${blocking} 条 S1/S2 问题，主流程或关键功能受影响。`
      : findings.length === 0
        ? '一句话结论 / Verdict: 本会话尚无记录；这不等于通过。 / nothing recorded yet — which is not a pass.'
        : '一句话结论 / Verdict: 未发现 S1/S2，详见下表。 / no S1/S2 found; see the table.',
  )
  out.push('')

  section('发现一览 / Findings at a glance')
  if (findings.length === 0) {
    out.push('（无记录 / none recorded）')
  } else {
    out.push('| ID | 级别 Sev | 类型 Kind | 模式 | 平台 | 元素/工具 Element | 标题 Title | 证据 Evidence |')
    out.push('| --- | --- | --- | --- | --- | --- | --- | --- |')
    for (const item of findings) {
      out.push(
        `| ${item.id} | ${item.severity} | ${KIND_LABEL[item.kind] ?? item.kind} | ${item.level} | ` +
          `${item.platform} | ${item.element} | ${item.title_zh || item.title_en} | ` +
          `${(item.evidence ?? []).join('<br>') || '—'} |`,
      )
    }
  }
  out.push('')

  section('发现详情 / Finding details')
  for (const item of findings) {
    out.push(`### ${item.id} · ${item.title_zh || item.title_en}`)
    out.push('')
    out.push(`- ${item.title_en || item.title_zh}`)
    out.push(`- 级别 Severity：${item.severity} · 类型 Kind：${KIND_LABEL[item.kind] ?? item.kind} · 模式 Level：${item.level} · 平台 Platform：${item.platform}`)
    out.push(`- 元素 Element：${item.element || '—'}`)
    if (item.content) out.push(`- 测试内容 Content area：${item.content}`)
    if (item.criteria) out.push(`- 判据 Criteria：${item.criteria}`)
    if (item.persona) out.push(`- 人物 Persona：${item.persona}`)
    if (item.scenario) out.push(`- 场景 Scenario：${item.scenario}`)
    if (item.task_outcome) out.push(`- 任务结果 Task outcome：${item.task_outcome}`)
    if (item.heuristic) out.push(`- 启发式 Heuristic：${item.heuristic}`)
    if (item.tour) out.push(`- 巡游 Tour：${item.tour}`)
    if (item.repro_rate) out.push(`- 复现率 Repro rate：${item.repro_rate}`)
    if (item.minimized) out.push(`- 最小复现 Minimized：${item.minimized}`)
    out.push(`- 记录时间 Recorded：${item.at}`)
    out.push('')
    if (item.steps_zh || item.steps_en) {
      out.push('**步骤 Steps**')
      out.push('')
      if (item.steps_zh) out.push(`- 中文：${item.steps_zh}`)
      if (item.steps_en) out.push(`- EN: ${item.steps_en}`)
      out.push('')
    }
    if (item.expected_zh || item.expected_en) {
      out.push('**期望 Expected**')
      out.push('')
      if (item.expected_zh) out.push(`- 中文：${item.expected_zh}`)
      if (item.expected_en) out.push(`- EN: ${item.expected_en}`)
      out.push('')
    }
    if (item.actual_zh || item.actual_en) {
      out.push('**实际 Actual**')
      out.push('')
      if (item.actual_zh) out.push(`- 中文：${item.actual_zh}`)
      if (item.actual_en) out.push(`- EN: ${item.actual_en}`)
      out.push('')
    }
    if (item.modes) {
      out.push(`**跨模式差异 Cross-mode**：${item.modes}`)
      out.push('')
    }
    if (item.impact) out.push(`**影响 Impact**：${item.impact}`)
    if (item.suggestion) out.push(`**建议 Suggestion**：${item.suggestion}`)
    if (item.impact || item.suggestion) out.push('')
    if ((item.evidence ?? []).length > 0) {
      out.push('**画面证据 Visual evidence**')
      out.push('')
      for (const file of item.evidence) out.push(`- [${file}](${file})`)
      out.push('')
    } else {
      out.push('**画面证据 Visual evidence**：无 / none — R5：无画面不得写成通过。')
      out.push('')
    }
  }

  const unverified = findings.filter((item) => item.kind === 'unverified' || item.severity === 'U')
  section('未验证项 / Unverified items')
  if (unverified.length === 0) {
    out.push('（本会话未登记未验证项；请核对权限缺口与未覆盖元素 / none logged — check the coverage gaps above）')
  } else {
    out.push('| ID | 项 Item | 原因 Reason | 需要什么 What is needed |')
    out.push('| --- | --- | --- | --- |')
    for (const item of unverified) {
      out.push(`| ${item.id} | ${item.element || item.title_zh || item.title_en} | ${item.actual_zh || item.impact || '—'} | ${item.suggestion || '权限/设备/时间 / permission, device or time'} |`)
    }
  }
  out.push('')

  section('证据索引 / Evidence index')
  if (evidence.length === 0) {
    out.push('（无证据文件 / no evidence files）')
  } else {
    out.push('| 时间 Time | 类型 Kind | 标签 Label | 文件 File | 备注 Note |')
    out.push('| --- | --- | --- | --- | --- |')
    for (const item of evidence) {
      out.push(`| ${item.at} | ${item.kind} | ${item.label} | [${item.file}](${item.file}) | ${item.note || ''} |`)
    }
  }
  out.push('')

  section('输入注入监控 / Injection watch')
  out.push('> 本会话由 `guard.mjs` 只读观察输入注入线索：它**观察**注入指令，从不**执行**注入。')
  out.push('> This session used `guard.mjs` to observe injection only: it **watches** injection directives and never performs one.')
  out.push('')
  if (compliance.length === 0) {
    out.push('（未运行监控 / watchdog not run — 建议在测试前后各跑一次 `guard.mjs scan`）')
  } else {
    const processHits = compliance.filter((entry) => entry.kind === 'process')
    const textHits = compliance.filter((entry) => entry.kind === 'plan-text' || entry.kind === 'finding-text')
    const scans = compliance.filter((entry) => entry.kind === 'scan')
    const watches = compliance.filter((entry) => entry.kind === 'watch')
    out.push(`- 扫描次数 scans：${scans.length} · 监视轮次 watch runs：${watches.length}`)
    out.push(`- 疑似注入进程量 suspected injection processes：${processHits.length}`)
    out.push(`- 测试文本中出现的被禁指令 banned directives in session text：${textHits.length}`)
    out.push('')
    if (processHits.length > 0 || textHits.length > 0) {
      out.push('| 时间 Time | 类型 Kind | 线索 Clue | 说明 Detail |')
      out.push('| --- | --- | --- | --- |')
      for (const hit of [...processHits, ...textHits]) {
        out.push(
          `| ${hit.at} | ${hit.kind} | ${hit.token} | ${hit.kind === 'process' ? `pid=${hit.pid} ${hit.command ?? ''}` : `${hit.file}:${hit.line}`} |`,
        )
      }
      out.push('')
      out.push('**需人工确认 / requires human confirmation**：这些是线索，不是定罪；确认后必须重跑受影响的用例。')
      out.push('**These are leads, not convictions** — confirm by hand and re-run the affected cases.')
    } else {
      out.push('未发现注入线索。注意：这**不构成"绝对没有注入"的证明**，只说明观察期间没有线索。')
      out.push('No injection clue was observed. This is **not proof of absence**, only the absence of a clue during observation.')
    }
  }
  out.push('')

  section('合规声明 / Compliance statement')
  out.push('- 本次测试使用真实的鼠标与键盘操作，录屏与截屏是唯一证据来源。')
  out.push('- **未使用任何内部指针指令**：无指针/触摸/按键注入，无自动化框架驱动，无内部句柄调用。')
  out.push('- This run used real mouse and keyboard input with screen recording and screenshots as the only evidence source.')
  out.push('- **No internal pointer directives were used**: no injected pointer, touch or key events, no automation drivers, no calls into software internals.')
  out.push('')

  section('修复建议顺序 / Suggested fix order')
  out.push('| 顺序 Order | 缺陷 ID | 理由 Rationale | 复测用例 Retest case |')
  out.push('| --- | --- | --- | --- |')
  for (const item of findings.filter((entry) => entry.kind === 'defect')) {
    out.push(`| ${item.severity} | ${item.id} | ${item.impact || '—'} | ${item.element || '—'} · ${item.level} |`)
  }
  out.push('')
  out.push('> 修复后用**同一用例、同一模式**复测，并把结论追加到原条目。')
  out.push('> Retest with the same case in the same mode and append the result to the original entry.')
  out.push('')

  return out.join('\n')
}

async function cmdBuild(positionals, values) {
  const dir = resolve(positionals[0] ?? '')
  if (!existsSync(join(dir, 'session.json'))) {
    throw new Error(`not an observed-UI-test session (no session.json): ${dir}`)
  }
  const session = JSON.parse(await readFile(join(dir, 'session.json'), 'utf8'))
  const findings = await readFindings(dir)
  const evidence = await readEvidenceIndex(dir)
  const compliance = await readCompliance(dir)
  const planned = {
    elements: await countTableRows(join(dir, 'elements.md')),
    cases: await countTableRows(join(dir, 'matrix.md')),
    personas: await countTableRows(join(dir, 'personas.md')),
    scenarios: await countTableRows(join(dir, 'scenarios.md')),
    journeySteps: await countTableRows(join(dir, 'journey.md')),
    contentAreas: await countTableRows(join(dir, 'content.md')),
  }
  const markdown = render(session, findings, evidence, planned, compliance)
  const target = values.out ? resolve(values.out) : join(dir, 'report.md')
  if (values.stdout) {
    process.stdout.write(markdown)
    return 0
  }
  await writeFile(target, markdown, 'utf8')
  process.stdout.write(`报告已生成 / report written: ${target}\n`)
  process.stdout.write(
    `发现 findings: ${findings.length} · 证据 evidence: ${evidence.length} · ` +
      `注入监控 records: ${compliance.length} · ` +
      `闸门 gate: ${session.gate.confirmed ? 'CONFIRMED' : 'NOT CONFIRMED'}\n`,
  )
  return 0
}

async function main() {
  const { positionals, values } = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    options: {
      out: { type: 'string' },
      stdout: { type: 'boolean', default: false },
    },
  })
  const command = positionals.shift() ?? 'build'
  try {
    if (command === 'build') return await cmdBuild(positionals, values)
    process.stderr.write(`unknown command: ${command} (only "build" is supported)\n`)
    return 2
  } catch (error) {
    process.stderr.write(`error: ${error.message}\n`)
    return 2
  }
}

if (isMain()) {
  process.exitCode = await main()
}

export { cmdBuild, render }
