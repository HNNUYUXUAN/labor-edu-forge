import type { AnimationSpec, InclinedPlaneParameters } from './index.js'

export function isInclinedPlaneAnimation(spec: Pick<AnimationSpec, 'title' | 'sceneType' | 'inclinedPlane'>) {
  return Boolean(spec.inclinedPlane) || spec.sceneType === 'inclined-plane' || /斜面/.test(spec.title)
}

/** Screen coordinates: x right, y down. Box origin is its rotated top-left corner. */
export function inclinedPlaneGeometry(parameters: InclinedPlaneParameters) {
  const angle = parameters.angleDegrees * Math.PI / 180
  const tangent = { x: Math.cos(angle), y: -Math.sin(angle) }
  const normal = { x: -Math.sin(angle), y: -Math.cos(angle) }
  const foot = { x: 150, y: 430 }
  const run = 520
  const length = run / tangent.x
  const top = { x: foot.x + run, y: foot.y + run * tangent.y / tangent.x }
  const width = 64, height = 44, startDistance = 24
  const contact = { x: foot.x + startDistance * tangent.x, y: foot.y + startDistance * tangent.y }
  const box = { x: contact.x + height * normal.x, y: contact.y + height * normal.y }
  const travel = length - startDistance - width
  const displacement = { x: travel * tangent.x, y: travel * tangent.y }
  const weight = parameters.massKg * 9.8
  const support = weight * Math.cos(angle)
  const friction = parameters.frictionCoefficient * support
  const pull = weight * Math.sin(angle) + friction
  return { angle, tangent, normal, foot, top, length, width, height, box, displacement, weight, support, friction, pull }
}

/** Compile physical parameters into a scene; model-supplied freehand coordinates are not authoritative. */
export function buildInclinedPlaneAnimation(spec: AnimationSpec): AnimationSpec {
  const p = spec.inclinedPlane ?? {
    angleDegrees: 20, massKg: 1, frictionCoefficient: 0.1,
    moveStart: Math.min(2, spec.duration * 0.1), moveDuration: spec.duration * 0.75,
  }
  const g = inclinedPlaneGeometry(p)
  const center = {
    x: g.box.x + g.width / 2 * g.tangent.x - g.height / 2 * g.normal.x,
    y: g.box.y + g.width / 2 * g.tangent.y - g.height / 2 * g.normal.y,
  }
  const line = (id: string, label: string, rotate: number, length: number, color: string): AnimationSpec['objects'][number] => ({
    id, type: 'line', label, position: { ...center },
    style: { length, rotate, stroke: color, strokeWidth: 4, arrow: 1, showLabel: 1 },
  })
  const objects: AnimationSpec['objects'] = [
    { id: 'ground', type: 'line', label: '地面', position: { x: 65, y: 430 }, style: { length: 830, stroke: '#8A9099', strokeWidth: 2 } },
    { id: 'platform', type: 'rect', label: '交接台', position: { ...g.top }, style: { width: 200, height: 430 - g.top.y, fill: '#DDE3E9' } },
    { id: 'ramp', type: 'line', label: '斜面', position: { ...g.foot }, style: { length: g.length, rotate: -p.angleDegrees, stroke: '#A96D35', strokeWidth: 4 } },
    { id: 'load', type: 'rect', label: '器材箱', position: { ...g.box }, style: { width: g.width, height: g.height, rotate: -p.angleDegrees, fill: '#E4B77E' } },
    line('pull', 'F', -p.angleDegrees, 110 * g.pull / g.weight, '#165DCC'),
    line('weight', 'mg', 90, 110, '#C23B32'),
    line('normal', 'N', -90 - p.angleDegrees, 110 * g.support / g.weight, '#27835D'),
  ]
  if (p.frictionCoefficient > 0) objects.push(line('friction', 'f', 180 - p.angleDegrees, 110 * g.friction / g.weight, '#8655A2'))
  const moving = ['load', 'pull', 'weight', 'normal', ...(p.frictionCoefficient > 0 ? ['friction'] : [])]
  return {
    ...spec, sceneType: 'inclined-plane', inclinedPlane: p,
    canvas: { width: 960, height: 540, background: '#FAFBFC' }, objects,
    timeline: moving.map((targetId) => ({ at: p.moveStart, duration: p.moveDuration, easing: 'linear', targetId, action: 'move', params: { ...g.displacement } })),
    captions: [...spec.captions].sort((a, b) => a.at - b.at),
    principle: `演示假设器材箱沿固定斜面匀速上行，拉力平行斜面；忽略起停瞬间。倾角 θ=${p.angleDegrees}°，质量 m=${p.massKg} kg，动摩擦系数 μ=${p.frictionCoefficient}，g=9.8 m/s²。支持力 N=mg cosθ=${g.support.toFixed(2)} N，摩擦力 f=μN=${g.friction.toFixed(2)} N，拉力 F=mg sinθ+f=${g.pull.toFixed(2)} N。重力竖直向下，支持力垂直斜面，摩擦力沿斜面向下。无摩擦时 Fs=mgh；有摩擦时 Fs=mgh+fs，不省功。箱底始终贴合斜面，到顶端停稳后由人员交接。`,
  }
}
