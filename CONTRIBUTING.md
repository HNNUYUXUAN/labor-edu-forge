# 贡献指南

1. 使用 Node.js 24+，运行 `npm ci`；安装会构建共享包。
2. 从小而明确的问题开始，避免把无关后台模板或大型设计系统引入项目。
3. 通用能力优先评估成熟开源依赖；新增依赖必须说明必要性、许可证、维护状态和安全影响。
4. 提交前运行 `npm run check`、`npm run license:check` 和 `npm audit`；前端变更还应运行 `npm run test:e2e`。
5. 不提交真实环境文件、API Key、私人业务空间端点、生成历史、测试报告、调试截图或个人数据；示例配置凭证留空。用于公开文档的截图与动画仅展示内置案例，经检查后放在 `docs/images/`，采集约定见该目录的说明。
6. 发布前运行 `npm run security:check`、`npm run security:history` 和 `npm run security:all`，分别检查当前分支、全部引用和完整本地对象库。发现历史凭证时先撤销/轮换，再处理历史和发布范围，见 [SECURITY.md](SECURITY.md) 与 [RELEASING.md](RELEASING.md)。
7. E2E 使用预配置的 Chromium，保持固定运行时和 `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`；版本不匹配时停止，不自动安装浏览器。依赖升级须验证类型、测试、构建和审计。

视觉修改需保持真白底、墨黑正文、朱红主动作、克制钴蓝信息色、低圆角和编辑部式排版。中文优先宋体，西文与数字优先 Times New Roman；公式使用 KaTeX，不直接套用正文的字体覆盖数学字形。动画标注应在桌面和窄屏核对上下标、单位、受力颜色与边界。使用系统字体，不提交商业字体文件。

## 检查与测试

从 Release ZIP 开始时，可在解压后的项目根目录依次运行 `npm run typecheck`、`npm test`、`npm run build`、`npm run license:check` 和 `npm audit`，检查源码与依赖。`npm test` 的安全测试使用临时 Git 仓库，需要安装 Git；日常启动和备课只需 Node.js 与 npm。准备提交贡献时，使用 Git 克隆仓库，再运行下方包含历史扫描的完整检查。

```powershell
npm run check
npm run license:check
npm audit
npm run security:history
npm run security:all
```

`check` 包含可提交工作树、暂存区、当前分支历史的敏感信息扫描、类型检查、单元/API 测试和构建。构建后再运行 `npm run security:check` 扫描最新浏览器产物。`security:history` 额外扫描全部本地分支、标签和内部 Git 引用；`security:all` 进一步检查 reflog 和不可达对象，适合历史清理后的复核。提交和标签消息也纳入检查。扫描只输出位置和规则，不打印命中内容；需在含 Git 历史的仓库根目录运行，不能证明任意格式的数据都已脱敏。

单元/API 测试使用临时数据目录和注入的模拟 provider；E2E 入口不读取环境文件，每次运行创建独立临时目录。测试均不调用真实模型。异常强制终止可能在系统临时目录留下合成测试数据。

端到端测试：`npm run test:e2e`，使用 5174 / 37857，不占用工作台端口。浏览器运行时须预先准备好，**不自动下载安装浏览器**。

- Windows：`C:\ProgramData\PlaywrightRuntime`；浏览器 `C:\ProgramData\ms-playwright`。
- WSL Ubuntu：`/opt/playwright-runtime`；浏览器 `/opt/ms-playwright`。
- 使用已安装的 `playwright` / `playwright-cli`，仅 Chromium；保持 `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`。
- 仓库测试依赖为 Playwright `1.62.1`。运行器、测试包和浏览器不兼容时停止并记录差异，不自行安装另一份浏览器。可用匹配现有运行时的 CLI 独立验证 UI。

CI 使用与测试依赖相同版本的 Playwright 容器中的已有浏览器，不运行安装器。版本匹配要求见 [Playwright 官方说明](https://playwright.dev/docs/docker)。
