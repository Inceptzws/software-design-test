# 使用说明 / Usage

> 中英对照：每段中文后跟 `> EN:` 英文。 / Bilingual: each Chinese block is followed by `> EN:`.
>
> 一句话：**人操作、屏幕作证、Agent 读图判定。** 中间不允许任何"内部指针指令"。
> One line: **the human acts, the screen testifies, the agent reads the picture.** No internal
> pointer directives anywhere in between.

---

## 1. 它解决什么问题 / What it is for

用 DeepSeek Harness 做软件设计时，"改完到底好不好用"通常没人系统验证。这个插件把**人工观察式
测试**变成一套可执行、可审计的流程：从真实鼠标键盘操作出发，用录屏与截屏判断功能元素是否完好、
工具是否真的能用，最后交出一份中英对照、带证据、能复现的报告。

When you design software with DeepSeek Harness, nobody systematically verifies whether the result is
actually usable. This plugin turns **human-observed testing** into an executable, auditable process:
real mouse and keyboard input, screen recordings and screenshots as evidence, and a bilingual,
reproducible report at the end.

适用平台 / Platforms：macOS · Windows · iPhone · iPad · 以及 Android、电视/车机/手表等交互设备。

---

## 2. 五步跑完一轮 / Five steps per round

### 第 0 步 · 说触发词（推荐）/ Say the trigger phrase (recommended)

```text
模拟真实用户测试
```

或英文 `simulate a real user test` / `run a real-user simulation test`。
插件收到后**立即开始真实模拟测试**：一句话确认对象 → 发权限问卷 → 建会话开跑，
不再跟你讨论方法论、不再反复确认流程。只有触发词、没给对象时，它只会问一句"测哪个应用/功能？"

> Saying the trigger phrase starts the run immediately: one line to confirm the target, then the
> permission questionnaire, then straight into P1–P9.

### 第 1 步 · 或者点名技能 / Or name the skill directly

在对话里直接说，或用 `/` 菜单：

```text
用软件设计测试（模拟真实用户）测一下 <应用名>：先按 observed-test-plan 过权限闸门，
再按 software-design-test 建人物、场景、任务卡，最后按三级模式真实操作。
Test <app> by simulating real users: run the permission gate from observed-test-plan, build
personas/scenarios/task cards with software-design-test, then execute L1 → L2 → L3.
```

> EN: Say it in chat or pick the skill from the `/` menu. Both skills are model-invocable, so the
> agent can also pick them up on its own when the request matches.

### 第 2 步 · 回答权限问卷 / Answer the permission questionnaire

Agent 会先发出权限问卷（鼠标、键盘、屏幕录制、截屏、麦克风、系统权限、范围与数据边界、合规确认）。
**不回答就不开始。** 问答会落盘到会话目录的 `permissions.md`。

The agent first asks the permission questionnaire (mouse, keyboard, screen recording, screenshots,
microphone, OS permissions, scope, data boundary, compliance). **No answers, no start.** The Q&A is
written into `permissions.md`.

> 提示：如果只愿意给截屏、不给录屏，也可以进行，但报告首页会记录"无连续录屏"这个缺口。
> Tip: screenshots without recording still works, but the gap is recorded on page one of the report.

### 第 3 步 · 建会话 / Create the session

```bash
cd /Users/inception/Documents/deepseek-harness/default-workspace/software-design-test
node scripts/session.mjs init ./ui-test-<app>-$(date +%F) --platform macos --app "<应用名>" --tester "<操作者>"
node scripts/session.mjs gate ./ui-test-<app>-<date> --mouse yes --keyboard L2 \
  --screen-recording yes --screenshot yes --microphone no --os-permission yes --cursor yes \
  --compliance yes --data-boundary "仅测试账号"
node scripts/capture.mjs check                 # 确认取证工具可用 / verify capture works
node scripts/guard.mjs scan ./ui-test-<app>-<date>   # 测试前：观察有没有注入工具在跑
```

### 第 4 步 · 按 L1 → L2 → L3 执行 / Run L1 → L2 → L3

测试期间：

```bash
node scripts/capture.mjs record <session> --label L1 --seconds 60    # 录一段
node scripts/capture.mjs shot   <session> --label L1-07-after         # 截一张
node scripts/guard.mjs watch    <session> --seconds 600               # 后台盯着注入线索
```

测得一条就立刻落盘一条（不要攒到最后回忆）：

```bash
node scripts/session.mjs finding <session> --json '{
  "level":"L1","element":"E-07 工具栏「导出」按钮",
  "title_zh":"导出按钮点击无反应","title_en":"Export button does nothing",
  "steps_zh":"移动鼠标到按钮，悬停 1 秒，单击","steps_en":"Hover 1s, then click",
  "expected_zh":"弹出导出面板","expected_en":"Export dialog opens",
  "actual_zh":"无反应，也没有按下态","actual_en":"No reaction, no pressed state",
  "modes":"L1 fail / L2 fail / L3 ⌘E pass","severity":"S2","kind":"defect",
  "evidence":["evidence/2026-10-04T09-30-12-L1-07-after.png"]
}'
```

### 第 5 步 · 出报告 / Generate the report

```bash
node scripts/report.mjs build <session>          # 生成 report.md（中英对照）
xattr -c <session>/evidence/*.png 2>/dev/null || true   # 可选：清理隔离属性
```

> EN: `report.md` collects the gate record, coverage, severity counts, per-finding detail with
> cross-mode differences, unverified items, the evidence index, the injection-watch section and a
> compliance statement.

---

## 3. 模拟真实用户：本插件的重心 / Simulating a real user: the centerpiece

**本插件的重点就是这个**：不是"检查按钮渲染是否正常"，而是**按真实用户会怎么用来找问题**。
"测什么"的完整清单在 [TEST-CONTENT.md](../skills/software-design-test/TEST-CONTENT.md)：15 类，
含窗口与界面尺寸、鼠标速度与指针、工具栏可读性、目标尺寸、文字、布局、反馈、效率、键盘焦点、
可访问性、性能、错误恢复、数据输入、跨设备一致性、视觉打磨，每类都有"怎么看 + 判据"。
十步流程（P0–P9）写在 [WORKFLOW.md](../skills/software-design-test/WORKFLOW.md)；
主技能名与插件名同名，是 `/` 菜单里的直接入口。

**三句话记住** / Three lines:

1. **人物**是观察的架子：3–5 个，每个都有依据（访谈/工单/埋点/设计目标/自身体验），
   并且写明"他会在哪里放弃"。
2. **任务卡**里不写答案：新手任务卡写具体点击位置，你测的就变成执行力而不是可发现性。
3. **缺陷分四类**：测试者错误、观察错误、产品缺陷、环境故障——**只有第三类算缺陷**。

**可直接复制的提示词 / Copy-paste prompt:**

```text
按 software-design-test 在这台机器上模拟真实用户找 bug：
1) 先跑 observed-test-plan 的权限闸门；
2) 建 3 个人物：新手（第一次用）、专家（每天 100 次）、键盘-only（可访问性需求），
   每个人物写依据和"会在哪里放弃"；
3) 每人至少一个场景，覆盖"首次成功""出错与恢复""中断"三类；
4) 拆成任务卡，成功标准必须是画面上能看见的；
5) 用启发式扫一遍：认知走查四问 → 十项可用性启发式 → HICCUPPS(F) → SFDIPOT → 巡游；
6) 按 L1 → L2 → L3 真实操作执行，出声思维，录屏 + 点击前后静帧；
7) 每条发现写 persona、scenario、task_outcome、复现率与证据；
8) 出报告，包含"用户模拟覆盖"一节。

硬性规则不变：不注入鼠标/触摸/按键，不驱动自动化框架；我操作，你观察。
```

**报告里会多出一节**：`用户模拟覆盖 / User-simulation coverage` —— 计划人物/场景 vs 实际走到的、
任务结果分布（通过/部分/失败/受阻/未验证）、每个人物的最坏级别。

> EN: The simulation skill adds personas, scenarios, task cards, a journey, heuristic sweeps and the
> four-way failure classification on top of the same three input modes and the same no-injection rule.
> The report gains a **User-simulation coverage** section.

**常见误区 / Common mistakes**：人物写成完人（什么都顺利）· 只走成功路径 · 任务卡里写出答案 ·
观察者引导操作者 · 把模拟结论写成"用户都……"。
详见 [DEFECTS.md](../skills/software-design-test/DEFECTS.md) 第八节。

---

## 4. 三级操作模式怎么选 / Choosing the input mode

| 级别 | 操作方式 | 主要能抓到 |
| --- | --- | --- |
| **L1 仅鼠标** | 只动鼠标：单击、双击、右键、拖拽、滚轮、悬停 | 没有鼠标可达路径、命中区过小、必须悬停才可发现的控件 |
| **L2 鼠标+键盘（禁快捷键）** | 可打字、Enter、Tab、方向键、退格、空格；禁止一切修饰键组合与功能键 | 键盘导航断链、焦点环错位/丢失、焦点陷阱、Tab 顺序错乱 |
| **L3 鼠标+键盘+快捷键** | 全部放开；每条功能走"鼠标路径"与"快捷键路径"并比对 | 快捷键失效/冲突、两条路径结果不一致、快捷键提示写错 |

> EN: L1 catches missing mouse-reachable paths; L2 catches broken keyboard navigation and focus;
> L3 compares the menu path with the shortcut path. The difference across modes is itself a finding:
> pass only at L3 → no mouse path; pass only at L1/L2 → the shortcut path is broken.

---

## 5. Agent 会怎么问、怎么判 / How the agent asks and judges

**问答模板（可直接复制给 Agent）/ Copy-paste prompt:**

```text
我要用 software-design-test 模拟真实用户测 <应用名> <版本>（<平台>）。
请按这个顺序做：
1) 先发权限问卷，等我逐条回答（鼠标、键盘级别、录屏、截屏、麦克风、系统权限、范围、数据边界、合规确认）；
2) 用 session.mjs init 建会话并记录我的答复；
3) 只看画面列元素清单与用例矩阵（不要看代码）；
4) 先跑 L1 全量，再 L2，再 L3，每条失败用例都在 L2/L3 复现一次并登记跨模式差异；
5) 每测得一条就写进 findings.jsonl，截图前一张后一张；
6) 最后出中英对照报告，含未验证项与权限缺口。

硬性要求：不允许使用任何内部指针指令（不注入鼠标/触摸/按键、不驱动自动化框架、不调用内部句柄）；
证据只来自录屏与截屏；我操作，你观察。
```

**判定句式 / Judgement patterns:**

- 「L1 做不到，L2/L3 能做到」→ 缺鼠标可达路径（可用性缺陷）。
- 「L1/L2 能做到，L3 失败」→ 快捷键路径缺陷。
- 「三级都做不到」→ 功能本身缺陷。
- 「L1 出现，L2/L3 不出现」→ 与输入方式耦合的状态缺陷。

---

## 6. 关于"观察注入" / About watching for injection

插件自带 `guard.mjs`，它**只读观察**输入注入线索（扫描进程表、扫描计划与发现文本），
把命中写进 `evidence/compliance.jsonl`，并在报告第 8 节汇总。它**没有任何注入能力**，
也不提供注入子命令。

`guard.mjs` **observes** injection directives only — process table and session text — writing hits to
`evidence/compliance.jsonl` and into section 8 of the report. It has **no injection capability** and
no injection subcommand.

> 意义：纪律不靠自觉。测试前扫一次、测试中盯一遍，"偷偷用脚本点一下"会留下痕迹。
> Why: discipline should leave a trace. Scan before, watch during — a smuggled scripted click has to
> show up somewhere.

---

## 7. 常见问题 / FAQ

**Q：没有录屏权限怎么办？**
A：改用逐步截屏（每条用例前后各一张），报告首页会记录"无连续录屏"。
> EN: Use step-by-step screenshots; the gap is recorded on page one.

**Q：只有截屏也不行呢？**
A：那就无法进行观察式测试——无画面即无证据。停下来，先解决权限。
> EN: Then the method cannot run: no picture, no evidence. Stop and fix permissions first.

**Q：iPhone 真机怎么录？**
A：控制中心 → 屏幕录制（长按可开麦克风）；或用 Mac 的 QuickTime 连续互通录制真机屏幕。
> EN: Control Centre → Screen Recording, or QuickTime on a Mac via Continuity.

**Q：模拟器算不算真机？**
A：不算。可以在模拟器上发现问题，但报告里必须写"未在真机验证（模拟器）"。
> EN: No. It can find problems, but the report must say "not verified on real hardware".

**Q：为什么不能用 Playwright / Appium / cliclick 帮我点？**
A：那正是被禁止的"内部指针指令"。一旦允许注入，缺陷就不再是"真实用户会遇到的缺陷"。
> EN: Those are exactly the banned internal pointer directives. Once injection is allowed, the defects
> are no longer the ones a real user would hit.

**Q：我真的需要自动化回归怎么办？**
A：那是另一轮工作，另开一轮、另写报告，**不能和本方法的结论混在一起**。
> EN: That is a different round with a different report; never mix its results with this method's.

**Q：用户模拟的结论能当作用户研究吗？**
A：不能。模拟提高的是发现率，不是结论权威性；高风险功能必须补真人会话，报告里写清"在 P-01 这个
模拟视角下"，而不是"用户都找不到导出"。
> EN: No. Simulation raises detection rate, not authority. Keep real sessions for high-risk features and
> always phrase findings as "under persona P-01", never "all users".

**Q：为什么不能用 AI/GUI 智能体替我点一遍？**
A：它的动作层就是内部指针指令（CDP / XTest / SendInput / 辅助功能驱动）。可以参考它的推理层
（先描述屏幕状态、按角色与名称定位元素、里程碑、后置条件、自我核查、失败四分类），但手必须是人的。
> EN: Its act layer is exactly the banned injection; borrow only its reasoning primitives.

**Q：被测机器上必须关掉什么？**
A：自动化框架、宏软件、按键精灵类工具、浏览器自动化扩展、远程控制软件；辅助功能权限不给非必要应用。
> EN: Automation frameworks, macro utilities, browser automation extensions, remote-control tools;
> and no unnecessary accessibility grants.

**Q：截图里有隐私怎么办？**
A：测试前就定好数据边界，用测试账号与演示数据；已录到的隐私内容在交付前处理掉。
> EN: Set the data boundary up front, use a test account and demo data, and scrub anything private
> before delivery.

---

## 8. 命令速查 / Command cheat sheet

```bash
# 会话 / session
node scripts/session.mjs init    <dir> --platform macos --app "<app>" [--tester "<name>"] [--force]
node scripts/session.mjs gate    <dir> --mouse yes --keyboard L2 --screen-recording yes --screenshot yes \
                                       [--microphone no] [--os-permission yes] [--cursor yes] \
                                       [--compliance yes] [--data-boundary "..."]
node scripts/session.mjs status  <dir>
node scripts/session.mjs finding <dir> --json '<json>' | --json @file.json | --stdin
#   finding 可带字段 / finding may carry: persona, scenario, task_outcome, heuristic, tour,
#   repro_rate, minimized, modes, severity(S1-S4|U), kind(defect|observation|suspicion|unverified)

# 取证 / evidence（只读捕获，绝不注入）
node scripts/capture.mjs check
node scripts/capture.mjs shot   <dir> --label L1-07-after [--window] [--target macos|ios-sim|android|windows]
node scripts/capture.mjs record <dir> --label L1 --seconds 60 [--target ...]

# 注入观察 / injection watch（观察 ≠ 执行）
node scripts/guard.mjs scan  <dir>
node scripts/guard.mjs watch <dir> --seconds 600 [--interval 5]

# 报告与自检 / report and self-check
node scripts/report.mjs build <dir> [--out report.md]
node scripts/verify.mjs
node --test test/*.test.mjs
```
