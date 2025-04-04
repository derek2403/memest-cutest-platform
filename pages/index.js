import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { initSidebar } from '../components/sidebar.js';
import { loadFurniture } from '../components/furniture.js';

export default function Home() {
  const mountRef = useRef(null);
  
  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#eeeee4'); // Light blue background (sky blue)

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Add a second directional light from another angle
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight2.position.set(-5, 8, -5);
    directionalLight2.castShadow = true;
    scene.add(directionalLight2);

    // Room dimensions
    const roomWidth = 6;
    const roomHeight = 3.5;
    const roomDepth = 8;

    // Floor (specific color)
    const floorGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: new THREE.Color('#d8d9d8'),  // Changed to a lighter gray color
        side: THREE.DoubleSide 
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    // Left wall (light blue color)
    const leftWallGeometry = new THREE.PlaneGeometry(roomDepth, roomHeight);
    const leftWallMaterial = new THREE.MeshStandardMaterial({ 
        color: new THREE.Color('#6d99c7'),  // Using string format with THREE.Color
        side: THREE.DoubleSide 
    });
    const leftWall = new THREE.Mesh(leftWallGeometry, leftWallMaterial);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-roomWidth/2, roomHeight/2, 0);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Back wall (slightly darker color)
    const backWallGeometry = new THREE.PlaneGeometry(roomWidth, roomHeight);
    const backWallMaterial = new THREE.MeshStandardMaterial({ 
        color: new THREE.Color('#f0f0f0'),  // Changed to a slightly darker white/light gray
        side: THREE.DoubleSide,
        emissive: new THREE.Color('#222222'), // Darker emissive for contrast
        roughness: 0.7,
        metalness: 0.1
    });
    const backWall = new THREE.Mesh(backWallGeometry, backWallMaterial);
    backWall.position.set(0, roomHeight/2, -roomDepth/2);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Load all furniture
    loadFurniture(scene, roomWidth, roomHeight, roomDepth);

    // Initialize the sidebar
    initSidebar();

    // Handle window resize
    const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }

    animate();
    
    // Cleanup function
    return () => {
        window.removeEventListener('resize', handleResize);
        mountRef.current.removeChild(renderer.domElement);
        renderer.dispose();
    };
  }, []);

  return (
    <div ref={mountRef} style={{ width: '100%', height: '100vh' }}></div>
  );
}