# FrankCards：把 React + Tauri App 装进真实 iPhone 的傻瓜手册

> 适用场景：你主要写 React / TypeScript / CSS；项目用 Tauri 打包；你想在自己的 iPhone 上测试，而暂时没有付费 Apple Developer Program，也不想用 TestFlight。
>
> 本手册按 FrankCards 这次实际走通的过程编写。你可以照做，但涉及 Bundle ID、Team ID、手机名称时，必须替换成你自己的值。

## 0. 先把结论讲明白

你**不需要**把 React 重写成 Swift，也**不需要** TestFlight，仍可以把开发版装到自己的 iPhone 上。

你需要的是：

1. 一个 Apple ID（不需要付费开发者会员）。
2. 一台 Mac、Xcode、Node/npm、Rust/Cargo。
3. 一台可以连接到 Mac 的 iPhone。
4. Tauri 生成的 iOS 原生工程。

它们的分工如下：

| 你在做什么 | 用什么做 | 谁负责 |
| --- | --- | --- |
| 页面、动画、登录、响应式设计 | React + CSS + TypeScript | 你 |
| 本地网页与热更新 | Vite | Vite |
| 把网页装进 iOS 原生容器 | Tauri + Rust | Tauri |
| Apple 签名、编译、安装到 iPhone | Xcode | Xcode |
| 验收安全区、灵动岛、键盘、手势、动画手感 | 真实 iPhone | 你 |

一句话：**React 是产品；Tauri 是包装与桥梁；Xcode 是 Apple 的签名和安装工具。**

## 1. 免费方案可以做什么，不能做什么

### 可以做

- 用 Xcode 中的免费 `Personal Team` 给自己的 iPhone 签名。
- 安装开发版 App 到自己连接的真机。
- 在手机上实时测试安全区、点击、键盘、滚动、动画和网络行为。
- 修改 React 代码后，通过 Tauri/Vite 的开发服务器看到更新。

### 不能做

- 不能发布到 App Store。
- 不能通过 TestFlight 发给其他测试者。
- 免费签名存在有效期与设备限制；失效时重新部署即可。

> TestFlight 是“给别人分发测试版”的下一阶段，不是“我自己在真机调试”的前置条件。

## 2. 第一次开始前：准备 Mac

在终端依次检查：

```bash
npm --version
cargo --version
```

如果两条都有版本号，说明 Node/npm 和 Rust/Cargo 都能被终端找到。

还需要：

- 安装 Xcode，并至少打开一次接受许可。
- 在项目目录运行过 `npm install`。
- 确保你进入的是 `package.json` 所在目录。

FrankCards 的项目根目录是：

```bash
cd /Users/songhaifan/Documents/GitHub/frank_cards
```

### 为什么 npm 有时“突然找不到”？

你的 Node/npm 由 Homebrew 安装在 `/opt/homebrew/bin`。新的终端、Finder 和从 Dock 打开的 Xcode 不一定拥有同一份 PATH。

我们已在 `~/.zshrc` 中加入：

```bash
if [[ -x /opt/homebrew/bin/brew ]]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
fi
```

它保证新的 zsh 终端能找到 npm。注意：**Xcode 图形界面的构建环境仍可能不读取 `.zshrc`**，这个问题在第 8 节单独处理。

## 3. 第一次开始前：准备 iPhone

按顺序完成：

1. 用数据线连接 iPhone 和 Mac。
2. 解锁 iPhone。
3. 如果手机询问“是否信任此电脑”，选择“信任”。
4. 打开 iPhone：**设置 → 隐私与安全性 → 开发者模式**。
5. 开启开发者模式，并按手机要求重启、再次确认。
6. 让 Mac 与 iPhone 使用同一 Wi-Fi。

> “信任 Mac”与“信任开发者证书”是两件事：前者让 Mac 能连接手机；后者让 iOS 允许启动刚安装的开发 App。

## 4. 在 Xcode 中做一次签名设置

Tauri 会生成一个 Xcode 工程。FrankCards 当前的位置是：

```text
src-tauri/gen/apple/conversation-cards.xcodeproj
```

首次配置时打开它，然后：

1. 在 Xcode 顶部菜单打开 **Xcode → Settings → Accounts**。
2. 点击 `+`，登录你的 Apple ID。
3. 在左侧选项目 Target：`conversation-cards_iOS`。
4. 打开 **Signing & Capabilities**。
5. 勾选 **Automatically manage signing**。
6. 在 **Team** 下拉框选择你的 `Personal Team`。
7. 检查 **Bundle Identifier**。

FrankCards 当前的 Bundle Identifier 是：

```text
com.cuecards.desktop
```

换新 App 时不要照抄；应使用你自己唯一的值，例如：

```text
com.yourname.myapp
```

如果 Xcode 显示 `Signing requires a development team`，几乎总是因为第 6 步还没有选 Team。

## 5. 让 Tauri 也知道你的 Team

在 `src-tauri/tauri.conf.json` 中配置 iOS 团队：

```json
{
  "bundle": {
    "identifier": "com.yourname.myapp",
    "iOS": {
      "developmentTeam": "你的_TEAM_ID"
    }
  }
}
```

这里的 `developmentTeam` 必须是你在 Xcode 里实际使用的 Team ID。不要把示例值或其他 Apple 账号的 ID 复制进来。

## 6. 让真机访问 Vite：为什么必须用 --host

Mac 上的 `localhost` 只代表 Mac 自己；iPhone 看不到它。Tauri 真机模式会使用 Mac 的局域网 IP，例如：

```text
http://192.168.x.x:1420/
```

因此 Vite 要读取 `TAURI_DEV_HOST`。FrankCards 的 `vite.config.ts` 应保持类似配置：

```ts
const host = process.env.TAURI_DEV_HOST;

server: {
  host: host || false,
  port: 1420,
  strictPort: true,
  hmr: host
    ? { protocol: "ws", host, port: 1421 }
    : undefined,
}
```

如果手机白屏、无法刷新或热更新失效，先确认：

- 手机和 Mac 是否同一 Wi‑Fi；
- 命令是否带 `--host`；
- 终端是否显示局域网 IP；
- Vite 是否采用了上面的 `TAURI_DEV_HOST` 配置。

## 7. 每天真机测试时，只记住这一条命令

先插上并解锁手机，再进入项目目录运行：

```bash
npm run tauri -- ios dev "Songhai's iPhone 14 pro" --host
```

换项目或设备时，通用格式是：

```bash
npm run tauri -- ios dev "你的 iPhone 名称" --host
```

命令之后会依次发生：

1. Tauri 检测已连接 iPhone。
2. Vite 启动本地开发服务器。
3. Tauri 调用 Xcode 编译 iOS 原生壳与 Rust。
4. Xcode 用你的 Personal Team 签名。
5. App 被安装到 iPhone。
6. Tauri 尝试启动 App。

看到 `App installed` 说明已完成安装。**不要关闭这个终端**：它仍在给手机提供 Vite 页面和热更新。结束测试时按 `Ctrl + C`。

## 8. 为什么不要直接点击 Xcode 的 Run

对于普通原生 App，点 Xcode 的 Run 很自然；但 Tauri 的生成工程包含一个 `Build Rust Code` 阶段，它需要与正在运行的 Tauri CLI 协调。

直接点 Run 时，我们遇到了：

```text
Connection refused
```

这不是手机坏了，而是 Xcode 的构建脚本找不到 Tauri 的协调进程。

正确分工：

- **日常启动**：从终端运行 `npm run tauri -- ios dev ... --host`。
- **Xcode**：用来登录 Apple ID、选择 Team、查看签名、查看原生日志和排查崩溃。

## 9. 我们实际遇到的报错：照表处理

| 报错或现象 | 原因 | 解决办法 |
| --- | --- | --- |
| `npm: command not found` | Xcode 或终端找不到 Homebrew 的 Node | 检查 `npm --version`；为 zsh 配置 Homebrew PATH；必要时给 Xcode Build Rust Code 脚本补 PATH。 |
| `Signing requires a development team` | 尚未选择 Personal Team | Xcode → Target → Signing & Capabilities → Team。 |
| `No profiles found` | Team、Bundle ID 或手机连接不完整 | 解锁并连接手机；确认 Bundle ID；保持 Automatically manage signing。 |
| `Operation not permitted` / `missing project.yml` | Xcode User Script Sandboxing 阻止 Tauri 构建脚本读文件 | 在生成 iOS 工程中设置 `ENABLE_USER_SCRIPT_SANDBOXING = NO`。 |
| App 已安装但无法启动，提示签名或 profile 未信任 | iPhone 没有信任开发者证书 | 设置 → 通用 → VPN 与设备管理 → 开发者 App → 信任。 |
| 手机白屏或不能热更新 | 手机访问不到 Mac 的开发服务器 | 同一 Wi-Fi；使用 `--host`；检查 `TAURI_DEV_HOST`。 |
| Xcode Run 显示 `Connection refused` | 没有从 Tauri CLI 启动协调进程 | 回到终端运行 Tauri 真机命令。 |

## 10. Xcode 找不到 npm/cargo 时怎么办

终端能找到 npm，不表示从 Dock 启动的 Xcode 也能找到它。

在 Tauri 生成的 iOS 工程里，`Build Rust Code` 脚本需要包含类似：

```bash
export PATH="/opt/homebrew/bin:$HOME/.cargo/bin:/usr/local/bin:$PATH"
npm run -- tauri ios xcode-script ...
```

这样 Xcode 才能找到：

- `npm`：运行 Tauri CLI；
- `cargo`：编译 Rust；
- 其他 Homebrew 安装的工具。

## 11. Tauri 生成工程的两个注意点

`src-tauri/gen/apple/` 是 Tauri 自动生成的 Xcode 工程。它并非完全“永远不变”：重新初始化 iOS、升级 Tauri 或删除生成目录后，局部修改可能被覆盖。

每次重新生成后，复查：

1. `src-tauri/tauri.conf.json` 中的 `developmentTeam`。
2. Xcode Build Rust Code 是否能找到 npm 与 cargo。
3. `ENABLE_USER_SCRIPT_SANDBOXING = NO` 是否仍存在。
4. `vite.config.ts` 是否仍支持 `TAURI_DEV_HOST`。

> 不需要害怕生成文件；只要把它们看作“iOS 构建层的设置”，并在重新生成后跑一次真机命令验证即可。

## 12. 每次测试前的勾选清单

- [ ] iPhone 已连接并解锁。
- [ ] iPhone 已信任 Mac。
- [ ] 开发者模式已开启。
- [ ] iPhone 已信任开发者证书。
- [ ] iPhone 与 Mac 在同一 Wi‑Fi。
- [ ] `npm --version` 和 `cargo --version` 都成功。
- [ ] Xcode 中已选 Personal Team，并开启 Automatically manage signing。
- [ ] Bundle Identifier 唯一且正确。
- [ ] 使用的是 `npm run tauri -- ios dev "设备名" --host`。
- [ ] 终端没有关闭；手机已显示 App。
- [ ] 现在开始验收安全区、灵动岛、键盘、触摸热区、滚动和动画。

## 13. 什么时候再进入 TestFlight？

等你准备把 App 发给其他人远程测试，或准备提交 App Store 时，再处理：

- 付费 Apple Developer Program；
- App Store Connect；
- TestFlight 内测；
- 隐私政策、账号删除、登录回调、商店资料和审核要求。

在此之前，最有效的节奏是：**继续写 React → 用 Tauri 部署到自己的 iPhone → 在真实设备上验收 → 迭代。**
