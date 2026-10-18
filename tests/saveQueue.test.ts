import { describe, expect, it, vi } from 'vitest'
import { createSaveQueue } from '../client/src/lib/saveQueue'

describe('autosave queue', () => {
  it('saves all sections in order before export/navigation can continue', async () => {
    const saved: string[] = []
    const queue = createSaveQueue<string>(async section => {saved.push(section)}, () => {})
    queue.mark('lesson'); queue.mark('task'); queue.mark('rubric')
    expect(await queue.flush()).toBe(true)
    expect(saved).toEqual(['lesson', 'task', 'rubric'])
    queue.dispose()
  })
  it('keeps edits made during an in-flight write and serializes flush callers', async () => {
    let finish!: () => void
    const pending = new Promise<void>(resolve => {finish=resolve})
    const save = vi.fn().mockImplementationOnce(() => pending).mockResolvedValue(undefined)
    const state = vi.fn()
    const queue = createSaveQueue<string>(save, state)
    queue.mark('lesson')
    const first=queue.flush()
    queue.mark('lesson'); queue.mark('task')
    const second=queue.flush()
    finish()
    expect(await first).toBe(true); expect(await second).toBe(true)
    expect(save.mock.calls.map(args=>args[0])).toEqual(['lesson','lesson','task'])
    expect(state).toHaveBeenLastCalledWith('saved')
    queue.dispose()
  })
  it('keeps failed and queued edits for explicit retry', async () => {
    const save = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined)
    const queue=createSaveQueue<string>(save,()=>{})
    queue.mark('lesson'); queue.mark('task')
    expect(await queue.flush()).toBe(false)
    expect(await queue.flush()).toBe(true)
    expect(save.mock.calls.map(args=>args[0])).toEqual(['lesson','lesson','task'])
    queue.dispose()
  })
})
