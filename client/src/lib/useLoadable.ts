import { ref, shallowRef } from 'vue'
import { ApiError } from '../api/client'

export function useLoadable<T>(load: () => Promise<T>) {
  const data = shallowRef<T>()
  const loading = ref(true)
  const error = ref('')
  const missing = ref(false)
  let sequence = 0
  async function reload() {
    const current = ++sequence
    loading.value = true; error.value = ''; missing.value = false
    try { const value = await load(); if (current === sequence) data.value = value }
    catch (reason) {
      if (current !== sequence) return
      missing.value = reason instanceof ApiError && reason.status === 404
      error.value = missing.value ? '这份内容不存在或已经移走。' : '暂时无法连接本机服务。请确认服务已启动，然后重试。'
      data.value = undefined
    } finally { if (current === sequence) loading.value = false }
  }
  return { data, loading, error, missing, reload }
}
