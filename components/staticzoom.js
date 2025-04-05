// StaticStarField.js
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const StaticZoom = () => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Create static star field
    const stars = [];
    const starCount = 300; // More stars for a denser field
    
    // Initialize stars with random positions
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        brightness: Math.random() * 0.5 + 0.5 // Random brightness for twinkling effect
      });
    }
    
    // Draw the static star field
    function drawStars() {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      stars.forEach(star => {
        // Create subtle twinkling effect
        const twinkle = Math.sin(Date.now() * 0.001 * star.brightness) * 0.5 + 0.5;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + twinkle * 0.5})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * (0.8 + twinkle * 0.2), 0, Math.PI * 2);
        ctx.fill();
      });
      
      requestAnimationFrame(drawStars);
    }
    
    drawStars();
    
    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="static-star-canvas"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1
      }}
    />
  );
};

export default StaticZoom;
