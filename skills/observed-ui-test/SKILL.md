---
name: observed-ui-test
description: 观察式界面测试：只用真实鼠标和键盘操作软件，靠录屏与截屏判断功能元素是否完好、工具是否可用。用于 macOS、Windows、iPhone、iPad 及其他交互设备的软件测试与找 bug，按三级模式推进（仅鼠标 / 鼠标+键盘无快捷键 / 鼠标+键盘+快捷键），禁止任何内部指针注入指令，开始前先向用户申请鼠标、键盘与录屏等权限。Observed UI testing: drive software with a real mouse and keyboard only, and judge element integrity and tool usability from screen recordings and screenshots, on macOS, Windows, iPhone and iPad, in three escalating input modes, with zero synthetic pointer injection, after asking the user for mouse, keyboard and capture permissions.
---

# 观察式界面测试 / Observed UI Testing

用 DeepSeek Harness 做软件设计时，用这套方法做验收、找 bug、验工具。核心只有一句：
**人是唯一的手，屏幕是唯一的证据。**

A method for acceptance testing, bug hunting and tool verification while designing software with
DeepSeek Harness. One sentence holds it together:
**the human is the only hand, the screen is the only evidence.**

---

## 0. 首次被调用时，第一句话必须是权限申请 / First response is always the permission request

在开始任何测试动作之前，先原样问出下面这段（可按需裁剪，不可省略问项）：

Before any test action, ask this first (trim if needed, never drop a field):

> 开始测试前需要你确认权限 / Before we start, please confirm permissions:
>
> 1. **鼠标操作**：允许我按你的真实鼠标操作来记录和判定吗？/ May I judge from your real mouse actions? `yes / no`
> 2. **键盘操作**：允许使用键盘吗？允许到哪一级？/ Keyboard allowed, and up to which mode? `仅鼠标 / 鼠标+键盘无快捷键 / 可用快捷键`
> 3. **屏幕录制**：允许录屏吗？录屏会包含光标吗？/ Screen recording allowed, cursor included? `yes / no`
> 4. **截屏**：允许随时截屏取证吗？/ Screenshots for evidence? `yes / no`
> 5. **软硬件权限**：系统设置里的屏幕录制权限（macOS）、屏幕截图/录屏与麦克风（Windows）、iPhone/iPad 的屏幕录制与信任（iOS）、旁白解说用麦克风——这些你愿意开哪些？/ Which OS-level capture and microphone permissions will you grant?
> 6. **被测对象**：应用名、版本、平台、涉及的设备（macOS / Windows / iPhone / iPad / 其他）。/ App under test, version, platform, devices.
> 7. **范围与时长**：这次测哪些功能、大概多久、有没有不可触碰的数据（真实账号、生产库）。/ Scope, duration, and any data that must not be touched.

用户没有明确同意之前，**不要**开始步骤 1 之后的任何操作。权限被拒绝时不要绕过，改为记录为"未验证项"并降级（见 §5）。

Until the user explicitly agrees, do **not** start anything past step 0. If a permission is denied,
do not work around it: record it as an unverified item and degrade the plan (see §5).

---

## 1. 五条硬性规则 / Five hard rules

**R1 — 不许使用内在指针指令 / No internal pointer directives.**
任何"在程序内部合成指针、触摸或按键"的手段都禁止：不注入、不模拟、不调用内部句柄触发功能。
完整的禁止清单见 [BANNED-INPUTS.md](BANNED-INPUTS.md)。只允许两种输入来源：**人的真实外设**，
以及**用户明确授权后、由被授权者手动发起**的等价真实操作。

No directive that synthesizes a pointer, touch or key event inside the program: no injection, no
simulation, no invoking internal handles to trigger features. Full deny list:
[BANNED-INPUTS.md](BANNED-INPUTS.md). Exactly two input sources are legal: **the human's real
peripherals**, and **the same real action performed by hand by an authorised person**.

**观察注入 ≠ 执行注入 / Watching injection is not doing it.** 被测机器上**可以有**一个只读守门器
一直盯着"有没有注入工具在跑"，这正是 `guard.mjs` 做的事：它扫描进程表与测试文本，把疑似注入线索
写进 `evidence/compliance.jsonl`，最终出现在报告里。它是**观察者**，不是**手**——它没有任何注入
能力。测试前扫一次、测试期间后台盯一遍，偷用注入就会留下痕迹。

A read-only watchdog **may** watch for injection tooling, and `guard.mjs` does exactly that: it scans
the process table and the session text, writing suspected injection clues to
`evidence/compliance.jsonl` and into the report. It is an **observer**, never a **hand** — it has no
injection capability at all. Scan before the run and watch during it; a smuggled injection leaves a
trace.

**R2 — 证据只来自录屏与截屏 / Evidence comes from recording and screenshots only.**
"元素是否完好""工具是否能用"必须从画面判定。代码、DOM、日志、接口返回、数据库只能当线索，
不能当结论。Agent 用 `read_image` 读截图，逐帧/逐张看图说话。

Element integrity and tool usability are judged from the picture. Code, DOM, logs, API responses and
databases are leads, never conclusions. The agent reads screenshots with `read_image` and speaks about
what is visible.

**R3 — 权限闸门先行 / Permission gate first.**
§0 的问项没被回答，测试不开始。答案写进会话文件，可追溯。

No answers, no testing. The answers are written into the session file and stay auditable.

**R4 — 三级模式按序执行 / Three modes, in order.**
仅鼠标 → 鼠标+键盘（禁快捷键）→ 鼠标+键盘+快捷键。同一个用例在三级的差异本身就是结论：
只在高级别能完成 = 缺少鼠标可达路径；只在低级别能完成 = 快捷键路径有问题。
见 [LEVELS.md](LEVELS.md)。

Mouse only → mouse + keyboard without shortcuts → with shortcuts. The difference across modes *is* a
finding: passing only at a higher mode means no mouse-reachable path exists; passing only at a lower
mode means the shortcut path is broken. See [LEVELS.md](LEVELS.md).

**R5 — 没测到不许写成通过 / Never mark untested as passed.**
三种状态分开记：`通过 / 失败 / 未验证`。证据不足以判定的写"未验证（证据不足）"。
每条缺陷都要有该模式下的真实操作步骤和对应截图/录屏时间点。

Three separate states: `passed / failed / unverified`. Insufficient evidence is
"unverified (insufficient evidence)". Every defect carries real steps under that mode plus the
screenshot or recording timestamp that shows it.

---

## 2. 从上到下的执行流程 / Top-down workflow

| # | 步骤 Step | 做什么 What | 产物 Artifact |
| --- | --- | --- | --- |
| 0 | 权限闸门 Gate | §0 的问项，用户逐条回答 | `session.json` 的 `gate` 段 |
| 1 | 建会话 Session | 建目录与清单骨架 | `node scripts/session.mjs init <dir> --platform macos` |
| 2 | 划范围 Scope | 被测版本、设备、账号、不可触碰的数据、退出条件 | 会话里的 `scope` |
| 3 | 列元素 Inventory | **只看画面**列出功能元素与工具，不看代码 | `elements.md` |
| 4 | 排用例 Matrix | 元素 × 平台 × 三级模式，标优先级 | `matrix.md` |
| 5 | 跑 L1 仅鼠标 | 全用例只用鼠标，截屏留证 | `findings.jsonl`、`evidence/` |
| 6 | 跑 L2 无快捷键 | 复跑全部用例；L1 的失败在此复现性登记 | 同上 |
| 7 | 跑 L3 快捷键 | 每条功能至少走"菜单/鼠标"与"快捷键"两条路径并比对结果一致性 | 同上 |
| 8 | 判定与报告 Verdict | 汇总、分级、写未验证项与权限缺口 | `report.md`（中英对照） |

会话脚手架、取证与报告都可由插件自带脚本生成；脚本只**读屏**，绝不注入输入：

```bash
node <skill-directory>/../scripts/session.mjs init  ./ui-test-<app>-<date> --platform macos --app "<app>"
node <skill-directory>/../scripts/capture.mjs check
node <skill-directory>/../scripts/guard.mjs scan    ./ui-test-<app>-<date>   # 只读观察注入线索
node <skill-directory>/../scripts/capture.mjs record ./ui-test-<app>-<date> --label L1 --seconds 60
node <skill-directory>/../scripts/guard.mjs watch   ./ui-test-<app>-<date> --seconds 600
node <skill-directory>/../scripts/report.mjs build  ./ui-test-<app>-<date>
```

The session scaffold, evidence capture, injection watchdog and report are generated by the scripts
shipped with this plugin. The scripts only **read the screen and the process table**; they never
inject input. 脚本只读屏、只读进程表，绝不注入输入。

---

## 3. 三级操作模式速查 / The three modes at a glance

| 级别 Level | 允许 Inputs | 禁止 Forbidden | 目的在于 Catches |
| --- | --- | --- | --- |
| **L1 仅鼠标** | 移动、单击、双击、右键菜单、拖拽、滚轮、悬停 | 一切键盘输入（含 Tab 导航）；预置剪贴板后用菜单粘贴是允许的 | 无鼠标路径、命中区过小、必须悬停才可发现的控件 |
| **L2 鼠标+键盘** | L1 全部 + 字符输入、Enter、Tab/Shift+Tab、方向键、退格/删除、空格、Home/End/PageUp/PageDown；Shift 仅用于输入大写 | 一切修饰键组合（⌘/Ctrl/⌥/Alt/Win）+ 按键；F1–F12；把 Esc 当"取消/关闭"用 | 键盘导航断链、焦点环错位/丢失、焦点陷阱、顺序错乱 |
| **L3 鼠标+键盘+快捷键** | 全部，含 ⌘/Ctrl 组合与功能键 | 仍然禁止内部指针指令（R1 永不放开） | 快捷键失效/冲突，鼠标路径与快捷键路径结果不一致 |

判定样例 / Worked examples：`仅 L3 可完成` = 无鼠标可达路径 → 可用性缺陷；
`L1、L2 可完成、L3 反而失败` = 快捷键路径有缺陷；`三级都失败` = 功能本身坏了。
细节与逐键白名单见 [LEVELS.md](LEVELS.md)。

---

## 4. 屏幕观察清单 / What to look for on screen

对清单里的每个元素，按这十个维度看图 / For every element in the inventory, inspect these ten
dimensions in the picture:

1. **存在 Existence** — 元素出现了吗，是否只在特定状态出现。
2. **完好 Integrity** — 图标、文字、边框、圆角、阴影是否正确渲染；破图、缺字（tofu）、错位、重影。
3. **可读 Legibility** — 对比度、字号、截断、换行、深色模式、高对比度模式。
4. **可发现 Discoverability** — 不看文档能不能找到；悬停提示、空状态引导是否存在。
5. **命中与状态 Hit target & states** — 点击区域与视觉是否一致；悬停/按下/选中/禁用/忙碌态是否都有。
6. **反馈 Feedback** — 操作后有即时反馈吗；加载、成功、错误提示是否出现且看得懂。
7. **状态正确 State correctness** — 取消、返回、切换后是否回到正确状态；焦点环在哪。
8. **层级与布局 Layering & layout** — 弹窗遮挡、滚动条、内容裁剪、窗口缩放、iPad 横竖屏与分屏。
9. **数据完整 Data integrity** — 输入是否被正确保存与回显，列表是否刷新。
10. **跨设备一致 Consistency** — macOS / Windows / iPhone / iPad 之间同一功能的表现是否一致。

"工具是否可行"就是这一条：软件提供的工具（工具栏、绘图、导出、查找、设置、批量操作等）
能否只用真实鼠标键盘走通，并且在画面上看得到正确结果。/

"Tool usability" is exactly this: can each tool the software offers (toolbar, drawing, export, find,
settings, batch operations) be completed with a real mouse and keyboard, with a correct visible
result on screen.

---

## 5. 权限被拒或缺失时 / When a permission is denied or missing

| 缺口 Gap | 不要做 Don't | 改为 Do instead |
| --- | --- | --- |
| 无录屏 No screen recording | 用日志/代码臆断结果 | 改用逐步截屏取证，并在报告里标注"无连续录屏" |
| 无截屏 No screenshots | 凭记忆写结论 | 停止测试，说明无法取证；或由用户口头描述并标为"未验证" |
| 无键盘 No keyboard | 偷偷用快捷键 | 只跑 L1，L2/L3 记为未覆盖 |
| 不能碰真实数据 Real data off-limits | 照测不误 | 用演示数据/测试账号，或在报告中明确数据边界 |
| 设备不在手边 Device unavailable | 用模拟器冒充真机 | 标为"未在真机验证（模拟器/仿真器）" |

状态栏里出现的任何"自动化"选项都不要开；测试期间关闭其他自动化工具与宏，避免污染观察。

Never enable an "automation" option to get around this; turn other automation tools and macros off
during a session so the observation stays clean.

---

## 6. 报告要求 / Report requirements

用 [REPORT-TEMPLATE.md](REPORT-TEMPLATE.md) 的结构，中英对照，至少包含：
测试环境与版本、权限记录、覆盖率（元素/模式/平台）、缺陷表（含步骤、期望、实际、证据、级别与
三级模式下的差异）、未验证项与原因、结论与建议修复顺序。

Use the structure in [REPORT-TEMPLATE.md](REPORT-TEMPLATE.md), bilingual, covering at least:
environment and versions, permission record, coverage over elements/modes/platforms, the defect table
(steps, expected, actual, evidence, severity, and behaviour across the three modes), unverified items
with reasons, and a verdict plus fix order.

级别 / Severity：`S1` 崩溃/数据丢失/主流程完全不可用 · `S2` 主流程受阻但有绕行 · `S3` 次要功能或视觉缺陷 ·
`S4` 打磨与建议 · `U` 证据不足无法判定。

---

## 7. 本技能的资源文件 / Files in this skill

| 文件 File | 内容 Content |
| --- | --- |
| [FRAMEWORK.md](FRAMEWORK.md) | 完整框架：从上到下的设计、角色、退出条件、原语 |
| [LEVELS.md](LEVELS.md) | 三级模式的逐键白名单、升降级规则、判定句式 |
| [BANNED-INPUTS.md](BANNED-INPUTS.md) | 各平台禁止的内部指针指令清单与合规替代做法 |
| [EVIDENCE.md](EVIDENCE.md) | 录屏/截屏取证协议：命名、时间点、可读性、留证边界 |
| [REPORT-TEMPLATE.md](REPORT-TEMPLATE.md) | 中英对照报告模板 |

配套的计划与权限技能是 `observed-test-plan`；开始前需要权限问卷与用例矩阵时先用它。
The companion planning skill is `observed-test-plan`; use it first for the permission questionnaire
and the case matrix.
