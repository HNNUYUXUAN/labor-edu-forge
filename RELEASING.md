# 发布指南

## 检查发布内容

在没有生成或优化请求运行时执行构建；开发模式的自动重载会中断正在处理的请求。

```powershell
npm ci
npm run check
npm run license:check
npm audit --audit-level=high
npm run security:history
npm run security:all
git status --short
```

所有检查通过后审查暂存区和发布提交。当前分支、全部引用与完整 Git 对象库是不同范围，不能用单次当前文件扫描替代历史检查。真实 Key、业务空间地址、生成备课、截图、日志和测试产物均应留在私人目录中。

端到端测试使用仓库要求的预配置 Chromium；运行时版本不匹配时不要自动安装另一份浏览器。用现有固定运行时完成页面验证，并在发布记录中说明验证方式。真实模型验收需单独完成生成、编辑保存、动画优化、播放和导出，避免在此期间运行构建。

## 准备版本

1. 更新版本号和 `CHANGELOG.md`，提交经审核的源码；保证 `git status --short` 无未提交文件。
2. 推送 `main` 并确认发布提交的 CI 成功，再在该提交上创建注释标签，例如 `git tag -a v1.1.1 -m "Release v1.1.1"`。已有标签不要覆盖；先核对其指向。
3. 再运行 `npm run security:all`，检查标签、提交消息和残留对象。
4. 执行 `npm run release:source`。只分享新生成的源码 ZIP，不压缩整个开发目录。ZIP 不含 Git 历史、依赖、构建产物、本地环境文件或备课数据库。

源码 ZIP 可用于分发代码。若需要保留已审核的提交历史，应从已经通过完整扫描的仓库克隆或推送，不能复制其他旧开发仓库的 `.git`。

## 发布到远端

先创建空仓库并确认所属账号与可见性。配置实际远端地址后检查 `git remote -v`，远端 URL 不应嵌入访问令牌。只推送已审核的分支和版本标签：

```powershell
git push -u origin main
git push origin v1.1.1
```

不要使用 `--all`、`--mirror` 或未经协调的强制推送。按上一节顺序，确认 `main` 的发布提交 CI 成功后再推送标签；标签 CI 成功后，用同一标签创建 Release，附上 `CHANGELOG.md` 对应版本说明、已审核源码包和 `SHA256SUMS.txt`。CI 不调用真实模型，也不需要配置模型 Key。

在托管平台启用适用的 secret scanning、push protection 和私密漏洞报告，并为主分支配置必需的 CI 检查。平台是否提供这些功能以仓库实际设置为准。

### 同步 Gitee

项目的独立 Gitee 仓库为 `https://gitee.com/hnnuxuan/labor-edu-forge`。首次配置远程：

```powershell
git remote add gitee https://gitee.com/hnnuxuan/labor-edu-forge.git
```

完成上述 GitHub CI 与 Release 验证后，将同一提交和版本标签同步到 Gitee：

```powershell
git push gitee main
git push gitee v1.1.1
```

在 Gitee 创建对应版本的 Release，上传同一份源码 ZIP 与 `SHA256SUMS.txt`，并附上版本说明和 GitHub CI 记录。重新匿名下载 Gitee 附件，核对 SHA-256；检查两处 main 与标签的提交一致，确认公开克隆和 README 中的安装入口可用。后续发布时将示例版本号替换为目标版本。

## 验证下载后的首次使用

从 GitHub Release 重新下载源码 ZIP 和校验文件，在全新目录解压并核对 SHA-256。按 README 执行 `npm ci`、`npm run dev`，先在空配置、空数据环境中打开三个案例，检查播放、暂停、进度拖动与重播；再填写本机模型配置并重启，通过页面生成备课、编辑保存、下载四份 Word，检查公式与分页。最后执行构建并验证构建预览。

验收环境使用独立的数据目录，下载内容与生成材料留在本机。将发现的改进提交到后续维护版本；已发布标签与源码附件保持对应，下载流程的补充说明可同步到 Release 正文。

## 历史清理后的核验

凭证一旦泄露，必须先在服务商控制台禁用或删除。删除引用和垃圾回收只处理当前本地副本；不能撤销凭证，也不能删除其他克隆、远端缓存、PR 或附件中的副本。

重写历史前确认工作区内容已保存、没有其他工作树或进程正在写入 Git，并协调所有协作者。清理后核对所有引用，过期相关 reflog，并清除不再需要的残留对象，运行 `npm run security:all`。对于已知泄露对象，还应确认 `git cat-file -e <对象哈希>` 已无法读取。不要在报告中粘贴 Key 原文。

若远端曾收到泄露历史，需单独处理远端分支、标签、缓存和附件，并要求协作者重新克隆。当前本地扫描通过不能证明托管平台或其他副本也已清理。
