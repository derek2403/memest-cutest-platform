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
import ConnectWallet from '../components/ConnectWallet';
const Shortcut = dynamic(() => import('../components/shortcut'), { ssr: false });
const MetamaskShortcut = dynamic(() => import('../components/shortcutdetails.js'), { ssr: false });
const WorkflowPopup = dynamic(() => import('../components/WorkflowPopup'), { ssr: false });
// After line 22 (imports), add these new imports
import { DialogIcon, appendDialogStyles } from "../components/dialogSystem.js";
import { FoxDialogButton } from "../components/foxDialog.js";

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
  const [showDialogIcon, setShowDialogIcon] = useState(false); // Keep dialog icon state
  
  // Initialize pluginsInRoom on client-side only
  useEffect(() => {
    // Exit early if the ref isn't set
    if (!mountRef.current) return;

    // Apply dialog system styles
    appendDialogStyles();

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
    
    // Make scene available globally for components
    window.scene = scene;
    
    // Store scene reference in state
    setSceneRef(scene);
    
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
    
    // Set camera position (keep the existing position setting if there is one)
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    
    // Make camera available to window for DialogIcon component
    window.camera = camera;
    
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

    // Enable panning, but configure which buttons do what
    controls.enablePan = true;
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.PAN,
      RIGHT: THREE.MOUSE.NONE // Disable right-click functionality
    };

    // Force the controls to orbit around the center of the room
    controls.target.set(0, 1, 0); // Set target to center of room, at reasonable height
    controls.update();

    // Room dimensions (defined here so we can use them for lighting)
    const roomWidth = 7;
    const roomHeight = 3.5;
    const roomDepth = 7;

    // Lighting - adjusted for night scene
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Increase ambient light intensity
    scene.add(ambientLight);

    // Add a warmer light inside the room
    const roomLight = new THREE.AmbientLight(0xffffff, 0.9); // Adjust to more neutral white
    roomLight.position.set(0, 2, 0);
    scene.add(roomLight);

    // Main directional light (moonlight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7); // More neutral and less blue
    directionalLight.position.set(50, 100, 30);
    directionalLight.castShadow = false;
    scene.add(directionalLight);

    // Add a second directional light from another angle
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5); // More neutral, less warm
    directionalLight2.position.set(-5, 8, -5);
    directionalLight2.castShadow = false;
    scene.add(directionalLight2);

    // Add a small point light near the window to simulate moonlight coming in
    const windowLight = new THREE.PointLight(0xffffff, 0.6); // Neutral white light
    windowLight.position.set(-roomWidth/2 + 0.5, 2.2, -2); // Position near window
    windowLight.distance = 10;
    windowLight.decay = 2;
    scene.add(windowLight);

    // Floor (specific color)
    const floorGeometry = new THREE.BoxGeometry(roomWidth, 0.2, roomDepth); // Make floor thicker
    
    // Create a wooden floor texture
    function createWoodenFloorTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      
      // Base color for the wooden floor - slightly darker
      ctx.fillStyle = '#8b6d4d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Create wooden planks
      const plankWidth = 60;
      const plankGap = 2;
      
      // Draw the planks with grain
      for (let x = 0; x < canvas.width; x += plankWidth + plankGap) {
        const adjustedWidth = Math.min(plankWidth, canvas.width - x);
        
        // Use varying colors for each plank to create natural wood look - slightly darker
        const baseHue = 28 + Math.random() * 10; // Darker brown
        const baseSaturation = 45 + Math.random() * 20;
        const baseLightness = 43 + Math.random() * 12; // Reduced lightness for darker appearance
        
        ctx.fillStyle = `hsl(${baseHue}, ${baseSaturation}%, ${baseLightness}%)`;
        ctx.fillRect(x, 0, adjustedWidth, canvas.height);
        
        // Add grain lines
        const grainCount = 40 + Math.floor(Math.random() * 30);
        ctx.globalAlpha = 0.15;
        
        for (let i = 0; i < grainCount; i++) {
          const grainY = Math.random() * canvas.height;
          const grainLength = 50 + Math.random() * 150;
          const grainThickness = 1 + Math.random() * 2;
          
          // Adjust grain color based on position - slightly more contrast
          const grainDarkness = Math.random() * 25;
          ctx.fillStyle = `hsl(${baseHue}, ${baseSaturation}%, ${baseLightness - grainDarkness}%)`;
          
          ctx.fillRect(x, grainY, adjustedWidth, grainThickness);
        }
        
        ctx.globalAlpha = 1.0;
        
        // Add darker edges to simulate plank separation
        if (x + adjustedWidth < canvas.width) {
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(x + adjustedWidth, 0, plankGap, canvas.height);
        }
      }
      
      // Add some knots in the wood
      const knotCount = 5 + Math.floor(Math.random() * 5);
      for (let i = 0; i < knotCount; i++) {
        const knotX = Math.random() * canvas.width;
        const knotY = Math.random() * canvas.height;
        const knotRadius = 3 + Math.random() * 5;
        
        const gradient = ctx.createRadialGradient(
          knotX, knotY, 0,
          knotX, knotY, knotRadius
        );
        
        gradient.addColorStop(0, 'rgba(50, 25, 0, 0.8)');
        gradient.addColorStop(0.8, 'rgba(80, 55, 30, 0.3)');
        gradient.addColorStop(1, 'rgba(100, 75, 50, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(knotX, knotY, knotRadius * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Create texture from canvas
      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(2, 2); // Repeat the texture to make planks smaller
      
      // For better quality
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      
      return texture;
    }
    
    // Create the wooden texture
    const woodTexture = createWoodenFloorTexture();
    
    // Create normal map for added depth
    function createWoodNormalMap() {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      
      // Fill with neutral normal color (r=128, g=128, b=255)
      ctx.fillStyle = '#8080ff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add normal details for plank gaps
      const plankWidth = 60;
      const plankGap = 2;
      
      ctx.fillStyle = '#6060ff'; // Darker for depth
      
      for (let x = 0; x < canvas.width; x += plankWidth + plankGap) {
        if (x + plankWidth < canvas.width) {
          ctx.fillRect(x + plankWidth, 0, plankGap, canvas.height);
        }
      }
      
      const normalTexture = new THREE.CanvasTexture(canvas);
      normalTexture.wrapS = THREE.RepeatWrapping;
      normalTexture.wrapT = THREE.RepeatWrapping;
      normalTexture.repeat.set(2, 2);
      
      return normalTexture;
    }
    
    const woodNormalMap = createWoodNormalMap();
    
    // Create material with texture
    const woodMaterial = new THREE.MeshStandardMaterial({
      map: woodTexture,
      normalMap: woodNormalMap,
      roughness: 0.7,
      metalness: 0.1,
      normalScale: new THREE.Vector2(0.5, 0.5)
    });
    
    // Use the wooden material for the top face, darker wood for sides
    const floorMaterial = [
      new THREE.MeshStandardMaterial({ map: woodTexture, normalMap: woodNormalMap, roughness: 0.8, color: new THREE.Color("#6d4b2a") }), // Right edge - darker
      new THREE.MeshStandardMaterial({ map: woodTexture, normalMap: woodNormalMap, roughness: 0.8, color: new THREE.Color("#6d4b2a") }), // Left edge - darker
      woodMaterial, // Top surface - wooden texture
      new THREE.MeshStandardMaterial({ color: new THREE.Color("#4d3118"), roughness: 0.9 }), // Bottom - darker
      new THREE.MeshStandardMaterial({ map: woodTexture, normalMap: woodNormalMap, roughness: 0.8, color: new THREE.Color("#6d4b2a") }), // Front edge - darker
      new THREE.MeshStandardMaterial({ map: woodTexture, normalMap: woodNormalMap, roughness: 0.8, color: new THREE.Color("#6d4b2a") })  // Back edge - darker
    ];

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.1; // Lower the floor to center it
    floor.receiveShadow = true; // Enable shadows on floor
    floor.name = "floor"; // Name the floor for raycasting
    scene.add(floor);
    
    // Light rays and dust particles removed from the room for a cleaner interior look
    
    // Control variables
    agentTargetPosition = new THREE.Vector3(0, 0, 0); // Initialize target position

    // Load all furniture
    loadFurniture(scene, roomWidth, roomHeight, roomDepth);
    
    // Load the island model in the center of the room
    spawnIslandModel(scene);
    
    // Visualize the obstacle boundaries in debug mode
    if (DEBUG_MODE) {
      visualizeObstacles();
      visualizeFloorBoundaries(floorBoundaries);
    }
    
    // Function to visualize obstacles for debugging
    function visualizeObstacles() {
      furnitureObstacles.forEach(obstacle => {
        // Create a material for the obstacle outline
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
        
        // Create points for the obstacle outline
        const points = [];
        for (const point of obstacle.points) {
          points.push(new THREE.Vector3(point.x, 0.05, point.z)); // Slightly above floor
        }
        // Close the loop
        points.push(new THREE.Vector3(obstacle.points[0].x, 0.05, obstacle.points[0].z));
        
        // Create the outline geometry
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(lineGeometry, lineMaterial);
        line.userData = { isDebugElement: true };
        scene.add(line);
        
        // Add points at each corner
        const sphereGeometry = new THREE.SphereGeometry(0.1);
        const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        
        for (const point of obstacle.points) {
          const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
          sphere.position.set(point.x, 0.1, point.z); // Slightly above floor
          sphere.userData = { isDebugElement: true };
          scene.add(sphere);
        }
      });
    }

    // Function to visualize the floor boundaries
    function visualizeFloorBoundaries(boundaries) {
      const boundaryMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff }); // Blue for floor boundaries
      
      // Create points for the boundary rectangle
      const points = [
        new THREE.Vector3(boundaries.minX, 0.05, boundaries.minZ),
        new THREE.Vector3(boundaries.maxX, 0.05, boundaries.minZ),
        new THREE.Vector3(boundaries.maxX, 0.05, boundaries.maxZ),
        new THREE.Vector3(boundaries.minX, 0.05, boundaries.maxZ),
        new THREE.Vector3(boundaries.minX, 0.05, boundaries.minZ)
      ];
      
      // Create the boundary line
      const boundaryGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const boundaryLine = new THREE.Line(boundaryGeometry, boundaryMaterial);
      boundaryLine.userData = { isDebugElement: true };
      scene.add(boundaryLine);
    }

    // Load AI Agent by default
    loadAIAgent(scene, {
      onAgentLoaded: (data) => {
        aiAgent = data.agent;
        mixer = data.mixer;
        animations = data.animations;
        currentAnimation = 'idle';
        console.log("AI Agent loaded and ready");
      }
    });

    // AI Agent loading and movement functions
    function removeExistingAgents() {
      if (scene) {
        // Find all objects that might be AI agents
        const agentsToRemove = [];
        scene.traverse((object) => {
          // Check if this is an AI agent by looking for specific properties
          if (object.userData && object.userData.isAIAgent) {
            agentsToRemove.push(object);
          }
        });
        
        // Remove all found agents
        agentsToRemove.forEach(agent => {
          console.log("Removing existing AI agent from scene");
          scene.remove(agent);
        });
        
        // Reset the aiAgent variable
        aiAgent = null;
        mixer = null;
        animations = {};
        currentAnimation = null;
      }
    }

    /**
     * Play a specific animation with crossfade
     * @param {string} name Animation name ('idle' or 'walk')
     * @param {number} fadeTime Duration of the crossfade in seconds
     */
    function playAnimation(name, fadeTime = 0.5) {
      if (!mixer || !animations[name] || currentAnimation === name) return;
      
      const toPlay = animations[name];
      
      // If there's a current animation, crossfade to the new one
      if (currentAnimation && animations[currentAnimation]) {
        const fromAnim = animations[currentAnimation];
        toPlay.reset();
        toPlay.setEffectiveTimeScale(1);
        toPlay.setEffectiveWeight(1);
        
        // Use a much shorter crossfade time for walk animation to prevent gliding
        const actualFadeTime = name === 'walk' ? 0.1 : fadeTime;
        
        toPlay.crossFadeFrom(fromAnim, actualFadeTime, true);
        toPlay.play();
      } else {
        // Just play the animation directly
        toPlay.play();
      }
      
      currentAnimation = name;
    }

    function updateAgentPosition(delta) {
      if (aiAgent && isAgentWalking) {
        // Calculate direction and distance to target
        const direction = new THREE.Vector3()
          .subVectors(agentTargetPosition, aiAgent.position)
          .normalize();
        const distance = aiAgent.position.distanceTo(agentTargetPosition);

        // If we're close enough to the target, check for next waypoint
        if (distance < 0.15) {
          // If we have more waypoints, move to the next one
          if (waypointQueue.length > 0) {
            // Set the next waypoint as target
            const nextWaypoint = waypointQueue.shift();
            
            // Ensure the waypoint is within floor boundaries
            const constrainedWaypoint = constrainToFloor(nextWaypoint);
            agentTargetPosition.copy(constrainedWaypoint);
            
            // Check if we still need to avoid obstacles between our current position and the next waypoint
            for (const obstacle of furnitureObstacles) {
              if (doesPathIntersectPolygon(aiAgent.position, agentTargetPosition, obstacle.points)) {
                console.log("Path to next waypoint intersects obstacle, recalculating");
                
                // Find a new waypoint to go around this obstacle
                const newWaypoints = findPathAroundObstacle(aiAgent.position, agentTargetPosition, obstacle);
                
                if (newWaypoints && newWaypoints.length > 0) {
                  // Ensure all new waypoints are within floor boundaries
                  const constrainedNewWaypoints = newWaypoints.map(wp => constrainToFloor(wp));
                  
                  // Insert these waypoints at the beginning of the queue
                  waypointQueue.unshift(...constrainedNewWaypoints);
                  agentTargetPosition.copy(constrainToFloor(waypointQueue.shift()));
                }
              }
            }
            
            // Update direction and rotation to face next waypoint
            const newDirection = new THREE.Vector3()
              .subVectors(agentTargetPosition, aiAgent.position)
              .normalize();
            const targetRotation = Math.atan2(newDirection.x, newDirection.z);
            aiAgent.rotation.y = targetRotation;
            
            console.log("Moving to next waypoint:", agentTargetPosition);
            return;
          }
          
          // Check if we reached our final destination
          if (finalDestination && aiAgent.position.distanceTo(finalDestination) > 0.2) {
            // If not at final destination yet, try to reach it
            if (!doesAnyObstacleBlockPath(aiAgent.position, finalDestination)) {
              // Direct path to final destination is clear
              const constrainedDestination = constrainToFloor(finalDestination);
              agentTargetPosition.copy(constrainedDestination);
              
              // Update direction and rotation
              const newDirection = new THREE.Vector3()
                .subVectors(agentTargetPosition, aiAgent.position)
                .normalize();
              const targetRotation = Math.atan2(newDirection.x, newDirection.z);
              aiAgent.rotation.y = targetRotation;
              
              console.log("Final approach to destination");
              return;
            }
          }
          
          // No more waypoints and at final destination, we're done walking
          isAgentWalking = false;
          playAnimation('idle'); // Switch to idle animation
          console.log("Reached destination, stopping");
          finalDestination = null;
          return;
        }

        // Make sure walk animation is playing
        if (currentAnimation !== 'walk') {
          playAnimation('walk');
        }

        // Calculate new position
        const newX = aiAgent.position.x + direction.x * walkingSpeed;
        const newZ = aiAgent.position.z + direction.z * walkingSpeed;
        
        // Constrain the new position to the floor boundaries
        const constrainedX = Math.max(floorBoundaries.minX, Math.min(floorBoundaries.maxX, newX));
        const constrainedZ = Math.max(floorBoundaries.minZ, Math.min(floorBoundaries.maxZ, newZ));
        
        // Move the AI Agent towards the target with constrained position
        aiAgent.position.x = constrainedX;
        aiAgent.position.z = constrainedZ;

        // Rotate the AI Agent to face the direction of movement
        const targetRotation = Math.atan2(direction.x, direction.z);
        aiAgent.rotation.y = targetRotation;

        // Update animation mixer
        if (mixer) {
          mixer.update(delta);
        }
      } else if (mixer) {
        // Keep updating mixer even when not walking for idle animation
        mixer.update(delta);
      }
    }
    
    // Helper function to constrain a point to the floor boundaries
    function constrainToFloor(point) {
      const constrained = point.clone();
      constrained.x = Math.max(floorBoundaries.minX, Math.min(floorBoundaries.maxX, constrained.x));
      constrained.z = Math.max(floorBoundaries.minZ, Math.min(floorBoundaries.maxZ, constrained.z));
      return constrained;
    }
    
    // Helper function to check if any obstacle blocks a path
    function doesAnyObstacleBlockPath(start, end) {
      for (const obstacle of furnitureObstacles) {
        if (doesPathIntersectPolygon(start, end, obstacle.points)) {
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
      }
      
      // If all else fails, just return a point behind the agent
      return new THREE.Vector3()
        .copy(start)
        .add(directVector.clone().multiplyScalar(-OBSTACLE_BUFFER * 2));
    }

    // Function to visualize the path for debugging
    function visualizePath(start, firstTarget, waypoints, pathBlocked) {
      // Remove any existing path visualization
      scene.children.forEach(child => {
        if (child.userData && child.userData.isPathVisualization) {
          scene.remove(child);
        }
      });
      
      // Create a material for the path
      const pathMaterial = new THREE.LineBasicMaterial({ 
        color: pathBlocked ? 0xffaa00 : 0x00ff00,
        linewidth: 3
      });
      
      // Create points for the complete path
      const pathPoints = [
        new THREE.Vector3(start.x, 0.1, start.z)
      ];
      
      // Add first target
      pathPoints.push(new THREE.Vector3(firstTarget.x, 0.1, firstTarget.z));
      
      // Add all waypoints
      for (const waypoint of waypoints) {
        pathPoints.push(new THREE.Vector3(waypoint.x, 0.1, waypoint.z));
      }
      
      // Create the path line
      const pathGeometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
      const pathLine = new THREE.Line(pathGeometry, pathMaterial);
      pathLine.userData = { isPathVisualization: true };
      scene.add(pathLine);
      
      // Add spheres at each waypoint for better visibility
      const wpGeometry = new THREE.SphereGeometry(0.1);
      const wpMaterial = new THREE.MeshBasicMaterial({ color: 0x00aaff });
      
      // First target gets a special color
      const firstTargetSphere = new THREE.Mesh(wpGeometry, new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
      firstTargetSphere.position.set(firstTarget.x, 0.1, firstTarget.z);
      firstTargetSphere.userData = { isPathVisualization: true };
      scene.add(firstTargetSphere);
      
      // Add remaining waypoints
      for (const waypoint of waypoints) {
        const sphere = new THREE.Mesh(wpGeometry, wpMaterial);
        sphere.position.set(waypoint.x, 0.1, waypoint.z);
        sphere.userData = { isPathVisualization: true };
        scene.add(sphere);
      }
    }

    // Register the right-click event handler
    renderer.domElement.addEventListener("contextmenu", onRightClick);

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    // Animation loop with performance optimizations
    let lastFrameTime = 0;
    const targetFPS = 60; // Higher FPS for smoother animation
    const frameInterval = 1000 / targetFPS;

    function animate(currentTime) {
      animationFrameId = requestAnimationFrame(animate);

      const deltaTime = currentTime - lastFrameTime;
      if (deltaTime < frameInterval) return;

      const delta = deltaTime / 1000; // Convert to seconds
      lastFrameTime = currentTime - (deltaTime % frameInterval);
      
      // Update stars
      updateStars(delta);

      // Update AI Agent position if it's moving
      updateAgentPosition(delta);
      
      // Store AI agent reference globally for dialog system
      if (aiAgent) {
        window.aiAgent = aiAgent;
      }
      
      // Animate any custom models that need animation (like the rotating planet)
      if (window.customModelsToAnimate && window.customModelsToAnimate.length > 0) {
        window.customModelsToAnimate.forEach(model => {
          // Handle rotation
          if (model && model.userData && model.userData.isRotating) {
            // Apply rotation based on the model's rotation speed
            model.rotation.y += model.userData.rotationSpeed || 0.005;
          }
          
          // Handle pulsing glow effect
          if (model && model.userData && model.userData.isPulsing && model.userData.updatePulse) {
            model.userData.updatePulse(delta);
          }
        });
      }

      controls.update();
      renderer.render(scene, camera);
    }

    animate(0);

    // Store the scene reference in state
    setSceneRef(scene);

    // Add click event handler for 3D objects
    function onClick(event) {
      // Calculate mouse position in normalized device coordinates
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      // Update the raycaster
      raycaster.setFromCamera(mouse, camera);
      
      // Find all intersected objects
      const intersects = raycaster.intersectObjects(scene.children, true);
      
      if (intersects.length > 0) {
        // Find the first clickable object
        let clickableObject = null;
        
        for (let i = 0; i < intersects.length; i++) {
          const object = intersects[i].object;
          let parent = object;
          
          // Traverse up to find a parent with userData
          while (parent && !parent.userData?.clickable) {
            parent = parent.parent;
          }
          
          if (parent && parent.userData?.clickable) {
            clickableObject = parent;
            break;
          }
          50% {
            opacity: 0.7;
          }
          100% {
            transform: scale(1.2) rotate(360deg);
            opacity: 0;
          }
        }
      }
    }
    
    // Register the click event handler
    renderer.domElement.addEventListener('click', onClick);

    // Initialize the sidebar with callbacks
    console.log("Initializing sidebar with callbacks");
    initSidebar({
      'metamask-button': () => {
        console.log("Metamask button clicked in index.js callback");
        // Pass the scene parameter to the 3D implementation
        spawnMetamaskFox(scene);
      },
      'polygon-button': () => {
        console.log("Polygon button clicked");
        // Add Polygon functionality to spawn the model
        spawnPolygonModel(scene);
      },
      'celo-button': () => {
        console.log("Celo button clicked");
        // Add Celo functionality to spawn the model
        spawnCeloModel(scene);
      },
      'oneinch-button': () => {
        console.log("1inch button clicked");
        // Add 1inch functionality to spawn the unicorn
        spawn1inchUnicorn(scene);
      },
      'spreadsheet-button': () => {
        console.log("Spreadsheet button clicked");
        // Add Spreadsheet functionality to spawn the model
        spawnSpreadsheetModel(scene);
      },
      'gmail-button': () => {
        console.log("Gmail button clicked");
        // Add Gmail functionality to spawn the model
        spawnGmailModel(scene);
      }
    }, scene); // Pass the scene object here

    // Cleanup function
    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("contextmenu", onRightClick);
      renderer.domElement.removeEventListener('click', onClick);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Handle dropping a button on the shortcut popup
  const handleShortcutDrop = (buttonId) => {
    console.log('Button dropped:', buttonId);
    setShowShortcutPopup(false);
    
    // Show the appropriate shortcut based on the button
    if (buttonId === 'metamask-button') {
      setShowMetamaskShortcut(true);
    }
    // Add handlers for other buttons if needed
  };

  return (
    <>
      <ConnectWallet />
      <div 
        ref={mountRef} 
        className="w-full h-screen" 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          overflow: 'hidden',
        }}
      ></div>
      
      {/* Fox Dialog Button - use the modular component */}
      <FoxDialogButton 
        scene={sceneRef || window.scene} 
        onDialogStart={() => setShowDialogIcon(true)}
        onDialogEnd={() => setShowDialogIcon(false)}
      />

      {/* Dialog icon - use the modular component */}
      {showDialogIcon && window.aiAgent && (
        <DialogIcon agentRef={window.aiAgent} />
      )}
      
      {showShortcutPopup && (
        <Shortcut 
          onClose={() => setShowShortcutPopup(false)} 
          onDrop={handleShortcutDrop} 
        />
      )}
      
      {showMetamaskShortcut && (
        <MetamaskShortcut 
          onClose={() => setShowMetamaskShortcut(false)} 
        />
      )}
      
      {showWorkflowPopup && (
        <WorkflowPopup 
          onClose={() => setShowWorkflowPopup(false)} 
          showSavedSection={true}
          readOnly={true}
        />
      )}
    </>
  );
}
