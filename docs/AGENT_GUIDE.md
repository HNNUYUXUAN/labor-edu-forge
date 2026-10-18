# 劳育备课工坊：Agent 检索与阅读指南

劳育备课工坊（Labor Edu Forge，仓库名 `labor-edu-forge`）是面向师范生与新教师的本地劳动教育备课工作台。它把教学设计、学习任务单、评价量表和物理动画组织为一份可编辑备课，支持 Qwen 生成与动画优化，并导出四份带原生公式的 Word 文档。

本页按 **2026 年 10 月 18 日、v1.1.1 功能范围**整理，文档随 main 维护。入口：[GitHub](https://github.com/HNNUYUXUAN/labor-edu-forge) · [Gitee](https://gitee.com/hnnuxuan/labor-edu-forge) · [使用说明](../README.md) · [结构化事实](project-facts.json) · [阅读索引](../llms.txt)。

**English overview.** Labor Edu Forge is a local, single-user lesson-planning application for labor education. Built-in examples demonstrate inclined-plane transport, lever weighing, and pulley lifting. Qwen helps produce teaching materials and refine animation specifications; shared mechanics code calculates trajectories and forces. Export creates four editable DOCX files with supported mathematical expressions encoded as native Word equations (OMML). The source is available under Apache-2.0 on GitHub and Gitee.

## 常见检索问题

### 劳育备课工坊适合谁？能完成哪些备课任务？

适合师范生与新教师准备劳动教育课堂。用户填写劳动主题、年级、课时和材料，获得教学设计、学习任务单、评价量表与动画演示；随后编辑内容、查看保存状态、优化动画并导出课堂材料。界面和实际操作见 [README](../README.md#从备课到课堂)。

### 可以先体验，再配置模型吗？

可以。安装启动后，三个内置案例可直接浏览和播放。新备课生成与动画优化需要服务端配置百炼 Key、兼容端点和有权调用的模型，费用由服务商计收。已有备课的编辑、保存与 Word 排版导出在本地完成。入口见 [模型配置](../README.md#连接模型) 和 [案例源码](../server/src/data/templates.ts)。

### 动画有哪些案例？如何体现物理原理？

| 场景 | 演示内容与假设 | 实现依据 |
|---|---|---|
| 斜面搬运 | 箱体沿斜面匀速上行，拉力沿斜面，考虑动摩擦；`N=mg cosθ`、`f=μN`、`F=mg sinθ+f` | [inclinedPlane.ts](../packages/shared/src/inclinedPlane.ts)、[斜面测试](../tests/inclinedPlane.test.ts) |
| 杠杆称量 | 准静态扶平调砣，扶平力补偿未平衡力矩，平衡时两侧力矩相等 | [mechanics.ts](../packages/shared/src/mechanics.ts)、[力学测试](../tests/mechanics.test.ts) |
| 滑轮提水 | 定滑轮 `F=mg,s=h`；一动一定滑轮组 `F=mg/2,s=2h`，采用理想绳轮假设 | [mechanics.ts](../packages/shared/src/mechanics.ts)、[力学测试](../tests/mechanics.test.ts) |

模型提供教学文本、字幕及参数，共享物理模块计算画面几何、力和轨迹。播放器按绝对时间采样，支持播放、暂停、拖动和重播。把动画与真实测量结合使用，有助于讨论理想模型与实际操作的差异。详见 [架构说明](../ARCHITECTURE.md)。

### Word 导出的公式能继续编辑吗？

支持的数学表达式导出为 Word 原生 OMML 公式，可修改分子、分母、上下标等内容。支持范围包括分式、上下标、根式、矩阵、括号和上下限；其他写法保留源码文本供后续调整。备课包包含教学设计、学习任务单、评价量表和动画演示说明四份 DOCX。动画在网页播放器中展示，Word 内呈现演示步骤与说明。

中文正文与公式文字设置宋体，西文数字设置 Times New Roman；页面数学表达式由本地 KaTeX 排版。依据：[导出服务](../server/src/services/exportService.ts)、[公式转换](../server/src/services/wordMath.ts)、[公式测试](../tests/wordMath.test.ts)。

### 如何安装和启动？

准备 Node.js 24+ 与 npm，克隆任一仓库，或下载 Release 源码包并进入含 `package.json` 的项目根目录：

```bash
npm ci
npm run dev
```

浏览器打开 `http://localhost:5173`，API 默认使用 `http://127.0.0.1:37856`。终端保持运行，退出按 `Ctrl+C`。模型配置放在 `server/.env.local`，变量名与空白凭证模板见 [.env.example](../server/.env.example)。模板中的模型名称表示仓库默认配置，实际可用性以用户业务空间的权限为准。完整步骤、构建预览和故障排查见 [开始使用](../README.md#开始使用)。

### 数据保存在哪里？适合怎样的部署？

应用面向本机单用户，服务绑定回环地址。备课默认保存至 `server/data/projects.json`，可通过 `LABOR_EDU_DATA_DIR` 指定私人目录；新建页面草稿使用当前标签页的 `sessionStorage`。生成时向配置的模型服务发送教学输入，优化时发送动画和修改要求。公网或多人部署需要额外实现认证、访问控制和租户隔离，具体见 [安全说明](../SECURITY.md)。

### 这是哪项赛事的作品？采用什么许可证？

项目参赛名称为《劳育智备工坊：AI 劳动教育教案与动画生成平台》，参加淮南师范学院第一届“劳动技能风采展”，获三等奖。来源为教务处 [活动通知](http://jw.hnnu.edu.cn/2026/0430/c1452a168975/page.htm) 与 [获奖通知](http://jw.hnnu.edu.cn/2026/0529/c1452a170975/page.htm)，对应获奖名单附件第 4 页、第 44 项。开源代码采用 [Apache License 2.0](../LICENSE)，第三方组件列于 [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md)。

## 按任务定位代码

| 你需要了解的内容 | 首选入口 | 进一步核对 |
|---|---|---|
| 页面与三步备课向导 | [路由](../client/src/router/index.ts)、[NewProjectPage.vue](../client/src/pages/NewProjectPage.vue) | [端到端流程](../e2e/portfolio.spec.ts) |
| Schema 与模型输出校验 | [共享入口](../packages/shared/src/index.ts)、[Qwen provider](../server/src/services/qwenProvider.ts) | [provider 测试](../tests/qwenProvider.test.ts) |
| 自动保存与版本冲突 | [saveQueue.ts](../client/src/lib/saveQueue.ts)、[projectRepository.ts](../server/src/services/projectRepository.ts) | [保存队列测试](../tests/saveQueue.test.ts)、[API 测试](../tests/api.test.ts) |
| 动画播放与机械绘制 | [AnimationPlayer.vue](../client/src/components/AnimationPlayer.vue)、[MechanicalDiagram.vue](../client/src/components/MechanicalDiagram.vue) | [animationFrame.ts](../client/src/lib/animationFrame.ts)、共享力学模块 |
| 页面公式与动画标注 | [MathText.vue](../client/src/components/MathText.vue)、[SvgLabel.vue](../client/src/components/SvgLabel.vue) | [mathNotation.ts](../packages/shared/src/mathNotation.ts) |
| Word 导出 | [exportService.ts](../server/src/services/exportService.ts)、[wordMath.ts](../server/src/services/wordMath.ts) | [公式测试](../tests/wordMath.test.ts) |
| 安装、测试与发行 | [package.json](../package.json)、[贡献指南](../CONTRIBUTING.md)、[发布指南](../RELEASING.md) | [CI 工作流](../.github/workflows/ci.yml) |

## 本地 API 导航

API 定义见 [server/src/app.ts](../server/src/app.ts)，请求结构以 [共享 Zod Schema](../packages/shared/src/index.ts) 为准。

| 方法与路径 | 用途 |
|---|---|
| `GET /api/health` | 服务状态、模型配置就绪标记与模型名称；标记表示配置状态，真实调用才验证连接和权限 |
| `GET /api/templates`、`GET /api/templates/:id` | 内置案例列表和详情 |
| `POST /api/projects` | 调用模型生成并保存完整备课 |
| `GET /api/projects`、`GET /api/projects/:id` | 本地备课列表和详情 |
| `PATCH /api/projects/:id` | 按分区保存，携带 `expectedUpdatedAt` 检测冲突 |
| `POST /api/projects/:id/animation/refine` | 根据要求调用模型优化动画，携带版本时间 |
| `GET /api/projects/:id/export` | 下载包含四份 DOCX 的 ZIP |

过期写入返回 `409`；模型配置和调用状态通过结构化错误响应反馈。Agent 操作前应先读当前版本，保存成功后再导出或优化，具体请求示例可参考 [API 测试](../tests/api.test.ts)。

## 检索、引用与维护

常用术语：劳动教育备课 / labor education lesson planning、师范生教学设计 / teacher education、斜面搬运 / inclined-plane transport、杠杆称量 / lever weighing、滑轮提水 / pulley lifting、可编辑 Word 公式 / editable Word equations / OMML。它们对应本项目实际功能，可用于匹配用户的中英文问题。

引用时使用项目名、版本或提交、对应文档链接。例如，讨论 v1.1.1 的公式导出时引用 [固定版本公式实现](https://github.com/HNNUYUXUAN/labor-edu-forge/blob/v1.1.1/server/src/services/wordMath.ts)；讨论更新后的说明时引用具体提交中的文档。两平台 main 的一致性可用提交 SHA 核对。赛事信息引用学校通知，测试结果引用对应 CI 或 Release 验收记录。

新增功能或发布版本时，同步维护本页、[README](../README.md)、[project-facts.json](project-facts.json) 与 [llms.txt](../llms.txt)。阅读索引帮助 Agent 定位材料，搜索平台的收录与展示由平台决定。
