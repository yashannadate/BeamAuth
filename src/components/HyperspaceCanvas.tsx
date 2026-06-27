"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ─── Particle data ──────────────────────────────────────────────────────────
const PARTICLE_COUNT = 6000;
const SPREAD         = 120;  // XY scatter radius
const DEPTH          = 400;  // Z depth tunnel length
const SPEED          = 0.6;  // warp speed multiplier

// Per-particle: [x, y, z, size, colorFactor]
function buildParticleData() {
  const positions  = new Float32Array(PARTICLE_COUNT * 3);
  const sizes      = new Float32Array(PARTICLE_COUNT);
  const colors     = new Float32Array(PARTICLE_COUNT * 3);
  const velocities = new Float32Array(PARTICLE_COUNT); // individual speed tweak

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Scatter in a cylinder toward the camera
    const angle  = Math.random() * Math.PI * 2;
    const radius = Math.pow(Math.random(), 0.5) * SPREAD; // sqrt for uniform disk
    positions[i * 3]     = Math.cos(angle) * radius;      // x
    positions[i * 3 + 1] = Math.sin(angle) * radius;      // y
    positions[i * 3 + 2] = -(Math.random() * DEPTH);      // z (behind camera)

    sizes[i] = Math.random() * 2.5 + 0.5;

    // Color: mix between blue (#60A5FA) and white (#FFFFFF)
    const t = Math.random();
    if (t < 0.6) {
      // neon blue
      colors[i * 3]     = 0.22 + t * 0.4;
      colors[i * 3 + 1] = 0.45 + t * 0.3;
      colors[i * 3 + 2] = 0.98;
    } else if (t < 0.85) {
      // cyan-white
      colors[i * 3]     = 0.7;
      colors[i * 3 + 1] = 0.88;
      colors[i * 3 + 2] = 1.0;
    } else {
      // pure white core stars
      colors[i * 3]     = 1.0;
      colors[i * 3 + 1] = 1.0;
      colors[i * 3 + 2] = 1.0;
    }

    velocities[i] = 0.4 + Math.random() * 1.2; // per-particle speed
  }

  return { positions, sizes, colors, velocities };
}

// ─── Warp Particles mesh ─────────────────────────────────────────────────────
function WarpParticles() {
  const meshRef    = useRef<THREE.Points>(null!);

  const { positions, sizes, colors, velocities } = useMemo(() => buildParticleData(), []);

  // Build geometry
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position",  new THREE.BufferAttribute(positions.slice(), 3));
    geo.setAttribute("color",     new THREE.BufferAttribute(colors,   3));
    geo.setAttribute("aSize",     new THREE.BufferAttribute(sizes,    1));
    return geo;
  }, [positions, colors, sizes]);

  // Custom shader material for stretched warp streaks
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uSpeed:   { value: 0.0 },
        uTime:    { value: 0.0 },
        uPixelRatio: { value: window.devicePixelRatio || 1 },
      },
      vertexShader: /* glsl */ `
        attribute float aSize;
        attribute vec3  color;
        varying   vec3  vColor;
        varying   float vAlpha;
        uniform   float uSpeed;
        uniform   float uPixelRatio;

        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          
          // Stretch size along Z based on speed for streak effect
          float dist  = length(mvPosition.xyz);
          float scale = mix(1.0, 3.5, uSpeed);
          gl_PointSize = aSize * uPixelRatio * scale * (300.0 / -mvPosition.z);
          gl_Position  = projectionMatrix * mvPosition;

          // Fade particles near camera and at far edge
          float normDist = clamp(dist / 200.0, 0.0, 1.0);
          vAlpha = smoothstep(0.0, 0.15, normDist) * smoothstep(1.0, 0.6, normDist);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3  vColor;
        varying float vAlpha;

        void main() {
          // Soft circular point with bright core
          vec2  uv   = gl_PointCoord - 0.5;
          float dist = length(uv);
          if (dist > 0.5) discard;
          
          float core  = smoothstep(0.5, 0.0, dist);
          float glow  = smoothstep(0.5, 0.15, dist) * 0.6;
          float alpha = (core + glow) * vAlpha;

          gl_FragColor = vec4(vColor + vec3(glow * 0.4), alpha);
        }
      `,
      transparent:  true,
      depthWrite:   false,
      blending:     THREE.AdditiveBlending,
      vertexColors: true,
    });
  }, []);

  // ── Per-frame animation ──
  useFrame((state, delta) => {
    const t     = state.clock.elapsedTime;
    const speed = SPEED * delta * 60;

    const points = meshRef.current;
    if (!points) return;

    const shaderMaterial = points.material as THREE.ShaderMaterial;
    shaderMaterial.uniforms.uTime.value  = t;
    shaderMaterial.uniforms.uSpeed.value = SPEED;

    const geom = points.geometry;
    const positionAttr = geom.getAttribute("position") as THREE.BufferAttribute;
    const positionsArray = positionAttr.array as Float32Array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Move particle toward camera (+Z)
      positionsArray[i * 3 + 2] += velocities[i] * speed;

      // Reset particle when it passes camera
      if (positionsArray[i * 3 + 2] > 10) {
        const angle  = Math.random() * Math.PI * 2;
        const radius = Math.pow(Math.random(), 0.5) * SPREAD;
        positionsArray[i * 3]     = Math.cos(angle) * radius;
        positionsArray[i * 3 + 1] = Math.sin(angle) * radius;
        positionsArray[i * 3 + 2] = -DEPTH;
      }
    }

    positionAttr.needsUpdate = true;

    // Very gentle camera sway for a cinematic feel
    state.camera.position.x = Math.sin(t * 0.05) * 1.5;
    state.camera.position.y = Math.cos(t * 0.07) * 0.8;
    state.camera.lookAt(0, 0, 0);
  });

  return <points ref={meshRef} geometry={geometry} material={material} />;
}

function buildStarFieldData() {
  const count  = 1500;
  const pos    = new Float32Array(count * 3);
  const col    = new Float32Array(count * 3);
  const sizes  = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    pos[i * 3]     = (Math.random() - 0.5) * 300;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 300;
    pos[i * 3 + 2] = -(Math.random() * 200 + 80);

    col[i * 3]     = 0.5 + Math.random() * 0.5;
    col[i * 3 + 1] = 0.6 + Math.random() * 0.4;
    col[i * 3 + 2] = 1.0;
    sizes[i]        = Math.random() * 0.8 + 0.2;
  }
  return { pos, col, sizes };
}

// ─── Static star field in the background ────────────────────────────────────
function StarField() {
  const { pos, col, sizes } = useMemo(() => buildStarFieldData(), []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos,   3));
    geo.setAttribute("color",    new THREE.BufferAttribute(col,   3));
    geo.setAttribute("aSize",    new THREE.BufferAttribute(sizes, 1));
    return geo;
  }, [pos, col, sizes]);

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        size:         0.5,
        vertexColors: true,
        blending:     THREE.AdditiveBlending,
        transparent:  true,
        opacity:      0.6,
        depthWrite:   false,
        sizeAttenuation: true,
      }),
    []
  );

  return <points geometry={geometry} material={material} />;
}

// ─── Central glow bloom ──────────────────────────────────────────────────────
function CenterGlow() {
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const s = 1 + Math.sin(clock.elapsedTime * 0.8) * 0.15;
    meshRef.current.scale.setScalar(s);
    (meshRef.current.material as THREE.MeshBasicMaterial).opacity =
      0.04 + Math.sin(clock.elapsedTime * 1.2) * 0.02;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -60]}>
      <sphereGeometry args={[18, 32, 32]} />
      <meshBasicMaterial color="#2563eb" transparent opacity={0.05} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

// ─── Public export ──────────────────────────────────────────────────────────
export default function HyperspaceCanvas() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(10,22,40,0.4) 0%, #000 70%)",
      }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 20], fov: 75, near: 0.1, far: 600 }}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.NoToneMapping,
        }}
        dpr={[1, 1.5]}
        style={{ background: "transparent" }}
      >
        <color attach="background" args={["#000000"]} />
        <fog attach="fog" args={["#000000", 80, 350]} />

        <StarField />
        <WarpParticles />
        <CenterGlow />
      </Canvas>

      {/* Radial vignette to blend into hero left content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 100% 100% at 0% 50%, rgba(0,0,0,0.7) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
