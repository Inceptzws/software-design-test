---
name: software-design-test
description: 软件设计测试（模拟真实用户）：把"真实用户会怎么用"变成可执行、可复现的测试——先建人物与场景，再拆成任务卡，用出声思维在三级操作模式（仅鼠标 / 鼠标+键盘无快捷键 / 可用快捷键）下真实操作，按"测试内容清单"逐类检查（窗口与界面尺寸、鼠标与指针速度、目标尺寸与间距、工具栏与菜单、文字排版、布局层级、反馈状态、效率流程、键盘焦点、可访问性、性能响应、错误恢复、数据输入、跨设备一致性、视觉打磨），靠录屏与截屏判断功能元素是否完好、工具是否可用；覆盖 macOS、Windows、iPhone、iPad。禁止任何内部指针注入指令，开始前先申请鼠标、键盘与录屏权限。**触发词：用户说「模拟真实用户测试」或英文等价表达（simulate a real user test / run a real-user simulation test / simulated user testing / test it like a real user）时，立即进入真实模拟测试。** Software design testing by simulating real users: personas, scenarios and executable task cards, think-aloud execution in three input modes, a full what-to-test checklist (window and screen size, pointer dynamics and speed, target size, toolbars and menus, legibility, layout, feedback, efficiency, keyboard focus, accessibility, performance, errors, data input, cross-device consistency, polish), screen-evidence judgement, no synthetic pointer injection, permission gate first. Trigger phrases — "模拟真实用户测试", "simulate a real user test", "run a real-user simulation test", "simulated user testing" — start the real simulation immediately.
---

# 软件设计测试：模拟真实用户 / Software Design Testing by Simulating Real Users

> **本技能是插件的重心。** 它回答一个问题：**怎么像真实用户那样去测一个软件，并真的找出问题。**
> This is the plugin's centerpiece: **how to test software the way a real user would, and actually
> find the problems.**

模拟真实用户不是"假装点几下"，而是三件事同时成立：

| 要素 | 含义 | 缺了它会怎样 |
| --- | --- | --- |
| **人物 Persona** | 以谁的身份：熟练度、频率、设备与姿势、可访问性需求、"会在哪里放弃" | 退化成无立场的"随便点点" |
| **任务 Task** | 他此刻想完成什么：意图 + 开始状态 + 画面可判定的成功标准 | 退化成元素清单核对 |
| **画面 Screen** | 证据只来自录屏与截屏；代码、DOM、日志只是线索 | 结论无法复现、无法被他人确认 |

> Simulating a real user means three things at once: **who** (persona), **what for** (task), and
> **proved by the screen** (recording and screenshots only).

---

## 0. 触发即开始 / Trigger phrases start the test

用户只要发出下面任意一句，就**立即进入真实模拟测试**，不要再讨论方法论、不要再要求确认流程：

| 语言 | 触发词 Trigger phrases |
| --- | --- |
| 中文 | **模拟真实用户测试** · 模拟真实用户 · 真实用户测试 · 真实用户模拟测试 |
| English | **simulate a real user test** · run a real-user simulation test · simulated user testing · real-user simulation · test it like a real user |

**收到触发词后的动作序列 / What happens next**：

1. **对象已明确** → 直接进 P0：一句话复述要测的应用与范围，紧接着发权限问卷（这是**唯一**必须先问的东西）。
2. 用户答复权限后 → 立刻 `session.mjs init` + `gate`，从 P1 人物/场景开始跑，**不再回头确认方法**。
3. **权限本会话已授予且对象明确** → 直接开始，不再问任何问题。
4. **只有触发词、没有对象** → 只问一个问题："测哪个应用/哪个功能？"得到答复后立即开始。
5. **测试中途出现触发词** → 继续当前会话，不新建会话、不重新问权限（除非范围变了）。

**禁止 / Do not**：

- 收到触发词后回答"我可以帮你做 X""这是方法论介绍"或罗列流程细节——直接开始。
- 反复确认"是否按 L1→L2→L3""要不要录屏"——权限问卷里已经问过。
- 每发现一个小问题就停下来汇报；按任务卡/级别跑完一段再汇总。

> On a trigger phrase, restate the target in one line, ask the permission questionnaire (the only
> mandatory ask), then start. Do not re-litigate the method.

---

## 1. 三条不可交换的硬规则 / Three non-negotiable rules

1. **人是唯一的手 / The human is the only hand** —— 只用真实鼠标键盘操作；任何内部指针指令
   （注入指针/触摸/按键、驱动自动化框架、调用软件内部句柄）一律禁止，完整清单见
   [BANNED-INPUTS.md](../observed-ui-test/BANNED-INPUTS.md)。
2. **屏幕是唯一证据 / The screen is the only evidence** —— 元素是否完好、工具是否可用，都从画面判定。
3. **权限先行 / Permissions first** —— 开始前必须问过用户：鼠标、键盘级别、录屏、截屏、系统权限、
   数据边界与合规确认；未答复不开始（问卷见 [PERMISSIONS.md](../observed-test-plan/PERMISSIONS.md)）。

执行细节（三级模式、十大观察维度、取证协议、报告模板）全部沿用 `observed-ui-test`。

---

## 2. 测什么 / What to test — 测试内容清单

用户真正关心的是**测试内容本身**，不是术语。完整清单在 **[TEST-CONTENT.md](TEST-CONTENT.md)**，
共 15 类、每类给出"检查项 / 怎么看 / 判据"：

| # | 类别 | 用户最常先问的 |
| --- | --- | --- |
| §1 | 窗口与界面尺寸 Window & screen size | 这个界面的大小便于使用吗？最小尺寸/分屏/缩放 200% 还能用吗？ |
| §2 | 鼠标速度与指针 Pointer dynamics & speed | 鼠标要跑多远？要不要很慢很准？双击速度跟系统一致吗？悬停菜单会不会"路过就弹"？ |
| §3 | 目标尺寸与间距 Target size | 按钮够大吗？相邻按钮会不会误点？（24 / 44 / 48 阈值） |
| §4 | 工具栏与菜单 Toolbar & menus | 图标不看提示能看懂吗？常用命令一级可达吗？变窄时会不会消失？ |
| §5 | 文字与排版 Legibility | 对比度、字号、截断、深色模式、放大后破版 |
| §6 | 布局与层级 Layout | 主次分明吗？弹窗挡东西吗？提示被裁了吗？ |
| §7 | 反馈与状态 Feedback | 点了有反应吗？加载/成功/失败提示清楚吗？ |
| §8 | 效率与流程 Efficiency | 要走几步？要重复填吗？能撤销吗？ |
| §9 | 键盘与焦点 Keyboard & focus | Tab 走得通吗？焦点看得见吗？有陷阱吗？ |
| §10 | 可访问性 Accessibility | 读屏、仅键盘、颜色依赖、动效可关 |
| §11 | 性能与响应 Performance | 启动、滚动、输入延迟、长时间运行 |
| §12 | 错误与恢复 Errors | 报错说人话吗？数据丢吗？能恢复吗？ |
| §13 | 数据与输入 Data & input | 空/超长/emoji/中文输入法/粘贴表格 |
| §14 | 跨设备一致性 Cross-device | 四个端的位置、命名、行为一致吗？ |
| §15 | 视觉打磨 Polish | 图标、对齐、圆角、动效、文案（S4 级） |

**用法**：会话开始时先跑 [TEST-CONTENT.md](TEST-CONTENT.md) §0 的"十分钟快扫"，再按需要逐类展开；
每条违反落盘时带上 `content`（类别）与 `criteria`（判据）字段，报告会按**测试内容**聚合出分布。

> The checklist answers "what do we actually look at": size, pointer travel, toolbar readability,
> targets, text, layout, feedback, efficiency, keyboard, accessibility, performance, errors, data,
> cross-device consistency, polish — each with how-to-check and a criterion.

---

## 3. 十步流程 / The ten steps

| # | 步骤 Step | 一句话 | 产出 |
| --- | --- | --- | --- |
| P0 | 立项与权限 Charter & gate | 要回答什么、不回答什么、何时停 | `session.json` |
| P1 | 人物 Personas | 3–5 个，含依据与"会在哪放弃" | `personas.md` |
| P2 | 场景 Scenarios | 六类场景各至少一条 | `scenarios.md` |
| P3 | 任务卡 Task cards | 意图 + 画面可判定的成功标准（新手卡里不写答案） | `matrix.md` |
| P4 | 旅程 Journey | 进入 → 首次成功 → 熟练 → 出错恢复 → 退出再进入 | `journey.md` |
| P5 | 启发式与巡游 Sweep | 认知走查四问 → 十项启发式 → HICCUPPS(F)/SFDIPOT → 巡游 | `heuristics.md` |
| P6 | 执行 Sessions | 出声思维 × 三级模式 × 录屏截屏 | `findings.jsonl`、`evidence/` |
| P7 | 判定 Adjudicate | 四分类（测试者/观察/产品/环境）→ 定级 → 复现与最小化 | 定稿发现 |
| P8 | 报告 Report | 去重、按根因合并、报告"用户模拟覆盖" | `report.md` |
| P9 | 复测 Retest | 同一任务卡、同一人物、同一级别 | 追加到原条目 |

逐步做法、会话节奏模板、可选方法（SBTM、首点/五秒/游击/日记、启发式评估、bug bash）与度量：
**[WORKFLOW.md](WORKFLOW.md)**。

> Full procedure — session rhythm, optional methods and metrics: [WORKFLOW.md](WORKFLOW.md).

---

## 4. 怎么"模拟得像" / How to simulate credibly

| 纪律 Discipline | 做法 Practice |
| --- | --- |
| 人物有依据 | 访谈、工单、埋点、设计目标、你自己第一次使用的体验；**不许凭空编造"典型用户"** |
| 人物有约束 | 一只手、赶时间、第一次用、只有触控板、键盘-only、动态字体——约束才产生缺陷 |
| 人物有放弃点 | 每个人物写一句"他会在哪里放弃" |
| 任务不写答案 | 新手任务卡写"点击右上角齿轮"→ 你测的是执行力，不是可发现性 |
| 出声思维 | 操作者边做边说"我在找什么、我以为会发生什么"；观察者只问中性问题（"你现在在想什么？"） |
| 不替软件找补 | 不知道就说不知道；卡住本身就是发现 |
| 全路径覆盖 | 成功路径只是一半；出错与恢复、中断、破坏性操作、交接才是缺陷密集区 |
| 三段式取证 | 录屏全程 + 每次点击前后静帧 + 关键状态截图 |
| 承认边界 | 模拟提高**发现率**，不提高**结论权威性**；高风险功能必须补真人会话（见 [SOURCES.md](SOURCES.md)） |

细节：[PERSONAS-SCENARIOS.md](PERSONAS-SCENARIOS.md)（人物/场景/任务卡）、
[HEURISTICS.md](HEURISTICS.md)（认知走查、Nielsen 十项、HICCUPPS(F)、SFDIPOT、巡游、
WCAG 2.2 仅键盘与屏幕阅读器步骤）、[DEFECTS.md](DEFECTS.md)（观察记录、失败四分类、复现与最小化）、
[SOURCES.md](SOURCES.md)（方法与出处，标注已核验/未核验）。

---

## 5. 三级操作模式 × 人物 / Modes × personas

同一张任务卡在三级下的期待完全不同——**差异本身就是结论**：

| 级别 Level | 适合的人物 Persona | 典型发现 Typical finds |
| --- | --- | --- |
| **L1 仅鼠标** | 新手、单手、触屏用户 | 找不到入口、必须悬停才知道、右键菜单缺项、拖拽无反馈 |
| **L2 鼠标+键盘（禁快捷键）** | 键盘-only、视障、键盘重度用户 | Tab 走不到、焦点环丢失、焦点陷阱、顺序与视觉不符 |
| **L3 鼠标+键盘+快捷键** | 专家、每天用 100 次的人 | 快捷键冲突、两条路径结果不一致、快捷键提示写错 |

`L1 做不到、L3 做得到` = 缺鼠标可达路径（新手会直接放弃）；`L1/L2 做得到、L3 失败` = 快捷键路径缺陷。

---

## 6. 最小可用流程 / Minimum viable run

```bash
cd software-design-test

# P0 会话与权限闸门
node scripts/session.mjs init ./ui-test-<app>-<date> --platform macos --app "<app>"
node scripts/session.mjs gate ./ui-test-<app>-<date> --mouse yes --keyboard L2 \
  --screen-recording yes --screenshot yes --compliance yes

# P1–P4 人物 / 场景 / 任务卡 / 旅程：填 init 生成的四个模板文件
# P5 只读观察有没有注入工具在跑
node scripts/guard.mjs scan ./ui-test-<app>-<date>

# P6 执行：录屏 + 点击前后静帧；每条发现立刻落盘
node scripts/capture.mjs record ./ui-test-<app>-<date> --label P01-S01-L1 --seconds 90
node scripts/session.mjs finding ./ui-test-<app>-<date> --json '{
  "level":"L1","persona":"P-01 新手 Novice","scenario":"S-01 首次导出 First export",
  "task_outcome":"fail","heuristic":"可发现性 Discoverability","tour":"后巷 Back Alley",
  "title_zh":"新手在 L1 找不到导出入口","title_en":"Novice cannot find export at L1",
  "content":"窗口与界面尺寸 Window size","criteria":"最小尺寸下主按钮不可见","severity":"S2","kind":"defect","repro_rate":"3/3","modes":"L1 fail / L2 fail / L3 pass"
}'

# P8 报告（含"用户模拟覆盖"一节）
node scripts/report.mjs build ./ui-test-<app>-<date>
```

---

## 7. 反模式 / Anti-patterns

| 反模式 | 为什么错 |
| --- | --- |
| 人物是完人（什么都会、从不生气） | 找不到任何缺陷 |
| 只走成功路径 | 只发现表面问题；断头路与恢复路径才是重点 |
| 任务卡写出答案 | 把可用性测试做成了执行力测试 |
| 观察者引导（"你没看到导出按钮吗？"） | 操作者照着做，问题消失 |
| 用脚本/AI 代点一遍 | 违反硬规则一：那就是内部指针指令 |
| 用代码/DOM/日志判定界面正确 | 破坏证据链，结论不可复现 |
| 把模拟结论写成"用户都……" | 越界：模拟不是用户研究 |
| 一条根因报成五条缺陷 | 用症状数量冒充缺陷数量 |

---

## 8. 与其他两个技能的关系 / How the three skills fit

```text
observed-test-plan   →   software-design-test（本技能，重心）   →   observed-ui-test
权限问卷、范围、         人物 → 场景 → 任务卡 → 旅程 →           三级模式、十大观察维度、
元素清单、用例矩阵       启发式/巡游 → 执行 → 判定 → 报告         取证协议、报告模板
```

三个技能共用同一套硬规则；本技能负责**"以谁、走哪条路、找哪类 bug"**，
`observed-test-plan` 负责准备与闸门，`observed-ui-test` 负责执行与取证的细节。

> This skill decides who is simulated, which path is walked and which bugs are hunted; the other two
> supply preparation/gating and execution/evidence mechanics.
