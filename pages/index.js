import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { initSidebar } from "../components/sidebar.js";
import { loadFurniture } from "../components/furniture.js";
import { loadAIAgent } from "../components/aiagent.js";
import { spawn1inchUnicorn } from "../components/oneinch.js";
import { spawnMetamaskFox } from "../components/metawallet.js";
import { spawnPolygonModel } from "../components/polygon.js";
import { spawnPolygonPlanet } from "../components/polygon_planet.js";
import { spawnOneinchPlanet } from "../components/oneinch_planet.js";
import { spawnCeloPlanet } from "../components/celo_planet.js";
import { spawnCeloModel } from "../components/celo.js";
import { spawnGmailModel } from "../components/gmail.js";
import { spawnSpreadsheetModel } from "../components/spreadsheet.js";
import { spawnIslandModel } from "../components/island.js";
import dynamic from 'next/dynamic';
const Shortcut = dynamic(() => import('../components/shortcut'), { ssr: false });
const MetamaskShortcut = dynamic(() => import('../components/shortcutdetails.js'), { ssr: false });
const WorkflowPopup = dynamic(() => import('../components/WorkflowPopup'), { ssr: false });

// At the top of your file, before the component
// Add this if you remove globals.css
const globalStyles = {
  html: {
    padding: 0,
    margin: 0,
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif",
    boxSizing: "border-box"
  }
};

export default function Home() {
  const mountRef = useRef(null);
  const [sceneRef, setSceneRef] = useState(null);

  // Add these state variables
  const [showShortcutPopup, setShowShortcutPopup] = useState(false);
  const [showMetamaskShortcut, setShowMetamaskShortcut] = useState(false);
  const [showWorkflowPopup, setShowWorkflowPopup] = useState(false);
  
  // Initialize pluginsInRoom on client-side only
  useEffect(() => {
    // Initialize global plugins tracking
    window.pluginsInRoom = {
      metamask: false,
      polygon: false,
      polygonPlanet: false,
      oneinchPlanet: false,
      celo: false,
      celoPlanet: false,
      oneinch: false,
      spreadsheet: false,
      gmail: false,
      // Function to get all active plugins (those that are in the room)
      getActivePlugins: function() {
        const active = [];
        if (this.metamask) active.push('metamask');
        if (this.polygon) active.push('polygon');
        if (this.polygonPlanet) active.push('polygonPlanet');
        if (this.oneinchPlanet) active.push('oneinchPlanet');
        if (this.celo) active.push('celo');
        if (this.celoPlanet) active.push('celoPlanet');
        if (this.oneinch) active.push('oneinch');
        if (this.spreadsheet) active.push('spreadsheet');
        if (this.gmail) active.push('gmail');
        return active;
      }
    };
  }, []);

  // Component level variables for animation and scene
  let walkingSpeed = 0.04; // Reduced by 20% from original 0.05
  let isAgentWalking = false;
  let aiAgent;
  let mixer;
  let walkAction;
  let agentTargetPosition = new THREE.Vector3();
  let raycaster = new THREE.Raycaster();
  let mouse = new THREE.Vector2();
  let animationFrameId = null;
  let scene, camera, renderer;
  let lastTimeClicked = 0;
  let animations = {}; // Dictionary to store animations
  let currentAnimation = null;

  // Floor boundaries (will be set in useEffect)
  let floorBoundaries = {
    minX: -3.5,
    maxX: 3.5,
    minZ: -3.5,
    maxZ: 3.5
  };

  // Expose floorBoundaries to window for access from sidebar.js
  window.floorBoundaries = floorBoundaries;

  // Add furniture obstacle data
  const furnitureObstacles = [
    {
      // Table and chair area
      points: [
        new THREE.Vector3(2.833, 0, -0.721),
        new THREE.Vector3(2.882, 0, -3.361),
        new THREE.Vector3(1.142, 0, -3.423),
        new THREE.Vector3(1.200, 0, -0.710)
      ]
    },
    {
      // Living room table area
      points: [
        new THREE.Vector3(0.18249943220364717, 0, 0.4219197930921914),
        new THREE.Vector3(-1.232898461053765, 0, 0.3622733604177472),
        new THREE.Vector3(-1.2637572087925983, 0, 2.731600609061),
        new THREE.Vector3(0.27887298226970775, 0, 2.7167017095035195)
      ]
    },
    {
      // Sofa area
      points: [
        new THREE.Vector3(-1.9942509933239285, 0, 2.8505197760793695),
        new THREE.Vector3(-3.451115247625434, 0, 2.946173082552176),
        new THREE.Vector3(-3.4329254395296758, 0, 0.10421278535787085),
        new THREE.Vector3(-1.9447783550794147, 0, 0.17249754939718953)
      ]
    },
    {
      // Table lamp area
      points: [
        new THREE.Vector3(-2.436873051520765, 0, 0.14620636452125985),
        new THREE.Vector3(-3.4330058552740788, 0, 0.008880845803213577),
        new THREE.Vector3(-3.4385544489786533, 0, -1.8812060427940032),
        new THREE.Vector3(-2.4361083017537257, 0, -1.9682776175330825)
      ]
    },
    {
      // Bed area
      points: [
        new THREE.Vector3(-3.407952893312852, 0, -1.6851876393965608),
        new THREE.Vector3(-3.483868548414369, 0, -3.3235582801304817),
        new THREE.Vector3(-0.5329127465405925, 0, -3.320640748699036),
        new THREE.Vector3(-0.5316397159820063, 0, -1.6836901963583096)
      ]
    }
    // More furniture obstacles can be added here
  ];

  // Debug mode for visualizing obstacles
  const DEBUG_MODE = false;
  // Larger buffer for obstacle avoidance
  const OBSTACLE_BUFFER = 1.0;
  // Use simple grid-based movement (horizontal/vertical only)
  const USE_GRID_MOVEMENT = true;
  // Waypoint queue for sequential navigation
  let waypointQueue = [];
  // Current navigation target (final destination)
  let finalDestination = null;

  useEffect(() => {
    // Exit early if the ref isn't set
    if (!mountRef.current) return;

    // Scene setup
    scene = new THREE.Scene();
    
    // Add subtle fog for depth perception
    scene.fog = new THREE.FogExp2(0x000510, 0.0015);
    
    // Create an environment with a stylized night sky backdrop
    const environmentGroup = new THREE.Group();
    scene.add(environmentGroup);
    
    // Create a dark gradient sky background
    const skyColors = {
      topColor: new THREE.Color("#000000"),  // Pure black for top
      middleColor: new THREE.Color("#050a20"), // Very dark blue for middle
      bottomColor: new THREE.Color("#0a1030") // Dark blue with slight purple tone for bottom
    };
    
    // Create a gradient background sphere
    const skyGeometry = new THREE.SphereGeometry(200, 32, 32);
    // Use a custom shader for the gradient sky
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: skyColors.topColor },
        middleColor: { value: skyColors.middleColor },
        bottomColor: { value: skyColors.bottomColor }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 middleColor;
        uniform vec3 bottomColor;
        varying vec3 vWorldPosition;
        void main() {
          // Normalize position for gradient calculation (0 = bottom, 1 = top)
          float h = normalize(vWorldPosition).y * 0.5 + 0.5;
          
          // Mix colors based on height with gentle transitions
          vec3 color = mix(bottomColor, middleColor, smoothstep(0.0, 0.4, h));
          color = mix(color, topColor, smoothstep(0.4, 0.9, h));
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.BackSide
    });
    
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    environmentGroup.add(sky);
    
    // Create stylized stars with varied sizes and brightness
    const starCount = 2000; // Reduced from 5000 to 2000
    const starColors = [0xffffff, 0xffffee, 0xeeeeff, 0xccddff];
    const starSizes = [0.4, 0.6, 0.8, 1.2, 1.5];
    
    // Generate multiple star layers for depth
    for (let layer = 0; layer < 3; layer++) {
      const starsGeometry = new THREE.BufferGeometry();
      const starsMaterial = new THREE.PointsMaterial({
        color: starColors[layer % starColors.length],
        size: starSizes[layer % starSizes.length],
        transparent: true,
        opacity: 0.8 - (layer * 0.15),
        sizeAttenuation: true,
        map: createCircleStarTexture(32), // Create circle texture for stars
        blending: THREE.AdditiveBlending // Use additive blending for smoother appearance
      });
      
      const starsVertices = [];
      const layerStarCount = Math.floor(starCount / (layer + 1));
      
      for (let i = 0; i < layerStarCount; i++) {
        const radius = 150 + layer * 20;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);
        
        // Remove the line below to allow stars to appear everywhere in space
        // if (y < -50) continue;
        
        starsVertices.push(x, y, z);
      }
      
      starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
      const stars = new THREE.Points(starsGeometry, starsMaterial);
      environmentGroup.add(stars);
    }
    
    // Add an additional layer of stars closer to the island
    const closeStarsGeometry = new THREE.BufferGeometry();
    const closeStarsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.3,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
      map: createCircleStarTexture(24), // Create circle texture for close stars
      blending: THREE.AdditiveBlending // Use additive blending for smoother appearance
    });
    
    const closeStarsVertices = [];
    const closeStarCount = 300; // Reduced from 800 to 300
    
    for (let i = 0; i < closeStarCount; i++) {
      // Generate stars in a smaller sphere around the island
      const radius = 20 + Math.random() * 30;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      closeStarsVertices.push(x, y, z);
    }
    
    closeStarsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(closeStarsVertices, 3));
    const closeStars = new THREE.Points(closeStarsGeometry, closeStarsMaterial);
    environmentGroup.add(closeStars);
    
    // Create twinkling stars with animation
    const twinkleStarCount = 100; // Reduced from 200 to 100
    const twinkleStarsGeometry = new THREE.BufferGeometry();
    const twinkleStarsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2.0,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      map: createCircleStarTexture(32, true), // Create twinkling star texture with glow
      blending: THREE.AdditiveBlending
    });
    
    const twinkleVertices = [];
    const twinkleOpacities = [];
    
    for (let i = 0; i < twinkleStarCount; i++) {
      const radius = 130;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      // Allow twinkling stars everywhere
      twinkleVertices.push(x, y, z);
      // Store initial twinkle state
      twinkleOpacities.push(Math.random());
    }
    
    twinkleStarsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(twinkleVertices, 3));
    const twinkleStars = new THREE.Points(twinkleStarsGeometry, twinkleStarsMaterial);
    environmentGroup.add(twinkleStars);
    
    // Function to create a circular star texture
    function createCircleStarTexture(size = 32, withGlow = false) {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      // Clear canvas
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillRect(0, 0, size, size);
      
      const center = size / 2;
      const radius = size / 2 - 1;
      
      // Create a soft radial gradient for smooth circle
      const gradient = ctx.createRadialGradient(center, center, 0, center, center, radius);
      
      if (withGlow) {
        // Create a star with glow effect
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.4, 'rgba(240,240,255,0.8)');
        gradient.addColorStop(0.7, 'rgba(220,220,255,0.3)');
        gradient.addColorStop(1, 'rgba(220,220,255,0)');
      } else {
        // Create a smooth circle star
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.7, 'rgba(255,255,255,0.5)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
      }
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.fill();
      
      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    }
    
    // Create a softer, more stylized star texture (original function - now replaced)
    function createStarTexture() {
      return createCircleStarTexture(32, true);
    }
    
    // Function to update stars in the animation loop
    function updateStars(delta) {
      // Update twinkling stars
      if (twinkleStars && twinkleStars.material) {
        // Create overall twinkling effect by varying material opacity
        twinkleStars.material.opacity = 0.7 + Math.sin(Date.now() * 0.001) * 0.3;
        twinkleStars.rotation.y += 0.0001; // Very slow rotation for added effect
      }
    }
    
    // Create a stylized ground plane that extends beyond the room
    const extendedGroundGeometry = new THREE.PlaneGeometry(500, 500);
    const extendedGroundMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#050916"), // Very dark blue/black ground
      side: THREE.DoubleSide,
      roughness: 0.9
    });
    
    const extendedGround = new THREE.Mesh(extendedGroundGeometry, extendedGroundMaterial);
    extendedGround.rotation.x = -Math.PI / 2;
    extendedGround.position.y = -0.01; // Slightly below room floor to prevent z-fighting
    // Removing the extended ground to make the room float in space
    // environmentGroup.add(extendedGround);
    
    // Use the video for star effects with reduced opacity
    const videoElement = document.createElement('video');
    videoElement.src = '/assets/fullstars.mp4';
    videoElement.loop = true;
    videoElement.muted = true;
    videoElement.playsInline = true;
    videoElement.autoplay = true;
    videoElement.crossOrigin = 'anonymous';
    videoElement.setAttribute('playsinline', '');
    videoElement.setAttribute('webkit-playsinline', '');
    videoElement.setAttribute('preload', 'auto');

    const videoTexture = new THREE.VideoTexture(videoElement);
    videoTexture.minFilter = THREE.NearestFilter;
    videoTexture.magFilter = THREE.NearestFilter;
    videoTexture.format = THREE.RGBAFormat;
    
    if (THREE.SRGBColorSpace !== undefined) {
      videoTexture.colorSpace = THREE.SRGBColorSpace;
    } else if (THREE.sRGBEncoding !== undefined) {
      videoTexture.encoding = THREE.sRGBEncoding;
    }
    
    videoTexture.generateMipmaps = false;
    videoTexture.needsUpdate = true;

    const videoSphereGeometry = new THREE.SphereGeometry(180, 32, 32);
    const videoSphereMaterial = new THREE.MeshBasicMaterial({
      map: videoTexture,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.0, // Set to 0 to completely remove the blur effect
      blending: THREE.NoBlending // Disable blending to ensure it doesn't show at all
    });
    
    const videoSphere = new THREE.Mesh(videoSphereGeometry, videoSphereMaterial);
    // Uncomment this line if you want to completely remove the video sphere
    // environmentGroup.add(videoSphere);

    const ensureVideoPlays = () => {
      videoElement.play().catch(e => {
        console.warn('Video autoplay failed, retrying:', e);
        setTimeout(ensureVideoPlays, 1000);
      });
    };
    
    // Don't bother playing the video if we're not using it
    // ensureVideoPlays();

    // Automatically spawn the planets in space
    spawnPolygonPlanet(scene);
    spawnOneinchPlanet(scene);
    spawnCeloPlanet(scene);

    // Camera setup
    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    
    // Allow the camera to see more of the environment
    camera.far = 500;
    camera.updateProjectionMatrix();

    // Check WebGL support before creating renderer
    let isWebGLAvailable = false;
    let isWebGL2Available = false;
    let useLowPerformanceMode = false;
    
    try {
      const canvas = document.createElement('canvas');
      isWebGLAvailable = !!(
        window.WebGLRenderingContext && 
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
      isWebGL2Available = !!(
        window.WebGL2RenderingContext && 
        canvas.getContext('webgl2')
      );
      
      // Override to always use maximum quality regardless of device
      useLowPerformanceMode = false;
      
    } catch (e) {
      console.error("WebGL detection failed:", e);
    }

    if (!isWebGLAvailable) {
      // Create fallback content when WebGL is not supported
      const fallbackDiv = document.createElement('div');
      fallbackDiv.style.width = '100%';
      fallbackDiv.style.height = '100vh';
      fallbackDiv.style.display = 'flex';
      fallbackDiv.style.flexDirection = 'column';
      fallbackDiv.style.justifyContent = 'center';
      fallbackDiv.style.alignItems = 'center';
      fallbackDiv.style.backgroundColor = '#050a20';
      fallbackDiv.style.color = 'white';
      fallbackDiv.style.fontFamily = 'Arial, sans-serif';
      fallbackDiv.style.padding = '20px';
      fallbackDiv.style.textAlign = 'center';
      
      const header = document.createElement('h1');
      header.textContent = 'WebGL Not Available';
      
      const message = document.createElement('p');
      message.textContent = 'Your browser or device does not support WebGL, which is required to view this 3D content. Please try a different browser or device.';
      
      fallbackDiv.appendChild(header);
      fallbackDiv.appendChild(message);
      
      // Clear any existing content and add the fallback
      if (mountRef.current) {
        mountRef.current.innerHTML = '';
        mountRef.current.appendChild(fallbackDiv);
      }
      
      // Return early to prevent further initialization
      return;
    }

    // Renderer setup with optimizations (only reaches here if WebGL is available)
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true, // Always enable antialiasing for maximum quality
        powerPreference: "high-performance",
        alpha: true,
        precision: "highp", // Always use high precision
        failIfMajorPerformanceCaveat: false,
        depth: true,
        stencil: true, // Enable stencil buffer for advanced effects
        preserveDrawingBuffer: false
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.shadowMap.enabled = true; // Enable shadow mapping
      renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Use soft shadows for better quality
      
      // Set output encoding to sRGB for vibrant colors throughout the scene
      if (THREE.OutputEncoding !== undefined) {
        renderer.outputEncoding = THREE.sRGBEncoding;
      } else if (THREE.ColorManagement !== undefined) {
        THREE.ColorManagement.enabled = true;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
      }
      
      // Always use the device's actual pixel ratio for maximum clarity
      renderer.setPixelRatio(window.devicePixelRatio);
      
      // Adjust renderer context settings for better compatibility
      const gl = renderer.getContext();
      if (gl) {
        gl.getExtension('OES_standard_derivatives');
        gl.getExtension('OES_element_index_uint');
        gl.getExtension('WEBGL_depth_texture');
        // Try to get additional extensions for better quality
        gl.getExtension('EXT_shader_texture_lod');
        gl.getExtension('OES_texture_float');
        gl.getExtension('OES_texture_half_float');
      }
      
      mountRef.current.appendChild(renderer.domElement);
      
      console.log(`Using WebGL${isWebGL2Available ? '2' : '1'} with maximum quality settings`);
      
    } catch (e) {
      console.error("WebGL renderer creation failed:", e);
      // Handle renderer creation failure
      const errorDiv = document.createElement('div');
      errorDiv.style.width = '100%';
      errorDiv.style.height = '100vh';
      errorDiv.style.display = 'flex';
      errorDiv.style.flexDirection = 'column';
      errorDiv.style.justifyContent = 'center';
      errorDiv.style.alignItems = 'center';
      errorDiv.style.backgroundColor = '#050a20';
      errorDiv.style.color = 'white';
      errorDiv.style.fontFamily = 'Arial, sans-serif';
      errorDiv.style.padding = '20px';
      errorDiv.style.textAlign = 'center';
      
      const header = document.createElement('h1');
      header.textContent = 'WebGL Error';
      
      const message = document.createElement('p');
      message.textContent = 'There was an error creating the WebGL context. This might be due to hardware limitations or browser settings. Try updating your graphics drivers or enabling hardware acceleration in your browser settings.';
      
      errorDiv.appendChild(header);
      errorDiv.appendChild(message);
      
      if (mountRef.current) {
        mountRef.current.innerHTML = '';
        mountRef.current.appendChild(errorDiv);
      }
      
      return;
    }

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
