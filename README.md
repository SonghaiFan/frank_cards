# FrankCards

<div align="center">

<img src="public/icon.png" width="112" alt="FrankCards 图标" />

### 把难开口的话，变成可以一起翻开的卡片。

为伴侣、朋友、家人，以及刚刚认识的人准备的对话卡牌。

[在线使用](https://frank-cards.vercel.app/) · [下载 v2.1.0](https://github.com/SonghaiFan/frank_cards/releases/tag/v2.1.0) · [全部版本](https://github.com/SonghaiFan/frank_cards/releases) · **中文** / [English](public/README-EN.md)

</div>

![FrankCards 首页：从不同的对话包中选择此刻想聊的话题](docs/images/readme/home.jpg)

FrankCards 把不容易开口的问题放进一场有节奏的卡牌体验里。选一个适合此刻的对话包，把屏幕放在彼此中间，然后从第一张卡开始。这里没有标准答案、分数或关系诊断，真正重要的是接下来发生的对话。

## What makes it different

- **一副牌是一场完整对话**：每个对话包都有自己的开场、分类、正反面提示和结束方式，让聊天自然地从轻松走向深入。
- **问题有不同的能量**：圆润的 **Bouba** 帮助人慢慢打开，尖锐的 **Kiki** 用来穿过客套和假装。
- **不被固定题库限制**：22 组中英文内置卡包覆盖伴侣、朋友、家庭、自我探索与不同场景，也可以筛选并组合成属于这一晚的一组牌。
- **直接在真实卡片上创作**：修改封面、问题、背面提示、分类和颜色时，看到的就是最终使用的样子，而不是一张复杂的配置表单。

![FrankCards 自定义模式：筛选并组合不同的对话包](docs/images/readme/custom-mode.jpg)

## 创建自己的对话包

内置卡包无需登录。登录后可以创建私人卡包，保存后继续编辑或立即使用。想公开分享时，可以提交审核；通过的作品只会出现在自定义模式的**社区**中，不会混入 FrankCards 官方内容。已发布卡包仍可修改，更新后会重新进入审核。

<table>
  <tr>
    <td width="50%"><img src="docs/images/readme/conversation.jpg" alt="FrankCards 对话卡片界面" /></td>
    <td width="50%"><img src="docs/images/readme/topic-studio.jpg" alt="FrankCards 所见即所得话题编辑器" /></td>
  </tr>
  <tr>
    <td align="center"><sub>一次只让一个问题留在中间。</sub></td>
    <td align="center"><sub>直接在真实卡片上完成创作。</sub></td>
  </tr>
</table>

## 下载

v2.1.0 提供 macOS（Apple Silicon 与 Intel）以及 Windows（`.exe` 与 `.msi`）安装包。前往 [Release 页面](https://github.com/SonghaiFan/frank_cards/releases/tag/v2.1.0) 下载。

> macOS 版本目前尚未进行 Apple notarization，首次打开时系统可能显示安全提醒。

<details>
<summary><strong>本地运行与参与开发</strong></summary>

需要 Node.js 20+ 与 npm：

```bash
git clone https://github.com/SonghaiFan/frank_cards.git
cd frank_cards
npm ci
npm run dev
```

桌面端使用 Tauri 2。安装 Rust 与 Tauri prerequisites 后运行：

```bash
npm run tauri dev
```

账号与用户话题由 Supabase 提供，配置见 [Supabase 说明](supabase/README.md)。项目使用 React、TypeScript、Vite、Supabase 与 Tauri，并以 [MIT License](LICENSE) 开源。参与前请阅读 [贡献指南](CONTRIBUTING_GUIDE.md)。

</details>

<div align="center">

**Made for conversations that matter.**

</div>
