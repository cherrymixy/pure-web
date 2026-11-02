/**
 * 로봇 MJCF 를 균일하게 키운다 (RobotSpec.scale).
 *
 * 길이 s 배 → 메시 scale·모든 pos ×s, 질량 ×s³, 관성 ×s⁵.
 * 관절 각속도 응답을 그대로 두려고 회전 쪽 힘(서보 kp·kv·forcerange, 관절 damping·frictionloss·armature)도 ×s⁵ —
 * 토크 ∝ 질량·길이² 이라 같은 각도 지령에 같은 각가속도가 나온다. 각도(range)는 그대로.
 */

const num = (v: string) => Number(v);
const fmt = (v: number) => Number(v.toPrecision(8)).toString();
const mapNums = (value: string, k: number) => value.trim().split(/\s+/).map((v) => fmt(num(v) * k)).join(' ');

export function scaleRobotXml(xml: string, s: number): string {
  if (s === 1) return xml;
  const s3 = s ** 3;
  const s5 = s ** 5;
  const attr = (src: string, name: string, k: number) =>
    src.replace(new RegExp(`(\\s${name}=")([^"]+)(")`, 'g'), (_m, a, v, b) => `${a}${mapNums(v, k)}${b}`);
  let out = xml.replace(/<mesh\s([^>]*?)\/>/g, (m, inner: string) => (/\sscale=/.test(` ${inner}`) ? m : `<mesh ${inner} scale="${s} ${s} ${s}"/>`));
  out = attr(out, 'pos', s);
  out = attr(out, 'mass', s3);
  out = attr(out, 'diaginertia', s5);
  for (const name of ['damping', 'frictionloss', 'armature', 'kp', 'kv', 'forcerange']) out = attr(out, name, s5);
  return out;
}
