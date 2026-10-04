# software-design-test · 软件设计测试（模拟真实用户）/ Software Design Testing by Simulating Real Users

**一个 DeepSeek Harness 插件（DSH bundle plugin），重心是「怎么模拟真实用户来测软件」：
建人物与场景 → 拆任务卡 → 用出声思维在三级操作模式下真实操作 → 靠录屏与截屏判断功能元素是否
完好、工具是否真的可用，系统找出断头路、绕路、误导与状态错误。人不借助任何输入注入。**
An AI-native DSH bundle plugin whose centerpiece is **how to simulate a real user to test software**:
personas and scenarios, executable task cards, think-aloud execution in three input modes, and
screen-evidence judgement of element integrity and tool usability — with zero input injection.

[![npm version](https://img.shields.io/npm/v/software-design-test.svg)](https://www.npmjs.com/package/software-design-test)
[![verify](https://github.com/Inceptzws/software-design-test/actions/workflows/verify.yml/badge.svg)](https://github.com/Inceptzws/software-design-test/actions/workflows/verify.yml)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![dsh-plugin](https://img.shields.io/badge/dsh--plugin-ecosystem-7C6CF6)](https://github.com/topics/dsh-plugin)
[![Listed on dsh-plugin.org](https://dsh-plugin.org/badges/listed.svg)](https://dsh-plugin.org/plugins/Inceptzws/software-design-test)

[English](#english) | 中文

> **一句话价值 / In one line**：装上它，Agent 就会**像真实用户一样**去测你的软件——先问你要鼠标、键盘与
> 录屏权限，再按人物、场景、任务卡与"测试内容清单"（窗口尺寸、鼠标速度、工具栏可读性……）
> 走一遍真实操作，用录屏与截屏给出可复现的缺陷报告。
> **Installing it makes the agent test your software the way a real user would** — permission gate first,
> then personas, task cards and a what-to-test checklist, executed by hand with screen evidence.

**能力分类 / Category**：技能与智能体 (Skills & Agents) · **许可证 / License**：MIT ·
**社区项目 / Community project**：非 DeepSeek 官方出品，与 DeepSeek AI 无隶属关系。

---

## 它是什么 / What it is

用 DeepSeek Harness 做软件设计（尤其 macOS、Windows、iPhone、iPad 各种交互设备）时，
把"改完到底好不好用"变成一套可执行、可审计的流程。**核心是模拟真实用户**：
不是"假装点几下"，而是明确**以谁的身份（人物）、想完成什么（任务）、用什么证明（画面）**，
然后由真人用真实鼠标键盘在他会走的路径上走一遍：

- **人是唯一的手**：只用真实鼠标与键盘操作，分三级模式推进。
- **屏幕是唯一的证据**：从录屏/截屏观察元素是否完好、工具是否可用，代码与日志只是线索。
- **不允许内在指针指令**：不注入鼠标/触摸/按键事件，不驱动自动化框架，不调用软件内部句柄。
- **先问权限再动手**：鼠标、键盘、录屏、截屏与系统权限逐项询问用户，未答复不开始。
- **可以观察注入**：只读守门器盯着"有没有注入工具在跑"，命中就落盘、就进报告。
- **中英对照**：技能内容、问卷、报告模板、文档全部中英对照。

> EN: A verifiable process for "is it actually usable yet": the human is the only hand (three
> escalating input modes), the screen is the only evidence, internal pointer directives are banned,
> permissions are asked before anything starts, a read-only watchdog records injection clues, and
> every artifact is bilingual.

---

## 安装 / Install

```bash
# npm（已发布，预构建，无需构建授权）/ from npm — prebuilt, no build approval needed
dsh plugin --profile web add software-design-test
dsh plugin --profile desktop add software-design-test

# GitHub（源码直装；本包零依赖零构建，不需要 allowBuilds）/ from GitHub
dsh plugin --profile web add github:Inceptzws/software-design-test

# Release 里的 tarball / the tarball from the release
dsh plugin --profile web add ./software-design-test-1.2.1.tgz

# 本地目录（改源码时）/ local checkout while editing
dsh plugin --profile desktop add link:/abs/path/to/software-design-test
```

重启 Harness，然后确认：

```bash
grep -n "software-design-test" ~/.dsh/profiles/desktop/package.json
```

（依赖里出现 `link:` 那一行、`dsh.profile.bundles` 里出现同名条目即挂载成功；
在 `/` 菜单或 `skill` 工具里能看到两个技能是最可靠的确认。）

完整安装步骤、界面安装、手动挂载、卸载与排错见 **[docs/INSTALL.zh-en.md](docs/INSTALL.zh-en.md)**
（安装说明 / Installation，中英对照）。
> EN: Full install guide — local, GitHub, npm, UI install, manual mount, uninstall, troubleshooting:
> [docs/INSTALL.zh-en.md](docs/INSTALL.zh-en.md).

---

## 使用 / Usage

1. **直接说触发词：`模拟真实用户测试`**（英文：`simulate a real user test` / `run a real-user simulation test`）——
   插件会**立即进入真实模拟测试**：一句确认对象 → 发权限问卷 → 建会话开跑，不再跟你讨论方法论。
   也可以说"用 software-design-test 测一下 &lt;应用名&gt;"，或从 `/` 菜单选 `software-design-test`。
2. 回答权限问卷（鼠标、键盘级别、录屏、截屏、麦克风、系统权限、范围、数据边界、合规确认）。
3. 建会话 → 记录闸门 → 只看画面列元素清单与用例矩阵。
4. 按 **L1 仅鼠标 → L2 鼠标+键盘禁快捷键 → L3 可快捷键** 执行，逐条落盘。
5. 生成中英对照报告（含未验证项、权限缺口、跨模式差异、注入观察）。

```bash
cd software-design-test
node scripts/session.mjs init ./ui-test-demo-2026-10-04 --platform macos --app "Demo"
node scripts/session.mjs gate ./ui-test-demo-2026-10-04 --mouse yes --keyboard L2 \
  --screen-recording yes --screenshot yes --compliance yes
node scripts/capture.mjs check
node scripts/guard.mjs scan  ./ui-test-demo-2026-10-04
node scripts/capture.mjs record ./ui-test-demo-2026-10-04 --label L1 --seconds 60
node scripts/report.mjs build ./ui-test-demo-2026-10-04
```

完整用法、对话模板、FAQ 见 **[docs/USAGE.zh-en.md](docs/USAGE.zh-en.md)**
（使用说明 / Usage，中英对照）；框架的从上到下设计见
**[docs/FRAMEWORK.zh-en.md](docs/FRAMEWORK.zh-en.md)**。
> EN: Full usage guide with copy-paste prompts and FAQ: [docs/USAGE.zh-en.md](docs/USAGE.zh-en.md).
> Top-down framework: [docs/FRAMEWORK.zh-en.md](docs/FRAMEWORK.zh-en.md).

---

## 分发与发布 / Distribution and publishing

**安装（用户侧）** / Install for users:

```bash
# npm（已发布）/ from npm
dsh plugin --profile desktop add software-design-test

# GitHub（无需克隆）/ from GitHub
dsh plugin --profile desktop add github:Inceptzws/software-design-test

# 本地目录（改源码时）/ local checkout while editing
dsh plugin --profile desktop add link:/abs/path/to/software-design-test
```

| 渠道 Channel | 地址 Location |
| --- | --- |
| npm | <https://www.npmjs.com/package/software-design-test> |
| GitHub | <https://github.com/Inceptzws/software-design-test> |
| Release（附 tarball） | <https://github.com/Inceptzws/software-design-test/releases> |

**发布（维护者侧）** / Publish as a maintainer:

```bash
npm version patch|minor|major     # 改版本号并打 tag
git push --follow-tags            # 触发 .github/workflows/publish.yml
```

`publish.yml` 走 **npm Trusted Publishing（OIDC）**：不需要长期 token，并自动生成 provenance。
一次性配置：npmjs.com → 包页面 → **Settings → Trusted Publisher → GitHub Actions**，
Organization or user `Inceptzws`、Repository `software-design-test`、Workflow filename `publish.yml`。

> Why OIDC: npm 正在收紧**绕过 2FA 的 token**（账号变更 2026-08 起、直接发布 2027-01 起），
> OIDC 是之后仍然可用的发布路径。**今天仍然可用**的备选方案是粒度访问令牌：
> Packages & scopes → Read and write → 只勾 `software-design-test`，勾选 "Bypass 2FA"，
> 存为仓库 secret `NPM_TOKEN`，然后取消 `publish.yml` 里 env 段的注释。

`verify.yml` 在每次 push/PR 上跑：自检 8 项 + 29 条测试 + "包内不存在输入注入 API" 断言。

---

## 收录信息 / Listing information

供 [DSH Plugin Hub](https://dsh-plugin.org/) 收录与用户评估使用 / trust signals for the Hub and for users:

| 项目 Item | 内容 Value |
| --- | --- |
| 一句话价值 Value | 让 Agent 像真实用户一样测软件：权限闸门 → 人物/场景/任务卡 → 真实操作 → 录屏截屏证据 → 可复现缺陷报告 |
| 能力分类 Category | 技能与智能体 Skills & Agents |
| 安装命令 Install | `dsh plugin --profile web add software-design-test`（npm）· `... add github:Inceptzws/software-design-test`（GitHub） |
| 兼容 Compatibility | DeepSeek Harness `0.2.0-rc.2`（本机实测）；Node ≥ 20.11；capture 脚本覆盖 macOS / Windows / iOS 模拟器 / Android |
| 运行要求 Requirements | 零依赖、零构建、**不联网**；只写会话目录；无外部服务 |
| 权限 Permissions | 只读**截屏/录屏**（含屏幕录制系统权限）；**不需要**辅助功能、输入监控、自动化等控制权限；包内无任何输入注入 API |
| 数据 Data | 证据只存本地会话目录；权限问卷里先定数据边界；涉密界面默认不录 |
| 许可 License | MIT · 非官方社区项目，与 DeepSeek AI 无隶属关系 |

**可见的证明 / Real output**（本仓库 CI 每次 push 都会跑）：

```text
$ node scripts/verify.mjs
PASS  mount: plugin publishes every skill through ctx.skills
PASS  mount: provider.get returns body without leaking rank/locator
PASS  skills: frontmatter is valid and bilingual
PASS  links: every relative markdown link resolves
PASS  ban: shipped code contains no input-injection API
PASS  content: method requirements are documented bilingually
PASS  cli: session init / gate / finding / guard / report end to end
PASS  cli: capture.mjs exposes no input subcommand and checks availability

8/8 checks passed — 注入能力: 无 / capability to inject input: none

$ node --test test/*.test.mjs
ℹ tests 29   ℹ pass 29   ℹ fail 0
```

一次性会话演示 / a full session in one go:

```bash
node scripts/session.mjs init ./ui-test-<app>-<date> --platform macos --app "<app>"
node scripts/session.mjs gate ./ui-test-<app>-<date> --mouse yes --keyboard L2 \
  --screen-recording yes --screenshot yes --compliance yes     # 未通过闸门不会开始
node scripts/report.mjs build ./ui-test-<app>-<date>            # 中英对照报告 + 测试内容分布
```

---

## 三个技能 / Three skills

| 技能 Skill | 用途 Purpose |
| --- | --- |
| **`software-design-test`**（重心 centerpiece） | **模拟真实用户**：人物 → 场景 → 任务卡 → 旅程 → 启发式/巡游 → 执行 → 判定 → 报告 |
| `observed-test-plan` | 准备：权限问卷、范围六项、只看画面的元素清单、用例矩阵与优先级 |
| `observed-ui-test` | 执行规则：五条硬性规则、三级模式、十大观察维度、取证协议、报告模板 |

技能名与插件名同名：`software-design-test` 就是本插件的主技能，也是 `/` 菜单里直接可用的入口。

三个技能都是模型可调用的，请求匹配时 Agent 会自己选用。
> EN: All three skills are model-invocable; the agent picks them up when the request matches.

---

## 测什么 / What to test — the content checklist

用户真正关心的是**测什么**。完整清单 [TEST-CONTENT.md](skills/software-design-test/TEST-CONTENT.md)
共 15 类，每类给出"检查项 / 怎么看 / 判据"：

| 类别 | 先问什么 |
| --- | --- |
| §1 窗口与界面尺寸 | 这个界面的大小便于使用吗？最小尺寸、分屏、缩放 200% 还能用吗？ |
| §2 鼠标速度与指针 | 鼠标要跑多远？要不要很慢很准？双击速度跟系统一致吗？悬停菜单会不会"路过就弹"？ |
| §3 目标尺寸与间距 | 按钮够大吗？相邻按钮会不会误点？（24 / 44 / 48 阈值） |
| §4 工具栏与菜单 | 图标不看提示能看懂吗？常用命令一级可达吗？变窄时会不会消失？ |
| §5–§15 | 文字排版 · 布局层级 · 反馈状态 · 效率流程 · 键盘焦点 · 可访问性 · 性能响应 · 错误恢复 · 数据输入 · 跨设备一致性 · 视觉打磨 |

阈速查（24×24 / 44×44 / 48dp、对比度 4.5:1、放大 200%、0.1s–1s–10s 响应时限、悬停 300–500ms…）见清单附 A。

> The checklist answers *what we actually look at* — window size, pointer travel and speed, toolbar
> readability, target sizes, text, layout, feedback, efficiency, keyboard, accessibility, performance,
> errors, data, cross-device consistency and polish — with criteria such as WCAG 2.5.8.

---

## 模拟真实用户：十步工作流 / Simulating a real user: the ten steps

完整流程写在 [skills/software-design-test/WORKFLOW.md](skills/software-design-test/WORKFLOW.md)：

| # | 步骤 Step | 产出 Artifact |
| --- | --- | --- |
| P0 | 立项与权限 Charter & gate | `session.json` / `permissions.md` |
| P1 | 人物 Personas（3–5 个，含依据与"会在哪放弃"） | `personas.md` |
| P2 | 场景 Scenarios（首次成功/例行/出错恢复/中断/破坏性/交接） | `scenarios.md` |
| P3 | 任务卡 Task cards（意图 + 画面可判定的成功标准） | `matrix.md` |
| P4 | 旅程 Journey（进入/首次成功/熟练/出错恢复/退出再进入） | `journey.md` |
| P5 | 启发式与巡游 Sweep（认知走查四问 → 十项启发式 → HICCUPPS/SFDIPOT → 14 条巡游） | `heuristics.md` |
| P6 | 执行 Sessions（出声思维 × 三级模式 × 录屏截屏） | `findings.jsonl` / `evidence/` |
| P7 | 判定 Adjudicate（分类、定级、复现与最小化） | 定稿发现 |
| P8 | 报告 Report（去重 + 用户模拟覆盖） | `report.md` |
| P9 | 复测 Retest（同一任务卡/人物/级别） | 追加到原条目 |

配套清单：[启发式与巡游](skills/software-design-test/HEURISTICS.md)（含 Nielsen 十项、HICCUPPS(F)、
SFDIPOT、Whittaker 巡游、WCAG 2.2 仅键盘/屏幕阅读器步骤）· [人物与场景](skills/software-design-test/PERSONAS-SCENARIOS.md) ·
[缺陷与复现](skills/software-design-test/DEFECTS.md) · [出处](skills/software-design-test/SOURCES.md)。

> EN: Ten phases from personas to retest, with heuristics, tours and accessibility checklists, all
> composed with the three input modes and the no-injection rule. See
> [WORKFLOW.md](skills/software-design-test/WORKFLOW.md).

---

## 三级操作模式 / The three input modes

| 级别 | 允许 | 禁止 | 能抓到 |
| --- | --- | --- | --- |
| **L1 仅鼠标** | 移动、悬停、单击、双击、右键、拖拽、滚轮；预置剪贴板 + 菜单粘贴 | 一切键盘输入（含 Tab） | 无鼠标可达路径、命中区过小、必须悬停才可发现 |
| **L2 鼠标+键盘** | 字符输入、Enter、Tab/Shift+Tab、方向键、退格、空格、Home/End/PageUp/Down；Shift 仅用于大写 | 一切修饰键组合（⌘/Ctrl/⌥/Alt/Win）、F1–F12、把 Esc 当命令键 | 键盘导航断链、焦点环错位/丢失、焦点陷阱、Tab 顺序错乱 |
| **L3 加快捷键** | 全部放开 | 仍禁止内部指针指令 | 快捷键失效/冲突、鼠标路径与快捷键路径结果不一致 |

跨模式差异本身就是结论：只在 L3 能完成 = 缺鼠标路径；只在 L1/L2 能完成 = 快捷键路径坏了。
> EN: The difference across modes is itself the finding.

---

## 脚本 / Scripts

| 脚本 | 作用 | 是否只读 |
| --- | --- | --- |
| `scripts/session.mjs` | 会话脚手架、权限闸门、发现落盘、状态统计 | 只写会话目录 |
| `scripts/capture.mjs` | 截屏/录屏（macOS、Windows、iOS 模拟器、Android） | **只读屏，绝不注入** |
| `scripts/guard.mjs` | 观察输入注入线索（进程表 + 测试文本） | **只读观察，绝不执行注入** |
| `scripts/report.mjs` | 生成中英对照报告 | 只读会话目录 |
| `scripts/verify.mjs` | 离线自检 8 项（挂载、元数据、链接、注入 API、CLI 端到端） | 只读 |

---

## 自检 / Verify

```bash
node scripts/verify.mjs          # 8/8 checks passed
node --test test/*.test.mjs      # 25/25 pass
```

自检里有一项专门扫描 `lib/` 与 `scripts/`，确保这个包里**不存在任何可执行的输入注入 API**；
另有一条测试确保 `capture.mjs` 永远不会长出一个 `input` 子命令。
> EN: One check scans `lib/` and `scripts/` so the package can never grow an executable
> input-injection API; another asserts `capture.mjs` never gains an `input` subcommand.

---

## 目录 / Layout

```text
software-design-test/
├── package.json            # dsh.bundle.patch → cordis.patch.yml
├── cordis.patch.yml        # 挂载：id: observed-ui-test
├── lib/index.js            # Cordis 插件：ctx.skills provider（挂载即校验）
├── lib/self-check.js       # 离线校验工具
├── skills/observed-ui-test/       # SKILL.md · FRAMEWORK · LEVELS · BANNED-INPUTS · EVIDENCE · REPORT-TEMPLATE
├── skills/observed-test-plan/     # SKILL.md · PERMISSIONS · MATRIX · PLAN-TEMPLATE
├── skills/software-design-test/      # SKILL.md · WORKFLOW · PERSONAS-SCENARIOS · HEURISTICS · DEFECTS · SOURCES
├── scripts/                # session · capture · guard · report · verify
├── test/                   # node:test 用例（25 条）
├── docs/                   # INSTALL · USAGE · FRAMEWORK（均中英对照）
└── locale/{zh,en}.json     # Plugins 页面标题与描述
```

---

## 归属与许可 / License

MIT，见 [LICENSE](LICENSE)。本插件不打包任何第三方技能内容，技能文本为本项目原创。
> EN: MIT, see [LICENSE](LICENSE). No third-party skill content is vendored; the skill text is
> original to this project.

---

<a id="english"></a>

## English

`software-design-test` is a **DSH bundle plugin** that turns usability verification into an auditable
process while you build software with DeepSeek Harness — especially on macOS, Windows, iPhone and
iPad.

**Five hard rules**

1. **No internal pointer directives.** No injected pointer, touch or key events, no UI automation
   drivers, no calls into the software's internals. Banned per platform with compliant alternatives in
   `skills/observed-ui-test/BANNED-INPUTS.md`.
2. **Evidence comes from recordings and screenshots only.** Code, DOM, logs and databases are leads,
   never conclusions.
3. **The permission gate comes first.** Mouse, keyboard mode, screen recording, screenshots,
   microphone, OS capture permission, scope, data boundary and a compliance confirmation are asked
   before anything starts; unanswered means no start. The Q&A is recorded in `session.json`.
4. **Three input modes, in order.** L1 mouse only → L2 mouse + keyboard without shortcuts →
   L3 with shortcuts. The difference across modes is itself a finding.
5. **Never mark untested as passed.** `passed / failed / unverified` are three separate states.

**Watching injection is not doing it.** A read-only watchdog (`scripts/guard.mjs`) may watch for
injection tooling — it scans the process table and the session text, writes suspected clues to
`evidence/compliance.jsonl`, and reports them in section 8 of the report. It has no injection
capability whatsoever; it produces leads, not proof of absence.

**Install**

```bash
dsh plugin --profile desktop add link:/absolute/path/to/software-design-test
dsh --profile desktop --dump-config | grep -A3 observed-ui-test
```

**Use**

Say "run an observed UI test on &lt;app&gt;", answer the permission questionnaire, scaffold the
session, run L1 → L2 → L3, and build the bilingual report:

```bash
node scripts/session.mjs init ./ui-test-demo --platform macos --app "Demo"
node scripts/session.mjs gate ./ui-test-demo --mouse yes --keyboard L2 --screen-recording yes \
  --screenshot yes --compliance yes
node scripts/report.mjs build ./ui-test-demo
```

Full guides: [install](docs/INSTALL.zh-en.md) · [usage](docs/USAGE.zh-en.md) ·
[framework](docs/FRAMEWORK.zh-en.md). Self-check: `node scripts/verify.mjs` (8/8) and
`node --test test/*.test.mjs` (25/25). MIT licensed.
