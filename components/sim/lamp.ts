/**
 * MuJoCo WASM 위에서 도는 로봇 시뮬레이터 (PURE Desk).
 * 파이썬 쪽 lelamp_sim/robot.py 와 같은 API 를 브라우저에서 제공한다.
 * 범위 초과 감지는 runtime.ts 가 setPose 전에 한다 — 여기 clamp 는 물리 한계(ctrlrange).
 */

import { loadMujoco, type MjData, type MjModel, type MujocoModule } from './mujoco';
import {
  JOINT_NAMES,
  type JointName,
  type PartialPose,
  type Pose,
} from '@/lib/sim/motion';
import type { RobotSpec } from '@/lib/sim/robots';
import { SIMREADY_BASE } from '@/data/simready-assets';
import { buildPropScene, propRobotXml, yawQuat, type PropAsset, type PropSlotSpec } from './props';
import { scaleRobotXml } from './robot-scale';

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

/** 이름 → 서보 ID. MuJoCo 모델 안의 조인트/액추에이터 이름이 곧 서보 ID 문자열이다. */
export const SERVO_ID: Record<JointName, number> = {
  base_yaw: 1,
  base_pitch: 2,
  elbow_pitch: 3,
  wrist_roll: 4,
  wrist_pitch: 5,
};

// Joint labels, hints, body names and model paths are per robot — see lib/sim/robots.ts.

// MuJoCo 쿼터니언은 (w, x, y, z) 순서다.
type Quat = ArrayLike<number>;

const quatConj = (q: Quat): number[] => [q[0], -q[1], -q[2], -q[3]];

const quatMul = (a: Quat, b: Quat): number[] => [
  a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
  a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
  a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
  a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0],
];

const quatRotate = (q: Quat, v: readonly number[]): number[] => {
  const [w, x, y, z] = [q[0], q[1], q[2], q[3]];
  // t = 2 * (q_vec × v);  v' = v + w*t + q_vec × t
  const tx = 2 * (y * v[2] - z * v[1]);
  const ty = 2 * (z * v[0] - x * v[2]);
  const tz = 2 * (x * v[1] - y * v[0]);
  return [
    v[0] + w * tx + (y * tz - z * ty),
    v[1] + w * ty + (z * tx - x * tz),
    v[2] + w * tz + (x * ty - y * tx),
  ];
};

export interface LoadProgress {
  phase: string;
  loaded: number;
  total: number;
}

interface Manifest {
  xml: string[];
  meshes: string[];
}

/** 엔진과 모델 파일을 받아 시뮬레이터를 만든다. */
export async function createLamp(
  robot: RobotSpec,
  onProgress: (p: LoadProgress) => void,
  props: PropAsset[] = [],
): Promise<LampSim> {
  onProgress({ phase: 'Loading MuJoCo engine', loaded: 0, total: 1 });
  const mj = await loadMujoco();

  // MuJoCo 모델(XML + STL)은 public/<robot.modelBase> 에 그대로 복사해 두었다.
  const base = robot.modelBase;
  const manifest: Manifest = await fetch(`${base}/manifest.json`).then((r) => r.json());
  // 로봇마다 가상 파일시스템의 자기 폴더에 푼다 — 엔진은 탭에 하나뿐이라, 로봇을
  // 바꿔 끼워도 다른 로봇의 XML·메시와 섞이지 않게 한다.
  const dir = `/models/${robot.id}`;
  const files = [
    ...manifest.xml.map((f) => ({ url: `${base}/${f}`, dest: `${dir}/${f}` })),
    ...manifest.meshes.map((f) => ({ url: `${base}/assets/${f}`, dest: `${dir}/assets/${f}` })),
    // 소품 충돌 메시 (props.ts) — 소품 씬일 때만
    ...props.flatMap((a) =>
      a.collision.map((c) => ({ url: `${SIMREADY_BASE}/${a.id}/${c}`, dest: `${dir}/props/${a.id}/${c}` })),
    ),
  ];

  for (const path of ['/models', dir, `${dir}/assets`, ...(props.length ? [`${dir}/props`, ...props.map((a) => `${dir}/props/${a.id}`)] : [])]) {
    try {
      mj.FS.mkdir(path);
    } catch {
      // 이미 있으면 무시
    }
  }

  let loaded = 0;
  onProgress({ phase: 'Downloading model', loaded, total: files.length });
  await Promise.all(
    files.map(async ({ url, dest }) => {
      const buf = await fetch(url).then((r) => {
        if (!r.ok) throw new Error(`Failed to fetch model file: ${url} (${r.status})`);
        return r.arrayBuffer();
      });
      mj.FS.writeFile(dest, new Uint8Array(buf));
      loaded += 1;
      onProgress({ phase: 'Downloading model', loaded, total: files.length });
    }),
  );

  onProgress({ phase: 'Compiling model', loaded: files.length, total: files.length });
  let entry = `${dir}/scene_sim.xml`;
  let slots: PropSlotSpec[] = [];
  const scale = robot.scale ?? 1;
  if (props.length || scale !== 1) {
    // 로봇 사본: 크기(RobotSpec.scale), 소품 씬이면 소품과만 부딪히게.
    // (가상 파일시스템은 매 로드마다 원본으로 다시 써진다)
    const robotFile = manifest.xml.find((f) => f !== 'scene_sim.xml') ?? 'robot.xml';
    const robotXml = await fetch(`${base}/${robotFile}`).then((r) => {
      if (!r.ok) throw new Error(`Failed to fetch model file: ${base}/${robotFile} (${r.status})`);
      return r.text();
    });
    const scaled = scaleRobotXml(robotXml, scale);
    mj.FS.writeFile(`${dir}/${robotFile}`, new TextEncoder().encode(props.length ? propRobotXml(scaled) : scaled));
  }
  if (props.length) {
    // 소품 씬: scene_sim.xml 을 include 한 씬을 새로 쓴다.
    const scene = buildPropScene('scene_sim.xml', props);
    mj.FS.writeFile(`${dir}/scene_props.xml`, new TextEncoder().encode(scene.xml));
    entry = `${dir}/scene_props.xml`;
    slots = scene.slots;
  }
  const model = mj.MjModel.from_xml_path(entry);
  const data = new mj.MjData(model);
  mj.mj_forward(model, data);
  return new LampSim(mj, model, data, robot, slots);
}

/** 씬 안의 소품 슬롯 하나 (MuJoCo 주소) */
export interface PropSlot extends PropSlotSpec {
  bodyId: number;
  qposAdr: number;
  dofAdr: number;
}

export class LampSim {
  readonly mj: MujocoModule;
  readonly robot: RobotSpec;
  readonly model: MjModel;
  readonly data: MjData;
  readonly dt: number;
  readonly limits: Record<JointName, [number, number]>;
  readonly headBodyId: number;
  readonly baseBodyId: number;
  /** 소품 슬롯 (소품 씬이 아니면 빈 배열) */
  readonly props: PropSlot[];
  /** 로봇 트리의 루트 바디 (월드 바로 아래) — 받침 높이(mount)를 옮길 때 */
  private readonly rootBodyId: number;
  private readonly rootHomePos = new Float64Array(3);
  private readonly rootHomeQuat = new Float64Array(4);
  private robotYaw = 0;
  /** 소품이 아닌(로봇) qpos·qvel 주소 — 소품만 물리로 돌릴 때 로봇을 붙잡아 둔다 */
  private readonly robotQpos: number[] = [];
  private readonly robotDof: number[] = [];

  /** 우리가 직접 누적하는 시뮬레이션 시각(초). 바인딩의 data.time 의미에 의존하지 않는다. */
  private simTime = 0;
  private readonly actId: Record<JointName, number>;
  private readonly qposAdr: Record<JointName, number>;
  /** freejoint 의 qpos 시작 주소 (없으면 -1) */
  private readonly freeAdr: number;
  /** 홈 상태에서 베이스 바디의 월드 포즈 — 기구학 프리뷰의 기준 */
  private readonly homeBasePos = new Float64Array(3);
  private readonly homeBaseQuat = new Float64Array(4);

  constructor(mj: MujocoModule, model: MjModel, data: MjData, robot: RobotSpec, propSpecs: PropSlotSpec[] = []) {
    this.mj = mj;
    this.robot = robot;
    this.model = model;
    this.data = data;
    const dt = Number(model.opt?.timestep);
    if (!Number.isFinite(dt) || dt <= 0) {
      throw new Error(`Could not read model timestep (timestep=${model.opt?.timestep})`);
    }
    this.dt = dt;

    const objAct = mj.mjtObj.mjOBJ_ACTUATOR.value;
    const objJnt = mj.mjtObj.mjOBJ_JOINT.value;
    const objBody = mj.mjtObj.mjOBJ_BODY.value;

    this.actId = {} as Record<JointName, number>;
    this.qposAdr = {} as Record<JointName, number>;
    this.limits = {} as Record<JointName, [number, number]>;

    for (const name of JOINT_NAMES) {
      const mjName = String(SERVO_ID[name]);
      const aid = mj.mj_name2id(model, objAct, mjName);
      const jid = mj.mj_name2id(model, objJnt, mjName);
      if (aid < 0 || jid < 0) throw new Error(`Joint '${name}' (id ${mjName}) not found in model`);
      this.actId[name] = aid;
      this.qposAdr[name] = model.jnt_qposadr[jid];
      this.limits[name] = [
        model.actuator_ctrlrange[aid * 2] * RAD,
        model.actuator_ctrlrange[aid * 2 + 1] * RAD,
      ];
    }

    this.headBodyId = mj.mj_name2id(model, objBody, robot.headBody);
    this.baseBodyId = mj.mj_name2id(model, objBody, robot.baseBody);

    // 로봇 트리의 루트 = 베이스에서 월드 바로 아래까지 올라간 바디
    let root = this.baseBodyId;
    while (root > 0 && model.body_parentid[root] !== 0) root = model.body_parentid[root];
    this.rootBodyId = root;
    const inRobot = (b: number) => {
      while (b > 0 && b !== root) b = model.body_parentid[b];
      return b === root;
    };

    // mjJNT_FREE === 0 — 로봇 트리 안의 freejoint 만 (소품 freejoint 는 제외)
    let freeAdr = -1;
    for (let j = 0; j < model.njnt; j++) {
      if (model.jnt_type[j] === 0 && inRobot(model.jnt_bodyid[j])) {
        freeAdr = model.jnt_qposadr[j];
        break;
      }
    }
    this.freeAdr = freeAdr;

    this.props = propSpecs.map((spec) => {
      const bodyId = mj.mj_name2id(model, objBody, spec.body);
      const jid = mj.mj_name2id(model, objJnt, spec.body);
      if (bodyId < 0 || jid < 0) throw new Error(`Prop '${spec.key}' not found in model`);
      return { ...spec, bodyId, qposAdr: model.jnt_qposadr[jid], dofAdr: model.jnt_dofadr[jid] };
    });
    const propQpos = new Set(this.props.flatMap((p) => [0, 1, 2, 3, 4, 5, 6].map((i) => p.qposAdr + i)));
    const propDof = new Set(this.props.flatMap((p) => [0, 1, 2, 3, 4, 5].map((i) => p.dofAdr + i)));
    for (let i = 0; i < model.nq; i++) if (!propQpos.has(i)) this.robotQpos.push(i);
    for (let i = 0; i < model.nv; i++) if (!propDof.has(i)) this.robotDof.push(i);
    this.rootHomePos.set(model.body_pos.subarray(root * 3, root * 3 + 3));
    this.rootHomeQuat.set(model.body_quat.subarray(root * 4, root * 4 + 4));

    // 홈 자세에서의 베이스 포즈를 기억해 둔다.
    mj.mj_resetData(model, data);
    mj.mj_forward(model, data);
    this.homeBasePos.set(data.xpos.subarray(this.baseBodyId * 3, this.baseBodyId * 3 + 3));
    this.homeBaseQuat.set(data.xquat.subarray(this.baseBodyId * 4, this.baseBodyId * 4 + 4));
  }

  /** 시뮬레이션 경과 시간(초) */
  get time(): number {
    return this.simTime;
  }

  /** MuJoCo 가 들고 있는 시각 — 디버깅용 */
  get engineTime(): number {
    return this.data.time;
  }

  /** 현재 서보에 지령된 목표 각도(도) */
  get targets(): Pose {
    const ctrl = this.data.ctrl;
    const out = {} as Pose;
    for (const n of JOINT_NAMES) out[n] = ctrl[this.actId[n]] * RAD;
    return out;
  }

  /** 실제로 측정된 관절 각도(도) */
  get pose(): Pose {
    const qpos = this.data.qpos;
    const out = {} as Pose;
    for (const n of JOINT_NAMES) out[n] = qpos[this.qposAdr[n]] * RAD;
    return out;
  }

  clamp(joint: JointName, degrees: number): number {
    const [lo, hi] = this.limits[joint];
    return Math.min(Math.max(degrees, lo), hi);
  }

  /** 관절 하나의 목표 각도를 설정한다. 리밋을 넘으면 잘라낸 값을 돌려준다. */
  setJoint(joint: JointName, degrees: number): number {
    const value = this.clamp(joint, degrees);
    this.data.ctrl[this.actId[joint]] = value * DEG;
    return value;
  }

  setPose(pose: PartialPose): void {
    for (const [k, v] of Object.entries(pose)) {
      if (v !== undefined) this.setJoint(k as JointName, v);
    }
  }

  /**
   * 물리 없이 즉시 자세를 만든다 — 타임라인 스크러빙용.
   *
   * 이 모델은 트리 루트가 아래팔이고 베이스가 그 자식이라, 관절 qpos 만 넣고
   * forward 하면 팔이 아니라 베이스가 움직인다 (평소엔 weld 구속이 물리로 풀어 준다).
   * 그래서 forward 후 베이스를 홈 포즈로 되돌리는 강체 보정을 freejoint 에 적용한다.
   * 결과적으로 베이스는 정확히 고정되고 관절각은 지령값 그대로가 된다.
   */
  poseKinematic(pose: PartialPose): void {
    const { mj, model, data } = this;
    const props = this.saveProps();
    mj.mj_resetData(model, data);
    this.restoreProps(props);
    for (const [key, value] of Object.entries(pose)) {
      if (value === undefined) continue;
      const name = key as JointName;
      data.qpos[this.qposAdr[name]] = this.clamp(name, value) * DEG;
      data.ctrl[this.actId[name]] = this.clamp(name, value) * DEG;
    }
    mj.mj_forward(model, data);

    if (this.freeAdr >= 0) {
      const b = this.baseBodyId;
      const bp = data.xpos.subarray(b * 3, b * 3 + 3);
      const bq = data.xquat.subarray(b * 4, b * 4 + 4);

      // corr = homeQuat * baseQuat⁻¹  (베이스를 홈 방향으로 되돌리는 회전)
      const corr = quatMul(this.homeBaseQuat, quatConj(bq));
      const rootP = data.qpos.subarray(this.freeAdr, this.freeAdr + 3);
      const rootQ = data.qpos.subarray(this.freeAdr + 3, this.freeAdr + 7);

      const rel = quatRotate(corr, [rootP[0] - bp[0], rootP[1] - bp[1], rootP[2] - bp[2]]);
      const newQ = quatMul(corr, rootQ);
      for (let i = 0; i < 3; i++) data.qpos[this.freeAdr + i] = this.homeBasePos[i] + rel[i];
      for (let i = 0; i < 4; i++) data.qpos[this.freeAdr + 3 + i] = newQ[i];

      data.qvel.fill(0);
      mj.mj_forward(model, data);
    }
  }

  /** 기구학 프리뷰 후 물리 재생으로 돌아갈 때 — 현재 자세를 지령으로 삼고 속도를 지운다. */
  freezeIntoPhysics(): void {
    // 로봇만 멈춘다 — 떨어지던 소품은 속도를 유지
    if (this.props.length) for (const i of this.robotDof) this.data.qvel[i] = 0;
    else this.data.qvel.fill(0);
    this.mj.mj_forward(this.model, this.data);
  }

  step(n = 1): void {
    if (!Number.isFinite(n) || n <= 0) return;
    const count = Math.min(Math.floor(n), 2000);
    for (let i = 0; i < count; i++) this.mj.mj_step(this.model, this.data);
    this.simTime += count * this.dt;
  }

  // ---------------------------------------------------------------- props (props.ts)

  private saveProps(): Float64Array[] {
    const { qpos, qvel } = this.data;
    return this.props.map((p) => {
      const out = new Float64Array(13);
      out.set(qpos.subarray(p.qposAdr, p.qposAdr + 7), 0);
      out.set(qvel.subarray(p.dofAdr, p.dofAdr + 6), 7);
      return out;
    });
  }

  private restoreProps(saved: Float64Array[]): void {
    this.props.forEach((p, i) => {
      this.data.qpos.set(saved[i].subarray(0, 7), p.qposAdr);
      this.data.qvel.set(saved[i].subarray(7, 13), p.dofAdr);
    });
  }

  /** 소품 바닥 중앙을 (x, y, z) 에 yaw(rad) 로 놓고 속도를 지운다. */
  setPropPose(slot: PropSlot, x: number, y: number, z: number, yaw: number): void {
    this.model.body_gravcomp[slot.bodyId] = 0;
    this.data.qpos.set([x, y, z, ...yawQuat(yaw)], slot.qposAdr);
    this.data.qvel.fill(0, slot.dofAdr, slot.dofAdr + 6);
    this.mj.mj_forward(this.model, this.data);
  }

  /** 안 쓰는 슬롯: 멀리 공중에 띄우고 중력을 상쇄 (바닥·다른 소품과 접촉 없음) */
  parkProp(slot: PropSlot): void {
    this.setPropPose(slot, slot.park[0], slot.park[1], slot.park[2], 0);
    this.model.body_gravcomp[slot.bodyId] = 1;
  }

  /** 소품 바디의 월드 위치 (바닥 중앙) */
  propPosition(slot: PropSlot): [number, number, number] {
    const p = this.data.xpos.subarray(slot.bodyId * 3, slot.bodyId * 3 + 3);
    return [p[0], p[1], p[2]];
  }

  /**
   * 일시정지 중에도 소품이 떨어지고 쌓이도록 — 로봇 qpos·qvel 은 매 스텝 되돌려 고정한다.
   * 시뮬 시각(simTime)은 흐르지 않는다.
   */
  stepProps(n = 1): void {
    if (!this.props.length || n <= 0) return;
    const { mj, model, data } = this;
    const q = this.robotQpos.map((i) => data.qpos[i]);
    const count = Math.min(Math.floor(n), 2000);
    for (let s = 0; s < count; s++) {
      mj.mj_step(model, data);
      this.robotQpos.forEach((idx, k) => (data.qpos[idx] = q[k]));
      for (const idx of this.robotDof) data.qvel[idx] = 0;
    }
    mj.mj_forward(model, data);
  }

  /** 로봇 받침을 (x, y, z) 로 옮긴다 (null = 원래 자리). 가구 위에 올릴 때. */
  setMount(at: [number, number, number] | null): void {
    const r = this.rootBodyId;
    const target = at ?? [this.rootHomePos[0], this.rootHomePos[1], this.rootHomePos[2]];
    const before = [this.model.body_pos[r * 3], this.model.body_pos[r * 3 + 1], this.model.body_pos[r * 3 + 2]];
    for (let i = 0; i < 3; i++) {
      this.model.body_pos[r * 3 + i] = target[i];
      this.homeBasePos[i] += target[i] - before[i];
    }
    this.mj.mj_forward(this.model, this.data);
  }

  /** 로봇 받침을 z 축으로 yaw(rad) 만큼 돌린다 (원래 방향 기준). */
  setRobotYaw(yaw: number): void {
    const r = this.rootBodyId;
    // 기구학 프리뷰의 베이스 기준 방향도 같이 돌린다 (freejoint 로봇)
    this.homeBaseQuat.set(quatMul(yawQuat(yaw - this.robotYaw), this.homeBaseQuat));
    this.robotYaw = yaw;
    const q = quatMul(yawQuat(yaw), this.rootHomeQuat);
    for (let i = 0; i < 4; i++) this.model.body_quat[r * 4 + i] = q[i];
    this.mj.mj_forward(this.model, this.data);
  }

  /** 로봇 받침 바디 (뷰포트에서 로봇을 고를 때) */
  get robotRootBody(): number {
    return this.rootBodyId;
  }

  /** 로봇 받침 위치 */
  get mount(): [number, number, number] {
    const r = this.rootBodyId;
    return [this.model.body_pos[r * 3], this.model.body_pos[r * 3 + 1], this.model.body_pos[r * 3 + 2]];
  }

  reset(pose?: PartialPose): void {
    const props = this.saveProps();
    this.mj.mj_resetData(this.model, this.data);
    this.restoreProps(props);
    this.simTime = 0;
    const ctrl = this.data.ctrl;
    for (let i = 0; i < ctrl.length; i++) ctrl[i] = 0;
    if (pose) this.setPose(pose);
    this.mj.mj_forward(this.model, this.data);
  }
}
