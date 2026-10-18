import { describe, expect, it } from 'vitest'
import { animationSpecSchema, buildInclinedPlaneAnimation, inclinedPlaneGeometry } from '@labor-edu-forge/shared'
import { lessonTemplates } from '../server/src/data/templates.js'
import { compileAnimationFrames } from '../client/src/lib/animationFrame.js'

describe('inclined plane physics and playback', () => {
  for (const angleDegrees of [10, 20, 30]) {
    for (const frictionCoefficient of [0, 0.1, 0.3]) {
      it(`keeps contact and force balance at ${angleDegrees} degrees, friction ${frictionCoefficient}`, () => {
        const parameters = { angleDegrees, frictionCoefficient, massKg: 2, moveStart: 2, moveDuration: 20 }
        const spec = buildInclinedPlaneAnimation({ ...lessonTemplates[0].content.animation, inclinedPlane: parameters })
        expect(animationSpecSchema.safeParse(spec).success).toBe(true)
        const g = inclinedPlaneGeometry(parameters)
        // Up-slope pulling + down-slope friction + normal reaction + vertical weight = zero.
        expect((g.pull - g.friction) * g.tangent.x + g.support * g.normal.x).toBeCloseTo(0, 10)
        expect((g.pull - g.friction) * g.tangent.y + g.support * g.normal.y + g.weight).toBeCloseTo(0, 10)
        const tracks = compileAnimationFrames(spec)
        const loadIndex = spec.objects.findIndex((object) => object.id === 'load')
        const pullIndex = spec.objects.findIndex((object) => object.id === 'pull')
        for (const time of [0, 2, 7, 12, 17, 22, 40]) {
          const load = tracks[loadIndex](time)
          const pull = tracks[pullIndex](time)
          expect(pull.x).toBeCloseTo(load.x, 10)
          expect(pull.y).toBeCloseTo(load.y, 10)
          // Both bottom corners remain on the finite ramp segment at every sample.
          for (const offset of [0, g.width]) {
            const x = load.object.position.x + load.x - g.height * g.normal.x + offset * g.tangent.x
            const y = load.object.position.y + load.y - g.height * g.normal.y + offset * g.tangent.y
            expect((x - g.foot.x) * g.normal.x + (y - g.foot.y) * g.normal.y).toBeCloseTo(0, 8)
            const distance = (x - g.foot.x) * g.tangent.x + (y - g.foot.y) * g.tangent.y
            expect(distance).toBeGreaterThanOrEqual(0)
            expect(distance).toBeLessThanOrEqual(g.length + 1e-8)
          }
        }
        const midpoint = tracks[loadIndex](12)
        const end = tracks[loadIndex](22)
        expect(midpoint.x * 2).toBeCloseTo(end.x, 10)
        expect(midpoint.y * 2).toBeCloseTo(end.y, 10)
        // Seeking backwards and replaying have no cumulative drift.
        expect(tracks[loadIndex](0).x).toBe(0)
        expect(tracks[loadIndex](12)).toEqual(midpoint)
      })
    }
  }

  it('slows motion by increasing duration while preserving the endpoint', () => {
    const before = lessonTemplates[0].content.animation
    const fast = buildInclinedPlaneAnimation({ ...before, inclinedPlane: { ...before.inclinedPlane!, moveStart: 0, moveDuration: 10 } })
    const slow = buildInclinedPlaneAnimation({ ...fast, inclinedPlane: { ...fast.inclinedPlane!, moveDuration: 20 } })
    const load = fast.objects.findIndex((object) => object.id === 'load')
    const fastFrame = compileAnimationFrames(fast)[load]
    const slowFrame = compileAnimationFrames(slow)[load]
    expect(slowFrame(5).x * 2).toBeCloseTo(fastFrame(5).x)
    expect(slowFrame(20)).toEqual(fastFrame(10))
  })

  it('rejects motion and captions extending beyond total duration', () => {
    const spec = structuredClone(lessonTemplates[0].content.animation)
    spec.inclinedPlane!.moveDuration = spec.duration
    spec.captions.push({ at: spec.duration + 1, text: '超时字幕' })
    expect(animationSpecSchema.safeParse(spec).success).toBe(false)
  })

  it('treats repeated move coordinates as absolute targets, not increments', () => {
    const spec = structuredClone(lessonTemplates[1].content.animation)
    const targetId = spec.objects[0].id
    spec.timeline = [
      { targetId, action: 'move', at: 0, duration: 2, params: { x: 50, y: -25 } },
      { targetId, action: 'move', at: 4, duration: 2, params: { x: 50, y: -25 } },
    ]
    const frame = compileAnimationFrames(spec)[0]
    expect(frame(6).x).toBe(50)
    expect(frame(1).x).toBe(25)
  })
})
