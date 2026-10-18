import type { AnimationSpec, LeverParameters, PulleyParameters } from './index.js'
import { buildInclinedPlaneAnimation, isInclinedPlaneAnimation } from './inclinedPlane.js'

export function physicsKind(spec: Pick<AnimationSpec, 'title' | 'sceneType' | 'inclinedPlane' | 'lever' | 'pulley'>, topic = ''): 'inclinedPlane' | 'lever' | 'pulley' | undefined {
  // The supplied teaching context takes precedence over model-generated labels.
  if (/杠杆|杆秤/.test(topic)) return 'lever'
  if (/滑轮/.test(topic)) return 'pulley'
  if (/斜面/.test(topic)) return 'inclinedPlane'
  if (spec.lever || spec.sceneType === 'lever' || /杠杆|杆秤/.test(spec.title)) return 'lever'
  if (spec.pulley || spec.sceneType === 'pulley' || /滑轮/.test(spec.title)) return 'pulley'
  if (isInclinedPlaneAnimation(spec)) return 'inclinedPlane'
}

const progressAt = (p: { moveStart: number; moveDuration: number }, time: number) => Math.max(0, Math.min(1, (time - p.moveStart) / p.moveDuration))

/** Quasi-static weighing: an upward hand force holds the load side horizontal until balanced. */
export function sampleLever(p: LeverParameters, time: number) {
  const progress = progressAt(p, time)
  const balanceArmM = p.loadMassKg * p.loadArmM / p.counterweightMassKg
  const counterArmM = balanceArmM * (p.startFraction + (1 - p.startFraction) * progress)
  const loadForce = p.loadMassKg * 9.8, counterForce = p.counterweightMassKg * 9.8
  const loadTorque = loadForce * p.loadArmM, counterTorque = counterForce * counterArmM
  const handForce = Math.max(0, (loadTorque - counterTorque) / p.loadArmM)
  const reaction = loadForce + counterForce - handForce
  const pivot = { x: 370, y: 250 }
  return { progress, balanceArmM, counterArmM, loadForce, counterForce, loadTorque, counterTorque, handForce, reaction, pivot,
    loadX: pivot.x - p.loadArmM * 600, counterX: pivot.x + counterArmM * 600, balanced: progress === 1 }
}

/** Ideal, inextensible rope. The movable pulley uses a fixed top pulley to redirect the free end downwards. */
export function samplePulley(p: PulleyParameters, time: number) {
  const progress = progressAt(p, time), strands = p.mode === 'movable' ? 2 : 1
  const liftedM = p.liftHeightM * progress, pulledM = strands * liftedM, liftPx = liftedM * 120
  const weight = p.massKg * 9.8, tension = weight / strands
  if (p.mode === 'fixed') {
    const wheel = { x: 480, y: 170, r: 36 }, hook = { x: 444, y: 360 - liftPx }, freeEnd = { x: 516, y: 240 + liftPx }
    return { progress, strands, liftedM, pulledM, weight, tension, wheel, movingWheel: undefined, hook, freeEnd,
      wheelAngle: liftPx / wheel.r * 180 / Math.PI, movingAngle: 0,
      ropeLengthPx: hook.y - wheel.y + freeEnd.y - wheel.y + Math.PI * wheel.r,
      ropePath: `M ${hook.x} ${hook.y} V 170 A 36 36 0 0 1 516 170 V ${freeEnd.y}` }
  }
  const wheel = { x: 466, y: 150, r: 36 }, movingWheel = { x: 400, y: 350 - liftPx, r: 30 }
  const hook = { x: 400, y: movingWheel.y + 30 }, freeEnd = { x: 502, y: 210 + 2 * liftPx }
  return { progress, strands, liftedM, pulledM, weight, tension, wheel, movingWheel, hook, freeEnd,
    wheelAngle: 2 * liftPx / wheel.r * 180 / Math.PI, movingAngle: -liftPx / movingWheel.r * 180 / Math.PI,
    ropeLengthPx: movingWheel.y - 90 + movingWheel.y - wheel.y + freeEnd.y - wheel.y + Math.PI * (wheel.r + movingWheel.r),
    ropePath: `M 370 90 V ${movingWheel.y} A 30 30 0 0 0 430 ${movingWheel.y} V 150 A 36 36 0 0 1 502 150 V ${freeEnd.y}` }
}

const timing = (spec: AnimationSpec) => ({ moveStart: Math.min(2, spec.duration * 0.1), moveDuration: spec.duration * 0.75 })
const line = (id: string, label: string, x: number, y: number, length: number, rotate = 0): AnimationSpec['objects'][number] =>
  ({ id, type: 'line', label, position: { x, y }, style: { length, rotate, stroke: '#525C69', strokeWidth: 5 } })
const rect = (id: string, label: string, x: number, y: number): AnimationSpec['objects'][number] =>
  ({ id, type: 'rect', label, position: { x, y }, style: { width: 80, height: 52, fill: '#E4B77E' } })
const move = (targetId: string, x: number, y: number, p: {moveStart: number; moveDuration: number}): AnimationSpec['timeline'][number] =>
  ({ targetId, action: 'move', at: p.moveStart, duration: p.moveDuration, easing: 'linear', params: { x, y } })

export function buildLeverAnimation(spec: AnimationSpec): AnimationSpec {
  const p = spec.lever ?? { loadMassKg: 1.2, counterweightMassKg: 0.8, loadArmM: 0.2, startFraction: 0.5, ...timing(spec) }
  const a = sampleLever(p, 0), b = sampleLever(p, spec.duration)
  return { ...spec, inclinedPlane: undefined, pulley: undefined, lever: p, sceneType: 'lever',
    canvas: { width: 960, height: 540, background: '#FAFBFC' },
    objects: [line('beam', '秤杆', 160, 250, 670), line('pivot', '固定支点', 370, 250, 155, 90),
      line('load-link', '吊绳', a.loadX, 250, 80, 90), rect('load', '待称物', a.loadX - 40, 330),
      line('counter-link', '秤砣挂钩', a.counterX, 250, 80, 90), rect('counterweight', '秤砣', a.counterX - 40, 330)],
    timeline: ['counterweight', 'counter-link'].map(id => move(id, b.counterX - a.counterX, 0, p)),
    captions: [...spec.captions].sort((a, b) => a.at - b.at),
    principle: `杆秤已调零，忽略秤杆和吊盘的自重及摩擦。调砣时手扶载荷侧保持秤杆水平，手的向上扶平力补偿未平衡力矩，不能提前松手。待称物质量 ${p.loadMassKg} kg，秤砣质量 ${p.counterweightMassKg} kg，载荷力臂 ${p.loadArmM} m。平衡条件 m物 g l物=m砣 g l砣，所需秤砣力臂为 ${b.balanceArmM.toFixed(3)} m，两侧力矩均为 ${b.loadTorque.toFixed(3)} N·m。到达平衡位置后扶平力降为零，松手保持水平。本演示是准静态称量步骤，不模拟失衡自由摆动。` }
}

export function buildPulleyAnimation(spec: AnimationSpec): AnimationSpec {
  const p = spec.pulley ?? { mode: 'fixed', massKg: 2, liftHeightM: 0.8, ...timing(spec) }
  const a = samplePulley(p, 0), b = samplePulley(p, spec.duration)
  const objects: AnimationSpec['objects'] = [
    { id: 'fixed-wheel', type: 'circle', label: '定滑轮', position: { x: a.wheel.x, y: a.wheel.y }, style: { radius: a.wheel.r, fill: '#DDE3E9' } },
    rect('bucket', '水桶', a.hook.x - 40, a.hook.y + 16), line('free-end', '绳端拉力', a.freeEnd.x, a.freeEnd.y, 50, 90),
  ]
  if (a.movingWheel) objects.push({ id: 'moving-wheel', type: 'circle', label: '动滑轮', position: {x: a.movingWheel.x, y: a.movingWheel.y}, style: { radius: a.movingWheel.r, fill: '#DDE3E9' } })
  return { ...spec, inclinedPlane: undefined, lever: undefined, pulley: p, sceneType: 'pulley',
    canvas: { width: 960, height: 540, background: '#FAFBFC' }, objects,
    timeline: [move('bucket', 0, b.hook.y-a.hook.y, p), move('free-end', 0, b.freeEnd.y-a.freeEnd.y, p),
      ...(a.movingWheel ? [move('moving-wheel', 0, -p.liftHeightM * 120, p)] : [])],
    captions: [...spec.captions].sort((a, b) => a.at - b.at),
    principle: `理想${p.mode === 'fixed' ? '定滑轮' : '一动一定滑轮组（上方定滑轮只改变拉力方向）'}：忽略滑轮自重、绳重、摩擦及起停瞬间，绳不可伸长，水桶匀速上升。总载荷（桶与水）${p.massKg} kg，重力 mg=${a.weight.toFixed(2)} N，由 ${a.strands} 段绳承担；同一根绳张力相等，绳端拉力 F=T=mg/${a.strands}=${a.tension.toFixed(2)} N。桶上升 h=${p.liftHeightM} m，绳端向下移动 s=${a.strands}h=${(a.strands*p.liftHeightM).toFixed(2)} m，Fs=mgh，理想情况下不省功。${p.mode === 'fixed' ? '定滑轮不省力，只改变用力方向。' : '动滑轮省一半力，同时要拉两倍距离；顶端导向轮不增加承重绳段数。'}到位后保持拉力或固定绳端，不得突然松手。` }
}

export function buildPhysicsAnimation(spec: AnimationSpec, kind = physicsKind(spec)): AnimationSpec {
  if (kind === 'lever') return buildLeverAnimation(spec)
  if (kind === 'pulley') return buildPulleyAnimation(spec)
  if (kind === 'inclinedPlane') return buildInclinedPlaneAnimation(spec)
  return spec
}
