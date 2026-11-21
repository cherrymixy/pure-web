import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { MujocoModule } from './mujoco';

const ROOT = path.resolve(__dirname, '../..');
const MODEL = path.join(ROOT, 'public/pure-rover/model');

describe('PURE Rover model', () => {
  it('loads, tracks every channel, and rolls its wheels with the drive', async () => {
    const mod = await import(/* @vite-ignore */ path.join(ROOT, 'public/mujoco/mujoco.js'));
    const mj: MujocoModule = await mod.default();
    const dir = '/models/rover';
    for (const p of ['/models', dir, `${dir}/assets`]) {
      try {
        mj.FS.mkdir(p);
      } catch {}
    }
    const manifest = JSON.parse(fs.readFileSync(path.join(MODEL, 'manifest.json'), 'utf8'));
    for (const f of manifest.xml) mj.FS.writeFile(`${dir}/${f}`, fs.readFileSync(path.join(MODEL, f)));
    for (const m of manifest.meshes) mj.FS.writeFile(`${dir}/assets/${m}`, fs.readFileSync(path.join(MODEL, 'assets', m)));
    const model = mj.MjModel.from_xml_path(`${dir}/scene_sim.xml`);
    const data = new mj.MjData(model);
    const id = (type: string, name: string) => mj.mj_name2id(model, mj.mjtObj[type].value, name);
    const q = (name: string) => data.qpos[model.jnt_qposadr[id('mjOBJ_JOINT', name)]];
    for (const n of ['1', '2', '3', '4', '5']) {
      expect(id('mjOBJ_ACTUATOR', n)).toBeGreaterThanOrEqual(0);
      expect(id('mjOBJ_JOINT', n)).toBeGreaterThanOrEqual(0);
    }
    expect(id('mjOBJ_BODY', 'shell')).toBeGreaterThanOrEqual(0);

    const deg = Math.PI / 180;
    const target: Record<string, number> = { '1': 30 * deg, '2': 0.03, '3': 10 * deg, '4': 5 * deg, '5': -8 * deg };
    for (const [n, v] of Object.entries(target)) data.ctrl[id('mjOBJ_ACTUATOR', n)] = v;
    for (let i = 0; i < 500; i++) mj.mj_step(model, data); // 1 s
    expect(q('1') / deg).toBeCloseTo(30, 0);
    expect(q('2')).toBeCloseTo(0.03, 2);
    expect(q('3') / deg).toBeGreaterThan(8);
    expect(q('5') / deg).toBeLessThan(-6);
    // 3 cm forward on a 0.0823 m wheel ≈ 0.36 rad
    expect(q('wheel_l')).toBeCloseTo(0.03 / 0.0823, 1);
    expect(q('wheel_r')).toBeCloseTo(0.03 / 0.0823, 1);

    // Driving: 25 cm along the heading moves the whole robot across the floor and rolls the wheels ~3 turns' worth.
    mj.mj_resetData(model, data);
    mj.mj_forward(model, data);
    const shell = id('mjOBJ_BODY', 'shell');
    const y0 = data.xpos[shell * 3 + 1];
    data.ctrl[id('mjOBJ_ACTUATOR', '2')] = 0.25;
    for (let i = 0; i < 750; i++) mj.mj_step(model, data); // 1.5 s
    expect(y0 - data.xpos[shell * 3 + 1]).toBeCloseTo(0.25, 1);
    expect(q('wheel_l')).toBeCloseTo(0.25 / 0.0823, 0);
  }, 60_000);
});
