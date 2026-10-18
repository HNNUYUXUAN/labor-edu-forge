export type SaveState = 'saved' | 'saving' | 'error'

/** Serialize versioned section writes so rapid tab changes and edits during requests survive. */
export function createSaveQueue<T>(save: (section: T) => Promise<void>, state: (value: SaveState, error?: unknown) => void, delay = 800) {
  const dirty = new Map<T, number>()
  let revision = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  let active: Promise<boolean> | undefined

  function flush(): Promise<boolean> {
    clearTimeout(timer)
    if (active) return active
    active = (async () => {
      try {
        while (dirty.size) {
          const [section, version] = dirty.entries().next().value!
          state('saving')
          await save(section)
          if (dirty.get(section) === version) dirty.delete(section)
        }
        state('saved')
        return true
      } catch (error) {
        state('error', error)
        return false
      }
    })().finally(() => { active = undefined })
    return active
  }
  return {
    mark(section: T) {
      dirty.set(section, ++revision)
      state('saving')
      clearTimeout(timer)
      timer = setTimeout(() => { void flush() }, delay)
    },
    flush,
    dispose() { clearTimeout(timer) },
  }
}
