import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { apply, parseSkillDocument } from '../lib/index.js'
import { checkContentRequirements, checkRelativeLinks, checkSkills } from '../lib/self-check.js'

const packageRoot = fileURLToPath(new URL('..', import.meta.url))

function mount() {
  let provider
  const ctx = { skills: { registerProvider: (factory) => { provider = factory() } } }
  apply(ctx, {})
  assert.ok(provider, 'the plugin must register a skill provider')
  return provider
}

test('the plugin mounts and publishes both skills', async () => {
  const provider = mount()
  const candidates = await provider.list()
  const names = candidates.map((candidate) => candidate.name)
  assert.deepEqual(names, ['observed-test-plan', 'observed-ui-test', 'software-design-test'])
  for (const candidate of candidates) {
    assert.equal(candidate.provider, 'software-design-test')
    assert.equal(candidate.source, 'bundled')
    assert.equal(candidate.rank, 600)
    assert.equal(candidate.resourceBase.kind, 'directory')
    assert.ok(candidate.description.length > 40)
  }
})

test('provider.get returns the body and hides provider internals', async () => {
  const provider = mount()
  for (const candidate of await provider.list()) {
    const loaded = await provider.get(candidate, {})
    assert.equal(typeof loaded.content, 'string')
    assert.ok(/[\u4e00-\u9fff]/u.test(loaded.content), `${candidate.name}: Chinese body missing`)
    assert.ok(/[A-Za-z]{4}/u.test(loaded.content), `${candidate.name}: English body missing`)
    assert.ok(!('locator' in loaded), 'locator must not leak')
    assert.ok(!('rank' in loaded), 'rank must not leak')
  }
})

test('the main skill documents the three input modes, the gate and the bans', async () => {
  const provider = mount()
  const main = (await provider.list()).find((candidate) => candidate.name === 'observed-ui-test')
  const skill = await provider.get(main, {})
  for (const needle of ['L1', 'L2', 'L3', '仅鼠标', 'Mouse only', '权限', 'Permission', 'guard.mjs']) {
    assert.ok(skill.content.includes(needle), `SKILL.md must mention ${needle}`)
  }
  const banned = readFileSync(join(packageRoot, 'skills/observed-ui-test/BANNED-INPUTS.md'), 'utf8')
  for (const api of ['CGEventPost', 'SendInput', 'adb shell input', 'XCUIElement', 'el.click()']) {
    assert.ok(banned.includes(api), `BANNED-INPUTS.md must list ${api}`)
  }
})

test('the trigger phrase starts a real run, not a methodology chat', async () => {
  const provider = mount()
  const main = (await provider.list()).find((candidate) => candidate.name === 'software-design-test')
  const skill = await provider.get(main, {})
  for (const phrase of [
    '模拟真实用户测试',
    'simulate a real user test',
    'run a real-user simulation test',
    'simulated user testing',
  ]) {
    assert.ok(skill.content.includes(phrase) || skill.description.includes(phrase), `trigger phrase missing: ${phrase}`)
  }
  assert.ok(skill.content.includes('立即进入真实模拟测试'), 'must start the test immediately')
  assert.ok(skill.content.includes('不再回头确认方法'), 'must not re-confirm the method')
  assert.ok(skill.content.includes('只有触发词、没有对象'), 'must handle a bare trigger phrase')
})

test('the what-to-test checklist covers the user-visible dimensions', () => {
  const checklist = readFileSync(join(packageRoot, 'skills/software-design-test/TEST-CONTENT.md'), 'utf8')
  for (const area of [
    '窗口与界面尺寸',
    '鼠标速度与指针',
    '目标尺寸与间距',
    '工具栏与菜单',
    '键盘与焦点',
    '跨设备一致性',
  ]) {
    assert.ok(checklist.includes(area), `checklist missing ${area}`)
  }
  for (const criterion of ['WCAG 2.5.8', '24×24', '44×44', 'Fitts', '300–500ms', '10 秒']) {
    assert.ok(checklist.includes(criterion), `checklist missing criterion ${criterion}`)
  }
})

test('frontmatter parsing validates name vs directory and is bilingual', () => {
  const { problems, skills } = checkSkills(packageRoot)
  assert.deepEqual(problems, [])
  assert.equal(skills.length, 3)
  for (const skill of skills) {
    assert.match(skill.name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    assert.ok(/[\u4e00-\u9fff]/u.test(skill.description), 'Chinese description required')
    assert.ok(/[A-Za-z]{4}/u.test(skill.description), 'English description required')
  }
})

test('every relative markdown link resolves', () => {
  assert.deepEqual(checkRelativeLinks(packageRoot), [])
})

test('content requirements and injections checks are clean on the shipped package', () => {
  assert.deepEqual(checkContentRequirements(packageRoot), [])
})

test('parseSkillDocument keeps colons and strips matching quotes', () => {
  const raw = '---\nname: demo\ndescription: "a: b"\n---\nbody text\n'
  const { fields, body } = parseSkillDocument(raw, 'demo')
  assert.equal(fields.get('description'), 'a: b')
  assert.equal(body.trim(), 'body text')
})
