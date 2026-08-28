import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial, Line } from '@react-three/drei';
import * as THREE from 'three';

/* ─────────────────────────────────────────────────────────────────────────────
   Sub-components: Follicles, Fallopian curves, hormonal particles
   ────────────────────────────────────────────────────────────────────────── */

function Follicle({
  position,
  color = '#FB7185',
  scale = 0.12,
  pulseSpeed = 2.2,
  brightness = 1,
}: {
  position: [number, number, number];
  color?: string;
  scale?: number;
  pulseSpeed?: number;
  brightness?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (ref.current) {
      const t = s.clock.getElapsedTime();
      const pulse = 1 + Math.sin(t * pulseSpeed + position[0] * 3) * 0.25;
      ref.current.scale.setScalar(scale * pulse);
    }
  });
  return (
    <Sphere ref={ref} args={[1, 24, 24]} position={position} scale={scale}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={3.2 * brightness}
        roughness={0.1}
        transparent
        opacity={0.9 * brightness}
      />
    </Sphere>
  );
}

function TubalCurve({
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
  const pts = useMemo(() => {
    const c = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...start),
      new THREE.Vector3(...control),
      new THREE.Vector3(...end)
    );
    return c.getPoints(48).map((p) => [p.x, p.y, p.z] as [number, number, number]);
  }, [start, control, end]);
  return <Line points={pts} color={color} opacity={0.45} transparent lineWidth={1.5} />;
}

function SignalingParticles({ count = 28 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const [positions, prog, spd, paths] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const pr = new Float32Array(count);
    const sp = new Float32Array(count);
    const pa = new Uint8Array(count);
    for (let i = 0; i < count; i++) {
      pr[i] = Math.random();
      sp[i] = 0.1 + Math.random() * 0.12;
      pa[i] = i % 2;
    }
    return [pos, pr, sp, pa];
  }, [count]);

  useFrame((s) => {
    if (!ref.current) return;
    const posAttr = ref.current.geometry.attributes.position;
    const dt = s.clock.getDelta();
    for (let i = 0; i < count; i++) {
      prog[i] = (prog[i] + dt * spd[i]) % 1.0;
      const p = prog[i];
      const isL = paths[i] === 0;
      const sx = isL ? -1.85 : 1.85;
      const sy = 0.45;
      const cx = isL ? -1.0 : 1.0;
      const cy = 1.1;
      const x = (1 - p) * (1 - p) * sx + 2 * (1 - p) * p * cx + p * p * 0;
      const y = (1 - p) * (1 - p) * sy + 2 * (1 - p) * p * cy + p * p * 0.2;
      const z = Math.sin(p * Math.PI) * 0.2;
      posAttr.setXYZ(i, x, y, z);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#FDA4AF"
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main Anatomical Scene: 5-phase entrance + idle
   ────────────────────────────────────────────────────────────────────────── */

function AnatomyScene({
  onPhaseChange,
  reducedMotion,
}: {
  onPhaseChange: (phase: number) => void;
  reducedMotion: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const uterusRef = useRef<THREE.Mesh>(null);
  const cervixRef = useRef<THREE.Mesh>(null);
  const vaginaRef = useRef<THREE.Mesh>(null);
  const leftOvaryRef = useRef<THREE.Mesh>(null);
  const rightOvaryRef = useRef<THREE.Mesh>(null);

  const startTime = useRef(performance.now());
  const currentPhase = useRef(0);

  const { pointer } = useThree();

  useFrame((state) => {
    const elapsed = (performance.now() - startTime.current) / 1000;
    const t = state.clock.getElapsedTime();

    // Phase detection
    let phase: number;
    if (elapsed < 1) phase = 1;
    else if (elapsed < 3) phase = 2;
    else if (elapsed < 5) phase = 3;
    else if (elapsed < 7) phase = 4;
    else phase = 5;

    if (phase !== currentPhase.current) {
      currentPhase.current = phase;
      onPhaseChange(phase);
    }

    if (!groupRef.current) return;

    // --- PHASE 1: VOID (0–1s) — deep behind camera, invisible ---
    // --- PHASE 2: EMERGENCE (1–3s) — translate z from -6 → 0, opacity 0→1 ---
    // --- PHASE 3: ROTATION (3–5s) — subtle rotation ±10° ---
    // --- PHASE 4: FOCUS (5–7s) — settle + ovaries brighten ---
    // --- PHASE 5: IDLE (7+) — gentle breathing ---

    if (reducedMotion) {
      // Static display for reduced motion users
      groupRef.current.position.z = 0;
      groupRef.current.rotation.set(0, 0, 0);
      groupRef.current.visible = true;
      return;
    }

    // Z position: approach from -6 → 0 during phases 1–3
    let targetZ: number;
    if (elapsed < 1) {
      targetZ = -6;
    } else if (elapsed < 3) {
      const p = (elapsed - 1) / 2;
      const ease = 1 - Math.pow(1 - p, 3); // easeOutCubic
      targetZ = THREE.MathUtils.lerp(-6, 0, ease);
    } else {
      targetZ = 0;
    }
    groupRef.current.position.z = THREE.MathUtils.lerp(
      groupRef.current.position.z,
      targetZ,
      0.08
    );

    // Opacity simulation via visibility
    groupRef.current.visible = elapsed > 0.8;

    // Rotation phases
    if (elapsed >= 3 && elapsed < 5) {
      // Phase 3: subtle rotation sweep
      const rotP = (elapsed - 3) / 2;
      const rotAngle = Math.sin(rotP * Math.PI) * 0.17; // ~10°
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        rotAngle,
        0.06
      );
    } else if (elapsed >= 5) {
      // Phase 4+5: Idle breathing + parallax
      const mouseX = pointer.x * 0.05; // ±3°
      const mouseY = pointer.y * 0.035; // ±2°
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        Math.sin(t * 0.25) * 0.08 + mouseX,
        0.04
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        Math.sin(t * 0.18) * 0.04 - mouseY,
        0.04
      );
      // Gentle floating
      groupRef.current.position.y = Math.sin(t * 0.5) * 0.06;
    }

    // Uterus breathing pulse
    if (uterusRef.current) {
      const pulse = 1 + Math.sin(t * 1.1) * 0.025;
      uterusRef.current.scale.set(1.05 * pulse, 1.2 * pulse, 0.75 * pulse);
    }
    if (cervixRef.current) {
      const cp = 1 + Math.sin(t * 1.1 + 0.3) * 0.018;
      cervixRef.current.scale.set(0.65 * cp, 0.9 * cp, 0.5 * cp);
    }
    if (vaginaRef.current) {
      const vp = 1 + Math.sin(t * 1.1 + 0.6) * 0.015;
      vaginaRef.current.scale.set(0.55 * vp, 1.1 * vp, 0.45 * vp);
    }
    if (leftOvaryRef.current) {
      leftOvaryRef.current.rotation.z = Math.sin(t * 0.4) * 0.08;
    }
    if (rightOvaryRef.current) {
      rightOvaryRef.current.rotation.z = -Math.sin(t * 0.4) * 0.08;
    }
  });

  // Follicle brightness ramp during phase 4
  const follicleGlow = 1;

  return (
    <group ref={groupRef} position={[0, 0, -6]} visible={false}>
      <Float speed={0.8} rotationIntensity={0.12} floatIntensity={0.25}>
        {/* 1. UTERUS */}
        <group position={[0, 0.1, 0]}>
          <Sphere ref={uterusRef} args={[0.95, 64, 64]} scale={[1.05, 1.2, 0.75]}>
            <MeshDistortMaterial
              color="#6E2D8B"
              emissive="#4A154B"
              emissiveIntensity={0.5}
              roughness={0.15}
              metalness={0.06}
              distort={0.2}
              speed={0.9}
              transparent
              opacity={0.88}
            />
          </Sphere>
          {/* Inner endometrial glow */}
          <Sphere args={[0.38, 32, 32]} position={[0, 0.1, 0]}>
            <meshStandardMaterial
              color="#E87084"
              emissive="#FB7185"
              emissiveIntensity={2.8}
              roughness={0.2}
              transparent
              opacity={0.6}
            />
          </Sphere>
        </group>

        {/* 2. CERVIX */}
        <Sphere
          ref={cervixRef}
          args={[0.42, 32, 32]}
          position={[0, -0.75, 0]}
          scale={[0.65, 0.9, 0.5]}
        >
          <meshStandardMaterial
            color="#581C87"
            emissive="#3B0764"
            emissiveIntensity={0.6}
            roughness={0.2}
            transparent
            opacity={0.82}
          />
        </Sphere>

        {/* 3. VAGINA */}
        <Sphere
          ref={vaginaRef}
          args={[0.38, 32, 32]}
          position={[0, -1.35, 0]}
          scale={[0.55, 1.1, 0.45]}
        >
          <meshStandardMaterial
            color="#4A154B"
            emissive="#2A0845"
            emissiveIntensity={0.45}
            roughness={0.25}
            transparent
            opacity={0.78}
          />
        </Sphere>

        {/* 4. LEFT OVARY + FOLLICLES */}
        <group position={[-1.85, 0.45, 0]}>
          <Sphere ref={leftOvaryRef} args={[0.55, 48, 48]} scale={[1.15, 0.85, 0.8]}>
            <MeshDistortMaterial
              color="#A21CAF"
              emissive="#6E2D8B"
              emissiveIntensity={0.55}
              roughness={0.12}
              distort={0.25}
              speed={1.1}
              transparent
              opacity={0.9}
            />
          </Sphere>
          <Follicle position={[-0.25, 0.22, 0.3]} color="#FB7185" scale={0.13} pulseSpeed={2.4} brightness={follicleGlow} />
          <Follicle position={[0.22, -0.18, 0.32]} color="#FDA4AF" scale={0.1} pulseSpeed={1.9} brightness={follicleGlow * 0.7} />
          <Follicle position={[-0.1, -0.28, 0.24]} color="#C084FC" scale={0.11} pulseSpeed={2.1} brightness={follicleGlow * 0.85} />
          <Follicle position={[0.28, 0.2, 0.22]} color="#F472B6" scale={0.12} pulseSpeed={2.6} brightness={follicleGlow} />
          <Follicle position={[0, 0.32, -0.15]} color="#E87084" scale={0.08} pulseSpeed={1.7} brightness={follicleGlow * 0.5} />
        </group>

        {/* 5. RIGHT OVARY + FOLLICLES */}
        <group position={[1.85, 0.45, 0]}>
          <Sphere ref={rightOvaryRef} args={[0.55, 48, 48]} scale={[1.15, 0.85, 0.8]}>
            <MeshDistortMaterial
              color="#A21CAF"
              emissive="#6E2D8B"
              emissiveIntensity={0.55}
              roughness={0.12}
              distort={0.25}
              speed={1.1}
              transparent
              opacity={0.9}
            />
          </Sphere>
          <Follicle position={[0.25, 0.22, 0.3]} color="#FB7185" scale={0.13} pulseSpeed={2.1} brightness={follicleGlow} />
          <Follicle position={[-0.22, -0.18, 0.32]} color="#FDA4AF" scale={0.1} pulseSpeed={2.5} brightness={follicleGlow * 0.7} />
          <Follicle position={[0.1, -0.28, 0.24]} color="#C084FC" scale={0.11} pulseSpeed={1.8} brightness={follicleGlow * 0.85} />
          <Follicle position={[-0.28, 0.2, 0.22]} color="#F472B6" scale={0.12} pulseSpeed={2.3} brightness={follicleGlow} />
          <Follicle position={[0, 0.32, -0.15]} color="#E87084" scale={0.08} pulseSpeed={2.0} brightness={follicleGlow * 0.5} />
        </group>

        {/* 6. FALLOPIAN TUBES */}
        <TubalCurve
          start={[-0.8, 0.75, 0]}
          control={[-1.35, 1.15, 0.15]}
          end={[-1.85, 0.55, 0]}
          color="#D8B4FE"
        />
        <TubalCurve
          start={[0.8, 0.75, 0]}
          control={[1.35, 1.15, 0.15]}
          end={[1.85, 0.55, 0]}
          color="#D8B4FE"
        />

        {/* 7. HORMONAL SIGNALING PARTICLES */}
        <SignalingParticles count={28} />
      </Float>
    </group>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CSS Fallback when WebGL is unavailable
   ────────────────────────────────────────────────────────────────────────── */

function CSSFallback() {
  return (
    <div className="relative w-full h-full flex items-center justify-center pointer-events-none" role="img" aria-label="Stylized female reproductive system visualization">
      <div className="w-80 h-80 rounded-full bg-gradient-to-tr from-[#6E2D8B]/40 via-[#8E3EAF]/30 to-[#E87084]/40 blur-3xl animate-pulse" />
      <div className="absolute w-44 h-48 rounded-[40%_40%_60%_60%/40%_40%_70%_70%] bg-gradient-to-b from-[#7E22CE]/85 to-[#4A154B]/90 border border-white/20 shadow-2xl" />
      <div className="absolute top-[60%] w-16 h-20 rounded-b-2xl bg-[#4A154B]/80 border-x border-b border-white/10" />
      <div className="absolute -left-2 top-1/3 w-16 h-12 rounded-full bg-gradient-to-r from-[#A21CAF] to-[#E87084] shadow-lg border border-white/30 flex items-center justify-center">
        <div className="w-2.5 h-2.5 rounded-full bg-[#FB7185] animate-ping" />
      </div>
      <div className="absolute -right-2 top-1/3 w-16 h-12 rounded-full bg-gradient-to-l from-[#A21CAF] to-[#E87084] shadow-lg border border-white/30 flex items-center justify-center">
        <div className="w-2.5 h-2.5 rounded-full bg-[#FB7185] animate-ping" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Exported wrapper — cinematic 5-phase entrance anatomy canvas
   ────────────────────────────────────────────────────────────────────────── */

export const AboutAnatomyCanvas: React.FC<{
  className?: string;
  onPhaseChange?: (phase: number) => void;
}> = ({ className, onPhaseChange }) => {
  const [hasWebGL, setHasWebGL] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
      if (!gl) setHasWebGL(false);
    } catch {
      setHasWebGL(false);
    }

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handlePhaseChange = useCallback(
    (phase: number) => {
      onPhaseChange?.(phase);
    },
    [onPhaseChange]
  );

  if (!hasWebGL) return <CSSFallback />;

  return (
    <div className={className || 'w-full h-full min-h-[500px]'}>
      <Canvas
        camera={{ position: [0, 0, 5.8], fov: 38 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[6, 8, 6]} intensity={1.8} color="#FFFFFF" />
        <directionalLight position={[-6, -6, 4]} intensity={1.4} color="#E87084" />
        <pointLight position={[0, 0, 0]} color="#FB7185" intensity={3.2} distance={6} />
        <pointLight position={[-2, 1, 2]} color="#C084FC" intensity={2.2} />
        <pointLight position={[2, 1, 2]} color="#FDA4AF" intensity={2.2} />

        <AnatomyScene onPhaseChange={handlePhaseChange} reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
};
