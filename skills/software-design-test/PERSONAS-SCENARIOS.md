# 人物、场景与任务 / Personas, Scenarios and Tasks

> 这一层决定"模拟谁、走哪条路"。人物与场景都是**观察的架子**，不是关于真实用户的证据。
> This layer decides who is simulated and which path is walked. Personas and scenarios are
> **scaffolding for observation**, never evidence about real users.

---

## 一、人物 / Personas

### 1.1 依据从哪来 / Where the evidence comes from

只允许这五类来源，并在 `personas.md` 的"依据"列写明：
Only these five sources are allowed, and the "source" column must name one:

| 来源 Source | 怎么用 How |
| --- | --- |
| 用户访谈 / 可用性会话记录 | 直接引用用户的原话作为动机 |
| 支持工单 / 客服邮件 | 统计高频卡点，形成场景 |
| 埋点与漏斗 | 找出真实放弃点，作为"会在哪里放弃" |
| 设计目标（如"30 秒内导出"） | 变成可判定的成功标准 |
| 你自己第一次使用的真实体验 | 作为新手人物的最低门槛 |

**不许**凭空写"25–35 岁白领、喜欢咖啡"这类与缺陷无关的画像——那是装饰，不是依据。
Never write decorative demographics; persona attributes must change what you test.

### 1.2 四个必填属性 / Four attributes that must be filled

| 属性 Attribute | 取值 Values | 影响什么 What it changes |
| --- | --- | --- |
| 熟练度 Expertise | 新手 novice / 普通 regular / 专家 expert | 是否需要引导、是否依赖快捷键 |
| 使用频率 Frequency | 第一次 / 每周 / 每天 100 次 | 容忍几秒延迟、能否记住状态 |
| 设备与姿势 Device & posture | 触控板 / 鼠标 / 触屏 / 外接键鼠 / 单手 | 命中区、悬停依赖、拖拽可达性 |
| 可访问性需求 Accessibility | 无 / 键盘-only / 屏幕阅读器 / 动态字体 / 高对比度 | 焦点顺序、朗读文本、缩放与重排 |

再加一句硬要求 / Plus one hard line: **"他会在哪里放弃"（where this persona gives up）**。

### 1.3 最少三个，最多五个 / Three to five, no more

| 槽位 Slot | 建议 Suggested | 为什么 Why |
| --- | --- | --- |
| P-01 | 新手，第一次用 | 发现入口、术语、引导问题 |
| P-02 | 专家，高频重复 | 发现效率、快捷键、批量操作问题 |
| P-03 | 键盘-only 或视障或单手 | 发现焦点、可达性、命中区问题 |
| P-04（可选） | 中断者 / 多任务者 | 发现状态保持、恢复、并发问题 |
| P-05（可选） | 谨慎/怀疑型 | 发现确认、撤销、隐私提示问题 |

### 1.4 反模式 / Anti-patterns

- 完人人物（什么都会、什么都不生气）→ 找不到缺陷。
- 只按人口统计写人物 → 与测试动作无关。
- 一个人物代表"所有用户" → 覆盖不到边缘，也解释不了差异。
- 用真实用户姓名与隐私信息 → 合规问题，用角色名代替。

---

## 二、场景 / Scenarios

### 2.1 公式 / The formula

```text
场景 = 人物 + 目标 + 触发条件 + 约束 + 成功标准 + 途中检查点
Scenario = persona + goal + trigger + constraints + success criteria + checkpoints
```

| 字段 Field | 例 Example |
| --- | --- |
| 人物 | P-01 新手 |
| 目标 Goal | 把当前笔记导出成 PDF 发给同事 |
| 触发 Trigger | 会议前 5 分钟，第一次导出 |
| 约束 Constraints | 只有一个触控板；不知道菜单在哪 |
| 成功标准 Success | 5 分钟内得到 PDF，文件名可辨认 |
| 检查点 Checkpoints | 找到入口 / 选对格式 / 找到保存位置 / 看到完成反馈 |

### 2.2 场景类型必须齐 / Scenario types that must all appear

| 类型 Type | 例子 Example | 找什么 Finds |
| --- | --- | --- |
| 首次成功 First success | 新装应用完成第一次核心任务 | 引导、术语、入口可发现性 |
| 熟练例行 Routine | 每天做 100 次的操作 | 效率、快捷键、批量、重复确认 |
| 出错与恢复 Error & recovery | 输错、断网、权限被拒、文件损坏 | 错误信息、恢复路径、数据是否丢 |
| 中断与恢复 Interruption | 做到一半接电话/切应用 | 状态保持、草稿、回到原处 |
| 破坏性操作 Destructive | 删除、覆盖、批量修改 | 确认、撤销、可逆性 |
| 交接与协作 Handoff | 别人发来的文件/链接 | 上下文、权限、命名 |

### 2.3 场景来源 / Where scenarios come from

真实会话与工单 · 支持邮件 · 埋点失败漏斗 · 设计目标 · 竞品对照 · 你第一次使用的体验。
每个场景都要能回答："这个场景失败，用户在画面上的哪一刻会看出来？"

---

## 三、任务分解 / Task decomposition

场景不能直接测，要拆成**任务卡**。A scenario is not testable until it becomes task cards.

```text
任务卡 Task card
  任务 ID / Task ID：T-01
  人物 / Persona：P-01 新手
  场景 / Scenario：S-01 首次导出
  意图 / Intent：把这份笔记变成能发出去的 PDF（意图，不是步骤清单）
  开始状态 / Start state：笔记本打开，有 2 条笔记，无未保存修改
  步骤 / Steps：只用「移动 / 悬停 / 单击 / 双击 / 右键 / 拖拽 / 滚轮 / 键入 / 焦点移动 / 等待」
  成功标准 / Success criteria（画面上可见）：屏幕上出现「已导出」提示，且导出目录里出现
    文件名含笔记标题的 PDF
  检查点 / Checkpoints：找到入口 → 选对格式 → 选对位置 → 完成反馈
  允许的求助 / Allowed help：无（新手人物不允许查文档）
  级别 / Levels：L1、L2、L3 各跑一次
```

### 3.1 步骤的写法 / How to write steps

- 用**意图 + 动作**，不要写"点击坐标 (412,88)"。
- 不写"调用导出接口""用脚本点一下"——那是 R1 禁止的内部指针指令。
- 允许写"等待导出完成（最多 30 秒）"。
- 新手人物的任务里**不写答案**（不要写"点击右上角齿轮"），否则测的是执行而不是可发现性。

### 3.2 成功标准必须可判定 / Success criteria must be decidable

| 不合格 Not decidable | 合格 Decidable |
| --- | --- |
| "导出成功" | "出现『已导出』提示，且导出目录出现新 PDF" |
| "界面友好" | "菜单第一层能直接看到『导出』两个字" |
| "没报错" | "控制台无错误弹窗，且列表首行状态列显示『已同步』" |

---

## 四、旅程 / The user journey

沿时间轴走一遍，标记每一步的"期望 vs 实际"。Walk the timeline and mark expectation vs observed.

| # | 阶段 Stage | 要问的问题 Question |
| --- | --- | --- |
| 1 | 进入 Entry | 用户凭什么知道该打开哪里、点哪个？ |
| 2 | 首次成功 First success | 多久得到第一次成功？中间被迫学了几个新词？ |
| 3 | 熟练使用 Routine | 第 100 次做同一件事，还有几个多余步骤？ |
| 4 | 出错与恢复 Error & recovery | 出错后用户知道发生了什么、下一步做什么吗？ |
| 5 | 退出与再进入 Exit & return | 再回来时，状态、草稿、位置还在吗？ |

旅程记录里额外标三类现象 / Mark three extra phenomena:

- **断头路 Dead end**：走到某处无路可走，也没有出口提示。
- **绕路 Detour**：为了达成目标必须离开当前上下文。
- **记忆负担 Memory burden**：用户被迫记住上一步看见但不能复制的信息。

---

## 五、一个完整例子 / A worked example

| 项 | 内容 |
| --- | --- |
| 人物 P-01 | 新手，第一次用，只有触控板，目标"把笔记发给同事"，会在"看到一堆陌生术语"时放弃 |
| 场景 S-01 | 会议前 5 分钟，把当前笔记导出成 PDF |
| 任务 T-01 | 意图：拿到能发出去的 PDF；成功标准：出现「已导出」提示 + 目录里出现新 PDF |
| 发现 F-003 | L1 下菜单只有「分享 / 打印 / 同步」，没有「导出」；L3 下 ⌘E 直接可用 → **缺鼠标可达路径（新手在 L1 会放弃）** |

这条发现的价值不在于"导出坏了"，而在于**"只有会快捷键的人才能导出"**——
这正是用户模拟工作流相对元素清单的增量。
