# 贡献指南

1. 使用 Node.js 24+，运行 `npm ci`；安装会构建共享包。
2. 从小而明确的问题开始，避免把无关后台模板或大型设计系统引入项目。
3. 通用能力优先评估成熟开源依赖；新增依赖必须说明必要性、许可证、维护状态和安全影响。
4. 提交前运行 `npm run check`、`npm run license:check` 和 `npm audit`；前端变更还应运行 `npm run test:e2e`。
5. 不提交真实环境文件、API Key、私人业务空间端点、生成历史、测试报告、调试截图或个人数据；示例配置凭证留空。用于公开文档的截图与动画仅展示内置案例，经检查后放在 `docs/images/`，采集约定见该目录的说明。
6. 发布前运行 `npm run security:check`、`npm run security:history` 和 `npm run security:all`，分别检查当前分支、全部引用和完整本地对象库。发现历史凭证时先撤销/轮换，再处理历史和发布范围，见 [SECURITY.md](SECURITY.md) 与 [RELEASING.md](RELEASING.md)。
7. E2E 使用预配置的 Chromium，保持固定运行时和 `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`；版本不匹配时停止，不自动安装浏览器。依赖升级须验证类型、测试、构建和审计。

视觉修改需保持真白底、墨黑正文、朱红主动作、克制钴蓝信息色、低圆角和编辑部式排版。
