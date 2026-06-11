import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';

export const ParticleExplosion: React.FC = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const maxParticles = 200;

  // Set up instance colors buffer
  useEffect(() => {
    if (!meshRef.current) return;
    
    // Initialize all matrices to 0-scale to hide them
    const dummy = new THREE.Object3D();
    dummy.scale.set(0, 0, 0);
    dummy.updateMatrix();
    
    for (let i = 0; i < maxParticles; i++) {
      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.setColorAt(i, new THREE.Color(0, 0, 0));
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;

    const { particles } = useGameStore.getState();
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    for (let i = 0; i < maxParticles; i++) {
      if (i < particles.length) {
        const p = particles[i];
        
        dummy.position.set(p.x, p.y, p.z);
        
        // Scale decreases as particle reaches end of life
        const scale = p.size * p.life;
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        
        meshRef.current.setMatrixAt(i, dummy.matrix);
        
        // Set particle color based on store state
        color.set(p.color);
        meshRef.current.setColorAt(i, color);
      } else {
        // Hide inactive particles
        dummy.position.set(0, -50, 0);
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[null as any, null as any, maxParticles]}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial transparent opacity={0.8} />
    </instancedMesh>
  );
};
export default ParticleExplosion;
