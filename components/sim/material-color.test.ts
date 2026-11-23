import fs from 'node:fs';
import path from 'node:path';
import { expect, it } from 'vitest';
import type { MujocoModule } from './mujoco';

const ROOT = path.resolve(__dirname, '../..');
const MODEL = path.join(ROOT, 'public/pure-desk/model');

// setMaterialColor repaints by robot.xml material name: the PURE Desk body ("shell") must resolve and cover the body parts.
it('PURE Desk body material "shell" resolves and paints the body, base included', async () => {
  const mod = await import(/* @vite-ignore */ path.join(ROOT, 'public/mujoco/mujoco.js'));
  const mj: MujocoModule = await mod.default();
  const dir = '/models/matcolor';
  for (const p of ['/models', dir, `${dir}/assets`]) {
    try {
      mj.FS.mkdir(p);
    } catch {}
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(MODEL, 'manifest.json'), 'utf8'));
  for (const f of ['scene_sim.xml', 'robot.xml']) mj.FS.writeFile(`${dir}/${f}`, fs.readFileSync(path.join(MODEL, f)));
  for (const m of manifest.meshes) mj.FS.writeFile(`${dir}/assets/${m}`, fs.readFileSync(path.join(MODEL, 'assets', m)));
  const model = mj.MjModel.from_xml_path(`${dir}/scene_sim.xml`);
  const shell = mj.mj_name2id(model, mj.mjtObj.mjOBJ_MATERIAL.value, 'shell');
  expect(shell).toBeGreaterThanOrEqual(0);
  const bodies = new Set<number>();
  for (let g = 0; g < model.ngeom; g++) if (model.geom_matid[g] === shell) bodies.add(model.geom_bodyid[g]);
  const base = mj.mj_name2id(model, mj.mjtObj.mjOBJ_BODY.value, 'base');
  expect(bodies.has(base)).toBe(true);
  expect(bodies.size).toBeGreaterThanOrEqual(5); // base, turret, lower arm, upper arm, head
});
