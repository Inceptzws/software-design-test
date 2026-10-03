# 观察式界面测试报告 / Observed UI Test Report

> 复制本模板生成 `report.md`，中英对照。也可以让 `scripts/report.mjs build` 自动生成初稿。
> Copy this template into `report.md`, bilingual. `scripts/report.mjs build` generates a draft.

---

## 0. 基本信息 / Basics

| 项目 Item | 内容 Value |
| --- | --- |
| 被测应用 App | |
| 版本 / 构建 Version / Build | |
| 平台与环境 Platform & environment | macOS 版本 / Windows 版本 / iPhone 型号+iOS / iPad 型号+iPadOS；分辨率、缩放、深浅色 |
| 输入设备 Input devices | 鼠标 / 触控板 / 键盘布局 / 手指 / 触控笔 / 外接键鼠 |
| 测试日期 Date | |
| 操作者 Operator | |
| 观察者 Observer | |
| 会话目录 Session dir | |

## 1. 权限记录 / Permission record

| 权限 Permission | 用户答复 Answer | 影响 Impact |
| --- | --- | --- |
| 鼠标操作 Mouse operation | yes / no | |
| 键盘 Keyboard（级别 Mode） | L1 / L2 / L3 | |
| 屏幕录制 Screen recording | yes / no / 含光标？ | |
| 截屏 Screenshot | yes / no | |
| 麦克风（口述解说）Microphone | yes / no | |
| 系统捕获权限 OS capture permission | 已授予 / 未授予 | |
| 数据边界 Data boundary | | |

**未获得的权限与替代方案 / Permissions not granted and the substitute:**
（没有替代方案就写"因此该项未覆盖" / if there is no substitute, write "therefore not covered"）

## 2. 范围与覆盖 / Scope and coverage

| 维度 Dimension | 计划 Planned | 实际 Actual | 未覆盖原因 Not covered because |
| --- | --- | --- | --- |
| 元素 Element | | | |
| 模式 Mode（L1/L2/L3） | | | |
| 平台 Platform | | | |
| 用例 Case | | | |

**明确不在本次范围内 / Explicitly out of scope:**

## 3. 结论摘要 / Verdict summary

| 级别 Severity | 数量 Count | 说明 Notes |
| --- | --- | --- |
| S1 阻断 Blocking | | |
| S2 严重 Major | | |
| S3 次要 Minor | | |
| S4 打磨 Polish | | |
| U 无法判定 Undetermined | | |

一句话结论 / One-line verdict:

## 4. 缺陷表 / Defect table

> 一行一条，`证据` 写相对路径，`跨模式` 写该用例在 L1/L2/L3 的差异。
> One row per finding; `Evidence` holds relative paths; `Modes` holds the L1/L2/L3 difference.

| ID | 级别 Sev | 平台 | 元素/工具 | 步骤（真实操作） | 期望（画面） | 实际（画面） | 跨模式 L1/L2/L3 | 证据 Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F-001 | S2 | macOS | 工具栏「导出」按钮 | 鼠标移动到按钮 → 单击 | 弹出导出面板 | 无任何反应，按钮无按下态 | L1 失败 / L2 失败 / L3 ⌘E 成功 | `evidence/2026-10-04T093012-F-001-L1-after.png` |
| F-002 | S3 | iPhone | 设置页「同步」开关 | 手指点击开关 | 开关变为开启 | 开关回弹，状态未变 | L1 失败 / L2 无外接键盘 / L3 不适用 | `evidence/...` |

每条缺陷另附细节 / Per-defect detail:

```text
ID：F-001
标题 / Title：
复现率 / Repro rate：x/y
前置条件 / Preconditions：
步骤 / Steps（只用：移动、悬停、单击、双击、右键、拖拽、滚轮、键入、焦点移动、等待）：
期望 / Expected：
实际 / Actual：
画面证据 / Visual evidence：（相对路径 + 录屏 mm:ss）
跨模式差异 / Cross-mode difference：
影响 / Impact：
建议 / Suggestion：
```

## 5. 观察与疑点 / Observations and suspicions

| ID | 类型 Kind（观察/疑点） | 现象 | 为什么值得记 | 下一步 |
| --- | --- | --- | --- | --- |

## 6. 未验证项 / Unverified items

| 项 Item | 原因 Reason（权限/设备/时间/证据不足） | 想验证它需要什么 |
| --- | --- | --- |

> 记住 R5：**没有画面的结论不能写成通过。**
> Remember R5: **a conclusion without a picture is never written as "passed".**

## 7. 合规声明 / Compliance statement

- 本次测试**未使用任何内部指针指令**：无指针/触摸/按键注入，无自动化框架驱动，
  无内部句柄调用。输入仅来自操作者的真实外设。
- 证据仅来自录屏与截屏；代码、日志、接口与数据库未作为结论依据。
- 是否使用硬件宏或系统辅助（鼠标键等）：是 / 否；如是，说明：

## 8. 修复建议顺序 / Suggested fix order

| 顺序 Order | 缺陷 ID | 理由（影响面/根因/成本） | 复测用例 |
| --- | --- | --- | --- |

修复后复测必须用**同一用例、同一模式**，结论追加到原缺陷条目。
Retest with the same case and mode, and append the result to the original entry.
