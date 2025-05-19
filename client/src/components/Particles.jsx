import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// This component is heavily optimized for performance
const Particles = ({ count = 150 }) => { // Reduced default count
  const pointsRef = useRef();
  
  // Create particles only once
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    const color = new THREE.Color();
    
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      
      // Add color variation
      const colorIndex = Math.floor(Math.random() * 3);
      if (colorIndex === 0) color.set('#3b82f6'); // Blue
      else if (colorIndex === 1) color.set('#0ea5e9'); // Cyan
      else color.set('#2563eb'); // Darker blue
      
      color.toArray(colors, i * 3);
      
      // Varied sizes
      sizes[i] = Math.random() * 0.03 + 0.01;
    }
    
    return { positions, colors, sizes };
  }, [count]);
  
  // Use requestAnimationFrame for smoother, more controlled animation
  useFrame((state) => {
    if (!pointsRef.current) return;
    
    // Move particles very slowly to create subtle movement
    const time = state.clock.getElapsedTime() * 0.05;
    pointsRef.current.rotation.y = time * 0.1;
    pointsRef.current.rotation.x = time * 0.05;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.positions.length / 3}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particles.colors.length / 3}
          array={particles.colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={particles.sizes.length}
          array={particles.sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
};

export default React.memo(Particles);