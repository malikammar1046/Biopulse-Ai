import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

function AnimatedOrganicMesh() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.15;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.6} floatIntensity={0.8}>
      <Sphere ref={meshRef} args={[1.4, 64, 64]} scale={1.1}>
        <MeshDistortMaterial
          color="#8E3EAF"
          roughness={0.2}
          metalness={0.1}
          distort={0.35}
          speed={1.5}
        />
      </Sphere>
    </Float>
  );
}

function FallbackOrb() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-gradient-to-tr from-[#6E2D8B] via-[#8E3EAF] to-[#E87084] opacity-80 blur-2xl animate-pulse" />
      <div className="absolute w-48 h-48 sm:w-60 sm:h-60 rounded-full bg-gradient-to-br from-[#A21CAF] to-[#6E2D8B] shadow-2xl border border-white/20" />
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
    // Graceful fallback without crashing page
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export const VitalOrb: React.FC<{ className?: string }> = ({ className }) => {
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
    return <FallbackOrb />;
  }

  return (
    <div className={className || 'w-full h-full min-h-[320px]'}>
      <WebGLErrorBoundary fallback={<FallbackOrb />}>
        <Canvas
          camera={{ position: [0, 0, 4.5], fov: 45 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
          className="w-full h-full"
        >
          <ambientLight intensity={1.2} />
          <directionalLight position={[5, 5, 5]} intensity={1.5} color="#FFFFFF" />
          <pointLight position={[-4, -4, -2]} color="#E87084" intensity={2} />
          <pointLight position={[3, -2, 2]} color="#C084FC" intensity={2} />
          <AnimatedOrganicMesh />
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
};
