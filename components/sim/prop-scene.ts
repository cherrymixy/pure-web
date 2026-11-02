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
/** 가구 위 로봇: 윗면 가장자리에서 이만큼 안쪽까지만 (m) */
const TOP_MARGIN = 0.06;
/** 막혔을 때 가구로 오르내리며 건너뛸 수 있는 칸 수 (받침 반경을 넘을 만큼) */
const HOP_CELLS = 4;

/** 뷰포트에서 로봇 받침을 골랐을 때의 선택 key */
export const ROBOT_KEY = 'robot';

interface Placed {
  slot: PropSlot;
  cell: [number, number];
  turn: number;
}

export class PropScene {
  private readonly placed = new Map<string, Placed>();
  private mountKey: string | null = null;
  /** 로봇 받침 칸·회전 (가구 위여도 월드 칸) */
  private robotCell: [number, number] = [0, 0];
  private robotTurn = 0;
  /** 로봇 받침 높이 (바닥 = 0, 가구 위 = 가구 윗면) */
  private robotZ = 0;
  /** 남은 정착 시간 (s) */
  settling = 0;
  selected: string | null = null;

  /** 로봇 받침의 원래 자리 (칸 0,0 · 바닥 높이) */
  private readonly home: [number, number, number];

  constructor(private readonly lamp: LampSim) {
    this.home = lamp.mount;
    this.robotZ = this.home[2];
  }

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

  get robot(): { cell: [number, number]; turn: number } {
    return { cell: [...this.robotCell], turn: this.robotTurn };
  }

  /** 저장된 배치를 그대로 복원 (같은 에셋은 비어 있는 슬롯 순서대로) */
  restore(placements: PropPlacement[], mount: string | null, robot?: { cell: [number, number]; turn: number }): void {
    for (const key of [...this.placed.keys()]) this.remove(key);
    this.robotCell = robot ? [robot.cell[0], robot.cell[1]] : [0, 0];
    this.robotTurn = robot?.turn ?? 0;
    this.applyRobot();
    const keyMap = new Map<string, string>();
    for (const p of placements) {
      const key = this.add(p.assetId, p.cell, p.turn);
      if (key) keyMap.set(p.key, key);
    }
    this.setMount(mount ? (keyMap.get(mount) ?? null) : null, true);
  }

  /**
   * 로봇 한 칸 이동. 막히면 그 방향으로 몇 칸 안에서
   *  - 바닥 → 가구(stage) 윗면이 있으면 올라가고,
   *  - 가구 위 → 가장자리 너머 빈 바닥이 있으면 내려간다.
   * 어디로도 못 가면 false.
   */
  moveRobot(dx: number, dy: number): boolean {
    const cell: [number, number] = [this.robotCell[0] + dx, this.robotCell[1] + dy];
    if (this.robotFits(cell)) {
      this.robotCell = cell;
      this.applyRobot();
      return true;
    }
    for (let n = 1; n <= HOP_CELLS; n++) {
      const c: [number, number] = [this.robotCell[0] + dx * n, this.robotCell[1] + dy * n];
      if (this.mountKey) {
        const was = this.mountKey;
        this.mountKey = null;
        if (this.robotFits(c)) {
          this.robotCell = c;
          this.robotZ = this.home[2];
          this.applyRobot();
          return true;
        }
        this.mountKey = was;
      } else {
        const top = this.stageUnder(c);
        if (top) {
          this.robotCell = c;
          this.setMount(top.slot.key, true);
          return true;
        }
      }
    }
    return false;
  }

  /** 로봇 받침이 그 칸에서 올라설 수 있는 가구(stage) — 윗면 가장자리 안쪽, 가장 높은 것 */
  private stageUnder(cell: [number, number]): Placed | undefined {
    const x = this.home[0] + cell[0] * PROP_CELL;
    const y = this.home[1] + cell[1] * PROP_CELL;
    let best: Placed | undefined;
    for (const p of this.placed.values()) {
      if (p.slot.asset.role !== 'stage') continue;
      const [hx, hy] = footprint(p.slot.asset.dims, p.turn);
      const [fx, fy] = this.cellPos(p);
      if (Math.abs(x - fx) > hx - TOP_MARGIN || Math.abs(y - fy) > hy - TOP_MARGIN) continue;
      if (!best || p.slot.asset.dims[2] > best.slot.asset.dims[2]) best = p;
    }
    return best;
  }

  /** 로봇 90° 회전 (받침이 둥글어 막히지 않는다) */
  turnRobot(): void {
    this.robotTurn = (this.robotTurn + 1) % 4;
    this.applyRobot();
  }

  private robotFits(cell: [number, number]): boolean {
    const x = this.home[0] + cell[0] * PROP_CELL;
    const y = this.home[1] + cell[1] * PROP_CELL;
    const m = this.mountKey ? this.placed.get(this.mountKey) : undefined;
    if (m) {
      const [hx, hy] = footprint(m.slot.asset.dims, m.turn);
      const [fx, fy] = this.cellPos(m);
      return Math.abs(x - fx) <= hx - TOP_MARGIN && Math.abs(y - fy) <= hy - TOP_MARGIN;
    }
    for (const b of this.boxes()) {
      const dx = Math.max(Math.abs(x - b.pos[0]) - b.half[0], 0);
      const dy = Math.max(Math.abs(y - b.pos[1]) - b.half[1], 0);
      if (Math.hypot(dx, dy) < ROBOT_CLEAR) return false;
    }
    return true;
  }

  private nearestFloorCell(): [number, number] {
    const [cx, cy] = this.robotCell;
    for (let r = 1; r <= 40; r++) {
      const ring: [number, number][] = [];
      for (let i = -r; i <= r; i++) for (let j = -r; j <= r; j++) if (Math.max(Math.abs(i), Math.abs(j)) === r) ring.push([cx + i, cy + j]);
      ring.sort((a, b) => Math.hypot(a[0] - cx, a[1] - cy) - Math.hypot(b[0] - cx, b[1] - cy));
      const hit = ring.find((c) => this.robotFits(c));
      if (hit) return hit;
    }
    return [cx, cy];
  }

  /** 로봇 받침을 칸·회전·높이대로 옮긴다 */
  private applyRobot(): void {
    this.lamp.setMount([this.home[0] + this.robotCell[0] * PROP_CELL, this.home[1] + this.robotCell[1] * PROP_CELL, this.robotZ]);
    this.lamp.setRobotYaw((this.robotTurn * Math.PI) / 2);
    this.settling = SETTLE;
  }

  /** 에셋 하나를 빈 슬롯에 놓는다. cell 이 없으면 로봇 옆 빈 칸. 반환 = 슬롯 key (슬롯이 다 찼으면 null) */
  add(assetId: string, cell?: [number, number], turn = 0): string | null {
    const slot = this.lamp.props.find((s) => s.asset.id === assetId && !this.placed.has(s.key));
    if (!slot) return null;
    // 로봇 받침도 하나의 상자로 넣어 피한다 (로봇이 어디로 옮겨졌든)
    const [rx, ry, rz] = this.lamp.mount;
    const robotBox: PlacedBox = { key: ROBOT_KEY, pos: [rx, ry, rz], half: [ROBOT_CLEAR, ROBOT_CLEAR], height: 0 };
    const at = cell ?? freeCell(footprint(slot.asset.dims, turn), [...this.boxes(), robotBox], 0);
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
    if (this.mountKey === key) this.robotCell = [this.robotCell[0] + dx, this.robotCell[1] + dy];
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
    if (this.mountKey === key) {
      // 가구와 함께 로봇도 가구 중심을 축으로 90° 돈다
      const ox = this.robotCell[0] - p.cell[0];
      const oy = this.robotCell[1] - p.cell[1];
      this.robotCell = [p.cell[0] - oy, p.cell[1] + ox];
      this.robotTurn = (this.robotTurn + 1) % 4;
    }
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

  /** 로봇을 그 가구 윗면 가운데로 올린다 (null = 바닥, 지금 칸 그대로). keepCell = 저장된 칸 유지(복원). */
  setMount(key: string | null, keepCell = false): void {
    const p = key ? this.placed.get(key) : undefined;
    this.mountKey = p ? key : null;
    if (!p) {
      const wasMounted = this.robotZ !== this.home[2];
      this.robotZ = this.home[2];
      // 내려올 땐 가구 옆 가장 가까운 빈 바닥 칸으로
      if (wasMounted && !keepCell && !this.robotFits(this.robotCell)) this.robotCell = this.nearestFloorCell();
      this.applyRobot();
      return;
    }
    if (!keepCell) this.robotCell = [p.cell[0], p.cell[1]];
    // 지금 가구가 놓인 높이(다른 소품 위일 수도) + 가구 높이
    this.robotZ = this.lamp.propPosition(p.slot)[2] + p.slot.asset.dims[2];
    this.applyRobot();
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
    if (this.mountKey === p.slot.key) {
      this.robotZ = z - DROP_GAP + p.slot.asset.dims[2];
      this.applyRobot();
    }
    this.settling = SETTLE;
  }
}
