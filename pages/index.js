import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import StaticStarField from '../components/staticzoom';
import StarField from '../components/zoom';

export default function Landing() {
  const router = useRouter();
  const [isZooming, setIsZooming] = useState(false);
  const [showDynamicStars, setShowDynamicStars] = useState(false);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const stars = [];
    const bgStars = [];
    let paused = false;
    let pauseTime;
    let lastChecked = Date.now();
    
    // Generate star color
    function generateStarColor() {
      // hsl range 0-60 (red) 180-240 (blue)
      return `hsl(${Math.random() * 60 + (Math.round(Math.random() + 0.3) ? 0 : 180)}, 100%, ${Math.floor(Math.random() * 20) + 81}%)`;
    }
    
    // Background star class
    class BackgroundStar {
      constructor(size = Math.random() + 0.5) {
        this.size = size;
        this.relativeSpeed = 1;
        this.color = generateStarColor();
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.angle = Math.atan2(this.y - canvas.height/2, this.x - canvas.width/2);
        
        this.traveled = 1;
        
        this.direction = {
          x: Math.cos(this.angle) * this.relativeSpeed,
          y: Math.sin(this.angle) * this.relativeSpeed
        };
        
        this.maxGlow = Number((Math.random() * 4 + 2).toFixed(2));
        this.glowTo = 0.5;
        this.glow = 1.5;
      }
      
      draw(delta) {
        const size = this.size + this.traveled / (canvas.width * 2);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Glow effect
        this.glow += this.glowTo * delta;
        
        if (this.maxGlow <= this.glow) {
          this.glowTo = -this.maxGlow;
          this.glow = this.maxGlow;
        } else if (this.glow <= 1) {
          this.glowTo = this.maxGlow - this.glow;
          if (this.glow < 0) this.glow = 0;
        }
        
        // Create gradient
        const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, size * this.glow);
        grd.addColorStop(0, this.color);
        grd.addColorStop(1, "rgba(255,255,255,0)");
        
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(this.x, this.y, size * this.glow, 0, Math.PI * 2);
        ctx.fill();
      }
      
      update(pos, delta) {
        this.relativeSpeed += this.traveled / (canvas.width ** 2);
        
        this.direction.x = Math.cos(this.angle) * this.relativeSpeed;
        this.direction.y = Math.sin(this.angle) * this.relativeSpeed;
        
        this.traveled += Math.hypot(this.direction.x * delta, this.direction.y * delta);
        
        this.x += this.direction.x * delta;
        this.y += this.direction.y * delta;
        
        if (this.x < -100 || this.x > canvas.width + 100 || this.y < -100 || this.y > canvas.height + 100) {
          bgStars.splice(pos, 1);
          return true;
        } else {
          this.draw(delta);
          return false;
        }
      }
    }
    
    // Foreground star class
    class Star {
      constructor() {
        this.size = Math.random() + 1;
        this.stretch = 0;
        this.relativeSpeed = 20;
        this.setSpeed = 20;
        this.color = generateStarColor();
        
        // Position near center
        this.x = (Math.random() - 0.5) * 80 + canvas.width / 2;
        this.y = (Math.random() - 0.5) * 80 + canvas.height / 2;
        
        this.angle = Math.atan2(this.y - canvas.height / 2, this.x - canvas.width / 2);
        this.traveled = Math.hypot(this.x - canvas.width / 2, this.y - canvas.height / 2);
        
        this.direction = {
          x: Math.cos(this.angle) * this.relativeSpeed,
          y: Math.sin(this.angle) * this.relativeSpeed
        };
      }
      
      draw(delta) {
        if (canvas.width / 8 > this.traveled) {
          ctx.fillStyle = this.color;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size + this.traveled / (canvas.width / 5), 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.lineWidth = this.size * 2 + 0.625;
          ctx.strokeStyle = this.color;
          
          ctx.beginPath();
          ctx.moveTo(this.x - this.direction.x * delta * 1.5, this.y - this.direction.y * delta);
          ctx.lineTo(this.x, this.y);
          ctx.stroke();
        }
      }
      
      update(pos, delta) {
        this.relativeSpeed += this.traveled ** 2 / (canvas.width / 6);
        
        this.direction.x = Math.cos(this.angle) * this.relativeSpeed;
        this.direction.y = Math.sin(this.angle) * this.relativeSpeed;
        
        this.x += this.direction.x * delta;
        this.y += this.direction.y * delta;
        this.traveled += Math.hypot(this.direction.x * delta, this.direction.y * delta);
        
        if (this.x < -100 || this.x > canvas.width + 100 || this.y < -100 || this.y > canvas.height + 100) {
          stars.splice(pos, 1);
          return true;
        } else {
          this.draw(delta);
          return false;
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
    const starInterval = setInterval(() => {
      if (!paused && stars.length < 100) {
        stars.push(new Star());
      }
    }, 15);
    
    const bgStarInterval = setInterval(() => {
      if (!paused && bgStars.length < 300) {
        bgStars.push(new BackgroundStar());
      }
    }, 250);
    
    // Animation loop
    function animationLoop() {
      if (paused) {
        requestAnimationFrame(animationLoop);
        return;
      }
      
      const now = Date.now();
      const delta = (now - lastChecked) / 1000;
      lastChecked = now;
      
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Update background stars
      for (let i = bgStars.length - 1; i >= 0; i--) {
        bgStars[i].update(i, delta);
      }
      
      // Update foreground stars
      for (let i = stars.length - 1; i >= 0; i--) {
        stars[i].update(i, delta);
      }
      
      requestAnimationFrame(animationLoop);
    }
    
    // Start animation
    animationLoop();
    
    // Handle window resize
    function handleResize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    
    window.addEventListener('resize', handleResize);
    
    // Handle visibility change
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        paused = false;
        lastChecked = Date.now() - (pauseTime ? Date.now() - pauseTime : 0);
      } else {
        paused = true;
        pauseTime = Date.now();
      }
    }
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(starInterval);
      clearInterval(bgStarInterval);
    };
  }, []);
  
  const handleStartClick = (e) => {
    e.preventDefault();
    setIsZooming(true);
    setShowDynamicStars(true);
    
    // Start the zoom animation
    if (containerRef.current) {
      containerRef.current.classList.add('zooming');
    }
    
    // Navigate to island.js after animation completes
    setTimeout(() => {
      router.push('/island');
    }, 2000); // 2 seconds for the zoom animation
  };

  return (
    <div className="landing-container">
      <Head>
        <meta name="description" content="Your AI-powered workspace" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&display=swap" rel="stylesheet" />
      </Head>

      {/* Static stars background (shown initially) */}
      {!showDynamicStars && <StaticStarField />}
      
      {/* Dynamic stars background (shown after clicking Start) */}
      {showDynamicStars && <StarField />}
      
      <main className={`landing-content ${isZooming ? 'zooming' : ''}`} ref={containerRef}>
        <div className="container">
          <div className="content">
            <div className="titleContainer">
              <Image 
                src="/newlogo.png"
                alt="MCP"
                width={800}
                height={450}
                priority
                style={{ marginTop: '20px' }}
              />
            </div>
            <div className="buttonContainer">
              <Link href="/login">
                <button className="loginButton" onClick={handleStartClick}>
                  <span className="button-shine"></span>
                  Start
                </button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .landing-container {
          height: 100vh;
          width: 100vw;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          color: white;
          overflow: hidden;
          perspective: 1000px;
          position: relative;
        }
        
        .star-canvas {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -1;
        }
        
        .backgroundWrapper {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -1;
        }
        
        .landing-content {
          text-align: center;
          z-index: 1;
          transition: all 2s cubic-bezier(0.19, 1, 0.22, 1);
          padding: 2rem;
          margin-bottom: 2rem;
          position: relative;
        }
        
        .zooming {
          transform: scale(20) translateZ(2000px);
          opacity: 0;
        }
        
        .container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .content {
          text-align: center;
          z-index: 1;
          transition: all 2s cubic-bezier(0.19, 1, 0.22, 1);
          padding: 2rem;
          margin-bottom: 2rem;
          position: relative;
        }
        
        .titleContainer {
          margin-bottom: 2rem;
        }
        
        .buttonContainer {
          margin-top: 1rem;
        }
        
        .loginButton {
          font-family: 'Orbitron', sans-serif;
          background: linear-gradient(135deg, #b347ff 0%, #8a2be2 100%);
          color: white;
          border: none;
          padding: 0.9rem 3rem;
          font-size: 1.3rem;
          font-weight: 600;
          border-radius: 2rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(138, 86, 172, 0.6), 0 0 20px rgba(186, 85, 211, 0.5);
          text-transform: uppercase;
          letter-spacing: 1px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          position: relative;
          overflow: hidden;
          z-index: 1;
        }
        
        .loginButton:hover {
          transform: translateY(-3px);
          box-shadow: 0 7px 20px rgba(138, 86, 172, 0.8), 0 0 30px rgba(186, 85, 211, 0.7);
          background: linear-gradient(135deg, #c966ff 0%, #9d3aff 100%);
        }
        
        .loginButton:active {
          transform: translateY(1px);
          box-shadow: 0 3px 10px rgba(138, 86, 172, 0.4);
        }
        
        .button-shine {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.4) 0%,
            rgba(255, 255, 255, 0.2) 30%,
            rgba(255, 255, 255, 0) 70%
          );
          transform: rotate(45deg);
          pointer-events: none;
          z-index: -1;
          animation: shine 3s infinite;
        }
        
        @keyframes shine {
          0% {
            transform: scale(0.5) rotate(0deg);
            opacity: 0;
          }
          50% {
            opacity: 0.7;
          }
          100% {
            transform: scale(1.2) rotate(360deg);
            opacity: 0;
          }
        }
        
        .welcomeText {
          font-family: 'Orbitron', sans-serif;
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: #fff;
          text-shadow: 
            0 0 10px rgba(138, 86, 172, 0.8),
            0 2px 0 #8a56ac,
            0 4px 0 #6e44a8,
            0 6px 0 #5a3a8a,
            0 8px 10px rgba(0, 0, 0, 0.6);
          letter-spacing: 2px;
          text-transform: uppercase;
          transform: perspective(500px) rotateX(10deg);
        }
      `}</style>

      <style jsx global>{`
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          width: 100%;
          overflow: hidden;
          font-family: 'Orbitron', -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
            Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
        }
        
        .backgroundWrapper {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -1;
        }
        
        .unicornImage, .foxImage {
          transform: scale(1.5);
        }
      `}</style>
    </div>
  );
}
