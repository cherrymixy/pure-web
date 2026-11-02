"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { Bounds, OrbitControls, useGLTF } from "@react-three/drei";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { SIMREADY_BASE, type SimReadyAsset } from "@/data/simready-assets";

/** 이동 모드 한 칸 (m) = 그리드 한 칸 */
const CELL = 0.1;
const KEY_STEP: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
};

// 체크 페이지 하나에 Canvas 하나: 선택한 에셋만 3D 로 본다 (나머지는 썸네일).
export function AssetGrid({ assets }: { assets: SimReadyAsset[] }) {
  const [sel, setSel] = useState(assets[0]?.id);
  const [hulls, setHulls] = useState(false);
  const [moving, setMoving] = useState(false);
  // 그리드 칸 좌표 (x, z) 와 90° 단위 회전
  const [cell, setCell] = useState<[number, number]>([0, 0]);
  const [turn, setTurn] = useState(0);
  const asset = assets.find((a) => a.id === sel);

  useEffect(() => {
    setCell([0, 0]);
    setTurn(0);
  }, [sel]);

  // 이동 모드: 방향키 = 한 칸, R = 90° 회전, Esc = 종료
  useEffect(() => {
    if (!moving) return;
    const onKey = (e: KeyboardEvent) => {
      const step = KEY_STEP[e.key];
      if (step) {
        e.preventDefault();
        setCell(([x, z]) => [x + step[0], z + step[1]]);
      } else if (e.code === "KeyR") {
        // e.key 는 한글 입력 상태에서 "ㄱ" 이 되므로 물리 키(code)로 본다
        e.preventDefault();
        setTurn((t) => (t + 1) % 4);
      } else if (e.key === "Escape") {
        setMoving(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moving]);

  return (
    <div className="grid grid-cols-[1fr_420px] gap-6">
      <div className="grid grid-cols-4 gap-3 self-start">
        {assets.map((a) => (
          <button
            key={a.id}
            onClick={() => setSel(a.id)}
            className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs ${a.id === sel ? "border-neutral-900" : "border-neutral-200"}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${SIMREADY_BASE}/${a.id}/thumb.png`} alt="" className="h-24 w-24 rounded-full bg-neutral-100 object-contain" />
            <span className="font-medium">{a.name}</span>
            <span className="text-neutral-500">{a.role} · {a.mass} kg</span>
          </button>
        ))}
      </div>

      {asset && (
        <div className="flex flex-col gap-2 text-sm">
          <div className="h-[420px] rounded-lg bg-neutral-100">
            <Canvas camera={{ position: [1, 0.8, 1.4], fov: 40 }}>
              <ZoomSafeSize />
              <ambientLight intensity={0.6} />
              <directionalLight position={[2, 4, 3]} intensity={1.6} />
              <Suspense fallback={null}>
                {/* GLB 원점 = 바닥 중앙이라 그대로 y=0 위에 선다 */}
                <Bounds fit clip margin={1.3} key={asset.id}>
                  <group position={[cell[0] * CELL, 0, cell[1] * CELL]} rotation={[0, (turn * Math.PI) / 2, 0]}>
                    <Model asset={asset} hulls={hulls} />
                  </group>
                </Bounds>
              </Suspense>
              <OrbitControls makeDefault />
              <gridHelper args={[4, 40, "#bbb", "#ddd"]} />
            </Canvas>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMoving((m) => !m)}
              className={`rounded border px-3 py-1 ${moving ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300"}`}
            >
              {moving ? "Move mode on" : "Move mode"}
            </button>
            <span className="font-mono text-xs text-neutral-500">
              cell ({cell[0]}, {cell[1]}) · {turn * 90}° {moving && "· ←↑↓→ move · R rotate · Esc exit"}
            </span>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={hulls} onChange={(e) => setHulls(e.target.checked)} />
            Show collision hulls ({asset.collision.length})
          </label>
          <dl className="grid grid-cols-[100px_1fr] gap-y-1 font-mono text-xs">
            <dt className="text-neutral-500">id</dt><dd>{asset.id}</dd>
            <dt className="text-neutral-500">dims (m)</dt><dd>{asset.dims.join(" × ")}</dd>
            <dt className="text-neutral-500">mass</dt><dd>{asset.mass} kg</dd>
            <dt className="text-neutral-500">friction</dt><dd>{asset.friction}</dd>
            <dt className="text-neutral-500">license</dt><dd>{asset.license}</dd>
          </dl>
        </div>
      )}
    </div>
  );
}

// 루트 CSS zoom(--app-zoom) 때문에 r3f 의 getBoundingClientRect 측정이 작게 나온다.
// 시뮬 뷰어처럼 clientWidth/Height(zoom 이전 CSS px)로 다시 맞춘다.
function ZoomSafeSize() {
  const gl = useThree((s) => s.gl);
  const setSize = useThree((s) => s.setSize);
  useEffect(() => {
    const parent = gl.domElement.parentElement;
    if (!parent) return;
    const fit = () => setSize(parent.clientWidth, parent.clientHeight);
    const ro = new ResizeObserver(() => requestAnimationFrame(fit));
    ro.observe(parent);
    fit();
    return () => ro.disconnect();
  }, [gl, setSize]);
  return null;
}

function Model({ asset, hulls }: { asset: SimReadyAsset; hulls: boolean }) {
  const { scene } = useGLTF(`${SIMREADY_BASE}/${asset.id}/model.glb`);
  return (
    <group>
      <primitive object={scene} visible={!hulls} />
      {hulls && <Hulls asset={asset} />}
    </group>
  );
}

// STL 은 MuJoCo Z-up → Y-up 으로 눕혀서 GLB 와 겹친다.
function Hulls({ asset }: { asset: SimReadyAsset }) {
  const geoms = useLoader(STLLoader, asset.collision.map((c) => `${SIMREADY_BASE}/${asset.id}/${c}`));
  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      {geoms.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshStandardMaterial color={`hsl(${(i * 47) % 360} 60% 60%)`} transparent opacity={0.75} />
        </mesh>
      ))}
    </group>
  );
}
