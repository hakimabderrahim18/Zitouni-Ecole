import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, MeshWobbleMaterial, Float } from '@react-three/drei';

function MouseParallaxGroup({ children }) {
  const groupRef = useRef();
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMouse({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += (mouse.x * 0.35 - groupRef.current.rotation.y) * 0.05;
      groupRef.current.rotation.x += (mouse.y * 0.25 - groupRef.current.rotation.x) * 0.05;
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

function FloatingShape({ type = 'dodecahedron', geometry, color = '#F4B400', speed = 1.5, wireframe = false, ...props }) {
  const meshRef = useRef();
  const shapeType = geometry || type;

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2 * speed;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3 * speed;
    }
  });

  return (
    <mesh ref={meshRef} {...props}>
      {shapeType === 'dodecahedron' && <dodecahedronGeometry args={[1.5, 0]} />}
      {shapeType === 'icosahedron' && <icosahedronGeometry args={[1.4, 0]} />}
      {shapeType === 'octahedron' && <octahedronGeometry args={[1.3, 0]} />}
      {shapeType === 'torus' && <torusGeometry args={[0.8, 0.25, 16, 100]} />}
      {shapeType === 'sphere' && <sphereGeometry args={[1, 32, 32]} />}
      
      {wireframe ? (
        <meshStandardMaterial color={color} wireframe emissive={color} emissiveIntensity={0.6} />
      ) : shapeType === 'dodecahedron' || shapeType === 'icosahedron' ? (
        <meshPhysicalMaterial
          color={color}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          roughness={0.12}
          metalness={0.75}
          reflectivity={1}
        />
      ) : (
        <MeshWobbleMaterial
          color={color}
          factor={0.3}
          speed={speed}
          roughness={0.2}
          metalness={0.2}
        />
      )}
    </mesh>
  );
}

function LightsAndEffects() {
  const lightRef = useRef();
  const lightRef2 = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (lightRef.current) {
      lightRef.current.position.x = Math.sin(t * 0.7) * 5;
      lightRef.current.position.y = Math.cos(t * 0.7) * 5;
    }
    if (lightRef2.current) {
      lightRef2.current.position.x = Math.cos(t * 0.5) * -5;
      lightRef2.current.position.z = Math.sin(t * 0.5) * 5;
    }
  });

  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[8, 8, 8]} intensity={2.2} color="#ffffff" castShadow />
      <pointLight ref={lightRef} position={[5, 5, 5]} intensity={2.5} color="#FFD95A" distance={15} />
      <pointLight ref={lightRef2} position={[-5, -5, 2]} intensity={2} color="#F4B400" distance={15} />
      <pointLight position={[0, -6, -4]} intensity={1.5} color="#3b82f6" />
    </>
  );
}

export default function ThreeDScene({ type = 'login' }) {
  const [webGlSupported] = useState(() => {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  });

  if (!webGlSupported) {
    return (
      <div className="w-full h-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-amber-500/10 to-yellow-600/5">
        <div className="absolute w-[200px] h-[200px] rounded-full bg-brand-500/20 filter blur-3xl animate-pulse" />
        <div className="w-40 h-40 rounded-[30%_70%_70%_30%_/_30%_30%_70%_70%] bg-gradient-to-r from-brand-400 to-amber-500 animate-float opacity-70 flex items-center justify-center border border-brand-300 shadow-xl shadow-brand-500/10">
          <div className="w-20 h-20 rounded-full bg-white/40 backdrop-blur-sm border border-white/50" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <Canvas camera={{ position: [0, 0, 5.5], fov: 34 }}>
        <LightsAndEffects />
        
        {type === 'login' && (
          <MouseParallaxGroup>
            {/* Core Hero Cluster */}
            <Float speed={2} rotationIntensity={1.8} floatIntensity={1.5}>
              <FloatingShape type="dodecahedron" color="#F4B400" speed={1.2} position={[0, 0, 0]} scale={1.8} />
              <FloatingShape type="dodecahedron" color="#FFD95A" speed={0.9} position={[0, 0, 0]} scale={2.1} wireframe />
              <FloatingShape type="torus" color="#FFD95A" speed={2} position={[-2.8, 1.6, -1]} scale={1.2} />
              <FloatingShape type="sphere" color="#ffffff" speed={1.5} position={[2.5, -1.6, -1]} scale={1.0} />
            </Float>

            {/* Deep Parallax Floating Crystals */}
            <Float speed={3} rotationIntensity={2.5} floatIntensity={2}>
              <FloatingShape geometry="octahedron" color="#FFD95A" speed={2.2} position={[3.2, 2.2, -2.5]} scale={0.6} />
              <FloatingShape geometry="icosahedron" color="#ffffff" speed={1.8} position={[-3.0, -2.4, -2]} scale={0.65} />
              <FloatingShape geometry="torus" color="#F4B400" speed={2.5} position={[0.5, 2.8, -1.8]} scale={0.5} />
            </Float>

            {/* Micro Sparkle Accents */}
            <Float speed={1.5} rotationIntensity={1} floatIntensity={1}>
              <FloatingShape geometry="sphere" color="#FFD95A" speed={1.2} position={[-1.8, 0.4, 1.2]} scale={0.15} />
              <FloatingShape geometry="sphere" color="#ffffff" speed={1.5} position={[1.8, 1.0, 1.5]} scale={0.12} />
              <FloatingShape geometry="sphere" color="#F4B400" speed={1.0} position={[1.0, -1.5, 1.0]} scale={0.18} />
            </Float>
          </MouseParallaxGroup>
        )}

        {type === 'landing' && (
          <Float speed={2.5} rotationIntensity={2} floatIntensity={2}>
            <FloatingShape type="dodecahedron" color="#F4B400" speed={1.5} position={[0, 0.2, 0]} />
            <FloatingShape type="torus" color="#FFD95A" speed={1.8} position={[2.2, 1.5, -1.5]} scale={0.8} />
            <FloatingShape type="sphere" color="#ffffff" speed={1} position={[-2.2, -1.5, -1]} scale={0.5} />
            <FloatingShape type="torus" color="#ca9000" speed={2.5} position={[-1.8, 1.5, -2]} scale={0.6} />
          </Float>
        )}

        {type === 'empty' && (
          <Float speed={1} rotationIntensity={0.5} floatIntensity={0.5}>
            <FloatingShape type="sphere" color="#FFD95A" speed={0.5} position={[0, 0, 0]} scale={1.2} />
          </Float>
        )}

        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.4} />
      </Canvas>
    </div>
  );
}
