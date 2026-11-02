import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { SIMREADY_ASSETS } from '@/data/simready-assets';
import type { MjData, MjModel, MujocoModule } from './mujoco';
import { buildPropScene, dropHeight, footprint, freeCell, propRobotXml, yawQuat } from './props';
import { LampSim } from './lamp';
import { PropScene } from './prop-scene';
import { PURE_DESK_ROBOT } from '@/lib/sim/robots';

// MuJoCo wasm 을 노드에서 직접 올려 소품 씬이 컴파일·낙하·적층되는지 본다.
const ROOT = path.resolve(__dirname, '../..');
const MODEL = path.join(ROOT, 'public/pure-desk/model');
const ASSETS = path.join(ROOT, 'public/assets/simready');

let mj: MujocoModule;
let model: MjModel;
let data: MjData;
let slots: ReturnType<typeof buildPropScene>['slots'];

function write(dest: string, buf: Uint8Array | string) {
  mj.FS.writeFile(dest, typeof buf === 'string' ? new TextEncoder().encode(buf) : buf);
}

beforeAll(async () => {
  const mod = await import(/* @vite-ignore */ path.join(ROOT, 'public/mujoco/mujoco.js'));
  mj = await mod.default();
  const dir = '/models/test';
  for (const p of ['/models', dir, `${dir}/assets`, `${dir}/props`]) {
    try {
      mj.FS.mkdir(p);
    } catch {}
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(MODEL, 'manifest.json'), 'utf8'));
  write(`${dir}/scene_sim.xml`, fs.readFileSync(path.join(MODEL, 'scene_sim.xml')));
  write(`${dir}/robot.xml`, propRobotXml(fs.readFileSync(path.join(MODEL, 'robot.xml'), 'utf8')));
  for (const m of manifest.meshes) write(`${dir}/assets/${m}`, fs.readFileSync(path.join(MODEL, 'assets', m)));
  for (const a of SIMREADY_ASSETS) {
    try {
      mj.FS.mkdir(`${dir}/props/${a.id}`);
    } catch {}
    for (const c of a.collision) write(`${dir}/props/${a.id}/${c}`, fs.readFileSync(path.join(ASSETS, a.id, c)));
  }
  const scene = buildPropScene('scene_sim.xml', SIMREADY_ASSETS);
  slots = scene.slots;
  write(`${dir}/scene_props.xml`, scene.xml);
  model = mj.MjModel.from_xml_path(`${dir}/scene_props.xml`);
  data = new mj.MjData(model);
  mj.mj_forward(model, data);
}, 60_000);

const bodyId = (name: string) => mj.mj_name2id(model, mj.mjtObj.mjOBJ_BODY.value, name);
const jointOf = (b: number) => {
  for (let j = 0; j < model.njnt; j++) if (model.jnt_bodyid[j] === b) return j;
  return -1;
};
function put(key: string, x: number, y: number, z: number, yaw = 0) {
  const slot = slots.find((s) => s.key === key)!;
  const j = jointOf(bodyId(slot.body));
  const a = model.jnt_qposadr[j];
  const d = model.jnt_dofadr[j];
  model.body_gravcomp[bodyId(slot.body)] = 0;
  data.qpos.set([x, y, z, ...yawQuat(yaw)], a);
  for (let i = 0; i < 6; i++) data.qvel[d + i] = 0;
}
const posOf = (key: string) => {
  const b = bodyId(slots.find((s) => s.key === key)!.body);
  return Array.from(data.xpos.subarray(b * 3, b * 3 + 3)) as number[];
};
const settle = (seconds: number) => {
  const n = Math.round(seconds / model.opt.timestep);
  for (let i = 0; i < n; i++) mj.mj_step(model, data);
};

describe('prop scene', () => {
  it('compiles with one body per slot', () => {
    expect(slots.length).toBe(SIMREADY_ASSETS.reduce((n, a) => n + (a.role === 'stage' ? 1 : 3), 0));
    for (const s of slots) expect(bodyId(s.body)).toBeGreaterThan(0);
  });

  it('drops a mug onto the floor and onto the coffee table', () => {
    const table = SIMREADY_ASSETS.find((a) => a.id === 'furniture_table_coffee_low_a01')!;
    put('furniture_table_coffee_low_a01#0', 0.8, 0, 0.01);
    put('dishware_mug_a01#0', -0.6, 0, 0.05);
    settle(1.5);
    expect(posOf('dishware_mug_a01#0')[2]).toBeLessThan(0.01);
    const tp = posOf('furniture_table_coffee_low_a01#0');
    const z = dropHeight(0.8, 0, footprint([0.11, 0.09, 0.08], 0), [
      { key: 't', pos: tp as [number, number, number], half: footprint(table.dims, 0), height: table.dims[2] },
    ]);
    put('dishware_mug_a01#0', 0.8, 0, z);
    settle(1.5);
    const mz = posOf('dishware_mug_a01#0')[2];
    expect(mz).toBeGreaterThan(table.dims[2] - 0.03);
    expect(mz).toBeLessThan(table.dims[2] + 0.03);
  });

  it('robot geoms collide with props only', () => {
    let robotGeoms = 0;
    for (let g = 0; g < model.ngeom; g++) if (model.geom_contype[g] === 2) robotGeoms++;
    expect(robotGeoms).toBeGreaterThan(0);
  });

  it('robot base position can be moved at runtime (mount)', () => {
    const base = bodyId('base');
    const before = data.xpos[base * 3 + 2];
    model.body_pos[base * 3 + 2] = 0.5;
    mj.mj_forward(model, data);
    expect(data.xpos[base * 3 + 2] - before).toBeCloseTo(0.5, 3);
    model.body_pos[base * 3 + 2] = 0;
    mj.mj_forward(model, data);
  });

  it('parked slots float without contacts', () => {
    const fresh = new mj.MjData(model);
    mj.mj_forward(model, fresh);
    const t0 = performance.now();
    for (let i = 0; i < 500; i++) mj.mj_step(model, fresh);
    const ms = (performance.now() - t0) / 500;
    expect(fresh.ncon).toBe(0);
    const s0 = bodyId(slots[0].body);
    expect(fresh.xpos[s0 * 3 + 2]).toBeCloseTo(5, 2);
    expect(ms).toBeLessThan(2);
  });

  it('PropScene places, moves, turns, mounts and survives kinematic posing', () => {
    const lamp = new LampSim(mj, model, new mj.MjData(model), PURE_DESK_ROBOT, slots);
    const scene = new PropScene(lamp);
    const mug = scene.add('dishware_mug_a01')!;
    const desk = scene.add('desk_a01')!;
    expect(mug).toBe('dishware_mug_a01#0');
    lamp.step(1000);
    const slot = (k: string) => lamp.props.find((p) => p.key === k)!;
    const p0 = lamp.propPosition(slot(mug));
    expect(Math.hypot(p0[0], p0[1])).toBeGreaterThan(0.1);
    expect(p0[2]).toBeLessThan(0.01);

    scene.move(mug, 1, 0);
    lamp.step(500);
    expect(lamp.propPosition(slot(mug))[0]).toBeCloseTo(p0[0] + 0.1, 1);

    // 기구학 자세(타임라인 스크러빙)는 소품 위치를 지우지 않는다
    const before = lamp.propPosition(slot(mug));
    lamp.poseKinematic({ base_yaw: 20 });
    lamp.propPosition(slot(mug)).forEach((v, i) => expect(v).toBeCloseTo(before[i], 3));

    scene.setMount(desk);
    // 받침 = 지금 책상이 놓인 높이 + 책상 높이
    const deskTop = lamp.propPosition(slot(desk))[2] + SIMREADY_ASSETS.find((a) => a.id === 'desk_a01')!.dims[2];
    expect(lamp.mount[2]).toBeCloseTo(deskTop, 3);
    expect(deskTop).toBeGreaterThan(0.74);
    expect(deskTop).toBeLessThan(0.78);

    // 로봇 자리로는 옮겨지지 않는다
    const mugAt = scene.list().find((p) => p.key === mug)!.cell;
    const toward: [number, number] = [-Math.sign(mugAt[0]), -Math.sign(mugAt[1])];
    let moved = 0;
    for (let i = 0; i < 20 && scene.move(mug, toward[0], 0); i++) moved++;
    for (let i = 0; i < 20 && scene.move(mug, 0, toward[1]); i++) moved++;
    const end = scene.list().find((p) => p.key === mug)!.cell;
    expect(Math.hypot(end[0] * 0.1 - lamp.mount[0], end[1] * 0.1 - lamp.mount[1])).toBeGreaterThan(0.1);
    expect(scene.list().map((p) => p.key).sort()).toEqual([desk, mug].sort());

    scene.remove(desk);
    expect(lamp.mount[2]).toBeCloseTo(0, 5);
    scene.turn(mug);
    expect(scene.list()[0].turn).toBe(1);

    // 저장된 배치 복원
    scene.restore([{ key: 'x', assetId: 'toys_rubiksCube_a01', cell: [3, 3], turn: 2 }], null);
    expect(scene.list()).toEqual([{ key: 'toys_rubiksCube_a01#0', assetId: 'toys_rubiksCube_a01', cell: [3, 3], turn: 2 }]);
  });

  it('robot moves by cells, turns, is blocked by props and stays on furniture', () => {
    const lamp = new LampSim(mj, model, new mj.MjData(model), PURE_DESK_ROBOT, slots);
    const scene = new PropScene(lamp);
    const base = bodyId('base');
    expect(scene.moveRobot(1, 0)).toBe(true);
    expect(lamp.mount[0]).toBeCloseTo(0.1, 6);
    expect(lamp.data.xpos[base * 3]).toBeCloseTo(0.1, 3);
    scene.turnRobot();
    expect(scene.robot).toEqual({ cell: [1, 0], turn: 1 });

    // 소품(stage 가 아닌 것)에는 막히고, 가구(stage)에는 올라간다
    const mug = scene.add('dishware_mug_a01', [1, 4])!;
    expect(scene.moveRobot(0, 1)).toBe(true); // (1,1)
    expect(scene.moveRobot(0, 1)).toBe(true); // (1,2)
    expect(scene.moveRobot(0, 1)).toBe(false); // 머그 앞에서 멈춤
    scene.remove(mug);

    const box = scene.add('storage_box_a01', [8, 2])!;
    let n = 0;
    while (scene.mount !== box && n < 20 && scene.moveRobot(1, 0)) n++;
    expect(scene.mount).toBe(box);
    const top = lamp.propPosition(lamp.props.find((p) => p.key === box)!)[2] + SIMREADY_ASSETS.find((a) => a.id === 'storage_box_a01')!.dims[2];
    expect(lamp.mount[2]).toBeCloseTo(top, 3);

    // 가구 위에서 계속 가면 반대편 바닥으로 내려온다
    n = 0;
    while (scene.mount === box && n < 20 && scene.moveRobot(1, 0)) n++;
    expect(scene.mount).toBeNull();
    expect(lamp.mount[2]).toBeCloseTo(0, 6);
    const [hx] = footprint(SIMREADY_ASSETS.find((a) => a.id === 'storage_box_a01')!.dims, 0);
    expect(lamp.mount[0]).toBeGreaterThan(0.8 + hx);

    // 저장된 로봇 자리 복원
    scene.restore([], null, { cell: [-3, 2], turn: 3 });
    expect(lamp.mount[0]).toBeCloseTo(-0.3, 6);
    expect(lamp.mount[1]).toBeCloseTo(0.2, 6);
    expect(scene.robot.turn).toBe(3);
    scene.restore([], null);
  });

  it('free cell avoids the robot base', () => {
    const c = freeCell([0.05, 0.05], [], 0.12);
    expect(Math.hypot(c[0] * 0.1, c[1] * 0.1)).toBeGreaterThanOrEqual(0.12);
  });
});
