# README 展示素材

这些素材来自本项目内置案例及备课引导页面，随项目按 Apache-2.0 发布，不含用户生成的备课内容、Key、私人端点或个人信息。

| 文件 | 来源 |
|---|---|
| `lesson-workbench.png` | `/templates/inclined-plane`，教学设计标签页 |
| `lesson-setup.png` | `/new?template=inclined-plane`，选择主题步骤 |
| `inclined-plane.gif` | `/templates/inclined-plane`，动画演示标签页 |
| `lever-weighing.gif` | `/templates/lever-weighing`，动画演示标签页 |
| `pulley-watering.gif` | `/templates/pulley-watering`，动画演示标签页，默认定滑轮 |

## 更新素材

1. 启动本地工作台，使用固定 Playwright Chromium 运行时，视口设为 1600 × 1000。等待页面字体加载完成；检查中文实际使用宋体、西文使用 Times New Roman，公式已完成 KaTeX 渲染。
2. 使用新的浏览器会话，只访问上表中的内置案例与引导页面。检查侧栏、输入框及状态信息，避免采集真实备课、用户输入或本机配置。
3. PNG 直接截取页面视口。GIF 只截取 `.animation-stage`，保留原始绘图、文字与受力标注，不修改页面内容或添加模型生成的示意图。
4. 先确认播放、暂停生效，再通过「动画进度」滑块逐帧采集 0–40 秒，每 0.25 秒一帧，共 161 帧。以 10 fps 编码，得到约 16 秒、2.5 倍速的循环 GIF；README 必须同步注明倍率。原始帧和采集脚本保留在仓库外或被忽略的 `output/` 中。
5. 检查起始、中间和结束画面，确认文字可读、动作完整，三个 GIF 总体积尽量控制在 1 MB 左右。更新后运行 `npm run security:check`，检查 README 相对链接及 GitHub 实际显示效果。

可用已安装的 FFmpeg 编码（不需要增加项目依赖）：

```sh
ffmpeg -framerate 10 -i frames/%03d.png -filter_complex "[0:v]split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle" -loop 0 demo.gif
```

这些 GIF 用于展示内置播放器，不代表一次真实模型生成结果。案例参数或播放器变化后应重新采集。
