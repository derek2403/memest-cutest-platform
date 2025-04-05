// StaticStarField.js
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function StaticStarField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Setup Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000);
    
    // Star color generator
    function generateStarColor() {
      return new THREE.Color(`hsl(${Math.random() * 60 + (Math.round(Math.random() + 0.3) ? 0 : 180)}, 100%, ${Math.floor(Math.random() * 20) + 81}%)`);
    }
    
    // Create static stars
    for (let i = 0; i < 1000; i++) {
      const size = Math.random() * 1.5 + 0.5;
      const color = generateStarColor();
      
      // Random position in 3D space
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = Math.random() * -1000;
      
      // Create star
      const geometry = new THREE.SphereGeometry(size, 8, 8);
      const material = new THREE.MeshBasicMaterial({ color: color });
      const star = new THREE.Mesh(geometry, material);
      star.position.set(x, y, z);
      
      // Add glow effect to some stars
      if (Math.random() > 0.7) {
        const glowSize = size * (Math.random() * 3 + 2);
        const glowGeometry = new THREE.SphereGeometry(glowSize, 8, 8);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.copy(star.position);
        scene.add(glow);
      }
      
      scene.add(star);
    }
    
    // Position camera
    camera.position.z = 100;
    
    // Simple animation for subtle twinkling
    function animate() {
      requestAnimationFrame(animate);
      
      // Subtle camera movement
      camera.position.x = Math.sin(Date.now() * 0.0001) * 10;
      camera.position.y = Math.cos(Date.now() * 0.0001) * 10;
      
      renderer.render(scene, camera);
    }
    
    animate();
    
    // Handle window resize
    function handleResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      
      // Remove all objects from scene
      while(scene.children.length > 0) { 
        scene.remove(scene.children[0]); 
      }
      
      renderer.dispose();
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        background: '#000'
      }}
    />
  );
}
