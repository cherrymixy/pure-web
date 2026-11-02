import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { MujocoModule } from './mujoco';
import { scaleRobotXml } from './robot-scale';

const ROOT = path.resolve(__dirname, '../..');
const MODEL = path.join(ROOT, 'public/pure-desk/model');

describe('scaleRobotXml', () => {
  it('scales lengths, masses, inertia and servo gains', () => {
    const xml = '<mujoco><default><joint damping="0.6"/><position kp="2" kv="1" forcerange="-3 3"/></default><asset><mesh name="a" file="a.stl"/></asset><body pos="0 0.1 0.2"><inertial pos="0 0 0.01" mass="0.5" diaginertia="1 2 3"/></body></mujoco>';
    const out = scaleRobotXml(xml, 2);
    expect(out).toContain('<mesh name="a" file="a.stl" scale="2 2 2"/>');
    expect(out).toContain('pos="0 0.2 0.4"');
    expect(out).toContain('mass="4"');
    expect(out).toContain('diaginertia="32 64 96"');
    expect(out).toContain('kp="64"');
    expect(out).toContain('forcerange="-96 96"');
    expect(out).toContain('damping="19.2"');
    expect(scaleRobotXml(xml, 1)).toBe(xml);
  });

  it('a 2.5× PURE Desk is 2.5× taller and tracks the same command like the original', async () => {
    const mod = await import(/* @vite-ignore */ path.join(ROOT, 'public/mujoco/mujoco.js'));
    const mj: MujocoModule = await mod.default();
    const run = (k: number) => {
      const dir = `/models/scale${String(k).replace('.', '_')}`;
      for (const p of ['/models', dir, `${dir}/assets`]) {
        try {
          mj.FS.mkdir(p);
        } catch {}
      }
      const manifest = JSON.parse(fs.readFileSync(path.join(MODEL, 'manifest.json'), 'utf8'));
      const enc = (s: string) => new TextEncoder().encode(s);
      mj.FS.writeFile(`${dir}/scene_sim.xml`, fs.readFileSync(path.join(MODEL, 'scene_sim.xml')));
      mj.FS.writeFile(`${dir}/robot.xml`, enc(scaleRobotXml(fs.readFileSync(path.join(MODEL, 'robot.xml'), 'utf8'), k)));
      for (const m of manifest.meshes) mj.FS.writeFile(`${dir}/assets/${m}`, fs.readFileSync(path.join(MODEL, 'assets', m)));
      const model = mj.MjModel.from_xml_path(`${dir}/scene_sim.xml`);
      const data = new mj.MjData(model);
      const head = mj.mj_name2id(model, mj.mjtObj.mjOBJ_BODY.value, 'head');
      mj.mj_forward(model, data);
      const height = data.xpos[head * 3 + 2];
      // shoulder (actuator "2") to 30°: angle after 0.3 s
      const a = mj.mj_name2id(model, mj.mjtObj.mjOBJ_ACTUATOR.value, '2');
      const j = mj.mj_name2id(model, mj.mjtObj.mjOBJ_JOINT.value, '2');
      data.ctrl[a] = (30 * Math.PI) / 180;
      for (let i = 0; i < 150; i++) mj.mj_step(model, data);
      return { height, angle: (data.qpos[model.jnt_qposadr[j]] * 180) / Math.PI };
    };
    const one = run(1);
    const big = run(2.5);
    expect(big.height / one.height).toBeCloseTo(2.5, 2);
    expect(Math.abs(big.angle - one.angle)).toBeLessThan(3);
  }, 60_000);
});
