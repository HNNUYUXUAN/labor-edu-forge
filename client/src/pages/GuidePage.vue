<template>
  <section class="collection-page guide-page">
    <header class="collection-header">
      <div><span class="eyebrow">QUICK START</span><h1>三步完成一套备课包</h1><p>先从真实劳动情境出发，再补齐教学目标与任务重点。系统会一次生成四份可以继续编辑的课堂材料。</p></div>
      <RouterLink class="button primary" to="/new">开始备课<ArrowRight :size="20" /></RouterLink>
    </header>
    <div class="guide-grid">
      <article><span>01</span><h2>描述情境</h2><p>选用案例模板，或写下学生要解决的真实劳动问题。场景越具体，生成结果越可执行。</p></article>
      <article><span>02</span><h2>确定任务</h2><p>设置学段、课时、学科知识点和育人重点。刷新页面时，会话草稿仍会自动恢复。</p></article>
      <article><span>03</span><h2>生成与打磨</h2><p>在工作台中编辑教学设计、任务单和量规；动画优化会经过安全 Schema 校验后才播放。</p></article>
    </div>
    <section class="guide-detail">
      <h2>生成前需要知道</h2>
      <div><strong>没有模型密钥</strong><p>仍可浏览全部示例；生成入口会明确提示配置方法，不会用伪造结果冒充 AI 输出。</p></div>
      <div><strong>自动保存</strong><p>编辑停顿 800 毫秒后保存。看到“已保存”再关闭页面；失败时本地内容不会被清空。</p></div>
      <div><strong>导出内容</strong><p>ZIP 内包含教学设计、学习任务单、评价量表和动画演示说明四份可编辑 Word。</p></div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { ArrowRight } from '@lucide/vue'
</script>
