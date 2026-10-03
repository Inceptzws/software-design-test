# 观察式界面测试框架 / The Observed UI Testing Framework

> 从上到下的设计：先定立场，再定闸门、范围、清单、矩阵、执行、取证、判定、报告。
> Top-down design: position first, then gate, scope, inventory, matrix, execution, evidence,
> adjudication, report.
>
> 本文是 [SKILL.md](SKILL.md) 的展开版。/ This file expands [SKILL.md](SKILL.md).

---

## 层 0 · 立场 / Layer 0 · Position

| 角色 Role | 是谁 Who | 职责 Responsibility |
| --- | --- | --- |
| 操作者 Operator | 用户（人） | 用真实鼠标键盘操作被测软件，是**唯一的手** |
| 观察者 Observer | Agent + 用户 | 看录屏/截屏，判读元素与工具状态，是**眼睛** |
| 记录者 Recorder | Agent | 写用例、记证据、出报告，是**笔** |
| 裁决者 Adjudicator | 用户 | 确认严重级、确认是否算缺陷、决定修不修 |

Agent 不能自己动鼠标、不能自己按键、不能注入事件。Agent 能做的是：
**生成用例与清单、驱动只读的截屏/录屏、读图判读、写报告。**

The agent never moves the mouse, never presses a key, never injects an event. What it does:
generate cases and inventory, drive read-only capture, read the pictures, write the report.

三条不可交换的原则 / Three non-negotiables：

1. **真实输入 / Real input** — 输入只来自人的外设。
2. **画面证据 / Visual evidence** — 结论必须有对应的画面。
3. **可复现 / Reproducible** — 每条结论都能被另一个操作者按步骤重放。

---

## 层 1 · 权限闸门 / Layer 1 · Permission gate

进入测试的充要条件 / The entry condition:

```
gate.confirmed = mouse ∧ keyboard(级别已定) ∧ (screenRecording ∨ screenshot) ∧ scopeAcknowledged
```

- 用户逐项回答，答案落盘到 `session.json`。
- `screenRecording` 与 `screenshot` 至少要有一个为真，否则**无法进行观察式测试**，直接停止并说明原因。
- 拒绝项不是"小问题"：它是覆盖率的缺口，必须出现在报告首页。
- 平台侧权限清单见 `observed-test-plan` 技能的 `PERMISSIONS.md`。

Details per platform live in the companion skill's `PERMISSIONS.md`. A denied item is never papered
over; it becomes a coverage gap on page one of the report.

---

## 层 2 · 范围 / Layer 2 · Scope

写死这六项，缺一项后面就会写出无法复现的缺陷 / Pin these six, or the later defects will not
reproduce:

1. 被测应用名 + 版本 + 构建号 / app, version, build
2. 平台与设备 / platform and device（macOS 版本 / Windows 版本 / iPhone 型号 + iOS 版本 / iPad + iPadOS 版本）
3. 输入设备 / input devices（鼠标型号、触控板、键盘布局；iPhone/iPad 是手指、触控笔还是外接键鼠）
4. 显示环境 / display（分辨率、缩放、外接屏、深色模式、动态字体大小）
5. 数据边界 / data boundary（用哪个账号、哪些数据不可触碰、是否需要脱敏）
6. 退出条件 / exit criteria（什么情况立刻停：崩溃、数据损坏、隐私泄露）

---

## 层 3 · 元素清单 / Layer 3 · Element inventory

**只看画面**建立清单：打开软件，逐个界面截图，把看得见的功能元素与工具抄下来。
不许打开代码、DOM 检查器或数据库来"补全"清单——那会让测试变成"验证我读到的代码"。

Build the inventory **from the screen only**: open the app, screenshot each surface, transcribe the
visible elements and tools. Do not open code, a DOM inspector or a database to "complete" the
inventory: that turns testing into "verifying the code I just read".

清单条目建议字段 / Suggested fields:

```text
ID | 界面 Surface | 元素/工具 Element or tool | 类型 Type | 期望状态 Expected states | 优先级 Priority
```

类型 Type：`按钮 button` · `输入框 field` · `菜单/工具栏 menu/toolbar` · `列表/表格 list/table` ·
`滚动区 scroll area` · `弹窗/面板 dialog/panel` · `开关/选择器 toggle/picker` · `状态/提示 status/toast` ·
`画布/工具 canvas/tool` · `导航 navigation`。

期望状态 Expected states 至少写全：默认、悬停、按下、选中、禁用、加载、错误、空。

---

## 层 4 · 用例矩阵 / Layer 4 · Case matrix

矩阵 = 元素 × 平台 × 模式。允许裁剪，但裁剪要写理由。

Matrix = element × platform × mode. Trimming is allowed; the reason is not optional.

```text
用例 ID | 元素 | 前置条件 | 操作步骤（该模式下） | 期望结果（画面上可见） | 平台 | 模式 L1/L2/L3 | 优先级
```

优先级 Priority：
**P0** 主流程 / primary flow · **P1** 常用功能与数据正确性 · **P2** 边缘与异常（空、超长、断网、权限不足） ·
**P3** 打磨与一致性。

规则 / Rules:
- 同一个用例在 L1、L2、L3 各跑一次，步骤写法按该模式调整（L1 里不能出现 Tab）。
- 每条用例的"期望结果"必须是**画面上能看到的东西**，不能是"数据库里多一行"。
- P2 用例至少覆盖：空输入、超长输入、无权限、离线、快速重复点击、窗口/屏幕旋转。

---

## 层 5 · 三级执行 / Layer 5 · Three-mode execution

严格顺序 L1 → L2 → L3，中间不混用输入。/ Strictly L1 → L2 → L3, never mixed.

执行时的纪律 / Discipline while running:

- 一次只改一个变量：先不改设置、不改窗口大小，跑完基线再测边缘。
- 每条用例前后各截一张图（前：前置状态；后：结果状态）。
- 出现异常先**别修**，先截图，再决定是否继续——修了就没证据了。
- 操作者报出动作与时间点（例如"14:32 点了右上角齿轮"），观察者据此在录屏里定位。
- Agent 每个用例结束时立刻落盘 `findings.jsonl`，别攒到最后回忆。

Per case: screenshot before and after; when something looks wrong, capture first and do not fix it;
the operator narrates action + timestamp; the agent writes each finding to disk immediately.

---

## 层 6 · 取证 / Layer 6 · Evidence

协议见 [EVIDENCE.md](EVIDENCE.md)。最低要求 / Minimum:
每条结论一条证据，文件名含用例 ID 与时间点，证据能读出**元素本身**而不是一堆背景。

除画面证据外，还有一类**合规证据**：`guard.mjs` 的只读观察日志
（`evidence/compliance.jsonl`），记录观察期间是否出现疑似注入线索、测试文本里是否写了被禁指令。
它观察注入、从不执行注入；它给的是线索而非"绝对没有注入"的证明。
Alongside visual evidence there is **compliance evidence**: the read-only watchdog log from
`guard.mjs`. It observes injection, never performs it, and yields leads rather than proof of absence.

---

## 层 7 · 判定 / Layer 7 · Adjudication

一条发现只允许落成四类之一 / Every observation becomes exactly one of:

| 类别 Kind | 含义 Meaning | 处理 Action |
| --- | --- | --- |
| 缺陷 Defect | 可复现、有画面证据、期望与实际不符 | 进缺陷表，定 S1–S4 |
| 观察 Observation | 现象为真，但不确定是否违背设计意图 | 写清现象与影响，交用户裁决 |
| 疑点 Suspicion | 像是问题但没复现出来 | 标"待复现"并写出怀疑依据 |
| 未验证 Unverified | 证据不足或权限缺失 | 写原因，不许写成通过 |

三级模式差异的判定句式 / Sentence patterns for cross-mode differences:

- 「L1 做不到，L2/L3 能做到」→ **缺鼠标可达路径**（可用性/无障碍缺陷）。
- 「L1/L2 能做到，L3 失败」→ **快捷键路径缺陷**。
- 「三级都做不到」→ **功能本身缺陷**。
- 「L1 出现，L2/L3 不出现」→ **与输入方式耦合的状态缺陷**（例如悬停态残留）。

---

## 层 8 · 报告与修复 / Layer 8 · Report and fix

用 [REPORT-TEMPLATE.md](REPORT-TEMPLATE.md)。至少给用户三样东西 / Deliver at least three things:

1. 能照着复现的缺陷表 / a reproducible defect table
2. 覆盖了什么、没覆盖什么、为什么 / what was and was not covered, and why
3. 建议的修复顺序（S1 先行，同因合并）/ a fix order, S1 first, same root cause merged

修复后必须**用同一个用例、同一个模式**复测，并把复测结论追加到原缺陷条目，而不是新开一条。
After a fix, retest with the same case in the same mode and append the result to the original entry.

---

## 原语 / Primitives

步骤只用这些词，避免歧义 / Write steps with these verbs only:

移动 move · 悬停 hover · 单击 click · 双击 double-click · 右键 right-click · 拖拽 drag ·
滚轮 scroll · 键入 type · 焦点移动 focus next/previous · 等待 wait（写明确切秒数或等待什么出现）。

不许出现"调用接口 xxx""通过脚本点击""执行内部命令"这类描述——那正是 R1 禁止的东西。
Phrases like "call endpoint x", "click via script", "run internal command" are exactly what R1 bans.
