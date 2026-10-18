import type { AnimationSpec } from '@labor-edu-forge/shared'

type Segment = { at: number; duration: number; from: number; to: number; easing?: 'linear' | 'easeInOut' }
const last = <T>(items: T[]) => items[items.length - 1]
const valueAt = (segment: Segment, time: number) => {
  const progress = segment.duration === 0 ? 1 : Math.max(0, Math.min(1, (time - segment.at) / segment.duration))
  const eased = segment.easing === 'easeInOut' ? progress * progress * (3 - 2 * progress) : progress
  return segment.from + (segment.to - segment.from) * eased
}

/** Absolute offsets from the initial SVG position; seeking and replay sample the same tracks. */
export function compileAnimationFrames(spec: AnimationSpec) {
  return spec.objects.map((object) => {
    const tracks = { x: [] as Segment[], y: [] as Segment[], rotation: [] as Segment[], opacity: [] as Segment[] }
    const actions = spec.timeline.filter((action) => action.targetId === object.id).sort((a, b) => a.at - b.at)
    const add = (key: keyof typeof tracks, to: number, action: typeof actions[number]) => {
      if (!Number.isFinite(to)) return
      const track = tracks[key]
      const previous = track[track.length - 1]
      const from = previous ? valueAt(previous, action.at) : key === 'opacity' ? 1 : 0
      track.push({ at: action.at, duration: action.duration ?? 1.2, easing: action.easing, from, to })
    }
    for (const action of actions) {
      if (action.action === 'move') { add('x', Number(action.params.x ?? 0), action); add('y', Number(action.params.y ?? 0), action) }
      if (action.action === 'rotate') add('rotation', Number(action.params.degree ?? 0), action)
      if (action.action === 'fade') add('opacity', Number(action.params.opacity ?? 0.25), action)
    }
    return (time: number) => {
      const sample = (key: keyof typeof tracks, initial: number) => {
        const active = last(tracks[key].filter((segment) => segment.at <= time))
        return active ? valueAt(active, time) : initial
      }
      const color = last(actions.filter((action) => action.action === 'highlight' && action.at <= time))?.params.color
      const text = last(actions.filter((action) => action.action === 'showText' && action.at <= time))?.params.text
      return { object, x: sample('x', 0), y: sample('y', 0), rotation: sample('rotation', 0), opacity: sample('opacity', 1), color, text }
    }
  })
}
