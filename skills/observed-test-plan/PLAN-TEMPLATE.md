# 观察式界面测试计划 / Observed UI Test Plan

> 计划阶段产物，中英对照。测试目录里的 `matrix.md` / `elements.md` 由脚手架生成。
> Phase-one artifact, bilingual. The session directory's `matrix.md` / `elements.md` come from the
> scaffold.

---

## 1. 目标 / Objective

本次要回答的问题（写成可判定的问题）/ The questions this run must answer:

1.
2.
3.

不回答的问题（明确排除）/ Explicitly out of scope:

-

## 2. 被测对象 / System under test

| 项目 Item | 内容 Value |
| --- | --- |
| 应用 App | |
| 版本 / 构建 Version / Build | |
| 平台 Platform | macOS / Windows / iPhone / iPad / other |
| 设备 Device | 型号 + 系统版本 |
| 安装方式 Install source | 应用商店 / 安装包 / 开发构建 / 模拟器 |
| 关键依赖 Dependencies | 网络、账号、外部设备 |

## 3. 测试环境 / Environment

分辨率与缩放 · 深色/浅色 · 动态字体大小 · 语言与区域 · 网络状态（在线/弱网/离线） ·
外接屏数量 · iPad 方向与分屏状态。

## 4. 权限与合规 / Permissions and compliance

| 项目 Item | 值 Value |
| --- | --- |
| 鼠标 Mouse | yes / no |
| 键盘 Keyboard | L1 / L2 / L3 |
| 屏幕录制 Screen recording | yes / no（含光标 / 不含） |
| 截屏 Screenshot | yes / no |
| 麦克风 Microphone | yes / no |
| 数据边界 Data boundary | |
| 内部指针指令 Internal pointer directives | **不使用 / none** |
| 硬件宏或系统辅助 Hardware macro / OS assist | 无 / 有（说明） |

## 5. 范围与优先级 / Scope and priority

P0：
P1：
P2：
P3（抽样）：

## 6. 排期 / Schedule

| 阶段 Phase | 内容 | 预计时长 |
| --- | --- | --- |
| 准备 Preparation | 权限、清单、矩阵 | |
| L1 | 仅鼠标全量 | |
| L2 | 无快捷键全量 | |
| L3 | 快捷键 + 双路径一致性 | |
| 汇总 Report | 判定、报告、复测建议 | |

## 7. 退出与中止条件 / Exit and abort criteria

**立即中止 / Abort immediately**：崩溃且无法恢复、数据损坏、隐私内容进入画面、误改生产数据、
设备过热或异常。

**提前结束 / End early**：S1 阻断导致主流程完全不可用（先出中间报告）。

## 8. 角色与产出 / Roles and artifacts

| 角色 Role | 人 Person |
| --- | --- |
| 操作者 Operator | |
| 观察者 Observer | |
| 记录者 Recorder | |
| 裁决者 Adjudicator | |

产出 / Artifacts：会话目录（`session.json`、`elements.md`、`matrix.md`、`findings.jsonl`、
`evidence/`）与最终 `report.md`。

## 9. 风险 / Risks

| 风险 Risk | 影响 | 缓解 Mitigation |
| --- | --- | --- |
| 无录屏权限 | 过程类缺陷无法取证 | 逐步截屏 + 操作者口述时间点 |
| 只有一台设备 | 跨端一致性无法验证 | 标"未验证"，列入下一轮 |
| 用例太多 | 跑不完 | 按抽样规则裁剪并写明 |
| 真实数据 | 隐私风险 | 用测试账号与演示数据 |
