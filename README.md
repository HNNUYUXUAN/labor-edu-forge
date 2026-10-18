# 劳育备课工坊

[![CI](https://github.com/HNNUYUXUAN/labor-edu-forge/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/HNNUYUXUAN/labor-edu-forge/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)

面向师范生和新教师的劳动教育备课工作台。通过三步引导生成可编辑的教学设计、学习任务单、评价量表和声明式动画，并导出包含四份 Word 文档的 ZIP。

[快速上手](#首次启动) · [动画演示](#内置案例动画) · [版本下载](https://github.com/HNNUYUXUAN/labor-edu-forge/releases) · [使用问题](https://github.com/HNNUYUXUAN/labor-edu-forge/issues)

![内置斜面搬运案例：左侧教学目标与教学流程，右侧动画播放器，可切换任务单和评价量表](docs/images/lesson-workbench.png)

## 可以完成什么

- 内置斜面搬运、杠杆称量、滑轮提水三个案例，无 Key 也可浏览和播放。
- 使用阿里云百炼 OpenAI 兼容接口；未配置 Key 时禁用生成与优化，不使用模拟结果替代真实调用。
- 分区编辑，停顿 800ms 自动保存；动画支持播放、暂停、进度拖动和重播。
- 物理动画按受约束的参数计算几何、受力和轨迹，模型负责文本与参数；理想模型假设在页面中注明。
- 中文使用宋体，西文与数字使用 Times New Roman；公式由本地 KaTeX 渲染，覆盖教学正文、动画标注和字幕。

当前版本是**本机单用户工具**，没有登录、租户隔离、配额或公网访问控制。前后端只监听 `127.0.0.1`，不要直接暴露到公网，详见 [SECURITY.md](SECURITY.md)。

| 备课成果 | 用在什么环节 |
|---|---|
| 教学设计 | 梳理教学目标、课堂流程、材料和安全提示 |
| 学习任务单 | 引导学生分工、操作、记录证据和反思 |
| 评价量表 | 从劳动技能、科学理解、安全意识与协作反思评价表现 |
| 动画演示 | 课堂中播放、暂停或拖动进度，解释动作与受力；支持用文字提出优化要求 |

导出包包含教学设计、学习任务单、评价量表和**动画说明**四份 Word 文档；动画在工作台中播放，导出包不包含视频。

## 内置案例动画

以下 GIF 均取自内置案例的实际页面播放器，按时间轴采集完整 0–40 秒画面，以 **2.5 倍速**循环展示。启动工作台后可按原速播放并查看原理、参数和教师提示；这些案例无需调用模型。

### 斜面搬运

器材箱贴合固定斜面上行，到顶端停稳。观察沿斜面的拉力、竖直向下的重力、垂直斜面的支持力和摩擦力，讨论“省力是否省功”。

![斜面搬运动画：器材箱沿斜面上升，受力箭头随箱体移动，到交接台前停稳](docs/images/inclined-plane.gif)

### 杠杆称量

扶平杆秤并移动秤砣，两侧力矩相等后松手。画面同步显示力臂、力矩与扶平力，帮助学生区分“被扶平”和“达到平衡”。

![杠杆称量动画：秤砣向外移动，右侧力矩增大，达到平衡时扶平力归零](docs/images/lever-weighing.gif)

### 滑轮提水

内置案例默认演示**定滑轮**：向下拉绳，水桶上升，两端移动距离相等，改变用力方向但不省力。工作台还支持动滑轮参数，其理想模型为两段绳承担载荷。

![定滑轮提水动画：绳端向下移动，水桶等距离上升，显示拉力和位移关系](docs/images/pulley-watering.gif)

演示采用页面注明的理想化或受约束物理模型，不能替代真实实验与课堂安全指导。素材来源与更新方法见 [展示素材说明](docs/images/README.md)。

## 字体与公式

正文、标题、表单和动画中的中文优先使用本机宋体（SimSun），西文与数字优先使用 Times New Roman。未安装这些字体时回退至随应用提供的思源宋体（Noto Serif SC）或系统衬线字体；仓库不分发宋体及 Times New Roman 字体文件。数学公式保留 KaTeX 的专业数学字形与间距，变量用斜体，单位用正体。

可在教学目标、活动说明、任务单、评价内容和动画说明中输入 `\(F=ma\)` 或 `$F=ma$`；独立公式可用 `\[s=2h\]` 或 `$$s=2h$$`。编辑时保留源码，完成编辑后显示公式。已有三个物理案例的普通文本公式兼容显示，不改写历史备课数据。Word 导出目前保留文本内容，手写 LaTeX 不会转换为 Word 原生公式。

公式资源随应用打包，运行时无需访问公式 CDN。渲染配置遵循 [KaTeX 安全选项](https://katex.org/docs/options)：禁用可信 HTML 与外部资源命令，限制展开次数；无法解析的公式回退为可读文本。手机上的动画画布可横向滑动，避免公式随整幅图缩小到难以辨认。

## 首次启动

需要 Node.js 24+、npm 和 Git。在仓库根目录运行。可选 Conda 环境：`conda env create -f environment.yml`，然后 `conda activate labor-edu-forge-dev`。

```powershell
git clone https://github.com/HNNUYUXUAN/labor-edu-forge.git
cd labor-edu-forge
npm ci
npm run dev
```

`npm ci` 使用锁文件安装依赖并构建共享包；`npm run dev` 启动前也会构建共享包，首次克隆无需手工准备 `dist`。打开 [本地工作台](http://localhost:5173)，API 默认位于 `http://127.0.0.1:37856`。无 Key 时可先试用案例。

**先体验，无需 Key：**点击左侧「案例模板」，选择任一案例，切换「教学设计 / 学习任务单 / 评价量表 / 动画演示」，点击播放或拖动进度。案例是只读的；生成自己的可编辑备课包需要配置模型。

**再生成自己的备课：**配置下方 Key 并重启服务，点击「基于案例备课」或「新建备课」，依次完成「选择主题 → 课堂设置 → 教学重点」。生成后分区编辑，确认自动保存完成，再按需优化动画并导出 ZIP。模型生成和优化会产生服务商调用费用。

![三步备课引导的第一步：选择内置案例或填写自己的劳动场景](docs/images/lesson-setup.png)

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
