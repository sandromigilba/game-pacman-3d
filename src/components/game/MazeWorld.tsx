import React, { useMemo, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';
import { INITIAL_MAZE, MAZE_ROWS, MAZE_COLS, gridToWorld } from '../../utils/mazeGenerator';

export const MazeWorld: React.FC = () => {
  const theme = useGameStore((state) => state.theme);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const wireframeRef = useRef<THREE.InstancedMesh>(null);

  // Filter out wall coordinates
  const wallCoords = useMemo(() => {
    const coords: { x: number; z: number }[] = [];
    for (let z = 0; z < MAZE_ROWS; z++) {
      for (let x = 0; x < MAZE_COLS; x++) {
        if (INITIAL_MAZE[z][x] === 1) {
          coords.push({ x, z });
        }
      }
    }
    return coords;
  }, []);

  // Update instance matrices when coordinates or theme changes
  useLayoutEffect(() => {
    if (!meshRef.current) return;

    const dummy = new THREE.Object3D();
    
    wallCoords.forEach((coord, i) => {
      const { x, z } = gridToWorld(coord.x, coord.z);
      
      // Position each box at grid height
      dummy.position.set(x, 0.4, z); // Height is 0.8, so center is at y = 0.4
      dummy.scale.set(0.95, 0.8, 0.95);
      dummy.updateMatrix();
      
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      if (wireframeRef.current) {
        wireframeRef.current.setMatrixAt(i, dummy.matrix);
      }
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (wireframeRef.current) {
      wireframeRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [wallCoords]);

  // Determine wall materials based on theme
  const materialProps = useMemo(() => {
    switch (theme) {
      case 'retro':
        return {
          color: '#1d4ed8', // Dark Arcade Blue
          roughness: 1.0,
          metalness: 0.0,
          emissive: '#000000',
          transparent: false,
          opacity: 1.0,
          wireframe: false,
        };
      case 'minimalist':
        return {
          color: '#e2e8f0', // Clay/Slate White
          roughness: 0.9,
          metalness: 0.1,
          emissive: '#000000',
          transparent: false,
          opacity: 1.0,
          wireframe: false,
        };
      case 'neon':
      default:
        return {
          color: '#ffffff', // Transparent white
          roughness: 0.1,
          metalness: 0.9,
          emissive: '#444444', // Brighter emissive glow
          transparent: true,
          opacity: 0.7, // Slightly higher opacity for extra whiteness and visibility
          wireframe: false,
        };
    }
  }, [theme]);

  // Find gate coordinate (cell value 5)
  const gateCoords = useMemo(() => {
    for (let z = 0; z < MAZE_ROWS; z++) {
      for (let x = 0; x < MAZE_COLS; x++) {
        if (INITIAL_MAZE[z][x] === 5) {
          return gridToWorld(x, z);
        }
      }
    }
    return null;
  }, []);

  return (
    <group>
      {/* 3D Floor / Grid Area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[MAZE_COLS + 2, MAZE_ROWS + 2]} />
        <meshStandardMaterial
          color={theme === 'retro' ? '#000000' : theme === 'minimalist' ? '#f8fafc' : '#040714'}
          roughness={theme === 'neon' ? 0.3 : 0.8}
          metalness={theme === 'neon' ? 0.7 : 0.1}
        />
      </mesh>

      {/* Instanced Maze Walls (Main Body) */}
      <instancedMesh
        ref={meshRef}
        args={[null as any, null as any, wallCoords.length]}
        castShadow
        receiveShadow
      >
        <boxGeometry />
        <meshStandardMaterial {...materialProps} />
      </instancedMesh>

      {/* Neon Outline Layer (for Cyber aesthetic) */}
      {theme === 'neon' && (
        <instancedMesh
          ref={wireframeRef}
          args={[null as any, null as any, wallCoords.length]}
        >
          <boxGeometry />
          <meshBasicMaterial
            color="#00D4FF"
            wireframe
            transparent
            opacity={0.55} // Brighter outlines
          />
        </instancedMesh>
      )}

      {/* Ghost House Gate */}
      {gateCoords && (
        <mesh position={[gateCoords.x, 0.2, gateCoords.z]} castShadow>
          <boxGeometry args={[1.0, 0.15, 0.15]} />
          <meshStandardMaterial
            color="#ec4899" // Pink gate
            emissive="#ec4899"
            emissiveIntensity={1.5}
            roughness={0.1}
          />
        </mesh>
      )}
    </group>
  );
};
export default MazeWorld;
