# 劳育备课工坊

面向师范生和新教师的劳动教育备课工作台。通过三步引导生成可编辑的教学设计、学习任务单、评价量表和声明式动画，并导出包含四份 Word 文档的 ZIP。

- 内置斜面搬运、杠杆称量、滑轮提水三个案例，无 Key 也可浏览和播放。
- 使用阿里云百炼 OpenAI 兼容接口；未配置 Key 时禁用生成与优化，不使用模拟结果替代真实调用。
- 分区编辑，停顿 800ms 自动保存；动画支持播放、暂停、进度拖动和重播。
- 物理动画按受约束的参数计算几何、受力和轨迹，模型负责文本与参数；理想模型假设在页面中注明。

当前版本是**本机单用户工具**，没有登录、租户隔离、配额或公网访问控制。前后端只监听 `127.0.0.1`，不要直接暴露到公网，详见 [SECURITY.md](SECURITY.md)。

## 首次启动

需要 Node.js 24+、npm 和 Git。在仓库根目录运行。可选 Conda 环境：`conda env create -f environment.yml`，然后 `conda activate labor-edu-forge-dev`。

```powershell
npm ci
npm run dev
```

`npm ci` 使用锁文件安装依赖并构建共享包；`npm run dev` 启动前也会构建共享包，首次克隆无需手工准备 `dist`。打开 [本地工作台](http://localhost:5173)，API 默认位于 `http://127.0.0.1:37856`。无 Key 时可先试用案例。

需要真实生成时，首次配置可执行：

```powershell
if (!(Test-Path server/.env.local) -and !(Test-Path server/.env)) {
  Copy-Item server/.env.example server/.env.local
}
```

macOS/Linux 对应命令：

```bash
test -f server/.env.local || test -f server/.env || cp server/.env.example server/.env.local
```

编辑已有的 `server/.env.local` 或 `server/.env`，填写自己的 `DASHSCOPE_API_KEY`，确认端点和模型属于同一业务空间并有调用权限。不要在终端打印完整配置，不要把 Key 填进前端代码。修改后在运行服务的终端按 `Ctrl+C`，再执行 `npm run dev`。

## 环境变量

读取优先级：**进程环境变量 > `server/.env.local` > `server/.env` > 程序默认值**。配置位置不受启动工作目录影响；两个环境文件均被 Git 忽略。仓库只提供不含密钥的 `.env.example`。

| 变量 | 默认值 / 用途 |
|---|---|
| `DASHSCOPE_API_KEY` | 空；服务端调用百炼所需 Key |
| `DASHSCOPE_BASE_URL` | `https://dashscope.aliyuncs.com/compatible-mode/v1`；可替换为业务空间 OpenAI 兼容地址，须包含 `/compatible-mode/v1` |
| `QWEN_TEXT_MODEL` | `qwen3.7-plus`；示例默认模型，可按业务空间权限调整，不保证所有账号均可用 |
| `BAILIAN_TIMEOUT_SECONDS` | `300`；单次请求超时秒数 |
| `BAILIAN_MAX_RETRIES` | `2`；最多重试次数，上限 3，真实请求可能产生费用 |
| `PORT` | `37856`；后端端口 |
| `LABOR_EDU_DATA_DIR` | 默认 `server/data`；建议以绝对路径指定其他私人目录 |
| `VITE_API_TARGET` | 前端开发/预览代理目标，默认 `http://127.0.0.1:37856`；通过启动前的进程变量设置，只填写非敏感地址 |

`apiHost`、`workspaceName`、`workspaceId`、描述等控制台元数据不参与应用调用，无需提交。自定义业务空间地址只填写本机环境文件。不要以 `VITE_` 前缀存放密钥：这类变量可能进入浏览器产物。

修改后端端口的 PowerShell 示例：

```powershell
$env:PORT = '37860'
$env:VITE_API_TARGET = 'http://127.0.0.1:37860'
npm run dev
```

前端使用 5173，端口占用时直接报错，不会悄悄切换地址。构建预览使用 4173。API 只接受本机工作台的固定来源，不允许任意网站跨域调用。

## 数据与隐私

- 生成结果位于 `server/data/projects.json`，包含输入要求和生成内容，不是公开样例数据。
- 新建备课的未提交草稿保存在当前浏览器标签页的 `sessionStorage` 中。
- 生成会将教学输入发往所配置的百炼服务；优化会发送当前动画及修改要求。避免输入学生姓名、联系方式等个人信息。
- 导出 ZIP 仅包含四份教学 DOCX，不包含环境文件、数据库或日志；教学内容仍需审核后再分享。
- 数据目录、旧版嵌套数据目录、环境文件、日志、导出包和测试产物已忽略。自定义数据目录应放在仓库之外。
- 备份前停止后端，将数据文件复制到私人位置；恢复也须先停止后端。不要分享整个工作目录或 `.git`。

## 构建与启动已构建版本

```powershell
npm run build
npm start
```

另开终端，在根目录运行 `npm run preview`，访问 [构建预览](http://localhost:4173)。后端读取同一套环境文件，前端预览将 `/api` 代理给本机后端。这是本机验收方式，不是公网部署方案。

## 检查与测试

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

## 开源发布

发布步骤见 [RELEASING.md](RELEASING.md)，版本变更见 [CHANGELOG.md](CHANGELOG.md)。完成检查后运行 `npm run release:source`。源码 ZIP 输出到被忽略的 `output/`，包含当前可提交源码和文档，不携带 `.git`、本机配置、生成数据、依赖或构建产物。

发布时明确推送经过审核的 `main` 和版本标签，不使用 `git push --all` 或 `git push --mirror`。若来源仓库含敏感历史，必须先撤销凭证并清理相关引用、reflog 和残留对象，或者将审核后的源码 ZIP 解压后初始化新仓库。源码打包本身不会清理历史。详见 [SECURITY.md](SECURITY.md)。

## 常见问题

| 现象 | 处理 |
|---|---|
| 未配置模型 | 检查服务端环境文件、有无更高优先级的空环境变量覆盖 Key，重启后端 |
| 密钥无效 / 无权限 | 核对 Key、业务空间端点和模型权限，不向 Issue 粘贴 Key |
| 生成耗时较长 | 完整请求可能耗时数分钟，按需调整超时，避免重复提交 |
| 端口占用 | 停止此前的本项目实例，勿随意结束其他应用进程 |
| 找不到共享包 `dist` | 在根目录运行 `npm run prepare`，使用正常的 `npm ci` 安装流程 |
| 升级依赖后开发服务异常 | 停止后重启，重新运行类型检查、测试和构建 |

项目结构：`client/` 为 Vue 3 界面，`server/` 为 Express API、存储与导出，`packages/shared/` 为 Schema、类型和物理计算。更多见 [ARCHITECTURE.md](ARCHITECTURE.md)、[CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可证

以 [Apache License 2.0](LICENSE) 开源，第三方组件见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
