# 架构说明

浏览器通过 Vue Router 进入三步备课向导。VeeValidate 管理字段状态，Zod Schema 是提交前与服务端接收后的共同验证边界，VueUse 负责会话草稿和 800ms 自动保存防抖。

Express 提供固定的 `/api/health`、`/api/templates` 与 `/api/projects` 系列接口。生成请求由官方 OpenAI Node SDK 转发到百炼兼容端点；返回 JSON 必须通过共享 Zod Schema，动画对象、动作白名单和目标引用必须全部有效后才能写入 lowdb。

项目按完整备课包原子创建，按 `lessonDesign`、`studentTaskSheet`、`rubric`、`animation` 四个分区更新。客户端携带 `expectedUpdatedAt`，服务端对过期写入返回 409，避免静默覆盖。

导出服务用 `docx` 生成四份可编辑 Word，再由 JSZip 打包。E2E fixture 仅由 `server/src/e2e.ts` 显式启动，不进入生产入口，也不会在模型失败时被调用。
