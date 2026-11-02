/**
 * 3D 에셋 소품 (Library L3) — SimReady 에셋을 MuJoCo 바디로 씬에 넣는다.
 *
 * 에셋마다 슬롯(freejoint 바디)을 미리 만들어 두고 안 쓰는 슬롯은 멀리 세워 둔다.
 * 배치·이동은 qpos 만 바꾸므로 모델을 다시 컴파일하지 않는다 (로봇 상태 유지).
 * 충돌 메시는 group 3 (뷰어가 그리지 않음), 보이는 건 뷰어가 GLB 로 덧그린다.
 *
 * 충돌 비트: 소품 contype 1 / conaffinity 3, 로봇 contype 2 / conaffinity 0, 바닥 1 / 1
 *  → 소품↔소품·바닥·로봇은 닿고, 로봇↔로봇·바닥은 지금처럼 안 닿는다.
 */

import type { SimReadyAsset } from '@/data/simready-assets';
import type { PropPlacement } from '@/lib/models';

export type { PropPlacement };

export type PropAsset = Pick<SimReadyAsset, 'id' | 'role' | 'dims' | 'mass' | 'friction' | 'collision'>;

/** 이동 모드 한 칸 (m) */
export const PROP_CELL = 0.1;
/** 에셋 하나당 슬롯 수 */
export const PROP_SLOTS: Record<PropAsset['role'], number> = { stage: 1, prop: 3 };
/** 떨어뜨리는 여유 높이 (m) */
export const DROP_GAP = 0.01;
/** 안 쓰는 슬롯을 띄워 두는 곳 — 공중(중력 상쇄 gravcomp=1)이라 바닥 접촉 계산이 없다 */
const PARK = { x: 40, y: 40, z: 5, step: 4 };

export interface PropSlotSpec {
  key: string;
  asset: PropAsset;
  /** MuJoCo 바디 이름 */
  body: string;
  park: [number, number, number];
}

const meshName = (assetId: string, i: number) => `prop_${assetId}_${i}`;

/** 로봇 사본: 시각 지오메트리 기본값을 소품과만 부딪히게 바꾼다. */
export function propRobotXml(robotXml: string): string {
  return robotXml.replace(
    /(<default class="visual">\s*<geom [^>]*?)contype="0" conaffinity="0"/,
    '$1contype="2" conaffinity="0"',
  );
}

/**
 * scene_sim.xml 을 include 한 소품 씬. 메시 파일은 `<dir>/props/<id>/col_NN.stl`
 * (컴파일러 meshdir 이 assets 라 상대경로 ../props).
 */
export function buildPropScene(sceneFile: string, assets: PropAsset[]): { xml: string; slots: PropSlotSpec[] } {
  const meshes: string[] = [];
  const bodies: string[] = [];
  const slots: PropSlotSpec[] = [];
  for (const a of assets) {
    a.collision.forEach((file, i) => meshes.push(`    <mesh name="${meshName(a.id, i)}" file="../props/${a.id}/${file}"/>`));
    const [dx, dy, dz] = a.dims;
    // 상자 근사 관성 (원점 = 바닥 중앙, 질량중심 = 높이 절반)
    const ix = (a.mass / 12) * (dy * dy + dz * dz);
    const iy = (a.mass / 12) * (dx * dx + dz * dz);
    const iz = (a.mass / 12) * (dx * dx + dy * dy);
    for (let n = 0; n < PROP_SLOTS[a.role]; n++) {
      const key = `${a.id}#${n}`;
      const park: [number, number, number] = [PARK.x + slots.length * PARK.step, PARK.y, PARK.z];
      const body = `prop:${key}`;
      slots.push({ key, asset: a, body, park });
      const geoms = a.collision
        .map((_, i) => `      <geom type="mesh" mesh="${meshName(a.id, i)}" group="3" contype="1" conaffinity="3" condim="3" friction="${a.friction} 0.005 0.0001"/>`)
        .join('\n');
      bodies.push(
        `    <body name="${body}" pos="${park.join(' ')}" gravcomp="1">\n` +
          `      <freejoint name="${body}"/>\n` +
          `      <inertial pos="0 0 ${(dz / 2).toFixed(4)}" mass="${a.mass}" diaginertia="${ix.toFixed(6)} ${iy.toFixed(6)} ${iz.toFixed(6)}"/>\n` +
          `${geoms}\n    </body>`,
      );
    }
  }
  const xml = `<mujoco model="pure_desk_props">
  <include file="${sceneFile}"/>
  <asset>
${meshes.join('\n')}
  </asset>
  <worldbody>
${bodies.join('\n')}
  </worldbody>
</mujoco>
`;
  return { xml, slots };
}

/** 회전 한 번 = 45° (한 바퀴 8번) */
export const TURN_STEP = Math.PI / 4;
export const TURNS = 8;
export const turnYaw = (turn: number) => turn * TURN_STEP;

/** 회전 수 → 바닥 위 발자국(축 정렬 상자) [x, y] 반폭 — 45° 면 돌린 사각형을 감싸는 상자 */
export function footprint(dims: readonly number[], turn: number): [number, number] {
  const a = turnYaw(turn);
  const c = Math.abs(Math.cos(a));
  const s = Math.abs(Math.sin(a));
  const hx = dims[0] / 2;
  const hy = dims[1] / 2;
  return [c * hx + s * hy, s * hx + c * hy];
}

/** (x, y) 가 그 회전의 윗면 사각형 안(가장자리에서 margin 안쪽)인가 — 중심 (cx, cy) */
export function insideTop(dims: readonly number[], turn: number, cx: number, cy: number, x: number, y: number, margin: number): boolean {
  const a = -turnYaw(turn);
  const dx = x - cx;
  const dy = y - cy;
  const lx = dx * Math.cos(a) - dy * Math.sin(a);
  const ly = dx * Math.sin(a) + dy * Math.cos(a);
  return Math.abs(lx) <= dims[0] / 2 - margin && Math.abs(ly) <= dims[1] / 2 - margin;
}

export interface PlacedBox {
  key: string;
  /** 바닥 중앙 위치 */
  pos: [number, number, number];
  half: [number, number];
  height: number;
}

/** 그 발자국 아래 가장 높은 윗면 + 여유 — 거기서 떨어뜨린다. */
export function dropHeight(x: number, y: number, half: [number, number], others: PlacedBox[]): number {
  let top = 0;
  for (const o of others) {
    const overlapX = Math.abs(o.pos[0] - x) < o.half[0] + half[0];
    const overlapY = Math.abs(o.pos[1] - y) < o.half[1] + half[1];
    if (overlapX && overlapY) top = Math.max(top, o.pos[2] + o.height);
  }
  return top + DROP_GAP;
}

/** z 축 yaw (rad) → MuJoCo 쿼터니언 (w, x, y, z) */
export const yawQuat = (yaw: number): [number, number, number, number] => [Math.cos(yaw / 2), 0, 0, Math.sin(yaw / 2)];

/**
 * 로봇 받침을 피해 비어 있는 첫 칸 (원점에서 가까운 순).
 * clear = 로봇 받침 반경 (m).
 */
export function freeCell(half: [number, number], others: PlacedBox[], clear: number): [number, number] {
  const reach = Math.hypot(half[0], half[1]) + clear;
  const cells: [number, number, number][] = [];
  for (let i = -30; i <= 30; i++) {
    for (let j = -30; j <= 30; j++) {
      const d = Math.hypot(i * PROP_CELL, j * PROP_CELL);
      if (d >= reach) cells.push([i, j, d]);
    }
  }
  cells.sort((a, b) => a[2] - b[2] || a[1] - b[1] || a[0] - b[0]);
  for (const [i, j] of cells) {
    const x = i * PROP_CELL;
    const y = j * PROP_CELL;
    const hit = others.some(
      (o) => Math.abs(o.pos[0] - x) < o.half[0] + half[0] && Math.abs(o.pos[1] - y) < o.half[1] + half[1],
    );
    if (!hit) return [i, j];
  }
  return [0, Math.round(-reach / PROP_CELL)];
}
