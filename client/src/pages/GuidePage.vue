<template>
  <section class="collection-page guide-page">
    <header class="collection-header">
      <div><span class="eyebrow">QUICK START</span><h1>三步完成一套备课包</h1><p>先从真实劳动情境出发，再补齐教学目标与任务重点。系统会一次生成四份可以继续编辑的课堂材料。</p></div>
      <RouterLink class="button primary" to="/new">开始备课<ArrowRight :size="20" /></RouterLink>
    </header>
    <div class="guide-grid">
      <article><span>01</span><h2>描述情境</h2><p>选用案例模板，或写下学生要解决的真实劳动问题。场景越具体，生成结果越可执行。</p></article>
      <article><span>02</span><h2>确定任务</h2><p>设置学段、课时、学科知识点和育人重点。刷新页面时，会话草稿仍会自动恢复。</p></article>
      <article><span>03</span><h2>生成与打磨</h2><p>检查教学内容后继续编辑。播放动画确认演示效果，也可以用一句话调整动画速度或物理参数。</p></article>
    </div>
    <section class="guide-detail">
      <h2>生成前需要知道</h2>
      <div><strong>第一次使用</strong><p>不必先配置模型，可以从<RouterLink to="/templates">案例模板</RouterLink>查看完整备课结构和播放动画。案例只读，“基于案例备课”会为你的课堂生成新内容。</p></div>
      <div><strong>配置生成服务</strong><p>请由本机维护者按照项目 README，在服务端环境文件填写百炼 API Key，确认模型权限后重启后端。回到新建备课页点击“重新检查”。不要把 Key 填进教学要求。</p></div>
      <div><strong>等待生成</strong><p>完整备课或动画优化可能需要数分钟。保持页面打开，无需重复点击。失败时查看提示，输入要求仍会保留，可调整后重试。</p></div>
      <div><strong>保存与恢复</strong><p>编辑停顿后会自动保存，切换分区不会漏掉待保存的修改。导出和离开项目前会先完成保存。若保存失败，请重试，或先下载当前草稿备份；未保存的内容关闭页面后可能丢失。</p></div>
      <div><strong>导出与课堂使用</strong><p>导出 ZIP 包含教学设计、学习任务单、评价量表和动画演示说明四份 Word，可解压后继续编辑。动画说明不是视频；动态演示请在工作台播放。课堂使用前请核对安全条件和物理模型假设。</p></div>
      <div><strong>信息放在哪里</strong><p>已生成备课保存在本机；新建页草稿仅在当前浏览器标签页中保留。生成时，教学要求会发送给所配置的模型服务，请避免填写学生姓名、联系方式等个人信息。</p></div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { ArrowRight } from '@lucide/vue'
</script>
