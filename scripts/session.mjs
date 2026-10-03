#!/usr/bin/env node
/**
 * session.mjs — observed-UI-test session scaffolding, permission gate and findings log.
 *
 * This script only reads and writes files inside the session directory you name.
 * It contains no input injection of any kind: no pointer, touch or key events, no
 * accessibility control, no automation driver. It exists so the permission gate
 * is answered *before* testing and every finding is on disk the moment it is seen.
 *
 * 只做三件事：建会话目录、记录权限闸门、落盘发现。绝不注入任何输入事件。
 *
 * Usage / 用法:
 *   node scripts/session.mjs init   <dir> --platform macos --app "Name" [--levels L1,L2,L3]
 *                                          [--tester "name"] [--force]
 *   node scripts/session.mjs gate   <dir> --mouse yes --keyboard L2 --screen-recording yes
 *                                          --screenshot yes [--microphone no] [--os-permission yes]
 *                                          [--cursor yes] [--data-boundary "..."]
 *                                          [--compliance yes]
 *   node scripts/session.mjs status <dir>
 *   node scripts/session.mjs finding <dir> --json '<json>' | --json @file.json | --stdin
 */

import { existsSync } from 'node:fs'
import { appendFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const SEVERITIES = ['S1', 'S2', 'S3', 'S4', 'U']
const KINDS = ['defect', 'observation', 'suspicion', 'unverified']
const LEVELS = ['L1', 'L2', 'L3']
const PLATFORMS = ['macos', 'windows', 'ios', 'ipados', 'android', 'other']

const QUESTIONS_ZH = `## 权限问卷（先问，未答复不得开始测试）/ Permission questionnaire

1. **鼠标操作**：允许使用真实鼠标操作并据此判定吗？\`yes / no\`
2. **键盘操作**：允许使用键盘吗？到哪一级？\`L1 仅鼠标 / L2 鼠标+键盘禁快捷键 / L3 可用快捷键\`
3. **屏幕录制**：允许录屏吗？录屏是否包含光标？\`yes / no\`（含光标 / 不含）
4. **截屏**：允许随时截屏取证吗？\`yes / no\`
5. **麦克风**：允许口述操作解说以便对齐录屏时间点吗？\`yes / no\`
6. **系统捕获权限**：
   - macOS：系统设置 → 隐私与安全性 → 屏幕录制（授予后需重启应用）
   - Windows：设置 → 隐私和安全性 → 屏幕截图和录制 / 游戏栏
   - iPhone / iPad：控制中心屏幕录制（长按可开麦克风）
7. **被测对象**：应用名、版本、平台、设备。
8. **范围与数据边界**：测哪些功能、哪些不测、哪些内容绝对不能录进画面。
9. **退出条件**：出现什么情况立即停止（崩溃 / 数据损坏 / 隐私泄露 / 误改生产数据）。
10. **合规确认**：本次测试不使用任何内部指针指令——不注入鼠标、触摸、按键事件，不驱动自动化
    框架，不调用软件内部句柄；输入只来自你的真实外设，证据只来自录屏与截屏。\`yes / no\`

## English

1. **Mouse**: may I base findings on your real mouse actions? \`yes / no\`
2. **Keyboard**: allowed, and up to which mode? \`L1 mouse only / L2 no shortcuts / L3 shortcuts\`
3. **Screen recording**: allowed? Include the cursor? \`yes / no\` (with / without)
4. **Screenshots**: allowed as evidence at any time? \`yes / no\`
5. **Microphone**: allowed for spoken narration to line up the timeline? \`yes / no\`
6. **OS capture permission**: macOS Screen Recording (restart the app) / Windows Screenshots and
   recording / iOS Control Centre screen recording.
7. **App under test**: name, version, platform, devices.
8. **Scope and data boundary**: features in, features out, anything that must never be recorded.
9. **Exit criteria**: crash, data loss, privacy leak, production damage.
10. **Compliance**: no internal pointer directives are used — no injected pointer, touch or key
    events, no automation drivers, no calls into software internals. Input comes only from your real
    peripherals; evidence comes only from screen recording and screenshots. \`yes / no\`
`

function usage() {
  return `observed-ui-test session tool

  init   <dir> --platform <p> --app <name> [--levels L1,L2,L3] [--tester <name>] [--force]
  gate   <dir> --mouse yes|no --keyboard L1|L2|L3 --screen-recording yes|no --screenshot yes|no
               [--microphone yes|no] [--os-permission yes|no] [--cursor yes|no]
               [--data-boundary "..."] [--compliance yes|no]
  status <dir>
  finding <dir> --json '<json>' | --json @file | --stdin
  help

Platforms: ${PLATFORMS.join(' | ')}
Severities: ${SEVERITIES.join(' | ')}   Kinds: ${KINDS.join(' | ')}
`
}

const nowIso = () => new Date().toISOString()
const stamp = () => nowIso().replace(/[:.]/g, '-')
const sessionPath = (dir) => join(dir, 'session.json')
const findingsPath = (dir) => join(dir, 'findings.jsonl')

async function loadSession(dir) {
  const file = sessionPath(dir)
  if (!existsSync(file)) {
    throw new Error(`not an observed-UI-test session (no session.json): ${dir}`)
  }
  return JSON.parse(await readFile(file, 'utf8'))
}

async function saveSession(dir, session) {
  session.updatedAt = nowIso()
  await writeFile(sessionPath(dir), JSON.stringify(session, null, 2) + '\n', 'utf8')
}

function yesNo(value, flag) {
  if (value === undefined) return undefined
  const text = String(value).trim().toLowerCase()
  if (['yes', 'y', 'true', '1', '是', '允许'].includes(text)) return true
  if (['no', 'n', 'false', '0', '否', '拒绝'].includes(text)) return false
  throw new Error(`--${flag} expects yes or no, got "${value}"`)
}

function normalizeLevel(value) {
  if (value === undefined) return undefined
  const text = String(value).trim().toUpperCase()
  const level = text.startsWith('L') ? text : `L${text}`
  if (!LEVELS.includes(level)) throw new Error(`--keyboard expects L1, L2 or L3, got "${value}"`)
  return level
}

function elementsTemplate() {
  return `# 元素清单 / Element inventory

> 只看画面建立：打开软件，逐个界面截图，抄下看得见的功能元素与工具。
> 不许打开代码、DOM 检查器或数据库来补全清单。
> Screen only: screenshot each surface and transcribe what is visible. Do not open code, a DOM
> inspector or a database to complete this list.

| ID | 界面 Surface | 元素/工具 Element or tool | 类型 Type | 期望状态 Expected states（默认·悬停·按下·选中·禁用·加载·错误·空） | 优先级 Priority | 证据 Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| E-01 |  |  |  |  |  |  |
`
}

function matrixTemplate(session) {
  const platform = session.platform
  return `# 用例矩阵 / Case matrix

> 矩阵 = 元素 × 平台 × 模式。P0/P1 必须三级全跑；跨模式差异本身就是结论。
> Matrix = element x platform x mode. P0/P1 must run at all three levels; the difference is a finding.

| 用例 ID | 元素 | 平台 Platform | 模式 Mode | 优先级 Priority | 前置 Preconditions | 操作步骤 Steps（该模式下） | 期望（画面上可见）Expected (on screen) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | E-01 | ${platform} | L1 | P0 |  |  |  |
| C-001 | E-01 | ${platform} | L2 | P1 |  |  |  |
| C-001 | E-01 | ${platform} | L3 | P1 |  |  |  |

## 覆盖率 / Coverage

- 元素覆盖率 Element coverage：待填
- 模式覆盖率 Mode coverage：待填
- 平台覆盖率 Platform coverage：待填
- 用例执行率 Case execution：待填
`
}

function personasTemplate() {
  return `# 人物 / Personas

> 人物是**观察的架子**，不是证据。每一个都要写出依据（访谈、工单、数据、设计目标），
> 不许凭空编造"典型用户"。模拟人物得出的结论不能当成真实用户结论。
> A persona is **scaffolding for observation**, not evidence. Every persona needs a stated source
> (interview, ticket, analytics, design goal). Never invent a "typical user", and never present a
> simulated persona's outcome as a fact about real users.

| ID | 人物 Persona | 目标/动机 Goal | 熟练度 Expertise | 设备与习惯 Device & habits | 可访问性需求 Accessibility needs | 依据 Source of evidence |
| --- | --- | --- | --- | --- | --- | --- |
| P-01 |  |  | 新手/普通/专家 novice/regular/expert |  | 无 / 键盘-only / 屏幕阅读器 / 动态字体 |  |

## 人物纪律 / Persona discipline

- 至少覆盖：一个新手、一个高频专家、一个"只剩一只手/键盘-only"或视障用户。
- 不许把人物写成"什么都会、什么都不生气"的完人——那样找不到任何缺陷。
- 每个人物写一句"他会在哪里放弃"。
`
}

function scenariosTemplate() {
  return `# 场景 / Scenarios

> 场景 = 人物 + 目标 + 触发条件 + 成功标准。场景要能被拆成**可执行的任务**。
> A scenario is persona + goal + trigger + success criteria, and it must decompose into executable
> tasks.

| ID | 人物 Persona | 场景 Story | 触发 Trigger | 成功标准 Success criteria | 途中检查点 Checkpoints |
| --- | --- | --- | --- | --- | --- |
| S-01 | P-01 |  |  |  |  |

## 场景来源 / Where scenarios come from

真实会话与工单 · 支持邮件 · 埋点里的失败漏斗 · 设计目标（"用户应该能在 30 秒内导出"）·
竞品对照 · 你自己的第一次使用体验。
`
}

function journeyTemplate() {
  return `# 用户旅程 / User journey

> 沿时间轴走一遍，标出每一步的"期望 vs 实际"。断头路、绕路、反复、被迫记住的东西，
> 都是缺陷候选。
> Walk the timeline once and mark expectation vs observation at every step. Dead ends, detours,
> loops and things the user is forced to memorise are all defect candidates.

| # | 阶段 Stage | 用户目标 Goal | 触点/界面 Touchpoint | 期望 Expectation | 实际观察 Observed | 摩擦/缺陷 Friction or defect | 证据 Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 进入 Entry |  |  |  |  |  |  |
| 2 | 首次成功 First success |  |  |  |  |  |  |
| 3 | 熟练使用 Routine use |  |  |  |  |  |  |
| 4 | 出错与恢复 Error and recovery |  |  |  |  |  |  |
| 5 | 退出与再进入 Exit and return |  |  |  |  |  |  |
`
}

function heuristicsTemplate() {
  return `# 启发式检查 / Heuristic sweep

> 用启发式当"透镜"逐条扫，每条都要能指到画面上的具体位置。完整清单见
> \`software-design-test/HEURISTICS.md\`（Nielsen 十项 + HICCUPPS(F) 一致性启发式 + SFDIPOT 结构透镜 + 巡游）。
> Sweep with heuristics as lenses; every line must point at a place on the screen. The full list
> lives in \`software-design-test/HEURISTICS.md\`.

| ID | 启发式 Heuristic | 适用处 Where applied | 结论 Verdict | 证据 Evidence |
| --- | --- | --- | --- | --- |
| H-01 | 系统状态可见 Visibility of system status |  | 通过 / 违反 / 未验证 |  |
`
}

function contentTemplate() {
  return `# 测试内容覆盖 / Content coverage

> 清单本体在 \`software-design-test/TEST-CONTENT.md\`（15 类，每类含"检查项 / 怎么看 / 判据"）。
> 每确认一类，把结论写进"结论"列；违反项单独落盘成 finding，并带上 content 与 criteria 字段。
> The checklist lives in \`TEST-CONTENT.md\`. Record a verdict per category here; file violations as
> findings with the \`content\` and \`criteria\` fields.

| # | 类别 Category | 结论 Verdict（通过 / 违反 / 未验证） | 违反数 Findings | 证据 Evidence |
| --- | --- | --- | --- | --- |
| §1 | 窗口与界面尺寸 Window & screen size |  |  |  |
| §2 | 鼠标速度与指针 Pointer dynamics & speed |  |  |  |
| §3 | 目标尺寸与间距 Target size & spacing |  |  |  |
| §4 | 工具栏与菜单 Toolbar & menus |  |  |  |
| §5 | 文字与排版 Legibility |  |  |  |
| §6 | 布局与层级 Layout & hierarchy |  |  |  |
| §7 | 反馈与状态 Feedback & state |  |  |  |
| §8 | 效率与流程 Efficiency & flow |  |  |  |
| §9 | 键盘与焦点 Keyboard & focus |  |  |  |
| §10 | 可访问性 Accessibility |  |  |  |
| §11 | 性能与响应 Performance |  |  |  |
| §12 | 错误与恢复 Errors & recovery |  |  |  |
| §13 | 数据与输入 Data & input |  |  |  |
| §14 | 跨设备一致性 Cross-device consistency |  |  |  |
| §15 | 视觉打磨 Polish |  |  |  |

## 十分钟快扫 / Ten-minute sweep

- [ ] 默认窗口完整可见 · [ ] 最小尺寸可用 · [ ] 缩放 200% 不破版 · [ ] 纯鼠标走主任务
- [ ] 纯键盘走主任务 · [ ] 记录指针总行程 · [ ] 工具栏图标可识别 · [ ] 长操作有反馈且可取消
- [ ] 故意输错看提示 · [ ] 深色模式 + 系统字号

## 尺寸与速度专项记录 / Size and pointer measurements

| 项 Item | 数值 Value | 结论 Verdict |
| --- | --- | --- |
| 默认窗口尺寸 / 最小可用尺寸 |  |  |
| 分屏（窄栏）下的可用性 |  |  |
| 系统缩放 125% / 150% / 200% |  |  |
| 主任务指针总行程（估） |  |  |
| 最远两点距离 |  |  |
| 双击速度（系统最慢 / 最快） |  |  |
| 悬停提示出现时间 |  |  |
`
}

function reportDraft(session) {
  return `# 观察式界面测试报告（初稿）/ Observed UI Test Report (draft)

- 应用 App：${session.app}
- 平台 Platform：${session.platform}
- 级别 Levels：${session.levels.join(', ')}
- 操作者 Operator：${session.tester || '(待填)'}
- 创建于 Created：${session.createdAt}
- 权限闸门 Gate：${session.gate.confirmed ? '已通过 confirmed' : '**未通过 NOT confirmed**'}

## 合规声明 / Compliance

本次测试使用真实的鼠标与键盘操作，使用录屏/截屏作为唯一证据，
**未使用任何内部指针指令**（无指针/触摸/按键注入、无自动化框架、无内部句柄调用）。
This run uses real mouse and keyboard input with screen recording and screenshots as the only
evidence, and uses **no internal pointer directives** of any kind.

> 用 \`node scripts/report.mjs build <dir>\` 依据 findings.jsonl 重新生成本报告。
> Regenerate from findings.jsonl with \`node scripts/report.mjs build <dir>\`.
`
}

const PROTECTED_FILES = [
  'session.json',
  'permissions.md',
  'elements.md',
  'matrix.md',
  'content.md',
  'personas.md',
  'scenarios.md',
  'journey.md',
  'heuristics.md',
  'findings.jsonl',
  'report.md',
  'evidence',
]

async function cmdInit(positionals, values) {
  const target = positionals[0]
  if (!target) throw new Error('init needs a session directory')
  const dir = resolve(target)

  const platform = (values.platform ?? 'macos').toLowerCase()
  if (!PLATFORMS.includes(platform)) {
    throw new Error(`--platform must be one of ${PLATFORMS.join(', ')}`)
  }
  const app = values.app ?? '(unnamed app)'
  const levels = (values.levels ?? 'L1,L2,L3')
    .split(',')
    .map((part) => normalizeLevel(part.trim()))
  for (const level of levels) {
    if (!LEVELS.includes(level)) throw new Error(`--levels must be a subset of ${LEVELS.join(',')}`)
  }

  if (existsSync(dir)) {
    const entries = (await readdir(dir)).filter((name) => !name.startsWith('.'))
    if (entries.length > 0 && !values.force) {
      const clash = entries.filter((name) => PROTECTED_FILES.includes(name))
      if (clash.length > 0) {
        throw new Error(
          `${dir} already holds a session (${clash.join(', ')}); pass --force to overwrite`,
        )
      }
    }
  }

  await mkdir(join(dir, 'evidence'), { recursive: true })

  const session = {
    schema: 'software-design-test/session@1',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    app,
    platform,
    levels,
    tester: values.tester ?? '',
    gate: {
      confirmed: false,
      answeredAt: null,
      mouse: null,
      keyboard: levels[0],
      screenRecording: null,
      screenshot: null,
      cursorIncluded: null,
      microphone: null,
      osPermission: null,
      complianceAcknowledged: null,
      dataBoundary: '',
      blockers: ['权限问卷尚未回答 / the permission questionnaire is unanswered'],
    },
    scope: { devices: '', environment: '', outOfScope: '', exitCriteria: '' },
    counts: { findings: 0 },
  }

  await saveSession(dir, session)
  const permissionsHeader = `# 权限记录 / Permission record

- 会话 Session：${dir}
- 应用 App：${app}
- 平台 Platform：${platform}
- 创建于 Created：${session.createdAt}

> 先原样把下面的问题发给用户，等逐条答复后再执行 \`session.mjs gate\`。
> Send the questions below verbatim first, then record the answers with \`session.mjs gate\`.

`
  const permissions =
    permissionsHeader +
    QUESTIONS_ZH +
    `

## 用户答复 / Answers

（由 \`session.mjs gate\` 写入 / written by \`session.mjs gate\`）
`
  await writeFile(join(dir, 'permissions.md'), permissions, 'utf8')
  await writeFile(join(dir, 'content.md'), contentTemplate(), 'utf8')
  await writeFile(join(dir, 'elements.md'), elementsTemplate(), 'utf8')
  await writeFile(join(dir, 'matrix.md'), matrixTemplate(session), 'utf8')
  await writeFile(join(dir, 'personas.md'), personasTemplate(), 'utf8')
  await writeFile(join(dir, 'scenarios.md'), scenariosTemplate(), 'utf8')
  await writeFile(join(dir, 'journey.md'), journeyTemplate(), 'utf8')
  await writeFile(join(dir, 'heuristics.md'), heuristicsTemplate(), 'utf8')
  await writeFile(join(dir, 'report.md'), reportDraft(session), 'utf8')
  await writeFile(findingsPath(dir), '', 'utf8')

  process.stdout.write(`已创建会话 / session created: ${dir}\n`)
  process.stdout.write(`  平台 platform : ${platform}\n`)
  process.stdout.write(`  级别 levels   : ${levels.join(', ')}\n`)
  process.stdout.write(`  闸门 gate     : 未通过 not confirmed\n\n`)
  process.stdout.write('下一步 / next:\n')
  process.stdout.write(`  1. 把 permissions.md 里的问卷发给用户 / send the questionnaire\n`)
  process.stdout.write(
    `  2. node scripts/session.mjs gate ${target} --mouse yes --keyboard ${levels[0]} ` +
      `--screen-recording yes --screenshot yes\n`,
  )
  process.stdout.write(`  3. 开始前用 capture.mjs check 验证取证可用 / verify capture first\n`)
  return 0
}

async function cmdGate(positionals, values) {
  const dir = resolve(positionals[0] ?? '')
  const session = await loadSession(dir)
  const gate = session.gate

  const mouse = yesNo(values.mouse, 'mouse')
  const keyboard = normalizeLevel(values.keyboard)
  const screenRecording = yesNo(values['screen-recording'], 'screen-recording')
  const screenshot = yesNo(values.screenshot, 'screenshot')
  const microphone = yesNo(values.microphone, 'microphone')
  const osPermission = yesNo(values['os-permission'], 'os-permission')
  const cursorIncluded = yesNo(values.cursor, 'cursor')
  const compliance = yesNo(values.compliance, 'compliance')

  if (values['data-boundary'] !== undefined) gate.dataBoundary = values['data-boundary']

  const blockers = []
  if (mouse === false) blockers.push('鼠标操作被拒绝 / mouse operation denied — 无法测试 cannot test')
  if (mouse === undefined && gate.mouse !== true) {
    blockers.push('鼠标权限未回答 / mouse permission unanswered')
  }
  if (screenRecording === false && screenshot === false) {
    blockers.push(
      '录屏与截屏都被拒绝 / both recording and screenshots denied — 无画面即无证据 no visual evidence',
    )
  }
  if (screenRecording === undefined && screenshot === undefined &&
      gate.screenRecording !== true && gate.screenshot !== true) {
    blockers.push('取证权限未回答 / capture permission unanswered')
  }
  if (compliance === false) {
    blockers.push('合规声明未确认 / compliance statement not confirmed')
  }
  if (values.keyboard !== undefined && keyboard === 'L1' && mouse === false) {
    blockers.push('仅鼠标模式下鼠标被拒绝 / mouse-only mode with mouse denied')
  }

  if (mouse !== undefined) gate.mouse = mouse
  if (keyboard !== undefined) gate.keyboard = keyboard
  if (screenRecording !== undefined) gate.screenRecording = screenRecording
  if (screenshot !== undefined) gate.screenshot = screenshot
  if (microphone !== undefined) gate.microphone = microphone
  if (osPermission !== undefined) gate.osPermission = osPermission
  if (cursorIncluded !== undefined) gate.cursorIncluded = cursorIncluded
  if (compliance !== undefined) gate.complianceAcknowledged = compliance

  const gateOk =
    gate.mouse === true &&
    (gate.screenRecording === true || gate.screenshot === true) &&
    gate.complianceAcknowledged !== false
  gate.confirmed = gateOk
  gate.answeredAt = nowIso()
  gate.blockers = gateOk
    ? []
    : blockers.length > 0
      ? blockers
      : ['闸门条件不完整 / gate conditions incomplete']

  await saveSession(dir, session)

  const lines = [
    `闸门 gate: ${gate.confirmed ? '已通过 CONFIRMED' : '未通过 NOT CONFIRMED'}`,
    `  鼠标 mouse              : ${fmtTri(gate.mouse)}`,
    `  键盘 keyboard           : ${gate.keyboard}`,
    `  屏幕录制 screenRecording : ${fmtTri(gate.screenRecording)}` +
      (gate.cursorIncluded === null ? '' : ` (光标 cursor: ${fmtTri(gate.cursorIncluded)})`),
    `  截屏 screenshot          : ${fmtTri(gate.screenshot)}`,
    `  麦克风 microphone        : ${fmtTri(gate.microphone)}`,
    `  系统权限 osPermission    : ${fmtTri(gate.osPermission)}`,
    `  合规 compliance          : ${fmtTri(gate.complianceAcknowledged)}`,
    `  数据边界 dataBoundary    : ${gate.dataBoundary || '(未填 unset)'}`,
  ]
  if (!gate.confirmed) {
    lines.push('  阻塞 blockers:')
    for (const blocker of gate.blockers) lines.push(`    - ${blocker}`)
    lines.push('  在闸门通过前不要开始测试 / do NOT start testing until the gate passes.')
  } else {
    lines.push('  可以开始 L1（仅鼠标）/ you may start L1 (mouse only).')
  }
  process.stdout.write(lines.join('\n') + '\n')

  const answers = `
## 用户答复 / Answers

- 记录时间 Recorded：${gate.answeredAt}
- 鼠标 Mouse：${fmtTri(gate.mouse)}
- 键盘 Keyboard：${gate.keyboard}
- 屏幕录制 Screen recording：${fmtTri(gate.screenRecording)}${
    gate.cursorIncluded === null ? '' : `（光标 cursor：${fmtTri(gate.cursorIncluded)}）`
  }
- 截屏 Screenshot：${fmtTri(gate.screenshot)}
- 麦克风 Microphone：${fmtTri(gate.microphone)}
- 系统捕获权限 OS capture permission：${fmtTri(gate.osPermission)}
- 合规确认 Compliance：${fmtTri(gate.complianceAcknowledged)}
- 数据边界 Data boundary：${gate.dataBoundary || '(未填 unset)'}
- 闸门结果 Gate result：${gate.confirmed ? '通过 CONFIRMED' : '未通过 NOT CONFIRMED'}
${
  gate.blockers.length > 0
    ? gate.blockers.map((blocker) => `  - 阻塞 / blocker：${blocker}`).join('\n') + '\n'
    : ''
}
> 未获得的权限必须出现在报告首页的覆盖缺口里。
> Every permission not granted must appear as a coverage gap on page one of the report.
`
  await appendFile(join(dir, 'permissions.md'), answers, 'utf8')
  return gate.confirmed ? 0 : 1
}

const fmtTri = (value) => (value === null || value === undefined ? '(未答 unanswered)' : value ? 'yes' : 'no')

async function cmdStatus(positionals) {
  const dir = resolve(positionals[0] ?? '')
  const session = await loadSession(dir)
  const findings = await readFindings(dir)
  const bySeverity = count(findings.map((item) => item.severity ?? 'U'))
  const byKind = count(findings.map((item) => item.kind ?? 'defect'))
  const byLevel = count(findings.map((item) => item.level ?? '?'))
  const out = [
    `会话 session : ${dir}`,
    `应用 app     : ${session.app} @ ${session.platform}`,
    `级别 levels  : ${session.levels.join(', ')}`,
    `闸门 gate    : ${session.gate.confirmed ? '已通过 CONFIRMED' : '未通过 NOT CONFIRMED'}`,
    `  鼠标/键盘  : ${fmtTri(session.gate.mouse)} / ${session.gate.keyboard}`,
    `  录屏/截屏  : ${fmtTri(session.gate.screenRecording)} / ${fmtTri(session.gate.screenshot)}`,
    `发现 findings: ${findings.length}`,
    `  级别 severity: ${SEVERITIES.map((s) => `${s}=${bySeverity[s] ?? 0}`).join('  ')}`,
    `  类型 kind    : ${KINDS.map((k) => `${k}=${byKind[k] ?? 0}`).join('  ')}`,
    `  模式 level   : ${LEVELS.map((l) => `${l}=${byLevel[l] ?? 0}`).join('  ')}`,
  ]
  if (!session.gate.confirmed) {
    out.push('提醒 reminder: 闸门未通过，不得开始测试。gate not confirmed, do not start testing.')
  }
  process.stdout.write(out.join('\n') + '\n')
  return 0
}

function count(items) {
  const result = {}
  for (const item of items) result[item] = (result[item] ?? 0) + 1
  return result
}

async function readFindings(dir) {
  const file = findingsPath(dir)
  if (!existsSync(file)) return []
  const raw = await readFile(file, 'utf8')
  const rows = []
  for (const [index, line] of raw.split('\n').entries()) {
    const text = line.trim()
    if (text.length === 0) continue
    try {
      rows.push(JSON.parse(text))
    } catch (error) {
      throw new Error(`${file}:${index + 1} is not valid JSON: ${error.message}`)
    }
  }
  return rows
}

async function readJsonArg(values) {
  if (values.stdin) return await readStdin()
  const arg = values.json
  if (arg === undefined) throw new Error('finding needs --json <json> | --json @file | --stdin')
  if (arg.startsWith('@')) return await readFile(resolve(arg.slice(1)), 'utf8')
  return arg
}

async function readStdin() {
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  return Buffer.concat(chunks).toString('utf8')
}

async function cmdFinding(positionals, values) {
  const dir = resolve(positionals[0] ?? '')
  const session = await loadSession(dir)
  const raw = await readJsonArg(values)
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    throw new Error(`--json is not valid JSON: ${error.message}`)
  }
  const items = Array.isArray(parsed) ? parsed : [parsed]
  const existing = await readFindings(dir)

  const written = []
  for (const item of items) {
    const severity = String(item.severity ?? 'U').toUpperCase()
    const kind = String(item.kind ?? item.status ?? 'defect').toLowerCase()
    const level = item.level === undefined ? session.levels[0] : String(item.level).toUpperCase()
    if (!SEVERITIES.includes(severity)) {
      throw new Error(`severity must be one of ${SEVERITIES.join(', ')}`)
    }
    if (!KINDS.includes(kind)) throw new Error(`kind must be one of ${KINDS.join(', ')}`)
    if (!LEVELS.includes(level)) throw new Error(`level must be one of ${LEVELS.join(', ')}`)
    if (!item.title_zh && !item.title_en) {
      throw new Error('a finding needs at least title_zh or title_en')
    }
    const id = item.id ?? `F-${String(existing.length + written.length + 1).padStart(3, '0')}`
    const record = {
      id,
      at: item.at ?? nowIso(),
      level,
      platform: item.platform ?? session.platform,
      element: item.element ?? '',
      persona: item.persona ?? '',
      content: item.content ?? '',
      criteria: item.criteria ?? '',
      scenario: item.scenario ?? '',
      task_outcome: item.task_outcome ?? '',
      heuristic: item.heuristic ?? '',
      tour: item.tour ?? '',
      repro_rate: item.repro_rate ?? '',
      minimized: item.minimized ?? '',
      title_zh: item.title_zh ?? item.title_en ?? '',
      title_en: item.title_en ?? item.title_zh ?? '',
      steps_zh: item.steps_zh ?? '',
      steps_en: item.steps_en ?? '',
      expected_zh: item.expected_zh ?? '',
      expected_en: item.expected_en ?? '',
      actual_zh: item.actual_zh ?? '',
      actual_en: item.actual_en ?? '',
      modes: item.modes ?? '',
      severity,
      kind,
      evidence: Array.isArray(item.evidence) ? item.evidence : item.evidence ? [item.evidence] : [],
      impact: item.impact ?? '',
      suggestion: item.suggestion ?? '',
    }
    written.push(record)
  }

  await appendFile(findingsPath(dir), written.map((record) => JSON.stringify(record)).join('\n') + '\n', 'utf8')
  session.counts = { findings: existing.length + written.length }
  await saveSession(dir, session)

  for (const record of written) {
    process.stdout.write(
      `已记录 / recorded ${record.id} [${record.severity}/${record.kind}] L=${record.level} ` +
        `${record.title_zh || record.title_en}\n`,
    )
  }
  process.stdout.write(
    `合计 / total: ${existing.length + written.length} — 用 report.mjs build 生成报告。\n`,
  )
  return 0
}

async function main() {
  const { positionals, values } = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    options: {
      platform: { type: 'string' },
      app: { type: 'string' },
      levels: { type: 'string' },
      tester: { type: 'string' },
      force: { type: 'boolean', default: false },
      mouse: { type: 'string' },
      keyboard: { type: 'string' },
      'screen-recording': { type: 'string' },
      screenshot: { type: 'string' },
      microphone: { type: 'string' },
      'os-permission': { type: 'string' },
      cursor: { type: 'string' },
      compliance: { type: 'string' },
      'data-boundary': { type: 'string' },
      json: { type: 'string' },
      stdin: { type: 'boolean', default: false },
    },
  })

  const command = positionals.shift() ?? 'help'
  try {
    if (command === 'init') return await cmdInit(positionals, values)
    if (command === 'gate') return await cmdGate(positionals, values)
    if (command === 'status') return await cmdStatus(positionals, values)
    if (command === 'finding') return await cmdFinding(positionals, values)
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

// Only run when executed as a CLI; importing this module (tests) must not touch stdout.
const invokedDirectly =
  process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invokedDirectly) {
  process.exitCode = await main()
}

export { cmdFinding, cmdGate, cmdInit, cmdStatus, readFindings, stamp }
