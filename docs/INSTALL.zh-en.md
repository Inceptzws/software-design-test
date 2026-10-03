# 安装说明 / Installation

> 中英对照：每段中文后跟 `> EN:` 英文。 / Bilingual: each Chinese block is followed by `> EN:`.
>
> 插件名 `software-design-test` · 类型：DSH bundle 插件 · 零依赖、零构建、零网络依赖。
> Package `software-design-test` · a DSH bundle plugin · zero dependencies, no build step.

---

## 0. 前置条件 / Prerequisites

需要装好 DeepSeek Harness（`dsh` 命令可用），并且知道要装进哪个 profile：桌面版一般是 `desktop`。
运行插件自带的脚本需要 Node.js ≥ 20.11（Harness 自带运行时即可）。

You need a working DeepSeek Harness (`dsh` on PATH) and the profile name — the desktop app uses
`desktop`. The bundled scripts need Node.js ≥ 20.11, which the Harness runtime already provides.

```bash
node -v                 # 需要 >= 20.11 / requires >= 20.11
dsh --help              # 确认 dsh 可用 / confirm dsh works
```

---

## 1. 从本地目录安装（推荐）/ Install from a local checkout (recommended)

插件就在本机的工作区里，用 `link:` 直接挂载，改动即时生效、不需要发布：

The plugin sits in this machine's workspace; `link:` mounts it directly, so edits take effect without
publishing:

```bash
dsh plugin --profile desktop add link:/Users/inception/Documents/deepseek-harness/default-workspace/software-design-test
```

> `link:` 后面必须是**绝对路径**。 / The path after `link:` must be absolute.

> **本机实测的坑 / a trap found on this machine**：PATH 上的 `dsh` 由 `/usr/bin/env node` 启动，
> 若系统 Node 是 v23（`import.meta.main` 在 Node 24 才存在），CLI 会**静默空转**：
> 退出码 0、无任何输出、profile 文件也不变。这种情况改用 Harness 应用自带的运行时 CLI：
> `dsh` on PATH runs under `env node`; with system Node v23 the CLI **silently does nothing**
> (exit 0, no output, no profile change) because `import.meta.main` only exists from Node 24.
> Use the runtime CLI the app itself ships:

```bash
"/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh" plugin --profile desktop \
  add link:/Users/inception/Documents/deepseek-harness/default-workspace/software-design-test
```

> 或者把系统 Node 升到 ≥ 24 再直接用 `dsh`。 / Or upgrade system Node to ≥ 24 and use `dsh` directly.

装完后重启 Harness（或重启 Web 应用），然后验证：

Restart Harness afterwards, then verify:

```bash
grep -n "software-design-test" ~/.dsh/profiles/desktop/package.json
```

期望看到两处 / expect two lines：

```json
"software-design-test": "link:/Users/inception/Documents/deepseek-harness/default-workspace/software-design-test",
```

以及 `dsh.profile.bundles` 数组里的 `"software-design-test"`。
The dependency spec and the bundle entry in `dsh.profile.bundles`.

最可靠的确认是在对话里用 `/` 菜单或 `skill` 工具，能看到 `observed-ui-test` 与
`observed-test-plan` 两个技能。

The most reliable confirmation: the `/` menu or the `skill` tool lists `observed-ui-test` and
`observed-test-plan`.

> 某些构建下 `dsh --profile desktop --dump-config` 不向标准输出打印内容（本机实测无输出），
> 所以以 profile 的 `package.json` 与技能列表为准。
> On some builds `--dump-config` prints nothing to stdout (verified on this machine), so trust the
> profile `package.json` and the skill list instead.

---

## 2. 从 GitHub 安装 / Install from GitHub

```bash
dsh plugin --profile desktop add github:Inceptzws/software-design-test
```

> 需要先把仓库推到 GitHub。包内没有依赖、没有 `prepare`/构建脚本，
> 所以 pnpm 不会要求 `allowBuilds` 批准。
> Push the repository first. There are no dependencies and no `prepare`/build script, so pnpm never
> asks for an `allowBuilds` approval.

---

## 3. 从 npm 安装 / Install from npm

```bash
dsh plugin add software-design-test
# 或指定 profile / or with an explicit profile
dsh plugin --profile desktop add software-design-test
```

---

## 4. 在 Harness 界面里安装 / Install from the Harness UI

Web / 桌面端侧边栏 → **Plugins** 页面 → **Install bundle** → target 填包名
`software-design-test`，或填本目录的绝对路径。也可以让 Agent 调用 `plugin_manager` 的
`install_bundle`（需要 danger-full-access 或逐次批准）。

Sidebar → **Plugins** → **Install bundle**, with the package name or the absolute path of this
directory. The agent can also call `plugin_manager`'s `install_bundle` (needs danger-full-access or a
per-approval).

---

## 5. 手动挂载（不用 pnpm 时）/ Manual mount without pnpm

把 `cordis.patch.yml` 的内容加进 profile 的配置树，或用启动器的 `--patch` 覆盖文件：

Add the contents of `cordis.patch.yml` to the profile's config tree, or use the launcher's `--patch`
overlay:

```yaml
- insert:
    - id: observed-ui-test
      name: software-design-test
```

```bash
dsh --profile desktop --patch /absolute/path/to/cordis.patch.yml
```

> 这种方式要求 `dsh` 能解析到包名 `software-design-test`；如果没装进 profile 的
> `node_modules`，请优先用第 1 种 `link:` 方式。
> This still requires the package to be resolvable; prefer the `link:` route above.

---

## 6. 安装后确认 / Post-install checks

```bash
# 1) profile 依赖与 bundle 列表里有没有这一行 / is it in the profile deps and bundles
grep -n "software-design-test" ~/.dsh/profiles/desktop/package.json

# 2) 技能自检（离线、只读）/ offline self-check
cd /Users/inception/Documents/deepseek-harness/default-workspace/software-design-test
node scripts/verify.mjs          # 期望 8/8 checks passed
node --test test/*.test.mjs      # 期望 25/25 pass
```

在对话里用 `/` 菜单或 `skill` 工具应能看到两个技能：

Two skills should be visible from the `/` menu or the `skill` tool:

| 技能 Skill | 何时用 When |
| --- | --- |
| **`software-design-test`**（重心） | **模拟真实用户测软件**：人物 → 场景 → 任务卡 → 旅程 → 启发式/巡游 → 判定 |
| `observed-test-plan` | 测试前：权限问卷、范围、元素清单、用例矩阵 |
| `observed-ui-test` | 执行规则：L1 → L2 → L3、取证协议、报告模板 |

---

## 7. 权限要求 / Permissions

- 插件本身**只需要读屏权限**（截屏/录屏），**不需要**辅助功能、输入监控、自动化等控制权限。
- 系统权限的授予路径见插件内 `skills/observed-test-plan/PERMISSIONS.md`。
- 测试开始前，Agent 必须先用权限问卷问过用户；没答复就不开始。

The plugin needs **screen-capture permission only** — never accessibility, input monitoring or
automation. Grant paths live in `skills/observed-test-plan/PERMISSIONS.md`. The agent must run the
permission questionnaire before any test action, and must not start without answers.

---

## 8. 卸载 / Uninstall

```bash
dsh plugin --profile desktop remove software-design-test
```

用 `link:` 安装时，卸载只会断开链接，不会删除本目录。
With a `link:` install, removing only detaches the link; this directory is left alone.

---

## 9. 故障排查 / Troubleshooting

| 现象 Symptom | 原因 Cause | 处理 Fix |
| --- | --- | --- |
| `dsh plugin ...` 无输出、退出码 0、profile 完全没变 | 系统 Node 是 v23，`import.meta.main` 不存在，CLI 静默空转 | 用应用自带 CLI：`"/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh" plugin …`，或升级 Node ≥ 24 |
| profile 的 `package.json` 里没有 `software-design-test` | `add` 没执行成功（路径不是绝对路径 / pnpm 报错） | 重跑 `add`，用**绝对路径**，看 pnpm 的报错 |
| 依赖有了但技能列表里没有 | 没加进 `dsh.profile.bundles`，或挂载失败 | 检查 `bundles` 数组；看 Harness 启动日志里 `software-design-test:` 开头的报错 |
| 写入 `~/.dsh/...` 报 `EPERM` | 会话的文件沙箱是 workspace-write，profile 在工作区之外 | 对安装命令放行一次（danger-full-access），或在 Harness 的 Plugins 页面安装 |
| `dsh --dump-config` 没有输出 | 某些构建下该标志不打印内容 | 改看 profile 的 `package.json` 与技能列表 |
| `pnpm` 提示 `allowBuilds` | 一般不会出现（零依赖零构建） | 若出现，说明有人加了依赖或构建脚本，检查 `package.json` |
| 截屏是黑屏/纯桌面 | 没授予屏幕录制权限，或授予后没重启应用 | 系统设置授予后重启应用 |
| 录屏没有光标 | 录制工具设置问题 | 用截屏补记指针位置，并在报告里注明 |
| 模拟器截屏失败 | 没有启动模拟器 | 先 `xcrun simctl boot`，或改用真机 + 控制中心录屏 |

---

## 10. 目录结构 / Layout

```text
software-design-test/
├── package.json           # dsh.bundle.patch 指向 cordis.patch.yml
├── cordis.patch.yml       # 挂载一行：id: observed-ui-test
├── lib/
│   ├── index.js           # Cordis 插件：注册 ctx.skills provider（挂载即校验）
│   └── self-check.js      # 离线校验：frontmatter、链接、注入 API 扫描
├── skills/
│   ├── observed-ui-test/  # 主技能：框架、三级模式、禁用指令、取证、报告模板
│   ├── observed-test-plan/# 计划技能：权限问卷、元素清单、用例矩阵
│   └── software-design-test/ # 模拟技能：工作流、人物场景、启发式巡游、缺陷复现、出处
├── scripts/
│   ├── session.mjs        # 会话脚手架 + 权限闸门 + 发现落盘
│   ├── capture.mjs        # 只读截屏/录屏（绝不含输入注入）
│   ├── guard.mjs          # 只读观察输入注入线索（观察注入 ≠ 执行注入）
│   ├── report.mjs         # 生成中英对照报告
│   └── verify.mjs         # 离线自检 8 项
├── test/                  # node:test 用例（25 条）
├── docs/                  # 本安装说明、使用说明、框架总览
├── locale/{zh,en}.json    # Plugins 页面标题与描述
└── icon.svg
```
