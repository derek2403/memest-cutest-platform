import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const Zoom = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.z = 100;

    // Stars arrays
    const stars = [];
    const bgStars = [];
    
    // Helper function to generate star color
    const generateStarColor = () => {
      const hue = Math.random() * 60 + (Math.round(Math.random() + 0.3) ? 0 : 180);
      const lightness = Math.floor(Math.random() * 20) + 81;
      return new THREE.Color(`hsl(${hue}, 100%, ${lightness}%)`);
    };

    // Background star class
    class BackgroundStar {
      constructor(size = Math.random() * 0.2 + 0.1) {
        this.size = size;
        this.relativeSpeed = 1;
        this.color = generateStarColor();
        
        // Position
        const x = (Math.random() - 0.5) * window.innerWidth;
        const y = (Math.random() - 0.5) * window.innerHeight;
        const z = 0;
        
        this.position = new THREE.Vector3(x, y, z);
        this.angle = Math.atan2(y, x);
        this.traveled = 1;
        
        // Direction
        this.direction = new THREE.Vector3(
          Math.cos(this.angle) * this.relativeSpeed,
          Math.sin(this.angle) * this.relativeSpeed,
          0
        );
        
        // Glow properties
        this.maxGlow = Number((Math.random() * 4 + 2).toFixed(2));
        this.glowTo = 0.5;
        this.glow = 1.5;
        
        // Create mesh
        const geometry = new THREE.CircleGeometry(this.size, 32);
        const material = new THREE.MeshBasicMaterial({ color: this.color });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        scene.add(this.mesh);
      }
      
      update(delta) {
        this.relativeSpeed += this.traveled / (window.innerWidth ** 2);
        
        this.direction.x = Math.cos(this.angle) * this.relativeSpeed;
        this.direction.y = Math.sin(this.angle) * this.relativeSpeed;
        
        this.traveled += Math.hypot(this.direction.x * delta, this.direction.y * delta);
        
        this.position.x += this.direction.x * delta;
        this.position.y += this.direction.y * delta;
        
        // Update mesh
        this.mesh.position.copy(this.position);
        const newSize = this.size + this.traveled / (window.innerWidth * 5);
        this.mesh.scale.set(newSize, newSize, 1);
        
        // Handle glow effect
        this.glow += this.glowTo * delta;
        
        if (this.maxGlow <= this.glow) {
          this.glowTo = -this.maxGlow;
          this.glow = this.maxGlow;
        } else if (this.glow <= 1) {
          this.glowTo = this.maxGlow - this.glow;
          if (this.glow < 0) this.glow = 0;
        }
        
        return !(this.position.x < -100 || 
                this.position.x > window.innerWidth + 100 || 
                this.position.y < -100 || 
                this.position.y > window.innerHeight + 100);
      }
      
      remove() {
        scene.remove(this.mesh);
      }
    }

    // Main star class
    class Star {
      constructor() {
        this.size = Math.random() * 0.3 + 0.3;
        this.relativeSpeed = 20;
        this.color = generateStarColor();
        
        // Position (start near center)
        const x = (Math.random() - 0.5) * 80;
        const y = (Math.random() - 0.5) * 80;
        const z = 0;
        
        this.position = new THREE.Vector3(x, y, z);
        this.angle = Math.atan2(y, x);
        this.traveled = Math.hypot(x, y);
        
        // Direction
        this.direction = new THREE.Vector3(
          Math.cos(this.angle) * this.relativeSpeed,
          Math.sin(this.angle) * this.relativeSpeed,
          0
        );
        
        // Create mesh
        const geometry = new THREE.CircleGeometry(this.size, 32);
        const material = new THREE.MeshBasicMaterial({ color: this.color });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        scene.add(this.mesh);
        
        // Line for trail effect
        this.line = null;
      }
      
      update(delta) {
        this.relativeSpeed += this.traveled ** 2 / (window.innerWidth / 6);
        
        this.direction.x = Math.cos(this.angle) * this.relativeSpeed;
        this.direction.y = Math.sin(this.angle) * this.relativeSpeed;
        
        const prevPosition = this.position.clone();
        
        this.position.x += this.direction.x * delta;
        this.position.y += this.direction.y * delta;
        this.traveled += Math.hypot(this.direction.x * delta, this.direction.y * delta);
        
        // Update mesh or line based on distance traveled
        if (window.innerWidth / 8 > this.traveled) {
          // Update circle
          this.mesh.position.copy(this.position);
          const newSize = this.size + this.traveled / (window.innerWidth / 10);
          this.mesh.scale.set(newSize, newSize, 1);
          
          // Remove line if it exists
          if (this.line) {
            scene.remove(this.line);
            this.line = null;
          }
        } else {
          // Create line for trail effect
          if (this.line) {
            scene.remove(this.line);
          }
          
          const lineGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(
              this.position.x - this.direction.x * delta * 1.5,
              this.position.y - this.direction.y * delta,
              0
            ),
            this.position
          ]);
          
          const lineMaterial = new THREE.LineBasicMaterial({ 
            color: this.color,
            linewidth: this.size * 1.5 + 0.2
          });
          
          this.line = new THREE.Line(lineGeometry, lineMaterial);
          scene.add(this.line);
          
          // Hide the circle
          this.mesh.visible = false;
        }
        
        return !(this.position.x < -100 || 
                this.position.x > window.innerWidth + 100 || 
                this.position.y < -100 || 
                this.position.y > window.innerHeight + 100);
      }
      
      remove() {
        scene.remove(this.mesh);
        if (this.line) {
          scene.remove(this.line);
        }
      }
    }

    // Initialize stars
    for (let c = 0; c < 200; c++) {
      bgStars.push(new BackgroundStar());
    }
    
    for (let c = 0; c < 10; c++) {
      stars.push(new Star());
    }
    
    // Add new stars periodically
    let paused = false;
    
    const starInterval = setInterval(() => {
      if (!paused) {
        stars.push(new Star());
      }
    }, 15);
    
    const bgStarInterval = setInterval(() => {
      if (!paused) {
        bgStars.push(new BackgroundStar());
      }
    }, 250);
    
    // Animation variables
    let lastChecked = Date.now();
    let pauseTime;
    
    // Animation loop
    const animate = () => {
      const now = Date.now();
      const delta = (now - lastChecked) / 1000;
      lastChecked = now;
      
      // Update background stars
      for (let i = bgStars.length - 1; i >= 0; i--) {
        const isVisible = bgStars[i].update(delta);
        if (!isVisible) {
          bgStars[i].remove();
          bgStars.splice(i, 1);
        }
      }
      
      // Update stars
      for (let i = stars.length - 1; i >= 0; i--) {
        const isVisible = stars[i].update(delta);
        if (!isVisible) {
          stars[i].remove();
          stars.splice(i, 1);
        }
      }
      
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    
    animate();
    
    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        paused = false;
        lastChecked += (Date.now() - pauseTime);
      } else {
        paused = true;
        pauseTime = Date.now();
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(starInterval);
      clearInterval(bgStarInterval);
      
      // Clean up Three.js resources
      stars.forEach(star => star.remove());
      bgStars.forEach(star => star.remove());
      renderer.dispose();
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        width: '100%', 
        height: '100%', 
        display: 'block',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: -1
      }} 
    />
  );
};

export default Zoom;
