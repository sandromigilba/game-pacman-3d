import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';

export const PacmanCharacter: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const upperMouthRef = useRef<THREE.Mesh>(null);
  const lowerMouthRef = useRef<THREE.Mesh>(null);
  const targetRotation = useRef<number>(0);
  const currentRotation = useRef<number>(0);
  const currentMouthAngle = useRef<number>(0.25);
  
  const theme = useGameStore((state) => state.theme);

  useFrame((state, delta) => {
    const store = useGameStore.getState();
    const { pacman, gameStatus } = store;

    if (!groupRef.current || gameStatus === 'idle') return;

    // 1. Transient update position directly to bypass React re-renders
    groupRef.current.position.set(pacman.posX, 0.25, pacman.posZ);

    // 2. Rotate Pacman in direction of movement
    const { dx, dz } = pacman.direction;
    if (dx !== 0 || dz !== 0) {
      // Math.atan2 takes y, x which corresponds to z, x in 3D
      // Adding Math.PI / 2 offset to align geometry front
      targetRotation.current = Math.atan2(-dx, -dz);
    }

    // Smooth rotation interpolation (slerp-like)
    let diff = targetRotation.current - currentRotation.current;
    
    // Normalize difference to [-PI, PI] to prevent spinning around the wrong way
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    currentRotation.current += diff * Math.min(1.0, delta * 15);
    groupRef.current.rotation.y = currentRotation.current;

    // 3. Mouth waka animation
    if (upperMouthRef.current && lowerMouthRef.current) {
      const isMoving = dx !== 0 || dz !== 0;
      const time = state.clock.getElapsedTime();
      
      // Chewing speed - reduced from 24 to 11 for longer chew cycles
      const speed = 11;
      const targetAngle = isMoving 
        ? (Math.sin(time * speed) + 1.0) * 0.55 // Chewing between 0.0 and 1.1 radians (0 to 63 degrees)
        : 0.25; // slightly open when idle

      // Smooth interpolation for chewing transitions
      currentMouthAngle.current += (targetAngle - currentMouthAngle.current) * Math.min(1.0, delta * 12);

      // Upper jaw rotates UP (around X)
      upperMouthRef.current.rotation.x = -currentMouthAngle.current;
      // Lower jaw rotates DOWN (around X)
      lowerMouthRef.current.rotation.x = currentMouthAngle.current;
    }
  });

  // Emissive values per theme
  const materialProps = theme === 'minimalist'
    ? { color: '#fbbf24', roughness: 0.9, metalness: 0.1, emissive: '#000000', emissiveIntensity: 0 }
    : theme === 'retro'
    ? { color: '#ffea00', roughness: 1.0, metalness: 0.0, emissive: '#000000', emissiveIntensity: 0 }
    : { color: '#ffd700', roughness: 0.1, metalness: 0.5, emissive: '#fcd34d', emissiveIntensity: 1.2 };

  return (
    <group ref={groupRef}>
      {/* Dynamic light emission attached to Pacman */}
      {theme === 'neon' && (
        <pointLight
          color="#ffd700"
          intensity={1.2}
          distance={3.5}
          decay={1.8}
          position={[0, 0.3, 0]}
          castShadow
        />
      )}

      {/* Pacman Geometry (Composed of two hemispheres for mouth animation) */}
      <group rotation={[0, Math.PI, 0]}>
        {/* Upper Mouth Half */}
        <mesh ref={upperMouthRef} castShadow position={[0, 0, 0]}>
          <sphereGeometry args={[0.32, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial {...materialProps} side={THREE.DoubleSide} />
        </mesh>
        
        {/* Lower Mouth Half */}
        <mesh ref={lowerMouthRef} castShadow position={[0, 0, 0]} rotation={[0, 0, 0]}>
          <sphereGeometry args={[0.32, 24, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          <meshStandardMaterial {...materialProps} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
};
export default PacmanCharacter;
