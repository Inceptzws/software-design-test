# 三级操作模式 / The Three Input Modes

> L1 仅鼠标 → L2 鼠标+键盘（禁快捷键）→ L3 鼠标+键盘+快捷键。
> Mouse only → mouse + keyboard without shortcuts → with shortcuts.
>
> 每一级都要跑**同一批用例**。差异就是结论。/ Run the same cases at every level. The difference
> is the finding.

---

## L1 · 仅鼠标 / Mouse only

**允许 Allowed**

| 动作 Action | 说明 Notes |
| --- | --- |
| 移动、悬停 move / hover | 含等待悬停提示出现 |
| 单击、双击 click / double-click | 左右键都算 |
| 右键与上下文菜单 right-click / context menu | 上下文菜单是鼠标路径的一部分 |
| 拖拽 drag | 含拖到边缘、拖出窗口、拖到无效区域 |
| 滚轮/触控板滚动 scroll | 含横向滚动、惯性滚动 |
| 菜单栏与工具栏点击 menu bar / toolbar click | 走菜单完成命令 |
| 用「编辑 → 粘贴」配合**测试前已预置**的剪贴板 | 剪贴板内容由操作者在测试前准备好，L1 期间不再改动 |
| 屏幕键盘（若已开启）on-screen keyboard | 用鼠标点屏上按键；开启动作在测试前完成并记录 |
| iPhone/iPad 上的手指/触控笔操作 | 手指就是手指；模拟器上则是真实鼠标点击模拟器窗口 |

**禁止 Forbidden**

- 任何物理键盘输入，包括 Tab 焦点导航、方向键、Enter。
- 一切修饰键组合。
- 内部指针指令（R1 永久生效）。
- 用剪贴板以外的"系统侧注入"来填内容。

**能抓到的缺陷 / Defects this level catches**

- 功能只能靠快捷键或键盘才能到达（无鼠标可达路径）。
- 命中区域小于视觉外观，或视觉上像按钮实际不可点。
- 必须悬停才可发现的控件在触屏/无悬停设备上不可用。
- 上下文菜单缺项、菜单项灰掉且无解释。
- 滚动容器卡住、拖拽无反馈、拖拽后状态回弹。

---

## L2 · 鼠标 + 键盘，禁止快捷键 / Mouse + keyboard, no shortcuts

**允许 Allowed（在 L1 之上新增）**

| 键 Keys | 允许原因 Why |
| --- | --- |
| 字母/数字/符号输入 character input | 这是"输入"，不是捷径 |
| Enter / Return | 表单提交的基础路径 |
| Tab / Shift+Tab | 焦点导航本身就是要测的对象 |
| 方向键 arrows | 列表与光标导航 |
| Backspace / Delete | 编辑文本 |
| 空格 space | 文本输入与（在有焦点时）激活控件 |
| Home / End / PageUp / PageDown | 视图导航，不触发命令 |
| Shift（仅用于输入大写字母与上档符号） | 不触发命令 |

**禁止 Forbidden（在 L1 的基础之上新增）**

- 一切修饰键组合：`⌘/Cmd`、`Ctrl`、`⌥/Option/Alt`、`Win`、`Shift+字母` 以外的组合，
  例如 ⌘C、⌘V、⌘S、⌘Z、Ctrl+F、Shift+点击（若该软件把它定义为命令）。
- 功能键 `F1`–`F12`（含"帮助""重命名""刷新"等）。
- 把 `Esc` 当作"取消/关闭/退出"的命令加速键使用。
- 仍然禁止内部指针指令。

> 边界说明 / Boundary note：`Shift+点击` 这类**指针手势**是否允许由测试计划预设并写清。
> 默认在 L2 允许（它一般不触发命令），在报告里注明即可。
> Whether a modifier + pointer gesture counts as a shortcut is decided in the plan and written down.
> Default: allowed at L2 because it usually triggers no command.

**能抓到的缺陷 / Defects this level catches**

- 键盘导航断链：Tab 走到一半跳回，或永远走不到某个控件。
- 焦点环缺失、错位、被裁剪，或焦点落在不可见元素上。
- 焦点陷阱：弹窗里 Tab 出不去，或 Tab 跑到弹窗背后。
- Tab 顺序与视觉顺序不一致。
- 表单用键盘提交时错误提示不可达、不被读出。
- 空格/Enter 在某控件上触发错误动作。

---

## L3 · 鼠标 + 键盘 + 快捷键 / Full input

**允许 Allowed**：L1 + L2 全部，加上修饰键组合与功能键。

**仍然禁止 Still forbidden**：内部指针指令（R1 任何级别都不放开）、用脚本或宏代替人工操作。

**特有要求 / Extra requirement**

每条功能至少走两条路径，并比对结果一致性 / Every feature must be exercised through at least two
paths, and the results compared:

```text
路径 A：菜单/工具栏/鼠标完成        → 结果 R_A
路径 B：快捷键完成                  → 结果 R_B
判定：R_A 与 R_B 的界面结果、数据结果、状态是否一致
```

**能抓到的缺陷 / Defects this level catches**

- 快捷键无效、被系统或其他应用抢占、与菜单显示的快捷键不一致。
- 快捷键在特定上下文（输入框聚焦、弹窗打开）误触发。
- 两条路径结果不一致（菜单路径保存成功，快捷键路径静默失败）。
- 快捷键在非英语键盘布局下失效。
- 快捷键提示在 UI 上写错（显示 ⌘S 实际是 ⌘⇧S）。

---

## 升降级规则 / Escalation rules

```text
默认：先跑完全部用例的 L1，再跑全部用例的 L2，再跑全部用例的 L3。
例外：某用例在 L1 发现缺陷 → 在 L2、L3 立即复现一次并登记"是否跨模式复现"。
降级：用户未授权键盘 → 只跑 L1，L2/L3 全部标"未覆盖（无键盘权限）"。
降级：设备不支持该模式（如 iPhone 无外接键盘）→ 标"不适用（设备限制）"，不要臆测结果。
```

```text
Default: all cases at L1, then all at L2, then all at L3.
Exception: a case that fails at L1 is immediately re-run at L2 and L3 and tagged "reproduces across
modes?".
Degrade: no keyboard permission → L1 only, L2/L3 marked "not covered (no keyboard permission)".
Degrade: the device cannot support the mode (an iPhone with no external keyboard) → mark "not
applicable (device limitation)". Never guess the result.
```

## 禁止"聪明的替代" / No clever substitutes

- 不许用"我先用快捷键做完，再补一次鼠标点击"来伪造 L1 结果。
- 不许用"在开发者工具里点一下"代替真实点击。
- 不许把未执行的模式标成通过。
- 不许在测试中途改变操作模式来绕过卡住的步骤；卡住本身就是一条缺陷。

Do not fake L1 by shortcut-then-clicking afterwards; do not click through a developer console instead
of the real UI; never mark an unexecuted mode as passed; never change modes mid-case to get unstuck —
being stuck is itself the finding.
