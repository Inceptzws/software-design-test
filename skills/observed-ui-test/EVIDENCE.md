# 取证协议 / Evidence Protocol

> 画面是唯一证据。取证的目标不是"拍下来"，是"让另一个人看到你看到的那个元素"。
> The picture is the only evidence. The goal is not "take a picture" — it is "let another person see
> the element you saw".

---

## 1. 两种证据 / Two kinds

| 类型 Kind | 用途 Use | 要求 Requirement |
| --- | --- | --- |
| 屏幕录制 Screen recording | 过程、时序、反馈、动效、卡顿、误触发 | 连续、含光标、含系统时间；操作者口述动作与时间点 |
| 截屏 Screenshot | 单点状态、元素细节、对比（前/后、L1/L2/L3） | 含窗口全貌与系统时间；必要时再拍一张放大局部 |

**录屏与截屏至少要有一个**，否则本方法无法进行（无画面 = 无证据 = 只能记为未验证）。

---

## 2. 命名与时间 / Naming and time

```text
evidence/<UTC或本地时间>-<用例ID>-<级别>-<前|后|异常>-<平台>.png
例：evidence/2026-10-04T093012-L1-07-L1-after-macos.png
```

- 一条缺陷至少一张图；跨模式差异至少两张（不同级别的同一状态）。
- 录屏要记住时间点（`mm:ss`），写进缺陷的"证据"字段。
- 报告里引用证据时用**相对路径**，方便整个会话目录一起交付。

---

## 3. 一张合格的截图 / What a usable screenshot must show

- **完整上下文**：看得见窗口标题、所在界面、周围的关键控件。
- **元素本身**：要看的是哪个按钮/输入框/列表，就在画面里清晰可辨（必要时补一张局部特写）。
- **状态可见**：悬停态、焦点环、禁用态、错误提示——要拍到它们**出现的那一刻**。
- **时间可见**：菜单栏时钟或状态栏时间在画面内。
- **不含敏感信息**：真实姓名、手机号、邮箱、密钥、生产数据要打码或改用测试数据。

**不合格 / Rejected**：只有一行报错文字没有界面；只拍了一角不知道是哪个界面；
照片糊到看不清字形；用代码截图（终端里的 HTML/JSON）冒充界面证据。

---

## 3.5 采样纪律 / Sampling discipline

**只靠固定间隔看画面，一定会漏掉一闪而过的状态**（toast、短暂错误、瞬间的禁用态）。
GUI 智能体的"截图翻页"方法有同样的已知盲区。所以：

- 全程录屏 + **每次点击前后各补一张静帧**（事件触发采样）。
- 关键状态（加载、成功、错误、禁用）出现时立刻截图，不要等它消失。
- 用屏幕阅读器时，**记录"听到什么"**——有些缺陷在画面上不可见、在耳朵里才成立。

> Fixed-rate recording plus event-triggered stills around every click. Record what is **heard** as
> well as what is seen; a defect can be invisible on screen and obvious in the ear.

---

## 4. 只用什么工具取证 / Capture tooling that is allowed

只读捕获，永远不注入输入 / read-only capture only:

```bash
node scripts/capture.mjs check                      # 看本机有哪些只读捕获工具
node scripts/capture.mjs shot  <session> --label L1-07-after
node scripts/capture.mjs record <session> --label L1 --seconds 60
```

- macOS：`screencapture -x`（静默截屏）、`screencapture -v`（录屏，可含光标）
- Windows：只读截屏（PowerShell `System.Drawing`）、Xbox Game Bar / OBS 录屏（人手动触发）
- iPhone/iPad：`xcrun simctl io booted screenshot|recordVideo`、控制中心屏幕录制、
  QuickTime 连续互通（真机）
- Android：`adb exec-out screencap -p`、`adb shell screenrecord`

**取证期间**：录制屏幕本身就要求系统权限，见 `observed-test-plan` 的 `PERMISSIONS.md`。
录屏若不含光标，必须额外用截屏记录指针位置，并在报告里注明"录屏无光标"。

---

## 5. 观察者怎么读图 / How the observer reads a picture

Agent 用 `read_image` 打开截图，然后**逐元素描述你实际看到的像素**：

1. 这是什么界面？标题栏写了什么？
2. 清单里的每个元素：在不在？长什么样？有没有异常（破图、错位、缺字、被裁、重叠）？
3. 状态：哪个元素是选中的？焦点环在哪？有没有错误提示？文字写的是什么？
4. 与期望的差异：差在哪，用画面上可指认的位置描述（"右上角齿轮按钮的图标缺失，只剩一块灰底"）。

描述纪律 / Discipline:
- 不写"应该是"、"大概"、"通常"；写"图中可见 / 图中不可见"。
- 看不清就说看不清，标为"证据不足"，不要补脑。
- 不把日志或代码结论写进画面观察结论里。

---

## 6. 证据不足时 / When evidence is insufficient

| 情形 Case | 处理 Action |
| --- | --- |
| 图糊/被裁 | 重拍，或补拍特写；重拍不了就标"证据不足" |
| 现象一闪而过 | 用录屏 + 慢放定位，或让操作者复现一次再拍 |
| 权限不允许录屏 | 用法逐步截屏替代，报告首页写明"无连续录屏" |
| 现象无法复现 | 记"疑点（待复现）"并写出怀疑依据与当时的观察 |
| 只能看到结果看不到过程 | 明确写"结果可见，过程未观察到" |

---

## 7. 留证边界 / Boundaries

- 证据只存本次会话目录，不外传；交付时整目录给用户。
- 涉密/隐私内容默认不录；必须先问用户哪些界面不能录。
- 录屏文件可能很大，会话结束前问用户是保留原视频还是只留关键帧。
