# 完整工作流 / The Complete Workflow

> 这是 `software-design-test` 的正文：从"决定模拟谁"到"交出一份能复现的缺陷报告"的全部步骤。
> 每一步都写清：输入、动作、产出、门（不满足就不许往下走）。
> The full procedure, from "who do we simulate" to "a reproducible defect report". Every step names
> its inputs, actions, artifacts and gate.

---

## 0. 定位 / Where this sits

```text
observed-test-plan  →  本工作流（software-design-test）  →  observed-ui-test
权限与范围             以谁、走哪条路、找哪类 bug        三级模式执行与录屏截屏取证
gate & scope           who, which path, which bugs      modes, evidence, reporting rules
```

**四类方法合成一条流水线** / Four method families compose into one pipeline:

| 方法族 Family | 解决的问题 Question | 本工作流中的位置 Where |
| --- | --- | --- |
| 用户模拟 / 人物与场景 UX simulation | 模拟谁、做什么任务 | P1–P4 |
| 启发式评估 / 认知走查 Heuristic evaluation & cognitive walkthrough | 不跑会话也能系统找问题 | P5 |
| 探索式测试 / SBTM / 巡游 Exploratory testing | 用章程与巡游扩大覆盖面 | P5、P6 |
| 出声思维会话 / 可用性测试 Think-aloud usability test | 观察真实卡点与误解 | P6 |

---

## 1. 十步总流程 / The ten steps

| # | 步骤 Step | 输入 In | 动作 Actions | 产出 Out | 门 Gate |
| --- | --- | --- | --- | --- | --- |
| P0 | 立项与权限 Charter & gate | 用户诉求 | 定目标问题、范围、退出条件；发权限问卷 | `session.json`、`permissions.md` | 闸门通过（鼠标 + 录屏或截屏 + 合规确认） |
| P1 | 人物 Personas | 访谈/工单/埋点/设计目标/自身体验 | 3–5 个，填四属性 + "会在哪放弃" + 依据 | `personas.md` | 每个有依据；覆盖新手/专家/键盘或视障 |
| P2 | 场景 Scenarios | 人物 + 真实会话 | 按六类场景各写至少一条 | `scenarios.md` | 每个场景可拆成任务 |
| P3 | 任务卡 Task cards | 场景 | 拆成意图 + 开始状态 + 步骤 + 画面可判定的成功标准 | `matrix.md` 的任务行 | 成功标准能在画面上判定 |
| P4 | 旅程 Journey | 任务卡 | 走五个阶段，标断头路/绕路/记忆负担 | `journey.md` | 五阶段都走过 |
| P5 | 启发式与巡游 Sweep | 界面 + `HEURISTICS.md` | 认知走查四问 → 十项启发式 → HICCUPPS/SFDIPOT → 巡游 → 风险优先级 | `heuristics.md` + 首批发现 | 每条结论指得到具体位置 |
| P6 | 执行 Sessions | 任务卡 × 人物 × 级别 | 出声思维 + 三级模式 + 录屏截屏 | `findings.jsonl`、`evidence/` | 遵守 `observed-ui-test` 全部门规 |
| P7 | 判定 Adjudication | 发现 | 分类（缺陷/观察/疑点/未验证）、分级、复现与最小化 | 定稿的发现条目 | 每条有证据与复现率 |
| P8 | 报告 Report | 全部 | 去重、按根因合并、按人物×场景统计覆盖 | `report.md` | 未验证项与权限缺口写清 |
| P9 | 复测 Retest | 修复版本 | 同一任务卡 + 同一人物 + 同一级别 | 追加到原条目 | 不许把复测结论另开新条 |

---

## 2. 每一步怎么做 / How each step is done

### P0 · 立项与权限 / Charter and gate

写清四个问题，否则后面所有结论都会漂移：**要回答什么？不回答什么？什么时候停？哪些数据不能碰？**
再用权限问卷拿到鼠标、键盘级别、录屏、截屏、系统权限与合规确认（`observed-test-plan`）。

> EN: Pin the questions the run must answer, what is out of scope, when to abort, and which data is
> off-limits, then run the permission questionnaire. No answers, no start.

### P1 · 人物 / Personas

四条属性必须改变你的测试行为：熟练度（要不要引导）、使用频率（能容忍几秒）、设备与姿势（命中区与
悬停依赖）、可访问性需求（焦点顺序、朗读、缩放）。写法与反模式见
[PERSONAS-SCENARIOS.md](PERSONAS-SCENARIOS.md)。

> EN: Four attributes must change what you test: expertise, frequency, device and posture,
> accessibility needs. See [PERSONAS-SCENARIOS.md](PERSONAS-SCENARIOS.md).

### P2 · 场景 / Scenarios

六类场景**每类至少一条**：首次成功、熟练例行、出错与恢复、中断与恢复、破坏性操作、交接与协作。
场景要能回答"失败时，用户在画面上哪一刻会看出来"。

> EN: At least one scenario from each of six families: first success, routine, error and recovery,
> interruption, destructive action, handoff.

### P3 · 任务卡 / Task cards

一条任务卡包含：任务 ID、人物、场景、**意图（不是步骤清单）**、开始状态、步骤（只用真实鼠标键盘
动作动词）、画面上可见的成功标准、检查点、允许的求助、要跑的级别。

**新手人物的任务卡不许写出答案**（不要写"点击右上角齿轮"），否则你测的是执行而不是可发现性。

> EN: A card holds intent (not a step list), start state, steps, screen-visible success criteria,
> checkpoints, allowed help and levels. Never bake the answer into a novice's card.

### P4 · 旅程走查 / Journey walkthrough

沿时间轴走五个阶段，标出三类现象：**断头路**（无路可走也没出口提示）、**绕路**（必须离开当前
上下文）、**记忆负担**（被迫记住上一步看见但不能复制的信息）。

> EN: Walk five stages and mark dead ends, detours and memory burdens.

### P5 · 启发式与巡游 / Heuristic sweep

按这个顺序扫，先便宜后昂贵：

1. **认知走查四问**（对每个任务卡的关键动作；主持人 + 记录员 + 3–6 名评估者，先约定"一步"的粒度）：
   1. 用户会想做这件事吗？（目标对得上吗）
   2. 用户会注意到正确操作存在吗？
   3. 用户会把正确操作和想要的结果联系起来吗？
   4. 做完之后，用户看得出自己在接近目标吗？
   **任何一问是"否" ⇒ 这一步判 Fail**，记录"哪一问失败 + 哪个界面 + 原因"。
   > The four questions: will the user try to achieve the right effect, notice the correct action is
   > available, associate it with the desired effect, and see progress after acting?
2. **十项可用性启发式**（快速全扫一遍，逐条找违反点）。
3. **HICCUPPS(F) 一致性启发式**：与历史、印象、同类产品、宣称、用户期望、产品自身、
   目的、标准法规、熟悉度是否一致——**任何一处不一致就是缺陷候选**。
4. **SFDIPOT 结构透镜**：结构 / 功能 / 数据 / 平台 / 操作 / 时间，各问"这里能怎么坏"。
5. **巡游 Tours**：把 Whittaker 的巡游当脚本走，用来强制自己离开"正常路径"。
6. **风险排序**：把候选按"影响面 × 概率 × 可检测性"排序，先测前 20%。

清单与逐条脚本见 [HEURISTICS.md](HEURISTICS.md)。

### P6 · 执行会话 / Running sessions

**节奏模板（一次 30–60 分钟）** / Session rhythm:

```text
1. 选一张任务卡 + 一个人物 + 一个级别（一轮只改一个变量）
2. 开始录屏（含光标）；截"前置状态"图
3. 人物视角操作：不知道就说不知道，不许替软件找补
4. 出声思维：一边做一边说在想什么（"我以为这个齿轮是设置"）
5. 卡住超过 60 秒 → 记为卡点，不放弃、不查文档（除非任务卡允许求助）
6. 每个检查点截一张图；每个任务结束截"结果"图
7. 立刻落盘一条发现（含级别、人物、场景、复现率）
8. 同一任务卡换下一个级别重跑；三级跑完换下一张卡
```

**任务脚本与出声思维纪律** / Task script and think-aloud discipline:

- **任务脚本**：用场景化目标写，**不含界面词汇与点击路径**；先试跑一遍；难度从易到难。
- 操作者出声说"我在找什么、我以为会发生什么"，不解释为什么。
- 观察者只问中性问题："你现在在想什么？""你期望发生什么？"，**不许引导**（"你没看到导出按钮吗？"）。
- 沉默超过 10 秒再提醒，别打断操作。
- **不许救援**：除非达到事先定好的失败判定标准或超时，否则不提示、不指路、不替操作者完成。
- 求助次数要计数——求助本身就是数据（可发现性缺陷的信号）。
- 每条任务后记：成功（独立/需协助）、耗时、错误与尝试次数；会话结束可选手填 SEQ / SUS
  （SUS 0–100，基准约 **68**）。

**三级模式 × 人物矩阵** / Mode × persona:

| 任务卡 | P-01 新手 | P-02 专家 | P-03 键盘/视障 |
| --- | --- | --- | --- |
| T-01 首次导出 | L1、（L2） | L3 | L2 |
| T-02 批量重命名 | L1 | L3（含快捷键双路径比对） | L2 |

括号表示"该人物在这个级别不典型，可选"。跨级别结果不一致（L1 失败 / L3 成功）→ 缺鼠标可达路径。

**取证采样纪律（别漏掉一闪而过的状态）** / Capture sampling:

- 录屏要点：**固定帧率录全程 + 在每次点击前后补截静帧**。只靠"每隔几秒看一眼"必然漏掉
  toast、短暂错误、一闪而过的禁用态（GUI 智能体的"截图翻页"就有这个已知盲区）。
- 每条任务：录屏 1 段 + 前置/结果/异常静帧各 1 张 + 录屏 `mm:ss` 时间点。
- 观察者先**把画面抄成文字**（元素、可用/禁用、可见文字、布局），再判断有没有问题。
- 判定成功之前，**回头看一眼画面上的后置条件**是否真的成立（"我说完成了"不算完成）。

> Fixed-rate recording **plus** event-triggered stills around every click, or transient toasts and
> errors will be missed. Describe the screen in text before judging it, and re-inspect the
> post-condition before declaring a task successful.

### P7 · 判定、复现与最小化 / Adjudicate, reproduce, minimize

分类（缺陷/观察/疑点/未验证）→ 定级 S1–S4/U → 记复现率 `x/y` → 最小化到最短可靠路径（**仍需人手动操作**）
→ 用最小路径重拍证据。细节见 [DEFECTS.md](DEFECTS.md)。

### P8 · 报告 / Report

`node scripts/report.mjs build <session>` 生成中英对照报告；报告里专门有
**"用户模拟覆盖"** 一节：计划人物/场景 vs 实际走到的人物/场景、任务结果分布、每个人物的最坏级别。

**去重纪律**：同一根因的多个症状合并成一条主缺陷 + 多个复现点；不要用症状数量冒充缺陷数量。

### P9 · 复测 / Retest

修复后必须用**同一任务卡、同一人物、同一级别**复测，结论追加到原条目。复测也要留下新证据。

---

## 3. 可选方法：怎么做而不注入输入 / Optional methods, without injection

这些经典方法都能在没有内部指针指令的前提下由人执行：

| 方法 Method | 怎么做 How（人不借助任何注入） | 产出 Out |
| --- | --- | --- |
| 首次点击测试 First-click | 只让操作者看一眼界面，说出"你会先点哪里"，然后**真的用鼠标点**，看是否走到任务成功 | 首点命中率、错误吸引点 |
| 五秒测试 Five-second | 展示界面 5 秒后遮住，问记住了什么；再真实操作验证记忆是否够用 | 记忆点/遗漏点 |
| 游击测试 Guerrilla | 找身边一个没参与设计的人，按同一任务卡真实操作，你在旁边观察 | 新手盲区 |
| 日记研究 Diary | 操作者连续几天真实使用，用录屏/截屏记录卡点，每天汇总 | 长期摩擦 |
| 认知走查 Cognitive walkthrough | 3–5 人各自独立对同一任务卡答四问，再合并 | 预期违背点 |
| 启发式评估 Heuristic evaluation | 3–5 名评估者**先独立**扫十项启发式，再合并去重、独立定级 | 违反清单 |
| 缺陷复盘 Bug bash | 60–90 分钟跨职能事件：冻结一个构建、写明范围、备好账号与数据、给一份填好的示例报告；角色=主持人/现场分诊/待命开发；中途轮换区域，现场定级，结束去重并指定负责人 | 高密度发现 |
| 风险驱动 Risk-based | 列风险 → 可能性 × 影响 → 排序 → 高风险深测、低风险浅测或不测 → 报**残余风险** | 风险清单、优先级章程 |
| 错误猜测 Error guessing | 从缺陷历史找模式 → 每个功能列错误类（边界、空、超长、null、中断）→ 先打最便宜的探针 → 有效的沉淀成检查表 | 快速命中清单 |
| 变更热点回归 Churn-based | 按文件的**相对变更量**（按大小归一）× 复杂度排序，叠加缺陷历史（缺陷会聚集），深测头部变更及其触及的接口 | 回归重点清单 |

> 错误猜测必须**记录推理**（为什么猜这里），只写结论的猜测无法审计。
> 变更热点依据：相对变更量可预测缺陷密度（Nagappan & Ball, ICSE 2005）。

**启发式评估的会话组织** / Heuristic evaluation session:

1. **先收窄范围**：一次只评一个任务/一个区域/一个设备或一类用户。
2. 3–5 名评估者，**各自独立**工作（不许共享笔记），每人约 1–2 小时：
   第一遍熟悉界面，第二遍逐条对照十项启发式并记录违反点与位置。
3. 由一名观察者把各人的清单**合并去重**成一份问题清单。
4. 评估者再对**合并后**的清单**各自独立给严重级**（0–4：0 不是问题 / 1 表面 / 2 轻微 / 3 严重 / 4 灾难），
   最终取 **≥3 人评分的均值**。
5. 争议条目不投票了事，改为**回到画面确认**，确认不了就降级为"观察"。

> 单个评估者平均只发现约 42% 的严重问题与 32% 的轻微问题（Nielsen 1992）——
> 一个人扫完说"没问题"，几乎必然漏掉大部分问题。
> One evaluator finds ~42% of major and ~32% of minor problems: never treat a solo sweep as coverage.

**SBTM 章程、会话单与复盘** / Session-Based Test Management（Bach & Bach）:

```text
章程 Charter：探索「首次导出」在 L1 下的可发现性，用新手人物（这是使命，不是脚本）
区域 Areas：macOS 14.5 · build 1234 · 导出子系统 · 策略=可发现性
时间盒 Timebox：45–120 分钟，不被打断
会话单 Session sheet：
  Task Breakdown：各段时长；TBS = 测试设计与执行 / 缺陷调查与报告 / 会话准备
  Charter vs Opportunity：花在章程内 vs 章程外的时间占比
  Data Files / Test Notes / Bugs / Issues
    —— Bugs 只放缺陷；疑问与障碍写 Issues；覆盖、预言与策略写在 Test Notes
复盘 Debrief：15–20 分钟对照清单
  机会漂移：>0% 说明原因；>25% 考虑重开章程；>50% 重开并补跑原章程
```

**常见坑**：章程太笼统（写成"测一遍导出"）；把会话数当 KPI；事后补写会话单；
把偶尔的意外发现当成常规覆盖。

---

## 4. 度量 / Metrics

| 指标 Metric | 怎么量 How（全部由人操作、画面判定） | 用来说明 What it says |
| --- | --- | --- |
| 任务成功率 Task success | 通过 / 部分 / 失败 / 受阻 | 人物在场景里能不能完成 |
| 求助次数 Help requests | 操作者不得不问"在哪"的次数 | 可发现性问题 |
| 错误数 Errors | 走错路、误触、需要撤销的次数 | 误导性设计 |
| 完成时间 Time on task | 人工秒表/录屏时间戳 | 效率（只作趋势，别当精确基准） |
| 卡点停留 Stall time | 超过 60 秒无有效动作的时长 | 最值得修的地方 |
| 覆盖 Coverage | 人物 × 场景 × 级别 的执行比例 | 结论的适用范围 |
| 严重度分布 | S1–S4/U 计数 | 发布判断 |
| （可选）SUS / SEQ | 操作者事后填问卷 | 主观易用性趋势 |

**别做的事** / Don'ts：不要在样本 3 个人的情况下报"87% 用户会失败"；人数少时只报"在这条路径上失败"。
Do not dress small-sample observations up as population statistics.

---

## 5. 与真实用户、自动化的边界 / Boundaries

| 事项 | 结论 |
| --- | --- |
| 模拟人物能不能替代真人会话 | **不能**。模拟提高发现率，不提高结论权威性；高风险功能必须补真人 |
| 走查/启发式能不能替代真人会话 | **不能，而且必须交替使用**：检查类方法（认知走查、启发式评估）与真人会话**发现的是不同的问题**——前者擅长一致性与规范违反，后者擅长真实卡点与误解 |
| "5 个用户就够了"能不能当覆盖保证 | **不能**。5 人是**发现**的经验法则，平均只能发现约 55% 的问题且方差很大（Faulkner 2003）；不同人群要各自 3–5 人。少量样本只能下路径级结论 |
| 能不能用 AI/脚本代跑一遍界面 | **不能**。那是内部指针指令，违反 R1 |
| 能不能用日志/DOM 判定界面正确 | **不能**作为结论；只能作为怀疑线索，必须回到画面确认 |
| 能不能把自动化回归的结论并进来 | **不能**混写；另开一轮、另写报告 |
| 样本很小能不能下统计结论 | **不能**；只写路径级结论 |

---

## 6. 模板索引 / Template index

| 要写的东西 Artifact | 模板 Template | 生成方式 |
| --- | --- | --- |
| 会话与权限 | `permissions.md`、`session.json` | `session.mjs init` / `gate` |
| 人物 | `personas.md` | `init` 生成骨架 |
| 场景 | `scenarios.md` | `init` 生成骨架 |
| 旅程 | `journey.md` | `init` 生成骨架 |
| 启发式扫描 | `heuristics.md` | `init` 生成骨架 + [HEURISTICS.md](HEURISTICS.md) |
| 任务卡与矩阵 | `matrix.md` | `init` 生成骨架 |
| 发现 | `findings.jsonl` | `session.mjs finding --json '…'` |
| 报告 | `report.md` | `report.mjs build` |

---

## 7. 常见失败模式 / Failure modes

| 失败模式 | 症状 | 纠正 |
| --- | --- | --- |
| 人物是完人 | 什么都顺利，找不到缺陷 | 给人物加约束（一只手、第一次用、赶时间） |
| 只走成功路径 | 缺陷很少且都是表面的 | 强制走"出错与恢复""中断"场景 |
| 任务卡写出了答案 | 测成了执行能力 | 新手任务卡删掉具体点击位置 |
| 观察者引导 | 操作者"照着做"，问题消失 | 只用中性提问，不提示、不指路 |
| 一条发现写三次 | 缺陷数量虚高 | 按根因合并，症状作为复现点 |
| 把模拟当用户研究 | 结论越界 | 报告写"在 P-01 模拟视角下"，不写"用户都…" |
| 用代码验证 UI | 证据链断裂 | 回到画面，用截图确认 |

---

## 8. 出处 / Sources

方法来源、书籍与文章链接见 [SOURCES.md](SOURCES.md)。
