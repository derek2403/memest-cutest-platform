import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { initSidebar } from "../components/sidebar.js";
import { loadFurniture } from "../components/furniture.js";
import { loadAIAgent } from "../components/aiagent.js";

export default function Home() {
  const mountRef = useRef(null);

  // Component level variables for animation and scene
  let walkingSpeed = 0.05;
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

  useEffect(() => {
    // Exit early if the ref isn't set
    if (!mountRef.current) return;

    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color("#eeeee4"); // Light blue background (sky blue)

    // Camera setup
    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);

    // Renderer setup with optimizations
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = false;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    mountRef.current.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Disable right-click panning
    controls.enablePan = false;

    // Force the controls to orbit around the center of the room
    controls.target.set(0, 1, 0); // Set target to center of room, at reasonable height
    controls.update();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = false;
    scene.add(directionalLight);

    // Add a second directional light from another angle
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight2.position.set(-5, 8, -5);
    directionalLight2.castShadow = false;
    scene.add(directionalLight2);

    // Room dimensions
    const roomWidth = 10;
    const roomHeight = 3.5;
    const roomDepth = 10;

    // Floor (specific color)
    const floorGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#d8d9d8"), // Changed to a lighter gray color
      side: THREE.DoubleSide,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = false;
    floor.name = "floor"; // Name the floor for raycasting
    scene.add(floor);

    // Left wall (light blue color)
    const leftWallGeometry = new THREE.PlaneGeometry(roomDepth, roomHeight);
    const leftWallMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#6d99c7"), // Using string format with THREE.Color
      side: THREE.DoubleSide,
    });
    const leftWall = new THREE.Mesh(leftWallGeometry, leftWallMaterial);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-roomWidth / 2, roomHeight / 2, 0);
    leftWall.receiveShadow = false;
    scene.add(leftWall);

    // Create a window cutout in the left wall
    const windowWidth = 1.2;
    const windowHeight = 1.;
    const windowX = -roomWidth/2 + 0.01; // Slightly in front of the wall
    const windowY = 2.1; // Height position
    const windowZ = -2; // Same Z position as the bed and window frame

    // Create a white glass for the window
    const windowGlassGeometry = new THREE.PlaneGeometry(
      windowWidth,
      windowHeight
    );
    const windowGlassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, // Pure white color
      transparent: true,
      opacity: 0.8, // More opaque
      transmission: 0.2, // Less transmission for white appearance
      roughness: 0.05,
      metalness: 0.0,
      clearcoat: 1.0,
      side: THREE.DoubleSide,
    });

    const windowGlass = new THREE.Mesh(
      windowGlassGeometry,
      windowGlassMaterial
    );
    windowGlass.position.set(windowX, windowY, windowZ);
    windowGlass.rotation.y = Math.PI / 2; // Same rotation as the wall
    windowGlass.receiveShadow = false;
    scene.add(windowGlass);

    // Back wall (slightly darker color)
    const backWallGeometry = new THREE.PlaneGeometry(roomWidth, roomHeight);
    const backWallMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#f0f0f0"), // Changed to a slightly darker white/light gray
      side: THREE.DoubleSide,
      emissive: new THREE.Color("#222222"), // Darker emissive for contrast
      roughness: 0.7,
      metalness: 0.1,
    });
    const backWall = new THREE.Mesh(backWallGeometry, backWallMaterial);
    backWall.position.set(0, roomHeight / 2, -roomDepth / 2);
    backWall.receiveShadow = false;
    scene.add(backWall);

    // Control variables
    agentTargetPosition = new THREE.Vector3(0, 0, 0); // Initialize target position

    // Load all furniture
    loadFurniture(scene, roomWidth, roomHeight, roomDepth);

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
        toPlay.crossFadeFrom(fromAnim, fadeTime, true);
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

        // If we're close enough to the target, stop walking
        if (distance < 0.1) {
          isAgentWalking = false;
          playAnimation('idle'); // Switch to idle animation
          return;
        }

        // Make sure walk animation is playing
        if (currentAnimation !== 'walk') {
          playAnimation('walk');
        }

        // Move the AI Agent towards the target
        aiAgent.position.x += direction.x * walkingSpeed;
        aiAgent.position.z += direction.z * walkingSpeed;

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

    // Function to spawn AI Agent when button is clicked
    function spawnAIAgent() {
      console.log("Spawn AI Agent button clicked");
      if (!aiAgent) {
        console.log("AI Agent not loaded yet, loading now...");
        loadAIAgent(scene, {
          onAgentLoaded: (data) => {
            aiAgent = data.agent;
            mixer = data.mixer;
            animations = data.animations;
            currentAnimation = 'idle';
            console.log("AI Agent loaded and ready");
          }
        });
      } else {
        console.log(
          "AI Agent already loaded, making visible and resetting position"
        );
        // If AI Agent exists but is not visible, make it visible
        aiAgent.visible = true;

        // Reset position to center if needed
        aiAgent.position.set(0, 0, 0);

        // Stop any ongoing walking
        isAgentWalking = false;

        // Force a render to show the AI Agent
        renderer.render(scene, camera);

        console.log("AI Agent is at position:", aiAgent.position);
      }
    }

    // Initialize the sidebar with callbacks
    initSidebar({
      'metamask-button': () => {
        console.log("Metamask button clicked");
        // Add Metamask functionality here
      },
      'gmail-button': () => {
        console.log("Gmail button clicked");
        // Add Gmail functionality here
      },
      'oneinch-button': () => {
        console.log("1inch button clicked");
        // Add 1inch functionality here
      }
    });

    // Add right-click event listener for movement
    function onRightClick(event) {
      event.preventDefault(); // Prevent the default context menu

      // Only proceed if the AI Agent exists
      if (!aiAgent) {
        console.log(
          "AI Agent doesn't exist yet. Please summon the AI Agent first."
        );
        return;
      }

      // Calculate mouse position in normalized device coordinates (-1 to +1)
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      // Update the raycaster with the camera and mouse position
      raycaster.setFromCamera(mouse, camera);

      // Find intersections with the floor
      const floorObjects = scene.children.filter((obj) => obj.name === "floor");
      console.log("Floor objects found:", floorObjects.length);

      const intersects = raycaster.intersectObjects(floorObjects);

      if (intersects.length > 0) {
        console.log("Right click detected on floor", intersects[0].point);

        // Set the target position where the AI Agent should move to
        agentTargetPosition.copy(intersects[0].point);

        // Calculate direction and update AI Agent rotation
        const direction = new THREE.Vector3()
          .subVectors(agentTargetPosition, aiAgent.position)
          .normalize();

        // Set the AI Agent's rotation to face the direction of movement
        const targetRotation = Math.atan2(direction.x, direction.z);
        aiAgent.rotation.y = targetRotation;

        // Start walking
        isAgentWalking = true;
        playAnimation('walk');
        console.log("Started walking to: ", agentTargetPosition);
      } else {
        console.log("No intersection with floor detected");
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
    const targetFPS = 30; // Lower FPS for better performance
    const frameInterval = 1000 / targetFPS;

    function animate(currentTime) {
      animationFrameId = requestAnimationFrame(animate);

      // Throttle renders to target FPS
      const deltaTime = currentTime - lastFrameTime;
      if (deltaTime < frameInterval) return;

      const delta = deltaTime / 1000; // Convert to seconds
      lastFrameTime = currentTime - (deltaTime % frameInterval);

      // Update AI Agent position if it's moving
      updateAgentPosition(delta);

      controls.update();
      renderer.render(scene, camera);
    }

    animate(0);

    // Cleanup function
    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("contextmenu", onRightClick);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100%", height: "100vh" }}></div>;
}
