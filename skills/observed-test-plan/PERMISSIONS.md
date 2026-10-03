# 权限清单与授予路径 / Permissions and Where to Grant Them

> 本方法只需要**捕获（看）**权限，**永远不需要控制（动）权限**。
> This method needs **capture (read)** permission and **never** control (inject) permission.
>
> 如果某个工具要求"辅助功能/输入监控/自动化"权限才能工作，那它超出了本方法的需要，不要授予。
> If a tool asks for accessibility, input-monitoring or automation permission, it exceeds what this
> method needs. Do not grant it.

---

## 一、需要向用户确认的权限 / Permissions to confirm with the user

| 权限 Permission | 必需 Required | 用途 Purpose | 被拒时 If denied |
| --- | --- | --- | --- |
| 鼠标操作 Mouse | 必需 | 一切界面操作 | 无法测试 |
| 键盘操作 Keyboard | 按级别 | L2/L3 的输入与导航 | 只跑 L1，L2/L3 记"未覆盖" |
| 屏幕录制 Screen recording | 与截屏二选一 | 过程、时序、动效、误触发 | 改用逐步截屏，报告注明"无连续录屏" |
| 截屏 Screenshot | 与录屏二选一 | 单点状态与元素细节 | 无法取证 → 停止测试 |
| 麦克风 Microphone | 建议 | 口述操作、对齐录屏时间点 | 改由操作者手写时间点 |
| 数据边界 Data boundary | 必需 | 避免把隐私录进证据 | 无法保证合规 → 缩小范围或停止 |

---

## 二、macOS

1. **系统设置 → 隐私与安全性 → 屏幕录制**：勾选运行 Harness / 终端 / 录屏工具的应用。
   授予后**需要重启该应用**才生效。
2. **麦克风**：系统设置 → 隐私与安全性 → 麦克风（要口述解说时）。
3. **不需要**：辅助功能（Accessibility）、输入监控（Input Monitoring）、自动化（Automation）。
   如果你发现被测机器上这些权限给了非必要应用，收回它们。
4. 光标：`screencapture -v` 录屏默认包含光标；QuickTime 录屏也含。若不含，必须用截屏补记指针位置。
5. 试拍验证：

```bash
node scripts/capture.mjs check
node scripts/capture.mjs shot "<session>" --label permission-probe
```

首次执行会触发系统权限提示；若返回黑屏或纯桌面图，说明权限未授予或未重启应用。

---

## 三、Windows

1. **设置 → 隐私和安全性 → 屏幕截图和录制**：允许应用访问屏幕。
2. **游戏栏 / Xbox Game Bar**：设置 → 游戏 → Xbox Game Bar 打开；`Win+G` 由**人手动**触发录制。
3. **麦克风**：设置 → 隐私和安全性 → 麦克风。
4. **不需要**：UI Automation 控制、`SendInput` 类自动化权限；不要安装/运行自动化框架。
5. 只读截屏验证：`node scripts/capture.mjs shot "<session>" --label permission-probe`
   （走 PowerShell `System.Drawing` 只读截屏，不注入输入）。
6. 若桌面是远程会话（RDP），画面与真机不同，必须在报告里注明。

---

## 四、iPhone / iPad（iOS / iPadOS）

1. **真机指纹/密码解锁**，并在设备上信任用于录制的电脑（如用 QuickTime 连续互通录制）。
2. **控制中心 → 屏幕录制**：按住录制按钮可选择是否开启麦克风；开始前确认要录的是整块屏。
3. **模拟器**：`xcrun simctl io booted screenshot` / `recordVideo` 需要 Xcode 命令行工具，不需要额外授权。
4. **不必开**：开发者模式（仅当测试你自己的构建、需要安装包时才用，且要写进报告）。
5. 人用手操作真机；模拟器上人用**真实鼠标**点击模拟器窗口——这不是注入。
6. 注意 DRM 内容在录制时可能黑屏，这不是缺陷，报告里注明。
7. 横竖屏、分屏、动态字体大小属于环境变量，测试前固定并记录。

---

## 五、Android 与其他设备 / Android and others

1. `adb exec-out screencap -p`（截屏）、`adb shell screenrecord`（录屏）为只读捕获，允许。
2. **禁止** `adb shell input ...` 与任何自动化驱动（见 `observed-ui-test` 技能的 BANNED-INPUTS.md）。
3. 电视/车机/手表：用厂商投屏或采集卡做只读录制，遥控器与触摸由人操作。

---

## 六、英文问卷 / The English questionnaire

```text
Before the observed UI test starts, please confirm:

[Input]
1. Mouse: may I base findings on your real mouse actions? (yes / no)
2. Keyboard: allowed, and up to which mode?
   A. Mouse only (L1)
   B. Mouse + keyboard, shortcuts forbidden (L2)
   C. Mouse + keyboard + shortcuts (L3)

[Capture]
3. Screen recording: allowed? Include the cursor? (yes / no; with / without cursor)
4. Screenshots: allowed as evidence at any time? (yes / no)
5. Microphone: allowed for spoken narration to line up the recording timeline? (yes / no)
6. OS capture permission:
   macOS: System Settings -> Privacy & Security -> Screen Recording (restart the app after granting)
   Windows: Settings -> Privacy & security -> Screenshots and recording / Game Bar
   iPhone/iPad: Control Centre screen recording (press and hold for the microphone)
   Which will you grant?

[Scope]
7. App under test: name, version, platform, devices (macOS / Windows / iPhone / iPad / other)
8. Scope: which features are in, which are explicitly out
9. Data boundary: which account/data; what must never appear in a recording (names, phone numbers,
   keys, production data)
10. Exit criteria: what makes us stop immediately (crash, data loss, privacy leak, production damage)

[Compliance]
This test uses no internal pointer directives: no injected pointer, touch or key events, no UI
automation drivers, no calls into the software's internals. Input comes only from your real
peripherals; evidence comes only from screen recording and screenshots. Do you confirm? (yes / no)
```
