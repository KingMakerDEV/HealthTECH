// src/components/CarenetraDNA.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';

type CarenetraDNAProps = {
  scrollProgress?: number;
  className?: string;
};

type SceneState = {
  primary: THREE.Color;
  secondary: THREE.Color;
  ecg: THREE.Color;
  rotationSpeed: number;
  particleSpeed: number;
  glow: number;
  alert: number;
  heart: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smoothstep = (edge0: number, edge1: number, value: number) => {
  const x = clamp01((value - edge0) / (edge1 - edge0));
  return x * x * (3 - 2 * x);
};

function getScrollState(progress: number): SceneState {
  const p = clamp01(progress);
  const vitals = smoothstep(0.18, 0.48, p);
  const alertsIn = smoothstep(0.5, 0.68, p);
  const alertsOut = 1 - smoothstep(0.68, 0.86, p);
  const alert = alertsIn * alertsOut;
  const connection = smoothstep(0.72, 1, p);

  const monitoringPrimary = new THREE.Color('#62e6ff');
  const monitoringSecondary = new THREE.Color('#0d4dff');
  const alertPrimary = new THREE.Color('#ff7a66');
  const alertSecondary = new THREE.Color('#ff315d');
  const connectionPrimary = new THREE.Color('#7df9ff');
  const connectionSecondary = new THREE.Color('#2b6bff');

  const primary = monitoringPrimary.clone().lerp(alertPrimary, alert).lerp(connectionPrimary, connection);
  const secondary = monitoringSecondary.clone().lerp(alertSecondary, alert).lerp(connectionSecondary, connection);
  const ecg = new THREE.Color('#35f7b3').lerp(new THREE.Color('#ff556b'), alert).lerp(new THREE.Color('#6ef7ff'), connection);

  return {
    primary,
    secondary,
    ecg,
    rotationSpeed: THREE.MathUtils.lerp(0.11, 0.36, vitals) + alert * 0.22 - connection * 0.14,
    particleSpeed: THREE.MathUtils.lerp(0.22, 1.25, vitals) + alert * 0.55 - connection * 0.38,
    glow: 0.45 + vitals * 0.65 + alert * 0.75 + connection * 0.2,
    alert,
    heart: connection,
  };
}

function useWebGLSupport() {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    setSupported(Boolean(context));
  }, []);

  return supported;
}

export function CarenetraDNA({ scrollProgress = 0, className }: CarenetraDNAProps) {
  const webglSupported = useWebGLSupport();
  const safeProgress = clamp01(scrollProgress);

  return (
    <div className={className ?? 'relative h-full w-full'} style={{ background: 'transparent' }}>
      {webglSupported ? (
        <Canvas
          camera={{ position: [0, 0, 12], fov: 42 }}
          dpr={[1, 2]}
          gl={{ alpha: true, antialias: true }}
          style={{ background: 'transparent' }}
        >
          <CarenetraDNAScene scrollProgress={safeProgress} />
        </Canvas>
      ) : (
        <CarenetraDNAFallback scrollProgress={safeProgress} />
      )}
    </div>
  );
}

function CarenetraDNAScene({ scrollProgress }: { scrollProgress: number }) {
  const rootRef = useRef<THREE.Group>(null);
  const rippleRef = useRef<THREE.Mesh>(null);
  const [heartbeat, setHeartbeat] = useState(0);
  const targetState = useMemo(() => getScrollState(scrollProgress), [scrollProgress]);
  const liveState = useRef(getScrollState(scrollProgress));

  useFrame((state, delta) => {
    liveState.current.primary.lerp(targetState.primary, 0.08);
    liveState.current.secondary.lerp(targetState.secondary, 0.08);
    liveState.current.ecg.lerp(targetState.ecg, 0.08);
    liveState.current.rotationSpeed = THREE.MathUtils.lerp(liveState.current.rotationSpeed, targetState.rotationSpeed, 0.08);
    liveState.current.particleSpeed = THREE.MathUtils.lerp(liveState.current.particleSpeed, targetState.particleSpeed, 0.08);
    liveState.current.glow = THREE.MathUtils.lerp(liveState.current.glow, targetState.glow, 0.08);
    liveState.current.alert = THREE.MathUtils.lerp(liveState.current.alert, targetState.alert, 0.08);
    liveState.current.heart = THREE.MathUtils.lerp(liveState.current.heart, targetState.heart, 0.08);

    if (rootRef.current) {
      rootRef.current.rotation.y += liveState.current.rotationSpeed * delta;
      rootRef.current.rotation.x = THREE.MathUtils.lerp(rootRef.current.rotation.x, (scrollProgress - 0.5) * 0.35, 0.05);
      rootRef.current.scale.setScalar(1 + heartbeat * 0.03);
    }

    if (rippleRef.current) {
      rippleRef.current.scale.setScalar(1 + heartbeat * 2.8);
      const material = rippleRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = heartbeat * 0.32;
      material.color.copy(liveState.current.ecg);
    }

    if (heartbeat > 0) {
      setHeartbeat((value) => Math.max(0, value - delta * 1.8));
    }

    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, Math.sin(scrollProgress * Math.PI * 2) * 0.35, 0.035);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, (scrollProgress - 0.5) * 0.45, 0.035);
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <ambientLight intensity={0.08} />
      <pointLight position={[-5.8, 2.2, 4.8]} color="#6ee7ff" intensity={3.0} distance={16} />
      <pointLight position={[5.6, 1.7, 4.2]} color="#ffd2a8" intensity={1.5} distance={16} />
      <pointLight position={[0, 6.4, 6.8]} color="#e8fbff" intensity={1.8} distance={18} />

      <group ref={rootRef} onClick={() => setHeartbeat(1)}>
        <Float speed={1.2} rotationIntensity={0.12} floatIntensity={0.32}>
          <DNAHelix stateRef={liveState} />
          <ECGPulse stateRef={liveState} />
          <ParticleOrbit stateRef={liveState} />
          <OrbitRing stateRef={liveState} />
        </Float>
        <mesh ref={rippleRef} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.9, 2.02, 96]} />
          <meshBasicMaterial transparent depthWrite={false} color="#6ee7ff" opacity={0} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </>
  );
}

function DNAHelix({ stateRef }: { stateRef: React.MutableRefObject<SceneState> }) {
  const materialA = useRef<THREE.MeshPhysicalMaterial>(null);
  const materialB = useRef<THREE.MeshPhysicalMaterial>(null);
  const rungMaterials = useRef<THREE.MeshStandardMaterial[]>([]);

  const { strandA, strandB, rungs } = useMemo(() => {
    const pointsA: THREE.Vector3[] = [];
    const pointsB: THREE.Vector3[] = [];
    const rungPairs: Array<[THREE.Vector3, THREE.Vector3]> = [];
    const turns = 4.25;
    const height = 7.4;
    const radius = 1.16;

    for (let i = 0; i <= 180; i += 1) {
      const t = i / 180;
      const angle = t * Math.PI * 2 * turns;
      const y = (t - 0.5) * height;
      const subtleBiologicalIrregularity = 1 + Math.sin(t * Math.PI * 14) * 0.018;
      const a = new THREE.Vector3(Math.cos(angle) * radius * subtleBiologicalIrregularity, y, Math.sin(angle) * radius * subtleBiologicalIrregularity);
      const b = new THREE.Vector3(Math.cos(angle + Math.PI) * radius * subtleBiologicalIrregularity, y, Math.sin(angle + Math.PI) * radius * subtleBiologicalIrregularity);
      pointsA.push(a);
      pointsB.push(b);

      if (i % 9 === 0) {
        rungPairs.push([a.clone(), b.clone()]);
      }
    }

    return {
      strandA: new THREE.CatmullRomCurve3(pointsA),
      strandB: new THREE.CatmullRomCurve3(pointsB),
      rungs: rungPairs,
    };
  }, []);

  useFrame(() => {
    if (materialA.current) {
      materialA.current.color.copy(stateRef.current.primary);
      materialA.current.emissive.copy(stateRef.current.primary);
      materialA.current.emissiveIntensity = 0.2 + stateRef.current.glow * 0.25;
    }

    if (materialB.current) {
      materialB.current.color.copy(stateRef.current.secondary);
      materialB.current.emissive.copy(stateRef.current.secondary);
      materialB.current.emissiveIntensity = 0.15 + stateRef.current.glow * 0.22;
    }

    rungMaterials.current.forEach((material, index) => {
      material.color.copy(index % 2 === 0 ? stateRef.current.primary : stateRef.current.secondary);
      material.emissive.copy(stateRef.current.ecg);
      material.emissiveIntensity = 0.25 + stateRef.current.glow * 0.25;
    });
  });

  return (
    <group>
      <mesh>
        <tubeGeometry args={[strandA, 180, 0.085, 18, false]} />
        <MeshTransmissionMaterial ref={materialA} transmission={0.78} thickness={0.62} roughness={0.08} ior={1.42} chromaticAberration={0.035} anisotropicBlur={0.08} backside color="#62e6ff" />
      </mesh>
      <mesh>
        <tubeGeometry args={[strandB, 180, 0.085, 18, false]} />
        <MeshTransmissionMaterial ref={materialB} transmission={0.8} thickness={0.64} roughness={0.075} ior={1.45} chromaticAberration={0.04} anisotropicBlur={0.08} backside color="#0d4dff" />
      </mesh>
      {rungs.map(([a, b], index) => {
        const midpoint = a.clone().lerp(b, 0.5);
        const direction = b.clone().sub(a);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());

        return (
          <mesh key={index} position={midpoint} quaternion={quaternion}>
            <cylinderGeometry args={[0.026, 0.026, direction.length(), 10]} />
            <meshStandardMaterial
              ref={(material) => {
                if (material) rungMaterials.current[index] = material;
              }}
              color="#baf7ff"
              emissive="#6ee7ff"
              emissiveIntensity={0.3}
              transparent
              opacity={0.68}
              roughness={0.18}
              metalness={0.12}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function ECGPulse({ stateRef }: { stateRef: React.MutableRefObject<SceneState> }) {
  const lineRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  const curve = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 130; i += 1) {
      const t = i / 130;
      const aroundHelix = t * Math.PI * 8.5 + Math.PI * 0.35;
      const ecgBeat = Math.exp(-Math.pow(((t * 6) % 1) - 0.42, 2) / 0.002) * 0.44 - Math.exp(-Math.pow(((t * 6) % 1) - 0.52, 2) / 0.004) * 0.28;
      points.push(new THREE.Vector3(Math.cos(aroundHelix) * 1.45, (t - 0.5) * 7.4 + ecgBeat, Math.sin(aroundHelix) * 1.45));
    }
    return new THREE.CatmullRomCurve3(points);
  }, []);

  useFrame((clock) => {
    if (lineRef.current) {
      lineRef.current.rotation.y = clock.clock.elapsedTime * 0.18;
    }

    if (materialRef.current) {
      const flicker = stateRef.current.alert * (Math.sin(clock.clock.elapsedTime * 24) * 0.16 + Math.sin(clock.clock.elapsedTime * 41) * 0.08);
      materialRef.current.color.copy(stateRef.current.ecg);
      materialRef.current.opacity = 0.7 + stateRef.current.glow * 0.3 + flicker;
    }
  });

  return (
    <mesh ref={lineRef}>
      <tubeGeometry args={[curve, 130, 0.026, 10, false]} />
      <meshBasicMaterial ref={materialRef} color="#35f7b3" transparent opacity={0.8} depthWrite={false} />
    </mesh>
  );
}

function ParticleOrbit({ stateRef }: { stateRef: React.MutableRefObject<SceneState> }) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const count = 210;

  const base = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const tube = (i * 2.399963229728653) % (Math.PI * 2);
      return { angle, tube, radius: 2.65 + Math.sin(i * 7.11) * 0.2 };
    });
  }, []);

  const positions = useMemo(() => new Float32Array(count * 3), []);

  useFrame((state) => {
    const heart = stateRef.current.heart;
    const speed = state.clock.elapsedTime * stateRef.current.particleSpeed;

    base.forEach((particle, index) => {
      const angle = particle.angle + speed * 0.22;
      const torusX = Math.cos(angle) * (particle.radius + Math.cos(particle.tube + speed) * 0.32);
      const torusY = Math.sin(particle.tube + speed) * 0.54;
      const torusZ = Math.sin(angle) * (particle.radius + Math.cos(particle.tube + speed) * 0.32);

      const heartAngle = particle.angle;
      const heartX = Math.sin(heartAngle) * Math.sin(heartAngle) * Math.sin(heartAngle) * 0.18;
      const heartY = (0.13 * Math.cos(heartAngle) - 0.05 * Math.cos(2 * heartAngle) - 0.02 * Math.cos(3 * heartAngle) - 0.01 * Math.cos(4 * heartAngle)) * 1.8;
      const heartZ = Math.sin(particle.tube + speed * 0.4) * 0.22;

      positions[index * 3] = THREE.MathUtils.lerp(torusX, heartX * 28, heart);
      positions[index * 3 + 1] = THREE.MathUtils.lerp(torusY, heartY * 28, heart) + 0.12;
      positions[index * 3 + 2] = THREE.MathUtils.lerp(torusZ, heartZ, heart);
    });

    if (pointsRef.current) {
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }

    if (materialRef.current) {
      materialRef.current.color.copy(stateRef.current.primary);
      materialRef.current.opacity = 0.3 + stateRef.current.glow * 0.25;
      materialRef.current.size = 0.036 + stateRef.current.glow * 0.018;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial ref={materialRef} color="#6ee7ff" size={0.045} transparent opacity={0.34} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function OrbitRing({ stateRef }: { stateRef: React.MutableRefObject<SceneState> }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const nodeRefs = useRef<THREE.Mesh[]>([]);

  useFrame((state, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.x += delta * 0.16;
      ringRef.current.rotation.z += delta * (0.12 + stateRef.current.particleSpeed * 0.08);
    }

    if (materialRef.current) {
      materialRef.current.color.copy(stateRef.current.ecg);
      materialRef.current.opacity = 0.15 + stateRef.current.glow * 0.1;
    }

    nodeRefs.current.forEach((node, index) => {
      const angle = state.clock.elapsedTime * (0.42 + stateRef.current.particleSpeed * 0.18) + (index / 7) * Math.PI * 2;
      node.position.set(Math.cos(angle) * 2.92, Math.sin(angle) * 2.92, Math.sin(angle * 2) * 0.08);
      const material = node.material as THREE.MeshBasicMaterial;
      material.color.copy(stateRef.current.ecg);
    });
  });

  return (
    <group rotation={[Math.PI / 2.4, 0, Math.PI / 8]}>
      <mesh ref={ringRef}>
        <torusGeometry args={[2.92, 0.012, 10, 144]} />
        <meshBasicMaterial ref={materialRef} color="#6ee7ff" transparent opacity={0.16} depthWrite={false} />
      </mesh>
      {Array.from({ length: 7 }).map((_, index) => (
        <mesh
          key={index}
          ref={(node) => {
            if (node) nodeRefs.current[index] = node;
          }}
        >
          <sphereGeometry args={[0.052, 16, 16]} />
          <meshBasicMaterial color="#6ee7ff" transparent opacity={0.88} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function CarenetraDNAFallback({ scrollProgress }: { scrollProgress: number }) {
  const state = getScrollState(scrollProgress);
  const primary = `#${state.primary.getHexString()}`;
  const secondary = `#${state.secondary.getHexString()}`;
  const ecg = `#${state.ecg.getHexString()}`;

  const strandA = Array.from({ length: 70 }, (_, i) => {
    const t = i / 69;
    return `${i === 0 ? 'M' : 'L'} ${(50 + Math.sin(t * Math.PI * 8.5) * 17).toFixed(2)} ${(8 + t * 84).toFixed(2)}`;
  }).join(' ');

  const strandB = Array.from({ length: 70 }, (_, i) => {
    const t = i / 69;
    return `${i === 0 ? 'M' : 'L'} ${(50 + Math.sin(t * Math.PI * 8.5 + Math.PI) * 17).toFixed(2)} ${(8 + t * 84).toFixed(2)}`;
  }).join(' ');

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-transparent">
      <div className="absolute h-[70vmin] w-[70vmin] rounded-full border border-cyan-300/15" style={{ boxShadow: `0 0 120px ${primary}33, inset 0 0 80px ${secondary}22` }} />
      {Array.from({ length: 24 }).map((_, index) => {
        const angle = (index / 24) * Math.PI * 2 + scrollProgress * Math.PI * 1.5;
        const heart = state.heart;
        const torusX = 50 + Math.cos(angle) * 31;
        const torusY = 50 + Math.sin(angle) * 20;
        const heartX = 50 + Math.sin(angle) ** 3 * 22;
        const heartY = 52 - (13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle));
        const x = THREE.MathUtils.lerp(torusX, heartX, heart);
        const y = THREE.MathUtils.lerp(torusY, heartY, heart);

        return <span key={index} className="absolute h-1.5 w-1.5 rounded-full" style={{ left: `${x}%`, top: `${y}%`, background: primary, boxShadow: `0 0 18px ${primary}` }} />;
      })}
      <svg viewBox="0 0 100 100" className="relative h-[70vmin] w-[46vmin] overflow-visible" style={{ filter: `drop-shadow(0 0 22px ${primary}88)` }}>
        <path d={strandA} fill="none" stroke={primary} strokeWidth="2.7" strokeLinecap="round" />
        <path d={strandB} fill="none" stroke={secondary} strokeWidth="2.7" strokeLinecap="round" />
        {Array.from({ length: 19 }).map((_, index) => {
          const t = index / 18;
          const x1 = 50 + Math.sin(t * Math.PI * 8.5) * 17;
          const x2 = 50 + Math.sin(t * Math.PI * 8.5 + Math.PI) * 17;
          const y = 8 + t * 84;
          return <line key={index} x1={x1} x2={x2} y1={y} y2={y} stroke="rgba(255,255,255,0.45)" strokeWidth="0.55" />;
        })}
        <path d="M 12 53 L 25 53 L 29 45 L 34 67 L 40 31 L 47 53 L 59 53 L 64 43 L 70 60 L 77 53 L 90 53" fill="none" stroke={ecg} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 10px ${ecg})` }} />
      </svg>
    </div>
  );
}

export default CarenetraDNA;