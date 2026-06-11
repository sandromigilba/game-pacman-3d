import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';
import { INITIAL_MAZE, MAZE_ROWS, MAZE_COLS, gridToWorld } from '../../utils/mazeGenerator';

export const PelletsContainer: React.FC = () => {
  const theme = useGameStore((state) => state.theme);
  
  // Refs for instanced meshes
  const normalRef = useRef<THREE.InstancedMesh>(null);
  const powerRef = useRef<THREE.InstancedMesh>(null);

  // Parse maze for pellet locations
  const normalPellets = useMemo(() => {
    const list: { key: string; x: number; z: number; worldX: number; worldZ: number }[] = [];
    for (let z = 0; z < MAZE_ROWS; z++) {
      for (let x = 0; x < MAZE_COLS; x++) {
        if (INITIAL_MAZE[z][x] === 2) {
          const world = gridToWorld(x, z);
          list.push({
            key: `${x},${z}`,
            x,
            z,
            worldX: world.x,
            worldZ: world.z,
          });
        }
      }
    }
    return list;
  }, []);

  const powerPellets = useMemo(() => {
    const list: { key: string; x: number; z: number; worldX: number; worldZ: number }[] = [];
    for (let z = 0; z < MAZE_ROWS; z++) {
      for (let x = 0; x < MAZE_COLS; x++) {
        if (INITIAL_MAZE[z][x] === 3) {
          const world = gridToWorld(x, z);
          list.push({
            key: `${x},${z}`,
            x,
            z,
            worldX: world.x,
            worldZ: world.z,
          });
        }
      }
    }
    return list;
  }, []);

  // Set up themes colors
  const colors = useMemo(() => {
    switch (theme) {
      case 'retro':
        return {
          normal: '#ffb8ae', // classic pink-orange pellet
          power: '#ffb8ff',
        };
      case 'minimalist':
        return {
          normal: '#94a3b8', // subtle slate grey
          power: '#8b5cf6', // purple accent
        };
      case 'neon':
      default:
        return {
          normal: '#ffd700', // pacman glowing yellow
          power: '#00d4ff', // glowing cyan
        };
    }
  }, [theme]);

  // Handle frame updates (animations & hide eaten pellets)
  useFrame((state) => {
    const store = useGameStore.getState();
    const pelletsState = store.pellets;
    const powerPelletsState = store.powerPellets;
    const time = state.clock.getElapsedTime();

    const dummy = new THREE.Object3D();

    // 1. Update Normal Pellets
    if (normalRef.current) {
      normalPellets.forEach((pellet, i) => {
        const isActive = pelletsState[pellet.key];
        
        if (!isActive) {
          // Hide eaten pellet by scaling it to 0
          dummy.position.set(0, -10, 0);
          dummy.scale.set(0, 0, 0);
        } else {
          // Floating wave offset animation for visual interest
          const y = 0.2 + Math.sin(time * 3 + i * 0.2) * 0.05;
          dummy.position.set(pellet.worldX, y, pellet.worldZ);
          dummy.scale.set(0.12, 0.12, 0.12);
          // Spin normal pellets
          dummy.rotation.set(time * 1.5 + i, time * 0.8, 0);
        }
        dummy.updateMatrix();
        normalRef.current!.setMatrixAt(i, dummy.matrix);
      });
      normalRef.current.instanceMatrix.needsUpdate = true;
    }

    // 2. Update Power Pellets
    if (powerRef.current) {
      powerPellets.forEach((pellet, i) => {
        const isActive = powerPelletsState[pellet.key];
        
        if (!isActive) {
          dummy.position.set(0, -10, 0);
          dummy.scale.set(0, 0, 0);
        } else {
          // Pulsing size animation for power pellets (made smaller)
          const pulseScale = 0.24 + Math.sin(time * 8 + i) * 0.05;
          dummy.position.set(pellet.worldX, 0.25, pellet.worldZ);
          dummy.scale.set(pulseScale, pulseScale, pulseScale);
          dummy.rotation.set(0, time * 2, 0);
        }
        dummy.updateMatrix();
        powerRef.current!.setMatrixAt(i, dummy.matrix);
      });
      powerRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Normal Pellets Mesh */}
      {normalPellets.length > 0 && (
        <instancedMesh
          ref={normalRef}
          args={[null as any, null as any, normalPellets.length]}
          castShadow
        >
          <boxGeometry />
          <meshStandardMaterial
            color={colors.normal}
            emissive={theme === 'neon' ? colors.normal : '#000000'}
            emissiveIntensity={theme === 'neon' ? 1.0 : 0.0}
            roughness={0.1}
          />
        </instancedMesh>
      )}

      {/* Power Pellets Mesh */}
      {powerPellets.length > 0 && (
        <instancedMesh
          ref={powerRef}
          args={[null as any, null as any, powerPellets.length]}
          castShadow
        >
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial
            color={colors.power}
            emissive={theme === 'neon' ? colors.power : '#000000'}
            emissiveIntensity={theme === 'neon' ? 1.5 : 0.0}
            roughness={0.1}
          />
        </instancedMesh>
      )}
    </group>
  );
};
export default PelletsContainer;
