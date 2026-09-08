# FrankCards 1.0.0 — App Store 提交资料包

准备日期：2026-09-08  
App Store Connect Apple ID：`6809699079`  
Bundle ID：`com.songhaifan.frankcards`  
SKU：`frankcards-ios`

此文件把可从当前产品代码确认的信息与尚待补齐的信息分开。不要把标为“待确认”或“发布前阻塞”的内容写成已完成。

## 1. App Store Connect：版本资料

### 基础信息

| 字段 | 建议填写 |
| --- | --- |
| App 名称 | FrankCards |
| 副标题（30 字符内） | Guided talks, card by card |
| 主类别 | Lifestyle |
| 次类别 | Entertainment（可选） |
| 年龄分级 | 按 App Store Connect 问卷如实作答；不要为了取得较低等级而省略敏感主题或用户生成内容。 |
| Copyright | `© 2026 [权利人姓名或实体]`（待确认） |
| 支持 URL | `https://frank-cards.vercel.app/support/` |
| 营销 URL | `https://frank-cards.vercel.app/marketing/` |

### Promotional Text（170 字符内，可后续更新）

```text
Use your phone like a shared card pack. FrankCards guides face-to-face conversations from an easy opening to deeper reflection and a meaningful close.
```

### Description

```text
Frankly Talking.

Use the phone in your hand—or place it between you and use it like a physical card pack. Choose a pack, take turns, and let FrankCards guide the conversation from an easy opening through deeper exploration and reflection to a natural close.

Want something more personal? Create a private topic, shape its cards and categories, and make the conversation fit the people in front of you. You can also submit a topic for Community review.

FrankCards is designed for face-to-face conversation: not a stream of random prompts, but a thoughtful flow with direction.

Features
• Curated conversation-card packs
• A focused, turn-by-turn card experience
• Create, edit and keep your own private topics
• Optional Community topics, reviewed before publication
• Optional AI-assisted draft generation with a provider and key you choose
• English and Simplified Chinese

Some features require an account. AI-assisted generation sends the topic you enter to the AI provider you select; your API key is used only for that request and is not saved by FrankCards.
```

### Keywords（100 字符内；逗号分隔）

```text
conversation,questions,reflection,relationships,icebreaker,card game,connection,party
```

### Review Notes（在产品门槛完成后填写）

```text
FrankCards is a conversation-card app. Built-in card packs can be explored without signing in.

Signing in is required only to create, save or submit personal topics, upload an avatar, and like Community packs. Community submissions are reviewed before publication.

Review account
Email: [待创建的审核账号]
Password: [待填]

AI-assisted draft generation is optional. It requires the reviewer to supply an API key from their own compatible AI provider; it is not required to review the core app.
```

## 2. 截图拍摄清单

在 App Store Connect 当前界面要求的 iPhone 尺寸中选择一种；不要把模拟器外框、鼠标、调试菜单或状态错误一起拍入。首三张最重要，因为它们通常用于产品页预览。

1. **主视觉 / 首屏**：FrankCards 标志、喝咖啡的人物、一个清晰的主操作。
2. **正在对话**：一张问题卡及进度，表现“轮流聊”的核心体验。
3. **自定义模式**：创建主题或筛选卡包，但画面只呈现一个明确任务。
4. **Topic Studio**：编辑一个自己的主题，突出“私有、可定制”。
5. **Community**：仅在举报、拉黑、公开联系渠道完成后展示；否则不要把它放在商店截图里。

截图原则：每张只讲一个好处；文字要少、可读；所有展示的账号、头像和内容都应是你拥有或可用于宣传的内容。

## 3. App Privacy：代码证据与待确认项

下表是当前代码审计结果，不是已提交的 App Privacy 问卷答案。App Store 的隐私标签还需要覆盖 Supabase 与用户选择的 AI 供应商的实际数据处理方式。

| 数据类型 | 当前功能证据 | 建议用途 | 是否与身份关联 | 是否用于追踪 |
| --- | --- | --- | --- | --- |
| Email Address | 邮箱密码注册、登录、密码重设 | App Functionality / Account Management | 是 | 否（按当前代码） |
| User ID | Supabase Auth 与资料、主题、点赞关联 | App Functionality | 是 | 否（按当前代码） |
| Name | 用户可编辑 display name | App Functionality / User Content | 是 | 否（按当前代码） |
| Photos | 用户可上传 JPEG、PNG 或 WebP 头像；头像公开显示 | App Functionality / User Content | 是 | 否（按当前代码） |
| User Content | 用户创建的主题标题、副标题、类别、问题、卡片内容 | App Functionality / User Content | 是 | 否（按当前代码） |
| Product Interaction | Community 卡包点赞 | App Functionality | 是 | 否（按当前代码） |
| Other User Content sent to AI | 可选 AI 生成时：用户输入的主题、受众、语言、卡片设置；发送到用户选择的 AI 服务商 | App Functionality | 取决于服务商与请求内容 | 否（FrankCards 当前未见广告追踪代码） |

发布前必须与实际 Supabase 项目设置及所启用 AI 供应商再次核对：是否记录 IP、诊断日志、邮件投递日志、分析或崩溃信息。若启用，必须反映在 App Privacy 中。

## 4. 必须先完成的审核门槛

这些不是文案问题；在当前代码中还没有完整实现。请先完成，再提交审核。

- [ ] **应用内删除账号**：代码、远端 Edge Function 与数据库级联已完成；使用临时账号在真机完成一次端到端删除验收后勾选。
- [ ] **用户生成内容安全机制**：公开 Community 内容须有举报入口、拉黑用户能力，以及可见的联系渠道；当前已有提交前审核流程，但尚未发现举报与拉黑功能。
- [x] **Privacy Policy 页面**：`/privacy/` 已列明数据类别、用途、Supabase 与可选 AI 供应商、保留/删除方式及联系方法；推送并部署后才可填入 App Store Connect。
- [x] **Support 页面**：`/support/` 已提供联系邮箱、常见问题与账号删除请求说明；推送并部署后才可填入 App Store Connect。
- [ ] **真实 iOS 登录与邮件流程**：Supabase 的生产 Site URL / Redirect URLs、邮件确认与密码重设链接必须能回到 iOS App 或可验证网页；当前代码使用 `window.location.origin`，不能假定原生 App 上一定可用。
- [ ] **生产邮件**：配置适合生产的发件域名与 SMTP，并实测注册确认和重设密码。
- [ ] **审核账号**：创建一个专供 Apple 审核的普通测试账号；不要提供自己的主账号。

## 5. 尚待你确认的资料

1. Copyright 的权利人名称（个人姓名或公司/实体名称）。
2. Support 页面公开的联系邮箱。代码里出现 `hello@frankcards.songhai.one`，但发布前请确认它确实能收信并由你维护。
3. 审核联系人：名字、姓氏、电话、邮箱。
4. Apple 审核专用账号的邮箱和密码（在填写 Review Information 时提供，不要写进 Git 仓库）。
5. 最终隐私政策的主体、地址/司法辖区（如适用）和生效日期。

## 6. 提交流程（产品门槛完成后）

1. 在真实 iPhone 完整测试注册、确认邮件、登录、登出、改名、上传头像、创建/删除主题、提交审核、社区浏览、删除账号。
2. Archive iOS build，上传至 App Store Connect，等待 build 处理完成。
3. 在 1.0.0 中选择该 build，填写上述商店资料、截图、隐私问卷、年龄分级与 Review Information。
4. 用另一台设备或无登录状态访问 Privacy Policy 与 Support URL，确认可公开打开。
5. 最后逐项复核一次实际功能与隐私标签一致，再提交审核。

## 7. 官方依据

- Apple 的 [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)：账号创建、用户生成内容及隐私政策要求。
- Apple 的 [Offering account deletion](https://developer.apple.com/support/offering-account-deletion-in-your-app/)：账号与关联数据删除方式。
- Apple 的 [Manage app privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/)：隐私政策 URL 与第三方数据实践。
- Apple 的 [App Store review](https://developer.apple.com/app-store/review/)：审核账号与说明资料。
