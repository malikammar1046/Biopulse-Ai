import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial, Line } from '@react-three/drei';
import * as THREE from 'three';

// Luminous Follicle-inspired inner node
function FollicleNode({ position, color = '#FB7185', scale = 0.16 }: { position: [number, number, number]; color?: string; scale?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.getElapsedTime();
      meshRef.current.scale.setScalar(scale * (1 + Math.sin(t * 2 + position[0] * 3) * 0.15));
    }
  });

  return (
    <Sphere ref={meshRef} args={[1, 32, 32]} position={position} scale={scale}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={2.5}
        roughness={0.1}
      />
    </Sphere>
  );
}

// Delicate Orbital Ring Curve
function OrbitalRing({ radius = 2.2, speed = 0.3, color = '#D8B4FE', tilt = 0.4 }: { radius?: number; speed?: number; color?: string; tilt?: number }) {
  const groupRef = useRef<THREE.Group>(null);

  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    const segments = 80;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      pts.push([Math.cos(theta) * radius, Math.sin(theta) * radius * 0.45, Math.sin(theta) * radius * tilt]);
    }
    return pts;
  }, [radius, tilt]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = state.clock.getElapsedTime() * speed;
    }
  });

  return (
    <group ref={groupRef}>
      <Line points={points} color={color} opacity={0.35} transparent lineWidth={1.2} />
    </group>
  );
}

// Biological Ovary-inspired Bilateral Intelligence Mesh
function BiologicalOvaryMesh() {
  const mainGroupRef = useRef<THREE.Group>(null);
  const leftLobeRef = useRef<THREE.Mesh>(null);
  const rightLobeRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const mouseX = state.pointer.x * 0.4;
    const mouseY = state.pointer.y * 0.4;

    if (mainGroupRef.current) {
      // Gentle floating rotation and mouse responsiveness
      mainGroupRef.current.rotation.y = THREE.MathUtils.lerp(mainGroupRef.current.rotation.y, t * 0.12 + mouseX, 0.05);
      mainGroupRef.current.rotation.x = THREE.MathUtils.lerp(mainGroupRef.current.rotation.x, Math.sin(t * 0.2) * 0.15 - mouseY, 0.05);
      mainGroupRef.current.position.y = Math.sin(t * 0.8) * 0.08;
    }

    if (leftLobeRef.current && rightLobeRef.current) {
      leftLobeRef.current.rotation.z = t * 0.08;
      rightLobeRef.current.rotation.z = -t * 0.08;
    }
  });

  return (
    <group ref={mainGroupRef}>
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.6}>
        {/* Left Organic Biological Lobe */}
        <Sphere ref={leftLobeRef} args={[1.1, 64, 64]} position={[-0.55, 0, 0]} scale={[1.1, 1.25, 0.95]}>
          <MeshDistortMaterial
            color="#7E22CE"
            roughness={0.15}
            metalness={0.1}
            distort={0.38}
            speed={1.4}
            transparent
            opacity={0.82}
          />
        </Sphere>

        {/* Right Organic Biological Lobe (Bilateral Symmetry) */}
        <Sphere ref={rightLobeRef} args={[1.05, 64, 64]} position={[0.55, 0, 0]} scale={[1.05, 1.2, 0.9]}>
          <MeshDistortMaterial
            color="#A21CAF"
            roughness={0.18}
            metalness={0.1}
            distort={0.34}
            speed={1.2}
            transparent
            opacity={0.78}
          />
        </Sphere>

        {/* Central Core Luminescence */}
        <Sphere args={[0.65, 32, 32]} position={[0, 0, 0]}>
          <meshStandardMaterial
            color="#E87084"
            emissive="#E87084"
            emissiveIntensity={1.8}
            roughness={0.3}
            transparent
            opacity={0.6}
          />
        </Sphere>

        {/* Luminous Follicle-like Spheres */}
        <FollicleNode position={[-0.8, 0.5, 0.4]} color="#FB7185" scale={0.18} />
        <FollicleNode position={[-0.9, -0.4, 0.3]} color="#FDA4AF" scale={0.14} />
        <FollicleNode position={[0.8, 0.4, 0.35]} color="#E87084" scale={0.16} />
        <FollicleNode position={[0.7, -0.5, 0.45]} color="#F472B6" scale={0.15} />
        <FollicleNode position={[0, 0.85, 0.2]} color="#C084FC" scale={0.13} />
        <FollicleNode position={[0.1, -0.8, -0.2]} color="#A855F7" scale={0.12} />

        {/* Orbital Guidance Curves */}
        <OrbitalRing radius={2.2} speed={0.2} color="#D8B4FE" tilt={0.35} />
        <OrbitalRing radius={1.9} speed={-0.25} color="#FDA4AF" tilt={-0.45} />
      </Float>
    </group>
  );
}

function FallbackBiologicalOrb() {
  return (
    <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
      {/* Outer ambient glow */}
      <div className="w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-[#6E2D8B]/50 via-[#8E3EAF]/40 to-[#E87084]/40 blur-3xl animate-pulse" />
      {/* Core biological shape */}
      <div className="absolute w-56 h-64 sm:w-64 sm:h-72 rounded-[45%_55%_60%_40%/50%_60%_40%_50%] bg-gradient-to-br from-[#7E22CE]/90 via-[#A21CAF]/85 to-[#E87084]/90 shadow-2xl border border-white/20 backdrop-blur-xl animate-[spin_18s_linear_infinite]" />
      {/* Luminous Follicle Dots */}
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

  componentDidCatch() {
    // Non-blocking graceful fallback
  }

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
    return <FallbackBiologicalOrb />;
  }

  return (
    <div className={className || 'w-full h-full min-h-[360px]'}>
      <WebGLErrorBoundary fallback={<FallbackBiologicalOrb />}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 42 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
          className="w-full h-full"
        >
          {/* Atmospheric Lighting */}
          <ambientLight intensity={1.1} />
          <directionalLight position={[6, 6, 6]} intensity={1.8} color="#FFFFFF" />
          <directionalLight position={[-6, -4, 4]} intensity={1.2} color="#E87084" />
          <pointLight position={[0, 0, 0]} color="#FB7185" intensity={3.5} distance={5} />
          <pointLight position={[-4, 3, 2]} color="#C084FC" intensity={2.8} />
          <pointLight position={[4, -3, 2]} color="#A855F7" intensity={2.5} />

          <BiologicalOvaryMesh />
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
};
