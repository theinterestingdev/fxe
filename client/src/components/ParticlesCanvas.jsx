import React, { memo } from 'react';
import { Canvas } from '@react-three/fiber';
import Particles from './Particles';


const ParticlesCanvas = () => {
  return (
    <Canvas
      camera={{ position: [0, 0, 1] }}
      dpr={[1, 1.5]} 
      gl={{ 
        powerPreference: "high-performance",
        antialias: false,
        stencil: false,
        depth: false
      }}
      style={{ touchAction: 'none' }}
      performance={{ min: 0.5 }} 
    >
      <Particles count={150} />
    </Canvas>
  );
};

export default memo(ParticlesCanvas); 