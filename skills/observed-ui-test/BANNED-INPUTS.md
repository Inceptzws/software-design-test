# 禁止使用的内在指针指令 / Banned Internal Pointer Directives

> **R1 是最高优先级的规则，任何级别（L1/L2/L3）都不放开。**
> **R1 outranks everything and is never relaxed, at any mode.**
>
> "内在指针指令"= 任何绕过人的真实外设、在程序内部合成指针/触摸/按键事件，或直接调用软件内部
> 句柄、接口、脚本来触发功能的指令。
> An "internal pointer directive" is any instruction that bypasses the human's real peripherals to
> synthesize a pointer, touch or key event inside the program, or that invokes the software's own
> internal handles, APIs or scripting to trigger a feature.

---

## 一句话判据 / The one-line test

> 这条指令，是一个**人用手**就能做出来的动作吗？如果不是，或者它让软件在**没有人的手**参与下
> 动了，就不能用。
>
> Could a human produce this action with their hands? If not — or if it makes the software move with
> no human hand involved — it is banned.

---

## 全平台通用禁止 / Banned everywhere

| 类别 Class | 例子 Examples |
| --- | --- |
| 指针/触摸/按键注入 | 合成鼠标移动、点击、触摸、滑动的任何 API |
| 自动化框架驱动 | 用测试框架把点击"打进"被应用（UI 自动化、录制回放、RPA、宏脚本） |
| 内部句柄调用 | 直接触发控件动作、调用应用内部命令、写数据库/配置文件来达到界面效果 |
| GUI 智能体代操作 | 任何"computer use / GUI agent"把鼠标键盘事件发给系统的能力 |
| 软件宏/脚本快捷键 | AutoHotkey 脚本、AppleScript 按键脚本、键盘宏软件（硬件宏需申报，见下） |
| 用代码"证明"UI | 打开 DOM 检查器/调试器/代码来判定界面是否正确（这会破坏 R2 的证据链） |

---

## macOS

**禁止 / Banned**

| 指令 Directive | 为什么 Why |
| --- | --- |
| `CGEventCreateMouseEvent` / `CGEventPost` / `CGEventPostToPid` | 内核事件注入，合成点击 |
| `CGWarpMouseCursorPosition` / `CGAssociateMouseAndMouseCursorPosition` | 程序移动光标 |
| `IOHIDPostEvent` / `hidutil`（用于发事件时） | HID 层注入 |
| `cliclick`、`mouseclick`、`xdotool` 类工具 | 命令行合成输入 |
| `osascript -e 'tell application "System Events" to click at {x, y}'` | 系统级合成点击 |
| `System Events` 的 `keystroke` / `key code` / `perform action "AXPress"` | 合成按键与内部动作调用 |
| Accessibility API：`AXUIElementPerformAction(kAXPressAction)` | 直接调用控件内部动作 |
| XCTest / XCUITest：`XCUIElement.tap()`、`typeText()` | 测试框架合成触摸 |
| `osascript -e 'tell application "App" to ...'` 触发业务功能 | 调用应用内部脚本接口代替界面操作 |
| 浏览器 DOM：`el.click()`、`dispatchEvent(new MouseEvent(...))`、CDP `Input.dispatchMouseEvent`、Playwright/Puppeteer/Selenium 的 `click()` | 绕过真实指针 |

**允许 / Allowed**

- 人用鼠标、触控板、外接键盘操作；人用手指/触控笔在 iPhone/iPad 上操作。
- 只读捕获：`screencapture -x`（截屏）、`screencapture -v`（录屏）、QuickTime 录屏、OBS 录屏。
- 只读观测线索：日志窗口、活动监视器（只作为线索，不能作为结论）。
- 环境准备（测试开始**前**完成，并在报告里记录）：切换深色模式、分辨率、缩放、辅助功能键盘。
- `osascript` 读取窗口标题/版本号等**环境元数据**可以，但不得用于触发任何功能。

---

## Windows

**禁止 / Banned**

| 指令 Directive | 为什么 Why |
| --- | --- |
| `SendInput` / `mouse_event` / `keybd_event` | Win32 合成输入 |
| `SetCursorPos` | 程序移动光标 |
| `PostMessage` / `SendMessage` 发 `WM_LBUTTONDOWN`、`WM_COMMAND`、`WM_KEYDOWN` | 直接给窗口投递内部消息 |
| UI Automation `InvokePattern.Invoke()` / `TogglePattern` / `SetValue` | 调用控件内部动作 |
| PowerShell `[System.Windows.Forms.SendKeys]::SendWait()`、`[System.Windows.Forms.Cursor]::Position`、`WScript.Shell SendKeys` | 脚本合成输入 |
| AutoHotkey / RPA / WinAppDriver / Appium Windows 驱动 | 自动化框架驱动界面 |
| `nircmd`、宏软件 | 合成输入 |

**允许 / Allowed**

- 人用鼠标与键盘操作。
- 只读捕获：Xbox Game Bar（`Win+G`，由人手动按）、OBS、Windows 截图工具、PowerShell 的
  `System.Drawing` 只读截屏（`capture.mjs` 走这条路）。
- 环境准备（测试前）：缩放比例、深浅色、区域设置。

---

## iPhone / iPad（iOS / iPadOS）

**禁止 / Banned**

| 指令 Directive | 为什么 Why |
| --- | --- |
| XCUITest `XCUIElement.tap()` / `typeText()` / 录制回放 | 合成触摸 |
| `idb ui tap` / `fb-idb` / Appium / WebDriverAgent | 合成触摸与按键 |
| 任何"远程控制设备"工具用脚本注入触摸（含 scrcpy 类工具的控制模式） | 合成触摸 |
| 用 `simctl` 修改应用内部状态来"制造"通过结果 | 内部句柄调用 |

**允许 / Allowed**

- 人用手指、触控笔、外接键盘鼠标在真机上操作。
- 模拟器：人用**真实鼠标**点击模拟器窗口（这是真实指针，不是注入）。
- 只读捕获：`xcrun simctl io booted screenshot` / `recordVideo`、控制中心的屏幕录制、
  QuickTime + 连续互通录制真机屏幕。
- 环境准备（测试前，写进报告）：`xcrun simctl` 设定外观明暗、语言区域、状态栏覆盖、
  启动/安装被测应用、`simctl openurl` 建立前置页面。**这些只用于建立前置状态，
  测试过程中不得用来代替人在界面上的操作。**

---

## 其他交互设备 / Other interactive devices

| 设备 Device | 禁止 Banned | 允许 Allowed |
| --- | --- | --- |
| Android 手机/平板 | `adb shell input tap/swipe/text/keyevent`、`monkey`、uiautomator、Espresso、Appium、scrcpy 控制模式 | 手指操作；`adb exec-out screencap -p` 只读截屏；`screenrecord` 只读录屏 |
| 电视/车机/手表 | 任何 SDK 注入遥控或触摸事件的接口 | 人用真实遥控器/触摸/旋钮操作；只读投屏与截屏 |
| 网页应用 | `el.click()`、合成事件、浏览器自动化框架 | 人用真实鼠标键盘；只读截屏工具 |

---

## 硬件宏与"看起来合规"的灰色地带 / Grey areas

| 情况 Case | 结论 Verdict |
| --- | --- |
| 硬件宏键盘（宏在键盘固件里，发出真实 HID 事件） | **可以，但必须在报告里申报**：它降低了"人手操作"的证据强度 |
| 软件宏（AutoHotkey、BetterTouchTool 宏、脚本快捷键） | **禁止** |
| 无障碍"鼠标键""粘滞键"等由人操作的系统辅助 | 可以，需申报；它们改变的是人的操作方式，不是注入 |
| 录屏软件自带的"点击高亮/自动操作"叠加功能 | 高亮可以，自动操作禁止 |
| 用剪贴板预置内容 + 菜单粘贴 | 在 L1 允许，剪贴板内容必须在测试前由人准备 |
| 用开发者工具/代码判断界面是否正确 | 禁止作为结论；可作为怀疑线索，但必须用画面确认 |

---

## 违规自检 / Self-check before you start

1. 被测机器上是否开着自动化工具、宏软件、按键精灵类程序？→ 全部退出。
2. macOS 的"辅助功能"权限是否给了任何非必要应用？→ 收回（本方法不需要辅助功能权限）。
3. 浏览器是否开着自动化调试端口/自动化扩展？→ 关闭。
4. 会话计划里是否出现了被禁指令的名字？→ 删掉，改写成人的操作步骤。
5. 插件的脚本是否只做只读捕获？→ `node scripts/verify.mjs` 会自动扫一遍，
   确保包内不存在被禁的输入 API。

If any automation tool, macro utility or accessibility control grant is active, close it first. This
method needs **capture** permission only — never control/injection permission.

## 让守门器替你盯 / Let the watchdog watch

"我们没用注入"这句话，要让机器留痕，而不是靠自觉。插件自带 `guard.mjs`，
它**观察**注入指令、从不**执行**注入（纯只读进程表扫描 + 文本扫描）：

```bash
node scripts/guard.mjs scan  <session>                       # 测试前：扫描 + 落盘
node scripts/guard.mjs watch <session> --seconds 600         # 测试中：后台盯着
```

- 命中会写进 `evidence/compliance.jsonl`，并在报告第 8 节汇总。
- 它同时扫描 `matrix.md` / `elements.md` / `findings.jsonl`，若步骤里写了被禁指令名字，会直接标出来。
- 它只能给出线索，不能证明"绝对没有注入"；有线索时人工确认，并**重跑受影响的用例**。

Let the machine leave a trace instead of trusting good intentions. `guard.mjs` observes injection
directives and never performs one; hits land in `evidence/compliance.jsonl` and in section 8 of the
report. It produces leads, not proof of absence — confirm by hand and re-run affected cases.
