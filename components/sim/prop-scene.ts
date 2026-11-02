/**
 * 소품 배치 규칙 (Library L3): 칸(0.1 m) 단위 이동, 90° 회전, 그 칸의 가장 높은 면 위에서 떨어뜨리기,
 * 로봇 받침을 가구 위로 올리기. 물리 상태는 LampSim, 보이는 건 LampViewer 가 맡는다.
 */

import type { LampSim, PropSlot } from './lamp';
import { DROP_GAP, PROP_CELL, dropHeight, footprint, freeCell, type PlacedBox, type PropPlacement } from './props';

/** 로봇 받침 반경 + 여유 (m) — 새 소품은 이 밖에 놓는다 */
const ROBOT_CLEAR = 0.14;
/** 배치·이동 뒤 일시정지 중에도 물리를 돌리는 시간 (s) */
const SETTLE = 2.5;

interface Placed {
  slot: PropSlot;
  cell: [number, number];
  turn: number;
}

export class PropScene {
  private readonly placed = new Map<string, Placed>();
  private mountKey: string | null = null;
  /** 남은 정착 시간 (s) */
  settling = 0;
  selected: string | null = null;

  constructor(private readonly lamp: LampSim) {}

  get enabled(): boolean {
    return this.lamp.props.length > 0;
  }

  /** 지금 놓여 있는 슬롯 key 들 */
  get keys(): string[] {
    return [...this.placed.keys()];
  }

  get mount(): string | null {
    return this.mountKey;
  }

  list(): PropPlacement[] {
    return [...this.placed.values()].map((p) => ({ key: p.slot.key, assetId: p.slot.asset.id, cell: [...p.cell], turn: p.turn }));
  }

  /** 저장된 배치를 그대로 복원 (같은 에셋은 비어 있는 슬롯 순서대로) */
  restore(placements: PropPlacement[], mount: string | null): void {
    for (const key of [...this.placed.keys()]) this.remove(key);
    const keyMap = new Map<string, string>();
    for (const p of placements) {
      const key = this.add(p.assetId, p.cell, p.turn);
      if (key) keyMap.set(p.key, key);
    }
    this.setMount(mount ? (keyMap.get(mount) ?? null) : null);
  }

  /** 에셋 하나를 빈 슬롯에 놓는다. cell 이 없으면 로봇 옆 빈 칸. 반환 = 슬롯 key (슬롯이 다 찼으면 null) */
  add(assetId: string, cell?: [number, number], turn = 0): string | null {
    const slot = this.lamp.props.find((s) => s.asset.id === assetId && !this.placed.has(s.key));
    if (!slot) return null;
    const at = cell ?? freeCell(footprint(slot.asset.dims, turn), this.boxes(), ROBOT_CLEAR);
    const entry: Placed = { slot, cell: [at[0], at[1]], turn: ((turn % 4) + 4) % 4 };
    this.placed.set(slot.key, entry);
    this.drop(entry);
    return slot.key;
  }

  /** 한 칸 이동 (월드 축 기준 dx, dy ∈ {-1, 0, 1}). 로봇과 겹치는 칸이면 움직이지 않고 false. */
  move(key: string, dx: number, dy: number): boolean {
    const p = this.placed.get(key);
    if (!p) return false;
    const cell: [number, number] = [p.cell[0] + dx, p.cell[1] + dy];
    if (this.hitsRobot(key, cell, p.turn)) return false;
    p.cell = cell;
    this.drop(p);
    return true;
  }

  /** 90° 회전. 돌리면 로봇과 겹치면 false. */
  turn(key: string): boolean {
    const p = this.placed.get(key);
    if (!p) return false;
    const turn = (p.turn + 1) % 4;
    if (this.hitsRobot(key, p.cell, turn)) return false;
    p.turn = turn;
    this.drop(p);
    return true;
  }

  /** 로봇 받침 원(반경 ROBOT_CLEAR)과 그 칸의 발자국이 겹치나 — 로봇이 올라선 가구 자신은 예외 */
  private hitsRobot(key: string, cell: [number, number], turn: number): boolean {
    if (this.mountKey === key) return false;
    const p = this.placed.get(key);
    if (!p) return false;
    const [hx, hy] = footprint(p.slot.asset.dims, turn);
    const [rx, ry] = this.lamp.mount;
    const dx = Math.max(Math.abs(cell[0] * PROP_CELL - rx) - hx, 0);
    const dy = Math.max(Math.abs(cell[1] * PROP_CELL - ry) - hy, 0);
    return Math.hypot(dx, dy) < ROBOT_CLEAR;
  }

  remove(key: string): void {
    const p = this.placed.get(key);
    if (!p) return;
    if (this.mountKey === key) this.setMount(null);
    this.placed.delete(key);
    if (this.selected === key) this.selected = null;
    this.lamp.parkProp(p.slot);
  }

  /** 로봇 받침을 그 가구 윗면 가운데로 (null = 바닥 원래 자리) */
  setMount(key: string | null): void {
    const p = key ? this.placed.get(key) : undefined;
    this.mountKey = p ? key : null;
    if (!p) {
      this.lamp.setMount(null);
      return;
    }
    const [x, y] = this.cellPos(p);
    // 지금 가구가 놓인 높이(다른 소품 위일 수도) + 가구 높이
    this.lamp.setMount([x, y, this.lamp.propPosition(p.slot)[2] + p.slot.asset.dims[2]]);
    this.settling = SETTLE;
  }

  /** 받침 높이 (m) — 카메라가 로봇을 따라 올라갈 때 */
  get mountHeight(): number {
    return this.lamp.mount[2];
  }

  private cellPos(p: Placed): [number, number] {
    return [p.cell[0] * PROP_CELL, p.cell[1] * PROP_CELL];
  }

  /** 지금 놓인 소품들의 바닥 상자 (자신 제외) */
  private boxes(exclude?: string): PlacedBox[] {
    const out: PlacedBox[] = [];
    for (const p of this.placed.values()) {
      if (p.slot.key === exclude) continue;
      out.push({
        key: p.slot.key,
        pos: this.lamp.propPosition(p.slot),
        half: footprint(p.slot.asset.dims, p.turn),
        height: p.slot.asset.dims[2],
      });
    }
    return out;
  }

  /** 칸 위, 그 아래 가장 높은 면에서 떨어뜨린다. 받침이 올라간 가구면 로봇도 따라간다. */
  private drop(p: Placed): void {
    const [x, y] = this.cellPos(p);
    const z = dropHeight(x, y, footprint(p.slot.asset.dims, p.turn), this.boxes(p.slot.key));
    this.lamp.setPropPose(p.slot, x, y, z, (p.turn * Math.PI) / 2);
    // 떨어진 뒤 가라앉을 높이 (여유 높이 제외) 기준으로 로봇을 올린다
    if (this.mountKey === p.slot.key) this.lamp.setMount([x, y, z - DROP_GAP + p.slot.asset.dims[2]]);
    this.settling = SETTLE;
  }
}
