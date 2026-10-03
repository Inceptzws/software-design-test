# 启发式、巡游与无障碍清单 / Heuristics, Tours and Accessibility Lenses

> 这些是"透镜"，不是"用例"。用法：**先各自独立扫，再合并去重**，每条结论都必须指得到画面上的
> 具体位置；指不到位置的结论降级为"观察"。
> These are lenses, not test cases. Sweep **independently first, merge second**; every conclusion must
> point at a place on the screen, or it is downgraded to an observation.

---

## A. 认知走查四问 / Cognitive walkthrough: the four questions

对任务卡里的**每一个关键动作**问这四句（Wharton / Carroll / Lewis / Polson）：

| # | 问题 Question | 画面上的证据 Evidence |
| --- | --- | --- |
| 1 | 用户会想做出这个效果吗？Will the user try to achieve the right effect? | 目标与界面的用词是否对得上 |
| 2 | 用户会注意到存在正确操作吗？Will the user notice the correct action is available? | 控件可见、未禁用、不是只在悬停才出现 |
| 3 | 用户会把正确操作和想要的结果联系起来吗？Will the user associate the action with the effect? | 标签/图标/位置是否表达一致含义 |
| 4 | 做完之后，用户看得出自己在接近目标吗？Will the user see progress after acting? | 有加载/成功/位置变化的可见反馈 |

**会话组织 / How to run it**：

1. 固定一个**人物** + 3–5 条最重要的任务；**先约定"一步"的粒度**（否则一半时间在吵粒度）。
2. 角色：主持人（逐步停在每个界面）、记录员、3–6 名评估者。
3. 每个界面集体答四问；**任何一问是"否" ⇒ 这一步判 Fail**。
4. 记录失败原因 + 界面位置 + 失败的是第几问。
5. 汇总失败点 → 按失败步骤的比例给分 → 进入设计修改。

**产物**：任务清单、逐步通过/失败表、失败原因、问题清单。
**坑**：粒度争议、跑题成通用设计评审、群体思维、假设用户知道评估者知道的事；
**对专家/高频功能不适用**（这类功能要用任务观察而不是走查）。
失败步骤按"哪一问失败 + 界面"打标签，作为缺陷候选；严重级由共识（Nielsen 0–4）给出，
但**评估者判断仍需真人会话佐证**。

> 3–5 人各自独立答，合并分歧点——**分歧点本身就是最好的缺陷候选**。

---

## B. 十项可用性启发式 / Nielsen's 10 usability heuristics

（名称与释义依据 NN/g 原文；检查问句与"画面上长什么样"是本地化改写）

| # | 启发式 Heuristic | 检查问句 Ask | 违反时长什么样 On screen |
| --- | --- | --- | --- |
| 1 | 系统状态可见性 Visibility of system status | 每个操作后 1 秒内有没有可见反馈？ | 点了没反应、无加载态、不知道保存没保存 |
| 2 | 贴合现实世界 Match with the real world | 用的是用户的词还是内部术语？ | "同步实体""实例化"这类词直接出现在界面 |
| 3 | 用户控制与自由 User control and freedom | 有没有明确的"紧急出口"（撤销/取消/返回）？ | 弹窗只能"确定"、误操作无法撤销 |
| 4 | 一致性与标准 Consistency and standards | 同类东西是不是同一套词、同一套位置？ | "保存"和"应用"混用；同类按钮位置不同 |
| 5 | 错误预防 Error prevention | 有没有在犯错前拦一下？ | 破坏性操作无二次确认、无影响范围说明 |
| 6 | 识别优于回忆 Recognition rather than recall | 需不需要记住上一屏的信息？ | 必须记住上一步的编号/路径才能继续 |
| 7 | 灵活与高效 Flexibility and efficiency | 新手与专家是否都有顺手的路径？ | 只有快捷键、或只有一层层点菜单 |
| 8 | 美观与极简 Aesthetic and minimalist design | 有没有无关信息挤占注意力？ | 一屏五个同等强调的按钮；干扰性提示 |
| 9 | 帮助用户识别、诊断和恢复错误 Help users recognize, diagnose, recover | 报错说人话吗？给出下一步了吗？ | 直接抛错误码、只说"操作失败" |
| 10 | 帮助与文档 Help and documentation | 需要时能不能就地找到帮助？ | 帮助入口埋在设置深处、无可搜索内容 |

**严重级（启发式评估用）**：`0` 不是问题 · `1` 表面问题（修饰性）· `2` 轻微/低优先 · `3` 严重/高优先 ·
`4` 灾难（发布前必修）。严重级按**频率 × 影响 × 持续性**综合判断，不由感觉定。
每个人**先独立定级**，再对合并后的问题清单**取 ≥3 人评分的均值**；分歧条目不投票，
**回到画面确认**，确认不了降级为"观察"。

> **为什么必须多人独立评估**：单个评估者平均只能发现约 **42%** 的严重问题与 **32%** 的轻微问题
> （Nielsen 1992）。所以一个"我扫过了，没问题"的结论几乎必然漏掉大部分问题。
> One evaluator finds only ~42% of major and ~32% of minor problems — a solo sweep is not coverage.

---

## C. HICCUPPS(F) 一致性启发式 / Consistency heuristics

软件应当与以下任一项保持一致；**任何一处不一致，都是缺陷候选**：

| 字母 | 一致性对象 | 问句 |
| --- | --- | --- |
| **H**istory | 历史（同一功能的旧版本/旧行为） | 以前能做，现在为什么不能？ |
| **I**mage | 产品形象（品牌、宣传、截图） | 宣称的能力与实际一致吗？ |
| **C**omparable products | 同类产品 | 别的软件按这个键会发生什么？ |
| **C**laims | 明确宣称（文档、帮助、提示文案、tooltip） | 文案说会做的事，真的做了吗？ |
| **U**ser expectations | 用户期望 | 一个普通用户会期待它怎么表现？ |
| **P**roduct | 产品自身（内部一致） | 同一应用里同类操作是否一致？ |
| **P**urpose | 目的（这个功能存在的理由） | 它有没有完成它存在的目的？ |
| **S**tatutes / standards | 标准与法规（平台规范、无障碍标准） | 是否符合平台/合规要求？ |
| **(F)**amiliarity | 熟悉度（你自己/团队的实际使用感受） | 第一次用的人会不会觉得别扭？ |

---

## D. SFDIPOT 结构透镜 / Structural lenses

> 常被简写成 "SFDIPOT"，**漏掉了 Interfaces**；完整形式是 **SFDIPOT**（Bach《Heuristic Test Strategy
> Model》）。用法：对每个透镜问"这里能怎么坏"，再配一条 HICCUPPS 一致性预言（见上一节）——
> 每个格子至少一个探针。
> Often truncated to "SFDIPOT", which drops **Interfaces**; the full form is **SFDIPOT**.

| 透镜 Lens | 问句 Prompts |
| --- | --- |
| **S**tructure 结构 | 界面由什么组成（区域、控件、层级）？哪个结构在极端内容下会崩？ |
| **F**unction 功能 | 每个功能做什么、不做什么？边界条件是什么？ |
| **D**ata 数据 | 输入什么数据会坏（空、超长、非拉丁文、emoji、极端数值、重复）？ |
| **I**nterfaces 接口 | 界面之间、模块之间、与外部系统/文件/设备/剪贴板怎么交接？交接处最容易坏。 |
| **P**latform 平台 | 依赖什么（系统、分辨率、输入设备、权限、网络）？换一个会怎样？ |
| **O**perations 操作 | 用户会怎么用它（顺序、并发、重复、撤销、批量、中断）？ |
| **T**ime 时间 | 时间相关（超时、跨天、时区、夏令时、并发编辑冲突、长期使用）？ |

配套的质量判据（HTSM 的 CRUSPICSTMPL）：Capability 能力 / Reliability 可靠 / Usability 易用 /
Charisma 吸引力 / Security 安全 / Scalability 扩展 / Compatibility 兼容 / Performance 性能 /
Installability 可安装 / Development 可维护——挑相关的几项当检查表。

> 提醒：预言会失效（不一致 ≠ 缺陷）；写结论时**点明用的是哪条预言**，别用"不符合预期"这种同义反复。

---

## E. 巡游 Tours / Exploratory tours

Whittaker《Exploratory Software Testing》(2009) 把巡游按"城区"分组。**巡游是启发式的方向，
不是脚本**；每走完一条，在 `heuristics.md` 记一行：`巡游 → 区域 → 观察`。

### 商业区 Business District

| 巡游 Tour | 意图 Intent | 一句话脚本 Script |
| --- | --- | --- |
| 导览 Guidebook | 对照文档 | 按帮助/文档走一遍，文档与实物不一致的地方记下来 |
| 金钱 Money | 值钱的功能 | 专测"把产品卖出去"的那几个功能 |
| 地标 Landmark | 熟悉地形 | 找出每个界面的关键功能，用不同顺序反复走 |
| 知识 Intellectual | 最难输入 | 专挑能骗过校验的输入（最难、最刁） |
| 快递 FedEx | 追一个数据 | 让同一条数据穿过所有子系统：建→改→导→同步→删 |
| 打烊后 After-Hours | 后台工作 | 触发用户看不见的后台任务：备份、索引、同步、清理 |
| 拾荒者 Garbage Collector | 快速普查 | 快速把每个功能各点一遍，做一次广度体检 |

### 历史区 Historical District

| 巡游 | 意图 | 脚本 |
| --- | --- | --- |
| 危险街区 Bad Neighbourhood | 缺陷密集区 | 去历史上 bug 最多的模块，专测那里 |
| 博物馆 Museum | 遗留代码 | 只测长期没人动过的遗留功能与旧接口 |
| 旧版本 Prior Version | 回归 | 把上一版的测试在新构建上重跑一遍 |

### 娱乐区 Entertainment District

| 巡游 | 意图 | 脚本 |
| --- | --- | --- |
| 配角 Supporting Actor | 旁支变体 | 测相邻区域、本地化版本，而不是主角功能 |
| 后巷 Back Alley | 冷门路径 | 只走偏好设置、恢复、首次运行、隐藏菜单、右键菜单 |
| 通宵 All-Nighter | 长时间 | 让它跑很久：内存泄漏、超时、长任务中断 |

### 旅游区 Tourist District

| 巡游 | 意图 | 脚本 |
| --- | --- | --- |
| 收藏家 Collector's | 穷举输出 | 把一个功能的每种输出都拿一遍（各格式、各分辨率） |
| 孤独商人 Lonely Businessman | 最长路径 | 走最长、最绕、最费时的那条路径 |
| 超级名模 Supermodel | 只看界面 | 只挑视觉问题：规范、图标、文案、对齐、深浅色 |
| TOGOF | 资源竞争 | 开两个以上实例抢同一资源（同一文件、同一账号、同一设备） |
| 苏格兰酒吧 Scottish Pub | 真实在用的功能 | 找出用户真正在用的功能，确认它们被测过 |

### 旅馆区 Hotel District

| 巡游 | 意图 | 脚本 |
| --- | --- | --- |
| 下雨取消 Rained-Out | 中止长任务 | 启动长任务后取消/退出/Esc，看状态是否干净 |
| 沙发土豆 Couch Potato | 最省力 | 只用最少操作、默认值、只填必填项、纯鼠标 |

### 灰色地带 Seedy District

| 巡游 | 意图 | 脚本 |
| --- | --- | --- |
| 破坏者 Saboteur | 破坏环境 | 断资源、断网、拔设备、把磁盘塞满、强杀进程 |
| 反社会 Antisocial | 逆向使用 | 无效输入、错误顺序、错误格式、并发乱序操作 |
| 强迫症 Obsessive-Compulsive | 重复与错误路径 | 反复执行同一步骤与错误路径，直到出现异常 |

> **注意**：常被提到的 "Configuration Tour" 与 "Dirty Harry Tour" **不在**该书巡游索引与公开速查表里，
> 本插件不作为标准巡游引用（配置类与环境脏数据类覆盖，用"平台/数据透镜 + 反社会/破坏者巡游"代替）。
> The widely repeated *Configuration* and *Dirty Harry* tours are not in the book's tour index or the
> public cheatsheets; this plugin does not present them as canonical.

**记录与产出**：每次会话每条巡游记一行（巡游 → 区域 → 观察），跨会话维护覆盖矩阵；
巡游日志不是缺陷报告——**发现要单独落盘成 finding**。

---

## F. 无障碍作为模拟轴 / Accessibility as a simulation axis

无障碍是**唯一"合法的模拟用户"**：一个真人按公开标准采用一种交互模式，步骤可复现、判据可引用。

### F.1 仅键盘走一遍（12 步）/ Keyboard-only pass

依据 WebAIM 键盘可达性指南与 WCAG 2.2（2.1.1 键盘、2.1.2 无键盘陷阱、2.4.3 焦点顺序、
2.4.7 焦点可见、**2.4.11 焦点不被遮挡**〔2.2 新增〕、**2.5.7 拖拽动作**〔2.2 新增，需提供
非拖拽的单指针替代〕）：

1. **物理上把鼠标收起来**（不是"尽量不用"）。
2. `Tab` 前进 / `Shift+Tab` 后退走完整页；每一站都要有**可见**焦点指示；不许有 `outline:0`。
3. 焦点顺序应与视觉顺序一致（左→右、上→下）；`tabindex ≥ 1` 是否把顺序搞乱了。
4. 激活：链接用 `Enter`；按钮 `Enter` **或** `Space` 都要能用。
5. 复选框用 `Space`；单选组用方向键移动、`Space` 选中、`Tab` 离开整组。
6. 下拉选择：方向键移动、`Space` 展开、`Enter`/`Esc` 选择并收起。
7. 复合控件（菜单、树、标签页）用方向键 + `Home`/`End`；滑块用方向键 + `PageUp`/`PageDown`。
8. `Esc` 关闭对话框/菜单并释放焦点；关闭后焦点应回到打开它的控件。
9. 试"跳到主内容"链接与标题/地标导航。
10. **专找陷阱**：Tab 进去以后，确认能否用 Tab/方向键/`Esc` 出来；出不来就是 2.1.2 失败。
11. 移动端接外接键盘再试一遍。
12. 焦点指示弱或被遮挡时，**截一张图**（粘性页脚挡住焦点是 2.4.11 的典型失败）。

### F.2 屏幕阅读器 / Screen readers

视障用户的消费方式是**线性且语义化**的（标题 → 地标 → 列表 → 表单），常常感知不到布局、
颜色和空间邻近；焦点顺序与朗读顺序可能不同；**被朗读的是可访问名称，不是可见文字**。

| 平台 | 键位要点 | 必查 |
| --- | --- | --- |
| macOS VoiceOver | `VO = Control+Option`；`VO+U` 打开转子（标题/链接/表单/地标）；`VO+Shift+↓` 进入组，`VO+Shift+↑` 退出 | 标题层级是否真实（不是样式冒充）；进入/退出嵌套组是否错乱；表单标签与错误是否被朗读 |
| iOS VoiceOver | 两指旋转 = 转子；右/左滑 = 下/上一项；双击 = 激活；三指滑 = 滚动 | 每个控件有标签+角色+提示；朗读顺序与视觉一致；弹窗/警告会被朗读；自定义手势有替代 |
| Windows NVDA | `NVDA+Space` 浏览/焦点模式切换；`H` 标题 `K` 链接 `D` 地标 `F` 表单字段 `B` 按钮；`NVDA+F7` 元素列表 | 角色/状态/标签是否朗读；实时区域与 toast 是否播报；换浏览器复测 |
| Windows Narrator | `Caps Lock+Space` 扫描模式；`Caps Lock+F7` 元素列表 | 扫描模式下导航、退出后输入是否正常 |

> **观察记录必须包含"听到什么"，不只是"看到什么"**：一个缺陷可能在画面上不存在、在耳朵里震耳欲聋。
> The log must record **what was heard**, not only what was seen.

---

## G. 风险排序与抽样 / Risk ranking and sampling

```text
风险分 = 影响面（多少人物/场景受影响） × 概率（多容易出现） × 不可检测性（错了能不能马上发现）
```

先测前 20% 风险最高的区域；P0 全量、P1 抽样 50%、P2 每类至少 1 条、P3 只跑视觉基线。
抽样规则**写进计划**，事后不得更改（改了就是选择偏差）。

---

## H. 扫描记录纪律 / Sweep discipline

- 每条结论：`启发式/巡游` + `适用处（界面+元素）` + `结论（通过/违反/未验证）` + `证据文件`。
- 同一条发现只能归到一个"根因"；如果一个界面里同一个根因造成 5 处违反，写成 1 条 + 5 个复现点。
- 不许写"整体不够友好"这类无法指认的结论。
- 扫描完成率要报数：14 条巡游里实际走了几条、10 项启发式里哪几项未验证。

**出处与链接见 [SOURCES.md](SOURCES.md)。**
