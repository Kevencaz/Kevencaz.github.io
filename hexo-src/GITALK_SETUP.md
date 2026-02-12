# Gitalk 评论系统配置指南

## 第一步：创建 GitHub OAuth App

1. 访问 https://github.com/settings/applications/new
2. 填写以下信息：
   - **Application name**: `Mystwood Blog Comments`
   - **Homepage URL**: `https://caijiahao.top`
   - **Authorization callback URL**: `https://caijiahao.top`
3. 点击 "Register application"
4. 创建成功后，你会看到 **Client ID** 和 **Client secrets**
5. 点击 "Generate a new client secret" 生成密钥

## 第二步：更新配置文件

打开 `hexo-src/_config.next.yml`，找到 gitalk 配置部分：

```yaml
gitalk:
  enable: true
  github_id: Kevencaz
  repo: Kevencaz.github.io
  client_id: PLACEHOLDER_CLIENT_ID        # 替换为你的 Client ID
  client_secret: PLACEHOLDER_CLIENT_SECRET # 替换为你的 Client Secret
  admin_user: Kevencaz
  distraction_free_mode: true
  language: zh-CN
```

将 `PLACEHOLDER_CLIENT_ID` 和 `PLACEHOLDER_CLIENT_SECRET` 替换为第一步获得的真实值。

## 第三步：初始化评论

Gitalk 基于 GitHub Issues 工作，每篇文章对应一个 Issue。

**初始化方法：**

1. 部署完成后，访问你的博客任意一篇文章
2. 滚动到评论区，你会看到 "未找到相关的 Issues 进行评论，请联系 @Kevencaz 初始化创建"
3. **用你的 GitHub 账号登录**（必须是 admin_user 配置的账号）
4. 登录后，Gitalk 会自动在你的仓库创建一个 Issue
5. 刷新页面，评论功能就可以使用了

**注意事项：**

- 只有 `admin_user` 配置的用户（仓库 owner）才能初始化评论
- 每篇文章第一次访问时需要手动初始化一次
- 初始化后，任何有 GitHub 账号的人都可以评论
- 你可以在 GitHub Issues 中管理和删除评论

## 第四步：管理评论

- 查看所有评论：访问 https://github.com/Kevencaz/Kevencaz.github.io/issues
- 删除恶意评论：在 Issues 页面找到对应评论，点击 "Close issue" 或直接删除
- 屏蔽用户：在 GitHub 仓库设置中可以屏蔽特定用户

## 常见问题

**Q: 为什么显示 "未找到相关的 Issues"？**
A: 这是正常的，每篇文章第一次需要用 admin 账号登录并初始化。

**Q: 如何批量初始化所有文章的评论？**
A: 可以使用 Gitalk 官方提供的初始化脚本，或者手动访问每篇文章进行初始化。

**Q: 评论数据存在哪里？**
A: 所有评论数据存储在你的 GitHub 仓库的 Issues 中，完全由你控制。

**Q: 如何防止垃圾评论？**
A: Gitalk 要求 GitHub 账号登录，这本身就过滤了大部分垃圾评论。你也可以在仓库设置中启用评论审核。
