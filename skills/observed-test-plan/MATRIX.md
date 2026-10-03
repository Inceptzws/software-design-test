# 元素清单与用例矩阵 / Inventory and Case Matrix

---

## 一、元素清单 / Element inventory

来源只有一个：**截图上的像素**。/ One source only: the pixels in a screenshot.

| 字段 Field | 说明 Notes |
| --- | --- |
| ID | `E-01` 顺序编号 |
| 界面 Surface | 元素所在的界面/窗口/页面 |
| 元素 / 工具 Element / tool | 用画面上的名字（按钮上的文字、图标含义） |
| 类型 Type | 按钮/输入框/菜单/工具栏/列表/表格/滚动区/弹窗/开关/选择器/状态提示/画布工具/导航 |
| 期望状态 Expected states | 默认·悬停·按下·选中·禁用·加载·错误·空（缺一不可） |
| 是否常用 Common? | 决定优先级 |
| 证据 Screenshot | 该元素所在的截图文件名 |

英文对照表头 / English header:

```text
ID | Surface | Element / tool | Type | Expected states | Priority | Evidence
```

**反例 / Anti-pattern**：清单里出现"`onSubmit()` 函数"、"`/api/export` 接口"、"`users` 表"——
这些不是画面元素，说明你去看代码了。删掉。

---

## 二、用例模板 / Case template

```text
用例 ID：C-012
标题 / Title：导出当前画布为 PNG
元素 / Element：E-07 工具栏「导出」按钮
平台 / Platform：macOS 14.5 · 1920x1080 · 100% · 浅色
前置 / Preconditions：已打开示例工程 sample-01；无未保存修改
模式 / Mode：L1 仅鼠标
步骤 / Steps：
  1. 移动鼠标到工具栏「导出」按钮，悬停 1 秒，观察是否出现提示
  2. 单击
  3. 等待导出面板出现（最多 5 秒）
期望（画面）/ Expected (on screen)：
  - 出现模态面板，标题为「导出」；默认选中 PNG；有取消与确认按钮
  - 悬停时按钮有可见的悬停态；点击时有按下态反馈
证据 / Evidence：前后各一张截图 + 录屏 mm:ss
结果 / Result：通过 / 失败 / 未验证
```

**期望结果的写法 / How to write expectations**：写成"画面上能看见什么"。
"数据写入成功"不合格；"列表首行出现名为 sample-01 的条目，且状态列显示『已同步』"才合格。

---

## 三、矩阵 / The matrix

```text
C-012｜E-07 导出按钮｜L1｜P0｜macOS
C-012｜E-07 导出按钮｜L2｜P1｜macOS
C-012｜E-07 导出按钮｜L3｜P1｜macOS
C-020｜E-11 同步开关｜L1｜P0｜iPhone
C-020｜E-11 同步开关｜L2｜P2｜iPhone（需外接键盘，若无则记"不适用"）
```

裁剪规则 / Trimming: 不常用的元素（P3）在 L2/L3 可以只跑一次基线；
但 **P0/P1 必须三级全跑**，因为它们的跨模式差异最有价值。
P0/P1 must run at all three modes; their cross-mode difference is the highest-value output.

---

## 四、优先级 / Priority

| 级别 | 含义 | 举例 |
| --- | --- | --- |
| P0 | 主流程，跑不通软件就没法用 | 打开工程、保存、导出、登录 |
| P1 | 常用功能与数据正确性 | 列表增删改、搜索、同步、设置生效 |
| P2 | 边缘与异常 | 空输入、超长文本、无权限、离线、快速重复点击、窗口缩放、iPad 旋转 |
| P3 | 打磨与一致性 | 动效、间距、深色模式配色、文案、跨端一致性 |

---

## 五、覆盖率怎么算 / Coverage arithmetic

```text
元素覆盖率 = 已执行用例覆盖的元素数 / 清单元素总数
模式覆盖率 = 每元素实际执行的模式数 / 计划模式数
平台覆盖率 = 实际测过的平台数 / 计划平台数
用例执行率 = 已执行 / 计划
```

报告里必须给出这四个数，并列出未覆盖项与原因。/ Report all four, with uncovered items and reasons.

---

## 六、抽样策略（用例太多时）/ Sampling when the matrix explodes

1. 先跑**每类元素各一个代表**的冒烟集（10–20 条），找出会崩的地方。
2. P0 全量，P1 抽样 50%，P2 每类至少 1 条，P3 只跑视觉基线。
3. 抽样规则必须写在计划里，事后不能改（改了就是选择偏差）。
