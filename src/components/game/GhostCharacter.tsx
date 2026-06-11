import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';
import type { GhostType } from '../../types/game';

interface GhostProps {
  type: GhostType;
}

const GHOST_COLORS: Record<GhostType, string> = {
  blinky: '#ff3333', // Red
  pinky: '#ff77aa',  // Pink
  inky: '#33ccff',   // Cyan
  clyde: '#ff9933',  // Orange
};

export const GhostCharacter: React.FC<GhostProps> = ({ type }) => {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const tentaclesRef = useRef<THREE.Group>(null);
  const eyesGroupRef = useRef<THREE.Group>(null);
  const targetRotation = useRef<number>(0);
  const currentRotation = useRef<number>(0);

  const theme = useGameStore((state) => state.theme);

  // Ghost individual offsets to de-synchronize animations
  const animOffset = useMemo(() => {
    switch (type) {
      case 'blinky': return 0;
      case 'pinky': return Math.PI * 0.5;
      case 'inky': return Math.PI;
      case 'clyde': return Math.PI * 1.5;
    }
  }, [type]);

  useFrame((state, delta) => {
    const store = useGameStore.getState();
    const ghost = store.ghosts[type];
    const { powerPelletTimer, gameStatus } = store;

    if (!groupRef.current || gameStatus === 'idle') return;

    // 1. Bobbing floating animation
    const time = state.clock.getElapsedTime();
    const bobHeight = 0.22 + Math.sin(time * 4.5 + animOffset) * 0.04;
    groupRef.current.position.set(ghost.posX, bobHeight, ghost.posZ);

    // 2. Rotate ghost body toward its movement direction (plus 180 deg to walk backwards/moonwalk)
    const { dx, dz } = ghost.direction;
    if (dx !== 0 || dz !== 0) {
      targetRotation.current = Math.atan2(-dx, -dz) + Math.PI;
    }
    
    let diff = targetRotation.current - currentRotation.current;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    currentRotation.current += diff * Math.min(1.0, delta * 12);
    groupRef.current.rotation.y = currentRotation.current;

    // 3. Modulate pupillary glance direction
    if (eyesGroupRef.current) {
      // Invert shift offsets since the parent body group is rotated 180 degrees
      eyesGroupRef.current.position.set(-dx * 0.04, 0.12, 0.2 - dz * 0.04);
    }

    // 4. Update body & tentacles visibility and materials based on state
    if (bodyRef.current) {
      const isRespawn = ghost.mode === 'respawn';
      const isFrightened = ghost.mode === 'frightened';
      
      bodyRef.current.visible = !isRespawn;

      const updateMaterial = (material: THREE.Material) => {
        const mat = material as THREE.MeshStandardMaterial;
        if (isFrightened) {
          // Frightened color alternates blue / white when flashing (< 2s left)
          if (powerPelletTimer < 2.0 && Math.floor(powerPelletTimer * 6) % 2 === 0) {
            mat.color.set('#ffffff');
            mat.emissive.set('#ffffff');
            mat.emissiveIntensity = 0.8;
          } else {
            mat.color.set('#1e3a8a'); // Frightened Dark Blue
            mat.emissive.set('#1d4ed8');
            mat.emissiveIntensity = 0.6;
          }
        } else if (!isRespawn) {
          // Normal color restore
          const baseColor = GHOST_COLORS[type];
          mat.color.set(baseColor);
          
          if (theme === 'neon') {
            mat.emissive.set(baseColor);
            mat.emissiveIntensity = 1.0;
          } else {
            mat.emissive.set('#000000');
            mat.emissiveIntensity = 0.0;
          }
        }
      };

      if (bodyRef.current.material) {
        updateMaterial(bodyRef.current.material as THREE.Material);
      }

      if (tentaclesRef.current) {
        tentaclesRef.current.children.forEach((child) => {
          const mesh = child as THREE.Mesh;
          if (mesh.material) {
            updateMaterial(mesh.material as THREE.Material);
          }
        });
      }
    }

    // 5. Animate waving tentacles
    if (tentaclesRef.current) {
      const children = tentaclesRef.current.children;
      for (let i = 0; i < children.length; i++) {
        const child = children[i] as THREE.Mesh;
        child.position.y = -0.28 + Math.sin(time * 12 + i * Math.PI * 0.5) * 0.04;
      }
    }
  });

  const bodyMaterialProps = useMemo(() => {
    const color = GHOST_COLORS[type];
    if (theme === 'minimalist') {
      return { color, roughness: 1.0, metalness: 0.0, emissive: '#000000', emissiveIntensity: 0 };
    } else if (theme === 'retro') {
      return { color, roughness: 1.0, metalness: 0.0, emissive: '#000000', emissiveIntensity: 0 };
    } else {
      // Matte, solid color ghost body with glow under neon theme (no specular reflections)
      return { color, roughness: 1.0, metalness: 0.0, emissive: color, emissiveIntensity: 1.0 };
    }
  }, [theme, type]);

  return (
    <group ref={groupRef}>
      {/* Ghost Main Body (Capsule with rounded dome) */}
      <mesh ref={bodyRef} castShadow>
        <capsuleGeometry args={[0.26, 0.25, 8, 16]} />
        <meshStandardMaterial {...bodyMaterialProps} />
        
        {/* Wavy Feet / Bottom Tentacles */}
        <group ref={tentaclesRef}>
          <mesh position={[0.13, -0.28, 0]}>
            <sphereGeometry args={[0.09, 12, 12]} />
            <meshStandardMaterial {...bodyMaterialProps} />
          </mesh>
          <mesh position={[-0.13, -0.28, 0]}>
            <sphereGeometry args={[0.09, 12, 12]} />
            <meshStandardMaterial {...bodyMaterialProps} />
          </mesh>
          <mesh position={[0, -0.28, 0.13]}>
            <sphereGeometry args={[0.09, 12, 12]} />
            <meshStandardMaterial {...bodyMaterialProps} />
          </mesh>
          <mesh position={[0, -0.28, -0.13]}>
            <sphereGeometry args={[0.09, 12, 12]} />
            <meshStandardMaterial {...bodyMaterialProps} />
          </mesh>
        </group>
      </mesh>

      {/* Floating eyes (Always rendered, body hides in respawn mode) */}
      <group ref={eyesGroupRef} position={[0, 0.12, 0.2]}>
        {/* Left eye socket */}
        <mesh position={[-0.11, 0, 0]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* Left pupil */}
        <mesh position={[-0.11, 0, 0.045]}>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshBasicMaterial color="#0000dd" />
        </mesh>

        {/* Right eye socket */}
        <mesh position={[0.11, 0, 0]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* Right pupil */}
        <mesh position={[0.11, 0, 0.045]}>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshBasicMaterial color="#0000dd" />
        </mesh>
      </group>
    </group>
  );
};
export default GhostCharacter;
