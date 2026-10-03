---
name: observed-test-plan
description: 观察式界面测试的测试前准备：向用户发出鼠标、键盘、录屏、截屏与软硬件权限问卷，确定被测范围与三级模式，只看画面建立功能元素清单，排出用例矩阵与优先级，并用脚手架脚本生成会话目录。Observed UI testing, preparation phase: ask the user the mouse/keyboard/screen-recording/screenshot and OS-permission questionnaire, pin scope and the three input modes, build the on-screen element inventory, and lay out the case matrix, generating the session scaffold.
---

# 测试前准备 / Test Preparation

这是 `observed-ui-test` 的第一阶段：**在碰软件之前**把权限、范围、元素清单和用例矩阵定下来。
没有这一步，后面的缺陷会无法复现、覆盖会说不清。

The phase before touching the app: pin permissions, scope, inventory and matrix. Skip it and the
later defects will not reproduce and coverage cannot be explained.

---

## 1. 权限问卷（先问，必须问全）/ The permission questionnaire (ask first, ask all)

把下面整段发给用户，等他逐条回答后再动。/ Send the whole block, wait for answers:

```text
开始观察式界面测试前，需要你确认以下几项权限与边界：

【输入权限】
1. 鼠标：允许使用真实鼠标操作并据此判定吗？（yes / no）
2. 键盘：允许使用键盘吗？到哪一级？
   A. 仅鼠标（L1）
   B. 鼠标 + 键盘，但不许使用快捷键（L2）
   C. 鼠标 + 键盘 + 快捷键（L3）

【取证权限】
3. 屏幕录制：允许录屏吗？录屏里要不要包含光标？（yes / no；含光标 / 不含）
4. 截屏：允许随时截屏作为证据吗？（yes / no）
5. 麦克风：允许口述操作解说、方便定位录屏时间点吗？（yes / no）
6. 系统捕获权限：
   macOS：系统设置 → 隐私与安全性 → 屏幕录制（授予后需重启应用）
   Windows：设置 → 隐私和安全性 → 屏幕截图和录制 / 游戏栏
   iPhone/iPad：控制中心录屏（长按可开麦克风）；如用模拟器则无需此步
   你愿意授予哪些？（逐项回答）

【测试范围】
7. 被测应用：名称、版本、平台、设备（macOS / Windows / iPhone / iPad / 其他）
8. 本次范围：要测哪些功能；哪些明确不测
9. 数据边界：用哪个账号/数据；哪些内容绝对不能录进画面（真实姓名、手机号、密钥、生产数据）
10. 退出条件：出现什么情况立即停止（崩溃、数据损坏、隐私泄露、误删生产数据）

【合规声明】
本次测试不会使用任何内部指针指令：不注入鼠标/触摸/按键事件，不驱动自动化框架，
不调用软件内部句柄。输入只来自你的真实外设；证据只来自录屏与截屏。
你是否确认这一点？（yes / no）
```

English version of the same questionnaire is in [PERMISSIONS.md](PERMISSIONS.md)；平台权限的具体授予
路径与"没权限时怎么办"也在那里。

Rules:
- `screenRecording` 与 `screenshot` **至少一个为 yes**，否则无法进行观察式测试，直接停下并说明。
- 任何一项回答"待定"→ 不要开始，先把待定项变成明确答复。
- 拒绝的项记录在案，不允许绕过、不允许"偷偷用一下"。

---

## 2. 范围六项 / The six scope fields

被测应用名+版本+构建号 · 平台与设备 · 输入设备 · 显示环境（分辨率/缩放/深浅色/动态字体） ·
数据边界 · 退出条件。写进 `session.json` 的 `scope`，见 [PLAN-TEMPLATE.md](PLAN-TEMPLATE.md)。

---

## 3. 只看画面建元素清单 / Element inventory from the screen only

1. 打开被测软件，把每个界面截图（用 `scripts/capture.mjs shot`）。
2. 对着截图列出**看得见**的功能元素与工具：按钮、输入框、菜单、工具栏、列表、弹窗、
   开关、选择器、状态提示、画布与工具、导航。
3. 每个元素写全期望状态：默认 / 悬停 / 按下 / 选中 / 禁用 / 加载 / 错误 / 空。
4. **不许**打开代码、DOM 检查器、日志或数据库来补全清单；那些是线索不是清单来源。

产出一张 `elements.md`（脚手架已生成表头）。

---

## 4. 用例矩阵与优先级 / Case matrix and priority

矩阵 = 元素 × 平台 × 模式（L1/L2/L3）。规则与样例见 [MATRIX.md](MATRIX.md)。
每条用例的"期望结果"必须是**画面上能看到的东西**。优先级 P0 主流程 → P1 常用与数据 → P2 边缘异常 →
P3 打磨一致性；P2 至少覆盖空输入、超长输入、无权限、离线、快速重复点击、窗口缩放/旋转。

---

## 5. 生成会话脚手架 / Generate the session scaffold

```bash
node <skill-directory>/../scripts/session.mjs init ./ui-test-<app>-<date> \
  --platform macos --app "<应用名>" --levels L1,L2,L3 --tester "<操作者>"
```

生成 / Creates:

```text
ui-test-<app>-<date>/
├── session.json          # 闸门、范围、平台、级别、权限记录
├── permissions.md        # 权限问卷与答复存根（中英对照）
├── elements.md           # 元素清单表头
├── matrix.md             # 用例矩阵表头
├── findings.jsonl        # 一条缺陷一行
├── report.md             # 报告初稿
└── evidence/             # 截图与录屏
```

记录权限答复 / Record the answers:

```bash
node <skill-directory>/../scripts/session.mjs gate ./ui-test-<app>-<date> \
  --mouse yes --keyboard L2 --screen-recording yes --screenshot yes \
  --microphone no --os-permission yes --cursor yes --data-boundary "仅测试账号"
```

闸门未通过时不要开始测试；`status` 会告诉你还缺什么：
`node <skill-directory>/../scripts/session.mjs status ./ui-test-<app>-<date>`。

---

## 6. 准备完成检查表 / Readiness checklist

- [ ] 权限问卷逐条有明确答复，并已落盘
- [ ] 至少一种取证方式可用（录屏或截屏），且已实际试拍成功
- [ ] 范围六项写全，退出条件写清
- [ ] 元素清单来自截图，不是来自代码
- [ ] 每个元素的期望状态列全
- [ ] 用例矩阵覆盖 P0 与 P2 的最低要求
- [ ] 被测机器上自动化工具、宏软件全部退出；辅助功能权限未授予任何非必要应用
- [ ] 已跑 `guard.mjs scan <session>`，注入线索已落盘（只读观察，不执行注入）
- [ ] 操作者与观察者分工确认（谁操作、谁读图、谁记录）

全部打勾后，切到 `observed-ui-test` 技能开始按 L1 → L2 → L3 执行。
When every box is ticked, switch to the `observed-ui-test` skill and run L1 → L2 → L3.
