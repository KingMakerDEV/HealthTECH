import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

const HealthOrb = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.5, 1]} />
        <meshStandardMaterial
          color="#4A90E2"
          transparent
          opacity={0.15}
          wireframe
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshStandardMaterial
          color="#00C896"
          transparent
          opacity={0.08}
        />
      </mesh>
      {/* Cross symbol */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.6, 0.15, 0.15]} />
        <meshStandardMaterial color="#4A90E2" transparent opacity={0.6} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.15, 0.6, 0.15]} />
        <meshStandardMaterial color="#4A90E2" transparent opacity={0.6} />
      </mesh>
    </Float>
  );
};

const HeroScene = () => (
  <div className="w-full h-full">
    <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#00C896" />
      <Suspense fallback={null}>
        <HealthOrb />
      </Suspense>
    </Canvas>
  </div>
);

export default HeroScene;
