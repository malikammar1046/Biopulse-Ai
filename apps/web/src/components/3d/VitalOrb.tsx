import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial, Line } from '@react-three/drei';
import * as THREE from 'three';

// Luminous Follicle Node inside the biological core
function FollicleNode({
  position,
  color = '#FB7185',
  scale = 0.14,
  pulseSpeed = 2,
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
      const pulse = 1 + Math.sin(t * pulseSpeed + position[0] * 4) * 0.2;
      meshRef.current.scale.setScalar(scale * pulse);
    }
  });

  return (
    <Sphere ref={meshRef} args={[1, 32, 32]} position={position} scale={scale}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={3.2}
        roughness={0.05}
      />
    </Sphere>
  );
}

// Inflowing Cellular/Biological Data Particles
function BiologicalParticleSwarm({ count = 45 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, initialRadii, angles, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const rad = new Float32Array(count);
    const ang = new Float32Array(count);
    const spd = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const radius = 2.2 + Math.random() * 1.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.8;

      rad[i] = radius;
      ang[i] = theta;
      spd[i] = 0.15 + Math.random() * 0.25;

      pos[i * 3] = radius * Math.cos(theta) * Math.cos(phi);
      pos[i * 3 + 1] = radius * Math.sin(phi);
      pos[i * 3 + 2] = radius * Math.sin(theta) * Math.cos(phi);
    }
    return [pos, rad, ang, spd];
  }, [count]);

  useFrame((state) => {
    if (pointsRef.current) {
      const posAttr = pointsRef.current.geometry.attributes.position;
      const t = state.clock.getElapsedTime();

      for (let i = 0; i < count; i++) {
        // Slow inward drift representing health data entering the core
        const currentR = ((initialRadii[i] - (t * speeds[i]) % 3.0) + 1.0);
        const theta = angles[i] + t * 0.08;
        const phi = Math.sin(t * 0.2 + i) * 0.5;

        posAttr.setXYZ(
          i,
          currentR * Math.cos(theta) * Math.cos(phi),
          currentR * Math.sin(phi) + Math.sin(t * 0.5 + i) * 0.2,
          currentR * Math.sin(theta) * Math.cos(phi)
        );
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.065}
        color="#FDA4AF"
        transparent
        opacity={0.75}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Delicate Scientific Orbital Curves
function ScientificOrbitalCurve({
  radius = 2.4,
  speed = 0.15,
  color = '#D8B4FE',
  tiltX = 0.35,
  tiltY = 0.2,
}: {
  radius?: number;
  speed?: number;
  color?: string;
  tiltX?: number;
  tiltY?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    const segments = 90;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      pts.push([
        Math.cos(theta) * radius,
        Math.sin(theta) * radius * 0.42,
        Math.sin(theta) * radius * tiltX + Math.cos(theta) * radius * tiltY,
      ]);
    }
    return pts;
  }, [radius, tiltX, tiltY]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = state.clock.getElapsedTime() * speed;
    }
  });

  return (
    <group ref={groupRef}>
      <Line points={points} color={color} opacity={0.28} transparent lineWidth={1.2} />
    </group>
  );
}

// Main Organic Intelligence Core Mesh
function OrganicIntelligenceCore() {
  const mainGroupRef = useRef<THREE.Group>(null);
  const leftLobeRef = useRef<THREE.Mesh>(null);
  const rightLobeRef = useRef<THREE.Mesh>(null);
  const internalCoreRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const mouseX = state.pointer.x * 0.35;
    const mouseY = state.pointer.y * 0.35;

    if (mainGroupRef.current) {
      // Biological breathing rotation & subtle cursor parallax tilt
      mainGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        mainGroupRef.current.rotation.y,
        t * 0.1 + mouseX,
        0.04
      );
      mainGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        mainGroupRef.current.rotation.x,
        Math.sin(t * 0.3) * 0.12 - mouseY,
        0.04
      );
      mainGroupRef.current.position.y = Math.sin(t * 0.7) * 0.09;
    }

    if (internalCoreRef.current) {
      // Subtle biological heartbeat/pulse
      const pulse = 1 + Math.sin(t * 1.6) * 0.07;
      internalCoreRef.current.scale.setScalar(0.7 * pulse);
    }
  });

  return (
    <group ref={mainGroupRef}>
      <Float speed={1.2} rotationIntensity={0.25} floatIntensity={0.5}>
        {/* Left Translucent Biological Lobe */}
        <Sphere
          ref={leftLobeRef}
          args={[1.15, 64, 64]}
          position={[-0.58, 0.05, 0]}
          scale={[1.1, 1.28, 0.96]}
        >
          <MeshDistortMaterial
            color="#7E22CE"
            emissive="#4A154B"
            emissiveIntensity={0.35}
            roughness={0.12}
            metalness={0.08}
            distort={0.42}
            speed={1.2}
            transparent
            opacity={0.84}
          />
        </Sphere>

        {/* Right Translucent Biological Lobe (Asymmetrical Bilateral Form) */}
        <Sphere
          ref={rightLobeRef}
          args={[1.1, 64, 64]}
          position={[0.58, -0.05, 0]}
          scale={[1.06, 1.22, 0.92]}
        >
          <MeshDistortMaterial
            color="#A21CAF"
            emissive="#6E2D8B"
            emissiveIntensity={0.4}
            roughness={0.14}
            metalness={0.08}
            distort={0.36}
            speed={1.0}
            transparent
            opacity={0.8}
          />
        </Sphere>

        {/* Glowing Luminous Inner Core */}
        <Sphere ref={internalCoreRef} args={[0.7, 32, 32]} position={[0, 0, 0]}>
          <meshStandardMaterial
            color="#E87084"
            emissive="#FB7185"
            emissiveIntensity={2.4}
            roughness={0.2}
            transparent
            opacity={0.7}
          />
        </Sphere>

        {/* Luminous Follicle Spheres inside the core */}
        <FollicleNode position={[-0.85, 0.45, 0.4]} color="#FB7185" scale={0.18} pulseSpeed={2.2} />
        <FollicleNode position={[-0.92, -0.4, 0.35]} color="#FDA4AF" scale={0.14} pulseSpeed={1.8} />
        <FollicleNode position={[0.82, 0.38, 0.38]} color="#E87084" scale={0.16} pulseSpeed={2.0} />
        <FollicleNode position={[0.74, -0.48, 0.42]} color="#F472B6" scale={0.15} pulseSpeed={2.4} />
        <FollicleNode position={[-0.05, 0.92, 0.22]} color="#C084FC" scale={0.13} pulseSpeed={1.6} />
        <FollicleNode position={[0.12, -0.85, -0.2]} color="#A855F7" scale={0.12} pulseSpeed={2.1} />
        <FollicleNode position={[0.3, 0.2, 0.65]} color="#FDA4AF" scale={0.11} pulseSpeed={2.5} />
        <FollicleNode position={[-0.35, -0.15, 0.62]} color="#FB7185" scale={0.12} pulseSpeed={1.9} />

        {/* Delicate Scientific Orbital Guidance Curves */}
        <ScientificOrbitalCurve radius={2.35} speed={0.12} color="#D8B4FE" tiltX={0.35} tiltY={0.2} />
        <ScientificOrbitalCurve radius={1.95} speed={-0.18} color="#FDA4AF" tiltX={-0.4} tiltY={-0.25} />

        {/* Inflowing Data Particles */}
        <BiologicalParticleSwarm count={50} />
      </Float>
    </group>
  );
}

// Graceful CSS Fallback
function FallbackOrganicCore() {
  return (
    <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
      <div className="w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-[#6E2D8B]/50 via-[#8E3EAF]/40 to-[#E87084]/40 blur-3xl animate-pulse" />
      <div className="absolute w-56 h-64 sm:w-64 sm:h-72 rounded-[45%_55%_60%_40%/50%_60%_40%_50%] bg-gradient-to-br from-[#7E22CE]/90 via-[#A21CAF]/85 to-[#E87084]/90 shadow-2xl border border-white/20 backdrop-blur-xl animate-[spin_18s_linear_infinite]" />
      <div className="absolute top-1/3 left-1/3 w-4 h-4 rounded-full bg-[#FB7185] shadow-[0_0_15px_#FB7185]" />
      <div className="absolute bottom-1/3 right-1/3 w-3.5 h-3.5 rounded-full bg-[#FDA4AF] shadow-[0_0_12px_#FDA4AF]" />
      <div className="absolute top-1/2 right-1/4 w-3 h-3 rounded-full bg-[#C084FC] shadow-[0_0_10px_#C084FC]" />
    </div>
  );
}

interface ErrorBoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class WebGLErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {}

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export const VitalOrb: React.FC<{ className?: string; interactive?: boolean }> = ({ className }) => {
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
    return <FallbackOrganicCore />;
  }

  return (
    <div className={className || 'w-full h-full min-h-[380px]'}>
      <WebGLErrorBoundary fallback={<FallbackOrganicCore />}>
        <Canvas
          camera={{ position: [0, 0, 5.2], fov: 40 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
          className="w-full h-full"
        >
          {/* Scientific Atmospheric Lighting */}
          <ambientLight intensity={0.9} />
          <directionalLight position={[6, 7, 6]} intensity={1.9} color="#FFFFFF" />
          <directionalLight position={[-6, -5, 4]} intensity={1.4} color="#E87084" />
          <pointLight position={[0, 0, 0]} color="#FB7185" intensity={4.0} distance={6} />
          <pointLight position={[-4, 3, 2]} color="#C084FC" intensity={2.8} />
          <pointLight position={[4, -3, 2]} color="#A855F7" intensity={2.6} />

          <OrganicIntelligenceCore />
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
};
