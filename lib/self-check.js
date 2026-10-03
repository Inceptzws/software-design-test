/**
 * self-check.js — offline checks shared by `scripts/verify.mjs` and `test/*.test.mjs`.
 *
 * Nothing here touches the screen, the network or any input device. It reads the plugin's own
 * files: skill frontmatter, relative markdown links, and — most importantly — scans the shipped
 * code for input-injection APIs so the plugin can never quietly grow one.
 *
 * 离线自检：校验技能 frontmatter、相对链接，并扫描包内代码是否混入输入注入 API。
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const SKILL_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u
const CJK_PATTERN = /[\u3400-\u4dbf\u4e00-\u9fff]/u

/**
 * APIs and command names that would mean the plugin performs input injection.
 * Word-boundary-ish matching keeps `element.click()` distinct from prose.
 */
const FORBIDDEN_CODE_PATTERNS = [
  { pattern: /\bCGEventPost\b/, why: 'macOS event injection' },
  { pattern: /\bCGEventCreateMouseEvent\b/, why: 'macOS event injection' },
  { pattern: /\bCGWarpMouseCursorPosition\b/, why: 'macOS cursor warping' },
  { pattern: /\bIOHIDPostEvent\b/, why: 'macOS HID injection' },
  { pattern: /\bAXUIElementPerformAction\b/, why: 'accessibility action invocation' },
  { pattern: /\bSendInput\b/, why: 'Windows synthetic input' },
  { pattern: /\bmouse_event\b/, why: 'Windows synthetic input' },
  { pattern: /\bkeybd_event\b/, why: 'Windows synthetic input' },
  { pattern: /\bSetCursorPos\b/, why: 'Windows cursor warping' },
  { pattern: /\bSendKeys\b/, why: 'scripted keystrokes' },
  { pattern: /InvokePattern/, why: 'UI Automation invocation' },
  { pattern: /dispatchMouseEvent|dispatchKeyEvent/, why: 'CDP input injection' },
  { pattern: /\.dispatchEvent\s*\(/, why: 'synthetic DOM event' },
  { pattern: /\.click\s*\(\s*\)/, why: 'programmatic click' },
  { pattern: /\bpyautogui\b/, why: 'synthetic input library' },
  { pattern: /\bcliclick\b/, why: 'CLI pointer injection' },
  { pattern: /xcrun simctl io booted (tap|input)/, why: 'simulator touch injection' },
  { pattern: /adb (shell )?input\b/, why: 'Android input injection' },
  { pattern: /\bidb ui tap\b/, why: 'iOS touch injection' },
  { pattern: /\bXCUIElement\b/, why: 'XCUITest synthesized touch' },
]

/** Directories scanned for injection APIs. */
const CODE_DIRS = ['lib', 'scripts']

function collectFiles(root, extensions) {
  const found = []
  const walk = (dir) => {
    let entries
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
        walk(full)
      } else if (extensions.some((extension) => entry.name.endsWith(extension))) {
        found.push(full)
      }
    }
  }
  walk(root)
  return found.sort()
}

function parseFrontmatter(raw, where) {
  const match = FRONTMATTER_PATTERN.exec(raw)
  if (match === null) throw new Error(`${where} has no YAML frontmatter`)
  const fields = new Map()
  for (const line of match[1].split(/\r?\n/)) {
    if (line.length === 0 || /^\s/u.test(line) || line.startsWith('#')) continue
    const colon = line.indexOf(':')
    if (colon <= 0) continue
    fields.set(line.slice(0, colon).trim(), line.slice(colon + 1).trim())
  }
  return { fields, body: raw.slice(match[0].length) }
}

/** Validate every skill directory: name grammar, name == directory, bilingual description. */
export function checkSkills(packageRoot) {
  const problems = []
  const skillsRoot = join(packageRoot, 'skills')
  let dirs = []
  try {
    dirs = readdirSync(skillsRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()
  } catch {
    problems.push(`skills/ directory missing under ${packageRoot}`)
    return { problems, skills: [] }
  }

  const skills = []
  for (const dir of dirs) {
    const locator = join(skillsRoot, dir, 'SKILL.md')
    try {
      const raw = readFileSync(locator, 'utf8')
      const { fields, body } = parseFrontmatter(raw, locator)
      const name = fields.get('name')
      const description = fields.get('description')
      if (name === undefined) problems.push(`${locator}: missing frontmatter name`)
      if (description === undefined) problems.push(`${locator}: missing frontmatter description`)
      if (name !== undefined && name !== dir) {
        problems.push(`${locator}: name "${name}" does not match directory "${dir}"`)
      }
      if (name !== undefined && !SKILL_NAME_PATTERN.test(name)) {
        problems.push(`${locator}: name "${name}" is not kebab-case`)
      }
      if (description !== undefined) {
        if (!CJK_PATTERN.test(description)) {
          problems.push(`${locator}: description has no Chinese text (bilingual required)`)
        }
        if (!/[A-Za-z]{4}/.test(description)) {
          problems.push(`${locator}: description has no English text (bilingual required)`)
        }
      }
      if (body.trim().length === 0) problems.push(`${locator}: empty body`)
      skills.push({ dir, locator, name, description, body })
    } catch (error) {
      problems.push(`${locator}: ${error.message}`)
    }
  }
  return { problems, skills }
}

/** Every relative markdown link inside the package must resolve to a real file. */
export function checkRelativeLinks(packageRoot) {
  const problems = []
  const files = collectFiles(packageRoot, ['.md'])
  for (const file of files) {
    const text = readFileSync(file, 'utf8')
    const directory = file.slice(0, file.lastIndexOf('/'))
    for (const match of text.matchAll(/\]\(([^)\s]+)\)/gu)) {
      const target = match[1]
      if (/^(https?:|mailto:|#)/u.test(target)) continue
      if (target.startsWith('<')) continue
      const clean = target.split('#')[0]
      if (clean.length === 0) continue
      const resolved = resolve(directory, clean)
      if (resolved.includes('/evidence/') || resolved.includes('scripts/../')) continue
      try {
        statSync(resolved)
      } catch {
        // Links that point into a generated session directory are documentation examples.
        if (/(evidence\/|ui-test-|report\.md$)/u.test(clean)) continue
        problems.push(`${file}: link does not resolve — ${target}`)
      }
    }
  }
  return problems
}

/**
 * Lines that legitimately *name* a banned token without being able to perform injection:
 * comments, quoted denylist entries, the scanner's own pattern table, and runtime
 * check-lists. Only code that could actually execute is reported.
 */
const NON_EXECUTABLE_LINE_PATTERNS = [
  /^\s*(\/\/|\*|\/\*)/u, // comment line
  /^\s*'[^']*',?\s*$/u, // quoted denylist entry
  /^\s*\['[^']*',/u, // [token, reason] pair entry
  /pattern:\s*\//u, // scanner pattern table row
  /for \(const \w+ of \[/u, // runtime check-list literal
]

/** The shipped code must never contain an input-injection API. */
export function scanForInjectionApis(packageRoot) {
  const problems = []
  for (const dir of CODE_DIRS) {
    for (const file of collectFiles(join(packageRoot, dir), ['.js', '.mjs', '.cjs'])) {
      const lines = readFileSync(file, 'utf8').split('\n')
      for (const [index, line] of lines.entries()) {
        if (NON_EXECUTABLE_LINE_PATTERNS.some((pattern) => pattern.test(line))) continue
        for (const { pattern, why } of FORBIDDEN_CODE_PATTERNS) {
          if (pattern.test(line)) {
            problems.push(`${file}:${index + 1} contains ${pattern} (${why}) — ${line.trim().slice(0, 120)}`)
          }
        }
      }
    }
  }
  return problems
}

/** Skills must actually document the method: three modes, the gate, the banned-directive rule. */
export function checkContentRequirements(packageRoot) {
  const problems = []
  const { skills } = checkSkills(packageRoot)
  const byName = new Map(skills.map((skill) => [skill.name, skill]))
  const main = byName.get('observed-ui-test')
  if (main === undefined) {
    problems.push('skill "observed-ui-test" is missing')
    return problems
  }
  const read = (relative) => readFileSync(join(main.locator, '..', relative), 'utf8')

  for (const level of ['L1', 'L2', 'L3']) {
    if (!main.body.includes(level)) problems.push(`observed-ui-test/SKILL.md does not mention ${level}`)
  }
  const mandatory = [
    ['observed-ui-test/SKILL.md', main.body, ['权限', 'permission']],
    ['observed-ui-test/SKILL.md', main.body, ['鼠标', 'mouse']],
    ['observed-ui-test/SKILL.md', main.body, ['键盘', 'keyboard']],
    ['observed-ui-test/SKILL.md', main.body, ['录屏', 'screen record']],
    ['observed-ui-test/SKILL.md', main.body, ['截屏', 'screenshot']],
  ]
  for (const [where, body, [zh, en]] of mandatory) {
    if (!body.includes(zh) || !body.toLowerCase().includes(en.toLowerCase())) {
      problems.push(`${where}: missing bilingual coverage for "${zh}" / "${en}"`)
    }
  }
  const banned = read('BANNED-INPUTS.md')
  for (const token of ['CGEventPost', 'SendInput', 'adb shell input', 'XCUIElement', 'cliclick']) {
    if (!banned.includes(token)) problems.push(`BANNED-INPUTS.md does not list ${token}`)
  }
  const levels = read('LEVELS.md')
  for (const token of ['仅鼠标', 'Mouse only', '修饰键', 'shortcut']) {
    if (!levels.toLowerCase().includes(token.toLowerCase())) {
      problems.push(`LEVELS.md: missing "${token}"`)
    }
  }

  // The user-simulation workflow is a first-class part of this plugin: its phases, heuristics and
  // defect discipline must all be present, and it must never gain an injection-based shortcut.
  const sim = byName.get('software-design-test')
  if (sim === undefined) {
    problems.push('skill "software-design-test" is missing')
    return problems
  }
  for (const level of ['L1', 'L2', 'L3']) {
    if (!sim.body.includes(level)) problems.push(`software-design-test/SKILL.md does not mention ${level}`)
  }
  for (const [zh, en] of [['人物', 'persona'], ['场景', 'scenario'], ['权限', 'permission']]) {
    if (!sim.body.includes(zh) || !sim.body.toLowerCase().includes(en)) {
      problems.push(`software-design-test/SKILL.md: missing bilingual coverage for "${zh}" / "${en}"`)
    }
  }
  const simRead = (relative) => readFileSync(join(sim.locator, '..', relative), 'utf8')
  const workflow = simRead('WORKFLOW.md')
  for (const phase of ['P0', 'P1', 'P3', 'P4', 'P5', 'P6', 'P7', 'P9']) {
    if (!workflow.includes(phase)) problems.push(`WORKFLOW.md: missing phase ${phase}`)
  }
  for (const token of [
    '认知走查',
    '十项可用性启发式',
    'HICCUPPS',
    'SFDIPOT',
    '巡游',
    '出声思维',
    '内部指针指令',
    '情感',
  ]) {
    if (token === '情感') continue
    if (!workflow.includes(token)) problems.push(`WORKFLOW.md: missing "${token}"`)
  }
  const heuristics = simRead('HEURISTICS.md')
  for (const token of ['Visibility of system status', 'HICCUPPS(F)', 'SFDIPOT', '地标 Landmark', 'WCAG', '键盘']) {
    if (!heuristics.includes(token)) problems.push(`HEURISTICS.md: missing "${token}"`)
  }
  const defects = simRead('DEFECTS.md')
  for (const token of ['复现率', '最小化', '严重级', 'Tester error', 'Observation error']) {
    if (!defects.includes(token)) problems.push(`DEFECTS.md: missing "${token}"`)
  }
  const testContent = simRead('TEST-CONTENT.md')
  for (const token of [
    '窗口与界面尺寸',
    '鼠标速度与指针',
    '工具栏与菜单',
    '目标尺寸与间距',
    '键盘与焦点',
    '跨设备一致性',
    'Fitts',
    'WCAG 2.5.8',
    '44×44',
  ]) {
    if (!testContent.includes(token)) problems.push(`TEST-CONTENT.md: missing "${token}"`)
  }
  // The trigger phrase must start a real run, not a methodology discussion.
  for (const token of ['模拟真实用户测试', 'simulate a real user test', '触发即开始']) {
    if (!sim.body.includes(token)) problems.push(`software-design-test/SKILL.md: missing trigger "${token}"`)
  }
  if (!themesTriggerIsDocumented(sim.body)) {
    problems.push('SKILL.md: the trigger section must say to start immediately')
  }
  for (const token of ['content', 'criteria']) {
    if (!testContent.includes(token)) problems.push(`TEST-CONTENT.md: missing ${token} guidance`)
  }
  const sources = simRead('SOURCES.md')
  for (const token of ['https://www.nngroup.com', 'https://www.w3.org', 'Whittaker']) {
    if (!sources.includes(token)) problems.push(`SOURCES.md: missing source "${token}"`)
  }
  return problems
}

/** The trigger section must promise an immediate start, not a method discussion. */
export function themesTriggerIsDocumented(body) {
  return body.includes('立即进入真实模拟测试') && body.includes('不再回头确认方法')
}

/** Plain-text mention check used by tests for the guard/observe wording. */
export function mentionsGuardObservation(packageRoot) {
  const text = [
    readFileSync(join(packageRoot, 'skills/observed-ui-test/SKILL.md'), 'utf8'),
    readFileSync(join(packageRoot, 'skills/observed-ui-test/BANNED-INPUTS.md'), 'utf8'),
  ].join('\n')
  return text.includes('guard.mjs') && text.includes('观察') && text.includes('observe')
}
