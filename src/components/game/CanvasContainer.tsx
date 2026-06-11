import React, { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';
import MazeWorld from './MazeWorld';
import PelletsContainer from './PelletsContainer';
import PacmanCharacter from './PacmanCharacter';
import GhostCharacter from './GhostCharacter';
import ParticleExplosion from './ParticleExplosion';

// Inner component to handle Camera follow movement & Screen Shake
const SceneController: React.FC = () => {
  const { camera, size } = useThree();
  const cameraMode = useGameStore((state) => state.cameraMode);
  
  // Cache to track camera target positions
  const lastLookTarget = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const lastCameraMode = useRef<string>(cameraMode);
  const switchTransitionTime = useRef<number>(0);

  useFrame((_, delta) => {
    // Run the game simulation tick
    useGameStore.getState().tick(delta);

    const store = useGameStore.getState();
    const { pacman, screenShake, gameStatus } = store;

    // Track mode transition
    if (lastCameraMode.current !== cameraMode) {
      lastCameraMode.current = cameraMode;
      if (cameraMode === 'follow') {
        switchTransitionTime.current = 1.2; // 1.2 seconds zoom-in transition window
      }
    }

    if (switchTransitionTime.current > 0) {
      switchTransitionTime.current -= delta;
    }

    // Reset camera in start/victory screens
    if (gameStatus === 'idle' || gameStatus === 'ready') {
      camera.position.lerp(new THREE.Vector3(0, 15, 6), delta * 4);
      lastLookTarget.current.lerp(new THREE.Vector3(0, 0, 0), delta * 4);
      camera.lookAt(lastLookTarget.current);
      return;
    }

    if (cameraMode === 'topDown') {
      // Calculate aspect-ratio aware top-down zoom to clear HUD overlays (navbar and joystick)
      const aspect = size.width / size.height;
      const fovRad = (camera as THREE.PerspectiveCamera).fov * Math.PI / 180;
      
      // Target viewport width and height to fit closer (more zoomed in)
      const fitWidth = 17;
      const fitHeight = 26;
      const hForHeight = fitHeight / (2 * Math.tan(fovRad / 2));
      const hForWidth = fitWidth / (aspect * 2 * Math.tan(fovRad / 2));
      const targetHeight = Math.max(hForHeight, hForWidth);
      
      // Clamp between 20 and 38 to keep the board nicely zoomed in
      const topDownHeight = Math.max(20, Math.min(38, targetHeight));

      const targetPos = new THREE.Vector3(0, topDownHeight, 0.5);
      camera.position.lerp(targetPos, delta * 5);
      
      const lookTarget = new THREE.Vector3(0, 0, 0);
      lastLookTarget.current.lerp(lookTarget, delta * 5);
      camera.lookAt(lastLookTarget.current);
    } else {
      // Championship Edition dynamic 3rd-person follow camera
      const activeDx = pacman.lastActiveDir.dx;
      const activeDz = pacman.lastActiveDir.dz;

      // Position camera straight behind the active heading direction (lurus saja)
      let camOffsetX = -activeDx * 2.8;
      let camOffsetZ = -activeDz * 2.8;
      // Look ahead in active heading
      let lookOffsetX = activeDx * 1.5;
      let lookOffsetZ = activeDz * 1.5;

      // Smooth camera interpolation
      const targetCamX = pacman.posX + camOffsetX;
      const targetCamY = 4.2; // slightly lower height for a cooler, more immersive follow view
      const targetCamZ = pacman.posZ + camOffsetZ;

      const targetPos = new THREE.Vector3(targetCamX, targetCamY, targetCamZ);
      
      const distToTarget = camera.position.distanceTo(targetPos);
      const isTransitioning = switchTransitionTime.current > 0;

      // Teleport instantly only if we aren't in a mode transition (avoid snap when swoop zooming down)
      if (distToTarget > 8 && gameStatus === 'playing' && !isTransitioning) {
        camera.position.copy(targetPos);
        lastLookTarget.current.set(pacman.posX + lookOffsetX, 0.2, pacman.posZ + lookOffsetZ);
      } else {
        // Slower lerp speed during transition for a beautiful zoom-in sweep
        const lerpSpeed = isTransitioning ? 3.0 : 12;
        camera.position.lerp(targetPos, delta * lerpSpeed);
        
        const lookTarget = new THREE.Vector3(pacman.posX + lookOffsetX, 0.2, pacman.posZ + lookOffsetZ);
        lastLookTarget.current.lerp(lookTarget, delta * 15);
      }
      camera.lookAt(lastLookTarget.current);
    }

    // Apply Screen Shake (from ghost collisions / power pellet eats)
    if (screenShake > 0) {
      camera.position.x += (Math.random() - 0.5) * screenShake * 0.4;
      camera.position.y += (Math.random() - 0.5) * screenShake * 0.4;
      camera.position.z += (Math.random() - 0.5) * screenShake * 0.4;
    }
  });

  return null;
};

// Light rig that adjusts based on active theme
const LightRig: React.FC = () => {
  const theme = useGameStore((state) => state.theme);

  // Brighter default lighting for neon theme so it is not too dark
  const ambientIntensity = theme === 'minimalist' ? 0.9 : theme === 'retro' ? 0.7 : 0.45;
  const dirIntensity = theme === 'minimalist' ? 0.8 : theme === 'retro' ? 0.5 : 0.75;

  return (
    <group>
      <ambientLight intensity={ambientIntensity} />
      <directionalLight
        position={[5, 12, 5]}
        intensity={dirIntensity}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={25}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
      
      {/* Accent Neon Ambient lighting for cyber grid theme - increased intensity for visibility */}
      {theme === 'neon' && (
        <group>
          <pointLight position={[-8, 3, -8]} color="#00D4FF" intensity={1.0} distance={18} />
          <pointLight position={[8, 3, 8]} color="#8B5CF6" intensity={1.0} distance={18} />
        </group>
      )}
    </group>
  );
};

export const CanvasContainer: React.FC = () => {
  const theme = useGameStore((state) => state.theme);
  const gameMode = useGameStore((state) => state.gameMode);
  const cameraMode = useGameStore((state) => state.cameraMode);

  return (
    <div className="w-full h-full absolute inset-0 z-10 bg-[#050816] select-none">
      <Canvas
        shadows
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        camera={{ position: [0, 16, 6], fov: 50, near: 0.1, far: 100 }}
      >
        {/* Set Fog for volumetric feel (extended ranges to prevent excessive darkness) */}
        {theme === 'neon' && (
          <fog 
            attach="fog" 
            args={cameraMode === 'topDown' ? ['#050816', 40, 95] : ['#050816', 14, 32]} 
          />
        )}

        <LightRig />
        
        {/* Game 3D Assets */}
        <MazeWorld />
        <PelletsContainer />
        <PacmanCharacter />
        
        {/* The 4 Ghosts (Arcade Mode Only) */}
        {gameMode === 'arcade' && (
          <group>
            <GhostCharacter type="blinky" />
            <GhostCharacter type="pinky" />
            <GhostCharacter type="inky" />
            <GhostCharacter type="clyde" />
          </group>
        )}
        
        {/* Action particles */}
        <ParticleExplosion />

        {/* Scene controls updates */}
        <SceneController />
      </Canvas>
    </div>
  );
};
export default CanvasContainer;
