import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial, Line } from '@react-three/drei';
import * as THREE from 'three';

// Luminous Follicle Node on Ovaries
function OvaryFollicle({
  position,
  color = '#FB7185',
  scale = 0.12,
  pulseSpeed = 2.2,
}: {
  position: [number, number, number];
  color?: string;
  scale?: number;
  pulseSpeed?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.getElapsedTime();
      const pulse = 1 + Math.sin(t * pulseSpeed + position[0] * 3) * 0.22;
      meshRef.current.scale.setScalar(scale * pulse);
    }
  });

  return (
    <Sphere ref={meshRef} args={[1, 32, 32]} position={position} scale={scale}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={3.5}
        roughness={0.1}
      />
    </Sphere>
  );
}

// Fallopian / Tubal Guidance Curve connecting Uterus to Ovary
function FallopianGuidanceCurve({
  start,
  control,
  end,
  color = '#D8B4FE',
}: {
  start: [number, number, number];
  control: [number, number, number];
  end: [number, number, number];
  color?: string;
}) {
  const points = useMemo(() => {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...start),
      new THREE.Vector3(...control),
      new THREE.Vector3(...end)
    );
    return curve.getPoints(50).map((p) => [p.x, p.y, p.z] as [number, number, number]);
  }, [start, control, end]);

  return <Line points={points} color={color} opacity={0.45} transparent lineWidth={1.5} />;
}

// Hormonal Signaling Traveling Particles
function HormonalSignalingParticles({ count = 30 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, progressArray, speeds, paths] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const prog = new Float32Array(count);
    const spd = new Float32Array(count);
    const pathChoice = new Uint8Array(count);

    for (let i = 0; i < count; i++) {
      prog[i] = Math.random();
      spd[i] = 0.12 + Math.random() * 0.15;
      pathChoice[i] = i % 2; // 0 = left ovary pathway, 1 = right ovary pathway
    }
    return [pos, prog, spd, pathChoice];
  }, [count]);

  useFrame((state) => {
    if (pointsRef.current) {
      const posAttr = pointsRef.current.geometry.attributes.position;
      const delta = state.clock.getDelta();

      for (let i = 0; i < count; i++) {
        progressArray[i] = (progressArray[i] + delta * speeds[i]) % 1.0;
        const p = progressArray[i];
        const isLeft = paths[i] === 0;

        // Quadratic Bezier interpolation
        const startX = isLeft ? -1.8 : 1.8;
        const startY = 0.4;
        const ctrlX = isLeft ? -1.0 : 1.0;
        const ctrlY = 1.1;
        const endX = 0;
        const endY = 0.2;

        const x = (1 - p) * (1 - p) * startX + 2 * (1 - p) * p * ctrlX + p * p * endX;
        const y = (1 - p) * (1 - p) * startY + 2 * (1 - p) * p * ctrlY + p * p * endY;
        const z = Math.sin(p * Math.PI) * 0.25;

        posAttr.setXYZ(i, x, y, z);
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.075}
        color="#FDA4AF"
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Complete 3D Female Reproductive System Mesh & Animation Controller
function ReproductiveSystemModel({ onSettle }: { onSettle?: () => void }) {
  const rootGroupRef = useRef<THREE.Group>(null);
  const uterusRef = useRef<THREE.Mesh>(null);
  const leftOvaryRef = useRef<THREE.Mesh>(null);
  const rightOvaryRef = useRef<THREE.Mesh>(null);

  // Entrance Approach Animation State
  useEffect(() => {
    const timer = setTimeout(() => {
      onSettle?.();
    }, 1800);
    return () => clearTimeout(timer);
  }, [onSettle]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const mouseX = state.pointer.x * 0.3;
    const mouseY = state.pointer.y * 0.3;

    if (rootGroupRef.current) {
      // Stage approach from z: -6 to z: 0
      const currentZ = THREE.MathUtils.lerp(rootGroupRef.current.position.z, 0, 0.035);
      rootGroupRef.current.position.z = currentZ;

      // Gentle interactive floating and breathing
      rootGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        rootGroupRef.current.rotation.y,
        Math.sin(t * 0.4) * 0.2 + mouseX,
        0.04
      );
      rootGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        rootGroupRef.current.rotation.x,
        Math.sin(t * 0.25) * 0.08 - mouseY,
        0.04
      );
      rootGroupRef.current.position.y = Math.sin(t * 0.7) * 0.08;
    }

    if (uterusRef.current) {
      const uPulse = 1 + Math.sin(t * 1.2) * 0.03;
      uterusRef.current.scale.set(1.05 * uPulse, 1.2 * uPulse, 0.75 * uPulse);
    }

    if (leftOvaryRef.current && rightOvaryRef.current) {
      leftOvaryRef.current.rotation.z = Math.sin(t * 0.5) * 0.1;
      rightOvaryRef.current.rotation.z = -Math.sin(t * 0.5) * 0.1;
    }
  });

  return (
    <group ref={rootGroupRef} position={[0, 0, -4.5]}>
      <Float speed={1.1} rotationIntensity={0.2} floatIntensity={0.4}>
        {/* 1. UTERUS (Stylized Central Reproductive Body) */}
        <group position={[0, -0.15, 0]}>
          <Sphere ref={uterusRef} args={[0.95, 64, 64]} scale={[1.05, 1.2, 0.75]}>
            <MeshDistortMaterial
              color="#6E2D8B"
              emissive="#4A154B"
              emissiveIntensity={0.45}
              roughness={0.15}
              metalness={0.06}
              distort={0.22}
              speed={1.1}
              transparent
              opacity={0.86}
            />
          </Sphere>

          {/* Endometrial/Cervical Base Extension */}
          <Sphere args={[0.42, 32, 32]} position={[0, -0.9, 0]} scale={[0.65, 1.1, 0.5]}>
            <meshStandardMaterial
              color="#4A154B"
              emissive="#35144F"
              roughness={0.25}
              transparent
              opacity={0.7}
            />
          </Sphere>

          {/* Glowing Inner Uterine Cavity Core */}
          <Sphere args={[0.38, 32, 32]} position={[0, 0.1, 0]}>
            <meshStandardMaterial
              color="#E87084"
              emissive="#FB7185"
              emissiveIntensity={2.6}
              roughness={0.2}
              transparent
              opacity={0.65}
            />
          </Sphere>
        </group>

        {/* 2. LEFT OVARY (Bilateral Ovoid Structure with Follicles) */}
        <group position={[-1.85, 0.45, 0]}>
          <Sphere ref={leftOvaryRef} args={[0.55, 48, 48]} scale={[1.15, 0.85, 0.8]}>
            <MeshDistortMaterial
              color="#A21CAF"
              emissive="#6E2D8B"
              emissiveIntensity={0.5}
              roughness={0.12}
              distort={0.28}
              speed={1.3}
              transparent
              opacity={0.88}
            />
          </Sphere>

          {/* Left Ovary Luminous Follicles */}
          <OvaryFollicle position={[-0.25, 0.22, 0.3]} color="#FB7185" scale={0.12} pulseSpeed={2.4} />
          <OvaryFollicle position={[0.22, -0.18, 0.32]} color="#FDA4AF" scale={0.11} pulseSpeed={1.9} />
          <OvaryFollicle position={[-0.1, -0.28, 0.24]} color="#C084FC" scale={0.1} pulseSpeed={2.1} />
          <OvaryFollicle position={[0.28, 0.2, 0.22]} color="#F472B6" scale={0.11} pulseSpeed={2.6} />
          <OvaryFollicle position={[0, 0.32, -0.15]} color="#E87084" scale={0.09} pulseSpeed={1.7} />
        </group>

        {/* 3. RIGHT OVARY (Bilateral Ovoid Structure with Follicles) */}
        <group position={[1.85, 0.45, 0]}>
          <Sphere ref={rightOvaryRef} args={[0.55, 48, 48]} scale={[1.15, 0.85, 0.8]}>
            <MeshDistortMaterial
              color="#A21CAF"
              emissive="#6E2D8B"
              emissiveIntensity={0.5}
              roughness={0.12}
              distort={0.28}
              speed={1.3}
              transparent
              opacity={0.88}
            />
          </Sphere>

          {/* Right Ovary Luminous Follicles */}
          <OvaryFollicle position={[0.25, 0.22, 0.3]} color="#FB7185" scale={0.12} pulseSpeed={2.1} />
          <OvaryFollicle position={[-0.22, -0.18, 0.32]} color="#FDA4AF" scale={0.11} pulseSpeed={2.5} />
          <OvaryFollicle position={[0.1, -0.28, 0.24]} color="#C084FC" scale={0.1} pulseSpeed={1.8} />
          <OvaryFollicle position={[-0.28, 0.2, 0.22]} color="#F472B6" scale={0.11} pulseSpeed={2.3} />
          <OvaryFollicle position={[0, 0.32, -0.15]} color="#E87084" scale={0.09} pulseSpeed={2.0} />
        </group>

        {/* 4. FALLOPIAN / TUBAL GUIDANCE CURVES */}
        <FallopianGuidanceCurve
          start={[-0.8, 0.65, 0]}
          control={[-1.35, 1.05, 0.15]}
          end={[-1.85, 0.55, 0]}
          color="#D8B4FE"
        />
        <FallopianGuidanceCurve
          start={[0.8, 0.65, 0]}
          control={[1.35, 1.05, 0.15]}
          end={[1.85, 0.55, 0]}
          color="#D8B4FE"
        />

        {/* 5. HORMONAL SIGNALING TRAVELING PARTICLES */}
        <HormonalSignalingParticles count={36} />
      </Float>
    </group>
  );
}

// Stylized Fallback for non-WebGL devices
function FallbackReproductiveSystem() {
  return (
    <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
      <div className="w-80 h-80 rounded-full bg-gradient-to-tr from-[#6E2D8B]/40 via-[#8E3EAF]/30 to-[#E87084]/40 blur-3xl animate-pulse" />
      {/* Central Uterus abstraction */}
      <div className="absolute w-44 h-52 rounded-[40%_40%_60%_60%/40%_40%_70%_70%] bg-gradient-to-b from-[#7E22CE]/85 to-[#4A154B]/90 border border-white/20 shadow-2xl backdrop-blur-xl" />
      {/* Bilateral Ovaries */}
      <div className="absolute -left-2 top-1/3 w-16 h-12 rounded-full bg-gradient-to-r from-[#A21CAF] to-[#E87084] shadow-lg border border-white/30 flex items-center justify-center">
        <div className="w-2.5 h-2.5 rounded-full bg-[#FB7185] animate-ping" />
      </div>
      <div className="absolute -right-2 top-1/3 w-16 h-12 rounded-full bg-gradient-to-l from-[#A21CAF] to-[#E87084] shadow-lg border border-white/30 flex items-center justify-center">
        <div className="w-2.5 h-2.5 rounded-full bg-[#FB7185] animate-ping" />
      </div>
    </div>
  );
}

export const ReproductiveSystem3D: React.FC<{
  className?: string;
  onSettle?: () => void;
}> = ({ className, onSettle }) => {
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setHasWebGL(false);
    } catch {
      setHasWebGL(false);
    }
  }, []);

  if (!hasWebGL) {
    return <FallbackReproductiveSystem />;
  }

  return (
    <div className={className || 'w-full h-full min-h-[420px]'}>
      <Canvas
        camera={{ position: [0, 0, 5.8], fov: 38 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.95} />
        <directionalLight position={[6, 8, 6]} intensity={2.0} color="#FFFFFF" />
        <directionalLight position={[-6, -6, 4]} intensity={1.5} color="#E87084" />
        <pointLight position={[0, 0, 0]} color="#FB7185" intensity={3.5} distance={6} />
        <pointLight position={[-2, 1, 2]} color="#C084FC" intensity={2.5} />
        <pointLight position={[2, 1, 2]} color="#FDA4AF" intensity={2.5} />

        <ReproductiveSystemModel onSettle={onSettle} />
      </Canvas>
    </div>
  );
};
