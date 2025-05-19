import React, { memo } from 'react';
import { Canvas } from '@react-three/fiber';
import Particles from './Particles';

// This component is separate to allow for lazy loading
const ParticlesCanvas = () => {
  return (
    <Canvas
      camera={{ position: [0, 0, 1] }}
      dpr={[1, 1.5]} // Limit pixel ratio for better performance
      gl={{ 
        powerPreference: "high-performance",
        antialias: false, // Disable antialiasing for performance
        stencil: false,
        depth: false
      }}
      style={{ touchAction: 'none' }} // Prevents gesture conflicts
      performance={{ min: 0.5 }} // Allow ThreeJS to reduce quality during low FPS
    >
      <Particles count={150} />
    </Canvas>
  );
};

export default memo(ParticlesCanvas); 