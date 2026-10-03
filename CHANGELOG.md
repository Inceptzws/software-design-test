# 变更记录 / Changelog

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 与[语义化版本](https://semver.org/lang/zh-CN/)。
This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [SemVer](https://semver.org/).

## [1.2.0] - 2026-10-04

### 新增 / Added

- **触发词即开始**：用户说「模拟真实用户测试」或英文等价表达（`simulate a real user test`、
  `run a real-user simulation test`、`simulated user testing`、`test it like a real user`）时，
  插件**立即进入真实模拟测试**：一句话确认对象 → 发权限问卷 → 建会话开跑，不再讨论方法论。
- **测试内容清单 `TEST-CONTENT.md`**：15 类"测什么"，每类含检查项 / 怎么看 / 判据——
  窗口与界面尺寸、鼠标速度与指针、目标尺寸与间距、工具栏与菜单、文字排版、布局层级、反馈状态、
  效率流程、键盘焦点、可访问性、性能响应、错误恢复、数据输入、跨设备一致性、视觉打磨，
  附阈值速查表（WCAG 2.5.8 / 2.5.5 / 1.4.3 / 1.4.4 / 1.4.10、Apple 44pt、Material 48dp、
  0.1s–1s–10s 响应时限、悬停 300–500ms）。
- **窗口尺寸与指针速度专项**：窗口尺寸矩阵（最小 / 默认 / 最大化 / 分屏 / 缩放 200% / 多显示器）、
  指针总行程与精细操作测量法（录屏帧估算，不需要任何自动化工具）。
- 会话脚手架新增 `content.md`（15 类跟踪表 + 十分钟快扫 + 尺寸/速度测量表）；
  发现条目新增 `content`（测试内容类别）与 `criteria`（判据）字段。
- 报告新增 **「测试内容分布」** 一节，按测试内容聚合发现、给出每类最坏级别与判据。
- 并入已核验的调研细节：单人启发式评估的发现率（严重 42% / 轻微 32%）、严重级=频率×影响×持续性、
  认知走查会话组织（任一问"否"即 Fail）、出声思维"不许救援"、N=5 只是发现法则、
  检查类方法与真人会话必须交替；观察记录 11 字段与 issue record 字段清单。
- 修正两处以讹传讹：巡游按书中的"城区"分组（Configuration / Dirty Harry 不在书内）、
  `SFDIPOT` 而非 `SFDPOT`（补回 Interfaces 透镜）。
- 新增 CI（`.github/workflows/verify.yml`）与 `CHANGELOG.md`。

### 变更 / Changed

- **插件改名为 `software-design-test`**（原 `dsh-observed-ui-test`）；主技能同名，
  是 `/` 菜单里的直接入口；`cordis.patch.yml` 行 id 与包名同步。
- 重心从"观察式测试"移到**"如何模拟真实用户做软件测试"**：主技能重写，
  README / 安装说明 / 使用说明 / 框架总览 / locale / package 描述全部改为模拟优先的叙述。
- `countTableRows` 修正为只统计文件内**第一张**表，避免 `content.md` 的测量表被计入类别数。

## [1.1.0] - 2026-10-03

### 新增 / Added

- `user-sim-bug-hunt`（现 `software-design-test`）技能：十步工作流（P0 立项与权限 → P1 人物 →
  P2 场景 → P3 任务卡 → P4 旅程 → P5 启发式与巡游 → P6 执行 → P7 判定 → P8 报告 → P9 复测）。
- 人物与场景构建、Nielsen 十项、HICCUPPS(F)、SFDIPOT、Whittaker 巡游、WCAG 2.2 无障碍步骤，
  以及带核验标记的 [SOURCES.md](skills/software-design-test/SOURCES.md)。
- 会话脚手架新增 `personas.md` / `scenarios.md` / `journey.md` / `heuristics.md`；
  报告新增「用户模拟覆盖」一节。

## [1.0.0] - 2026-10-03

### 新增 / Added

- 首个版本（最初命名 `dsh-observed-ui-test`）：观察式界面测试。
- 两个技能：`observed-ui-test`（五条硬性规则、三级操作模式、十大观察维度、取证协议、报告模板）、
  `observed-test-plan`（权限问卷、范围六项、元素清单、用例矩阵）。
- 脚本：`session.mjs`（会话、权限闸门、发现落盘）、`capture.mjs`（只读截屏/录屏）、
  `guard.mjs`（只读观察输入注入线索）、`report.mjs`（中英对照报告）、`verify.mjs`（离线自检）。
- 硬规则：真实鼠标键盘、画面唯一证据、**禁止任何内部指针注入指令**、权限闸门先行。
- 中英对照的 README、安装说明、使用说明与框架总览。

[1.2.0]: https://github.com/Inceptzws/software-design-test/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Inceptzws/software-design-test/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Inceptzws/software-design-test/releases/tag/v1.0.0
