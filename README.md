# 劳育备课工坊

面向师范生和新教师的劳动教育备课工作台。从一个真实劳动场景出发，经三步引导生成可继续编辑的教学设计、学习任务单、评价量表与声明式动画演示，并导出为四份 Word 文档组成的 ZIP。

## 产品原则

- 真实任务优先：劳动技能、学科理解与安全要求必须落到可操作过程。
- 诚实使用 AI：未配置百炼密钥时可以浏览案例，但生成和动画优化明确禁用，不返回伪造结果。
- 教师保有控制权：生成内容按分区编辑，停顿 800ms 自动保存，导出后仍可在 Word 中修改。
- 通用能力复用开源：Reka UI、VeeValidate、Zod、VueUse、lowdb、OpenAI SDK、Anime.js、docx 与 JSZip 分别承担成熟基础能力。

## 本地运行

需要 Node.js 24+，也可以使用仓库提供的 Conda 环境：

```powershell
conda env create -f environment.yml
conda activate labor-edu-forge-dev
npm install
Copy-Item server/.env.example server/.env.local
npm run dev
```

访问 `http://localhost:5173`，API 默认位于 `http://localhost:37856`。

在 `server/.env.local` 中设置自己的 `DASHSCOPE_API_KEY`。密钥只由本地 Express 服务读取，不会发送给浏览器或写入仓库。百炼兼容地址和模型均可覆盖。

## 质量检查

```powershell
npm run typecheck
npm run test
npm run build
npm run test:e2e
npm run license:check
npm audit
```

端到端测试使用显式的 E2E fixture 服务，不会请求真实模型，也不会成为生产运行时的回退路径。

## 项目结构

- `client`：Vue 3 用户界面与 Anime.js 动画播放器。
- `server`：Express API、百炼适配、lowdb 存储和 DOCX/ZIP 导出。
- `packages/shared`：前后端共享的 Zod Schema 与 TypeScript 类型。

接口和数据流见 [ARCHITECTURE.md](ARCHITECTURE.md)，贡献方式见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可证

项目以 [Apache License 2.0](LICENSE) 开源。第三方组件及其许可证见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
