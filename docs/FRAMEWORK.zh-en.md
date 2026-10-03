# 框架总览（从上到下）/ Framework Overview (top-down)

> 这是给人看的设计说明；Agent 执行时读的是 `skills/observed-ui-test/`、
> `skills/observed-test-plan/` 与 `skills/software-design-test/`。
> This is the human-facing design document; the agent executes from the two skill directories.

---

## 总图 / The picture

```text
                    ┌──────────────────────────────────────────────┐
  层 0 立场         │  人 = 唯一的手      屏幕 = 唯一证据          │
  Layer 0 Position  │  human = the only hand   screen = the only   │
                    │                          evidence            │
                    └──────────────────────────────────────────────┘
                                      │
                    ┌──────────────────────────────────────────────┐
  层 1 权限闸门     │ 鼠标 · 键盘级别 · 录屏/截屏 · 系统权限        │
  Layer 1 Gate      │ 未答复 → 不开始 / unanswered → no start      │
                    └──────────────────────────────────────────────┘
                                      │
                    ┌──────────────────────────────────────────────┐
  层 2 范围         │ 应用/版本 · 平台设备 · 输入设备 · 显示环境   │
  Layer 2 Scope     │ 数据边界 · 退出条件                          │
                    └──────────────────────────────────────────────┘
                                      │
                    ┌──────────────────────────────────────────────┐
  层 3 元素清单     │ 只看画面列出功能元素与工具 + 全部期望状态     │
  Layer 3 Inventory │ inventory from the screen only               │
                    └──────────────────────────────────────────────┘
                                      │
                    ┌──────────────────────────────────────────────┐
  层 4 用例矩阵     │ 元素 × 平台 × 模式(L1/L2/L3)，P0–P3 优先级   │
  Layer 4 Matrix    │ case matrix with priorities                  │
                    └──────────────────────────────────────────────┘
                                      │
                    ┌──────────────────────────────────────────────┐
  层 4.5 用户模拟   │ 人物 → 场景 → 任务卡 → 旅程 → 启发式/巡游   │
  Layer 4.5 Sim     │ personas → scenarios → tasks → journey →     │
                    │ heuristics & tours（software-design-test）      │
                    └──────────────────────────────────────────────┘
                                      │
                    ┌──────────────────────────────────────────────┐
  层 5 三级执行     │ L1 仅鼠标 → L2 无快捷键 → L3 可快捷键         │
  Layer 5 Execution │ the difference across modes IS the finding   │
                    └──────────────────────────────────────────────┘
                                      │
                    ┌──────────────────────────────────────────────┐
  层 6 取证         │ 录屏 + 截屏 + 注入观察日志（只读）            │
  Layer 6 Evidence  │ recording + screenshots + read-only watchdog │
                    └──────────────────────────────────────────────┘
                                      │
                    ┌──────────────────────────────────────────────┐
  层 7 判定         │ 缺陷 / 观察 / 疑点 / 未验证，S1–S4 分级       │
  Layer 7 Verdict   │ defect / observation / suspicion / unverified│
                    └──────────────────────────────────────────────┘
                                      │
                    ┌──────────────────────────────────────────────┐
  层 8 报告         │ 中英对照、带证据、可复现、含权限缺口          │
  Layer 8 Report    │ bilingual, evidenced, reproducible, with gaps│
                    └──────────────────────────────────────────────┘
```

---

## 三条不可交换的原则 / Three non-negotiables

1. **真实输入 / Real input** —— 输入只来自人的真实外设。不注入、不模拟、不调用内部句柄。
   > EN: Input comes only from the human's real peripherals. No injection, no simulation, no
   > internal handle invocation.
2. **画面证据 / Visual evidence** —— 结论必须能在画面上指认出来。
   > EN: Every conclusion must be pointable-to on screen.
3. **可复现 / Reproducible** —— 另一个操作者照步骤能重放。
   > EN: Another operator can replay the steps.

---

## 测试要求 / Test requirements（用户指定的四条）

| 要求 Requirement | 落地方式 How it is enforced |
| --- | --- |
| 不允许使用内在指针指令 | 禁用清单 + 计划文本扫描 + 进程表只读观察 + 代码级自检（`verify.mjs`） |
| 从录屏/截屏观察元素是否完好、工具是否可行 | 十大观察维度 + 证据协议 + 一图一结论 |
| 开始前询问鼠标/键盘/录屏等软硬件权限 | 权限问卷闸门，落盘 `session.json`，未通过不得开始 |
| 三级操作模式 | L1 仅鼠标 → L2 鼠标+键盘禁快捷键 → L3 可用快捷键，跨模式差异登记 |

> EN: No internal pointer directives (deny list, plan scan, process watchdog, code self-check);
> judge integrity and tool usability from recordings and screenshots (ten dimensions, evidence
> protocol); ask for mouse/keyboard/capture permissions before starting (gate recorded in
> `session.json`); three input modes with cross-mode differences logged.

---

## 十大观察维度 / Ten on-screen dimensions

存在 · 完好 · 可读 · 可发现 · 命中与状态 · 反馈 · 状态正确 · 层级与布局 · 数据完整 · 跨设备一致。
> EN: existence · integrity · legibility · discoverability · hit target and states · feedback ·
> state correctness · layering and layout · data integrity · cross-device consistency.

---

## 角色分工 / Roles

| 角色 | 是谁 | 做什么 |
| --- | --- | --- |
| 操作者 Operator | 用户 | 唯一的手：真实鼠标键盘操作 |
| 观察者 Observer | Agent + 用户 | 眼睛：读图判读元素与工具状态 |
| 记录者 Recorder | Agent | 笔：写用例、记证据、出报告 |
| 裁决者 Adjudicator | 用户 | 确认严重级与是否算缺陷 |

> EN: the human is the only hand; the agent is the eyes and the pen; the human adjudicates severity.

---

## 用户模拟这一层怎么接进来（本插件的重心）/ How the simulation layer plugs in (the centerpiece)

`software-design-test` 是本插件的主技能，提供"以谁、走哪条路、找哪类 bug"：人物（3–5 个，含依据）、六类场景、
任务卡、用户旅程（五个阶段）、启发式扫描（认知走查四问 → Nielsen 十项 → HICCUPPS(F) → SFDIPOT →
14 条巡游）、以及无障碍作为唯一"合法的模拟用户"（WCAG 2.2 仅键盘与屏幕阅读器步骤）。
它**不改动**本框架的任何硬规则：仍然是真实鼠标键盘、画面证据、禁止内部指针指令。

> EN: The simulation skill supplies who is simulated, which path, and which bugs — personas, six
> scenario families, task cards, a five-stage journey, heuristic sweeps and accessibility lenses —
> without relaxing a single hard rule of this framework.

## 这个框架不做什么 / What it deliberately does not do

- 不做自动化点击、不做录制回放、不做 RPA——那不是"真实用户路径"。
- 不用代码/DOM/日志/数据库来"证明"界面正确——那些只是线索。
- 不把没测到的写成通过——`未验证` 是一种正式结论。

> EN: no scripted clicking, replay or RPA; no code/DOM/log/database "proof" of UI correctness; and
> never writing untested as passed — `unverified` is a formal outcome.

---

## 一轮的产出 / Outputs of one round

```text
ui-test-<app>-<date>/
├── session.json          # 闸门、范围、级别、统计
├── permissions.md        # 权限问卷与用户答复
├── elements.md           # 画面元素清单
├── matrix.md             # 用例矩阵与覆盖率
├── findings.jsonl        # 一条发现一行（含跨模式差异）
├── report.md             # 中英对照报告（含未验证项、注入观察、合规声明）
└── evidence/             # 截图、录屏、取证索引、注入观察日志
```
