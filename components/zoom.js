import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function StarField() {
	const canvasRef = useRef(null);

	useEffect(() => {
		if (!canvasRef.current) return;

		// Setup Three.js scene
		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
		const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true });
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setClearColor(0x000000);
		
		// Arrays to store stars
		const stars = [];
		const bgStars = [];
		
		// Star color generator
		function generateStarColor() {
			// hsl range 0-60 (red) 180-240 (blue)
			return new THREE.Color(`hsl(${Math.random() * 60 + (Math.round(Math.random() + 0.3) ? 0 : 180)}, 100%, ${Math.floor(Math.random() * 20) + 81}%)`);
		}
		
		// Background star class
		class BackgroundStar {
			constructor(size = Math.random() + 0.5) {
				this.size = size;
				this.relativeSpeed = 1;
				this.color = generateStarColor();
				
				// Position
				this.x = (Math.random() - 0.5) * window.innerWidth;
				this.y = (Math.random() - 0.5) * window.innerHeight;
				this.z = Math.random() * 500;
				
				// Create the star mesh
				const geometry = new THREE.SphereGeometry(this.size, 8, 8);
				const material = new THREE.MeshBasicMaterial({ color: this.color });
				this.mesh = new THREE.Mesh(geometry, material);
				this.mesh.position.set(this.x, this.y, -this.z);
				
				// Angle and direction
				this.angle = Math.atan2(this.y, this.x);
				this.traveled = 1;
				
				// Glow properties
				this.maxGlow = Number((Math.random() * 4 + 2).toFixed(2));
				this.glowTo = 0.5;
				this.glow = 1.5;
				
				// Add glow effect
				const glowGeometry = new THREE.SphereGeometry(this.size * this.glow, 8, 8);
				const glowMaterial = new THREE.MeshBasicMaterial({
					color: this.color,
					transparent: true,
					opacity: 0.5
				});
				this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
				this.glowMesh.position.copy(this.mesh.position);
				
				scene.add(this.mesh);
				scene.add(this.glowMesh);
			}
			
			update(delta) {
				this.relativeSpeed += this.traveled / (window.innerWidth ** 2);
				
				const dirX = Math.cos(this.angle) * this.relativeSpeed;
				const dirY = Math.sin(this.angle) * this.relativeSpeed;
				
				this.traveled += Math.hypot(dirX * delta, dirY * delta);
				
				// Update position
				this.mesh.position.x += dirX * delta;
				this.mesh.position.y += dirY * delta;
				this.mesh.position.z += 0.1 * delta;
				
				// Update glow
				this.glow += this.glowTo * delta;
				
				if (this.maxGlow <= this.glow) {
					this.glowTo = -this.maxGlow;
					this.glow = this.maxGlow;
				} else if (this.glow <= 1) {
					this.glowTo = this.maxGlow - this.glow;
					if (this.glow < 0) this.glow = 0;
				}
				
				// Update glow mesh
				this.glowMesh.position.copy(this.mesh.position);
				this.glowMesh.scale.set(this.glow, this.glow, this.glow);
				
				// Remove if out of bounds
				if (
					this.mesh.position.x < -window.innerWidth/2 - 100 || 
					this.mesh.position.x > window.innerWidth/2 + 100 || 
					this.mesh.position.y < -window.innerHeight/2 - 100 || 
					this.mesh.position.y > window.innerHeight/2 + 100
				) {
					scene.remove(this.mesh);
					scene.remove(this.glowMesh);
					return true; // Mark for removal
				}
				
				return false;
			}
		}
		
		// Foreground star class
		class Star {
			constructor() {
				this.size = Math.random() + 1;
				this.relativeSpeed = 20;
				this.color = generateStarColor();
				
				// Position near center
				this.x = (Math.random() - 0.5) * 80;
				this.y = (Math.random() - 0.5) * 80;
				this.z = 0;
				
				this.angle = Math.atan2(this.y, this.x);
				this.traveled = Math.hypot(this.x, this.y);
				
				// Create star geometry
				const geometry = new THREE.SphereGeometry(this.size, 8, 8);
				const material = new THREE.MeshBasicMaterial({ color: this.color });
				this.mesh = new THREE.Mesh(geometry, material);
				this.mesh.position.set(this.x, this.y, this.z);
				
				// For trail effect
				this.trail = new THREE.Line(
					new THREE.BufferGeometry().setFromPoints([
						new THREE.Vector3(this.x, this.y, this.z),
						new THREE.Vector3(this.x, this.y, this.z)
					]),
					new THREE.LineBasicMaterial({ color: this.color, linewidth: 2 })
				);
				
				scene.add(this.mesh);
				scene.add(this.trail);
			}
			
			update(delta) {
				this.relativeSpeed += this.traveled ** 2 / (window.innerWidth / 6);
				
				const dirX = Math.cos(this.angle) * this.relativeSpeed;
				const dirY = Math.sin(this.angle) * this.relativeSpeed;
				
				// Previous position for trail
				const prevX = this.mesh.position.x;
				const prevY = this.mesh.position.y;
				
				// Update position
				this.mesh.position.x += dirX * delta;
				this.mesh.position.y += dirY * delta;
				this.mesh.position.z += 0.5 * delta;
				
				this.traveled += Math.hypot(dirX * delta, dirY * delta);
				
				// Update trail
				if (window.innerWidth / 8 <= this.traveled) {
					const positions = this.trail.geometry.attributes.position.array;
					positions[0] = prevX;
					positions[1] = prevY;
					positions[2] = this.mesh.position.z;
					positions[3] = this.mesh.position.x;
					positions[4] = this.mesh.position.y;
					positions[5] = this.mesh.position.z;
					this.trail.geometry.attributes.position.needsUpdate = true;
					this.trail.visible = true;
				} else {
					this.trail.visible = false;
					// Adjust size based on distance
					this.mesh.scale.set(
						1 + this.traveled / (window.innerWidth / 5),
						1 + this.traveled / (window.innerWidth / 5),
						1 + this.traveled / (window.innerWidth / 5)
					);
				}
				
				// Remove if out of bounds
				if (
					this.mesh.position.x < -window.innerWidth/2 - 100 || 
					this.mesh.position.x > window.innerWidth/2 + 100 || 
					this.mesh.position.y < -window.innerHeight/2 - 100 || 
					this.mesh.position.y > window.innerHeight/2 + 100
				) {
					scene.remove(this.mesh);
					scene.remove(this.trail);
					return true; // Mark for removal
				}
				
				return false;
			}
		}
		
		// Initialize stars
		for (let c = 0; c < 200; c++) {
			bgStars.push(new BackgroundStar());
		}
		
		for (let c = 0; c < 10; c++) {
			stars.push(new Star());
		}
		
		// Position camera
		camera.position.z = 100;
		
		// Animation variables
		let lastChecked = Date.now();
		let paused = false;
		let pauseTime;
		
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
		function animate() {
			requestAnimationFrame(animate);
			
			if (paused) return;
			
			const now = Date.now();
			const delta = (now - lastChecked) / 1000;
			lastChecked = now;
			
			// Update background stars
			for (let i = bgStars.length - 1; i >= 0; i--) {
				if (bgStars[i].update(delta)) {
					bgStars.splice(i, 1);
				}
			}
			
			// Update foreground stars
			for (let i = stars.length - 1; i >= 0; i--) {
				if (stars[i].update(delta)) {
					stars.splice(i, 1);
				}
			}
			
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