import React, { useMemo, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { MeshReflectorMaterial } from '@react-three/drei';
import { useGameStore } from '../../store/useGameStore';
import { INITIAL_MAZE, MAZE_ROWS, MAZE_COLS, gridToWorld } from '../../utils/mazeGenerator';

export const MazeWorld: React.FC = () => {
  const theme = useGameStore((state) => state.theme);
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Pre-calculate EdgesGeometry for clean outlines without diagonal lines
  const edgesGeometry = useMemo(() => {
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const geo = new THREE.EdgesGeometry(boxGeo);
    boxGeo.dispose();
    return geo;
  }, []);

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
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
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
          color: '#020617', // Dark base to make the emissive color pop
          roughness: 0.1,
          metalness: 0.9,
          emissive: '#00d4ff', // Glowing cyber cyan
          emissiveIntensity: 1.8,
          transparent: true,
          opacity: 0.75,
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
      {/* 3D Floor / Grid Area - reflects objects and receives shadows in neon mode */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[MAZE_COLS + 2, MAZE_ROWS + 2]} />
        {theme === 'neon' ? (
          <MeshReflectorMaterial
            mirror={0.4} // Mirror reflection intensity
            blur={[300, 100]} // Blur ground reflections (width, height)
            mixBlur={1.0} // How much blur mixes with surface roughness
            mixStrength={10.0} // Strength of reflections
            mixContrast={1.0} // Contrast of reflections
            resolution={512} // Off-buffer resolution
            depthScale={1.2} // Scale of depth factor
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#040615"
            roughness={0.2}
            metalness={0.9}
            distortion={0}
          />
        ) : (
          <meshStandardMaterial
            color={theme === 'retro' ? '#000000' : '#f8fafc'}
            roughness={0.8}
            metalness={0.1}
          />
        )}
      </mesh>

      {/* Cyber Grid Lines for Neon Theme (matching gameplay_preview.png) */}
      {theme === 'neon' && (
        <gridHelper
          args={[32, 32, '#00d4ff', '#8b5cf6']}
          position={[0.5, 0.005, 0.5]}
        />
      )}

      {/* Instanced Maze Walls (Main Body) */}
      <instancedMesh
        ref={meshRef}
        args={[null as any, null as any, wallCoords.length]}
        castShadow
        receiveShadow
        frustumCulled={false}
      >
        <boxGeometry />
        <meshStandardMaterial {...materialProps} />
      </instancedMesh>

      {/* Neon Outline Layer (for Cyber aesthetic) - Clean edges with no diagonal lines, scaled slightly thicker and bright cyan */}
      {theme === 'neon' && wallCoords.map((coord, i) => {
        const { x, z } = gridToWorld(coord.x, coord.z);
        return (
          <lineSegments
            key={i}
            position={[x, 0.4, z]}
            scale={[0.96, 0.81, 0.96]} // Slightly larger than wall scale [0.95, 0.8, 0.95] for thicker visual border
            geometry={edgesGeometry}
          >
            <lineBasicMaterial
              color="#00FFFF" // Bright cyan
              transparent={false}
              opacity={1.0}
            />
          </lineSegments>
        );
      })}

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
