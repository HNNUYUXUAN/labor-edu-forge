import { describe, expect, it } from 'vitest'
import { animationSpecSchema, buildLeverAnimation, buildPulleyAnimation, sampleLever, samplePulley, type LeverParameters, type PulleyParameters } from '@labor-edu-forge/shared'
import { lessonTemplates } from '../server/src/data/templates.js'

describe('lever weighing', () => {
  for (const loadMassKg of [0.4, 1.2, 1.6]) {
    it(`holds the beam with the correct force until the ${loadMassKg} kg load balances`, () => {
      const p: LeverParameters = { loadMassKg, counterweightMassKg: 0.8, loadArmM: 0.2, startFraction: 0.5, moveStart: 3, moveDuration: 18 }
      for (const time of [0, 3, 7.5, 12, 16.5, 21, 30]) {
        const g = sampleLever(p, time)
        expect(g.counterTorque + g.handForce * p.loadArmM).toBeCloseTo(g.loadTorque, 10)
        expect(g.reaction + g.handForce).toBeCloseTo(g.loadForce + g.counterForce, 10)
        expect((g.pivot.x - g.loadX) / 600).toBeCloseTo(p.loadArmM, 10)
        expect((g.counterX - g.pivot.x) / 600).toBeCloseTo(g.counterArmM, 10)
        expect(g.balanced).toBe(time >= 21)
        if (time >= 21) { expect(g.handForce).toBeCloseTo(0, 10); expect(g.counterTorque).toBeCloseTo(g.loadTorque, 10) }
        else expect(g.handForce).toBeGreaterThan(0)
      }
      expect(sampleLever(p, 12).counterX).toBeCloseTo((sampleLever(p, 3).counterX + sampleLever(p, 21).counterX) / 2, 10)
      const spec = buildLeverAnimation({ ...lessonTemplates[1].content.animation, lever: p })
      expect(animationSpecSchema.safeParse(spec).success).toBe(true)
      expect(buildLeverAnimation(spec)).toEqual(spec)
    })
  }
  it('rejects an unreachable balance arm and conflicting physical scene parameters', () => {
    const spec = structuredClone(lessonTemplates[1].content.animation)
    spec.lever!.counterweightMassKg = 0.1
    expect(animationSpecSchema.safeParse(spec).success).toBe(false)
    spec.lever!.counterweightMassKg = 0.8
    spec.pulley = lessonTemplates[2].content.animation.pulley
    expect(animationSpecSchema.safeParse(spec).success).toBe(false)
  })
})

describe('ideal pulley mechanisms', () => {
  for (const mode of ['fixed', 'movable'] as const) {
    for (const liftHeightM of [0.2, 0.8, 1]) {
      it(`${mode}: conserves rope length and work over a ${liftHeightM} m lift`, () => {
        const p: PulleyParameters = { mode, liftHeightM, massKg: 2, moveStart: 3, moveDuration: 18 }
        const start = samplePulley(p, 0)
        for (const time of [0, 3, 7.5, 12, 16.5, 21, 30]) {
          const g = samplePulley(p, time)
          expect(g.ropeLengthPx).toBeCloseTo(start.ropeLengthPx, 10)
          expect(g.pulledM).toBeCloseTo(g.strands * g.liftedM, 10)
          expect(g.strands * g.tension).toBeCloseTo(g.weight, 10)
          expect(g.tension * g.pulledM).toBeCloseTo(g.weight * g.liftedM, 10)
          expect(g.freeEnd.y - start.freeEnd.y).toBeCloseTo(g.strands * (start.hook.y - g.hook.y), 10)
          expect(g.freeEnd.y + 48).toBeLessThanOrEqual(540)
          if (g.movingWheel) {
            expect(g.hook.y - g.movingWheel.y).toBe(30)
            // No-slip on the left fixed rope: counterclockwise rotation cancels upward axle velocity.
            expect(g.movingAngle * Math.PI / 180 * g.movingWheel.r).toBeCloseTo(-g.liftedM * 120, 10)
          } else expect(g.wheel).toEqual(start.wheel)
          expect(g.wheelAngle * Math.PI / 180 * g.wheel.r).toBeCloseTo(g.pulledM * 120, 10)
        }
        const spec = buildPulleyAnimation({ ...lessonTemplates[2].content.animation, pulley: p })
        expect(animationSpecSchema.safeParse(spec).success).toBe(true)
        expect(buildPulleyAnimation(spec)).toEqual(spec)
      })
    }
  }
  it('slows the lift without changing the final height, ratio or force', () => {
    const p = lessonTemplates[2].content.animation.pulley!
    const fast = { ...p, moveStart: 0, moveDuration: 10 }
    const slow = { ...fast, moveDuration: 20 }
    expect(samplePulley(slow, 5).liftedM * 2).toBeCloseTo(samplePulley(fast, 5).liftedM)
    expect(samplePulley(slow, 20)).toEqual(samplePulley(fast, 10))
  })
})
