import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { initSidebar } from "../components/sidebar.js";
import { loadFurniture } from "../components/furniture.js";

export default function Home() {
  const mountRef = useRef(null);

  // Component level variables for animation and scene
  let walkingSpeed = 0.05;
  let isWalking = false;
  let wolf;
  let mixer;
  let walkAction;
  let targetPosition = new THREE.Vector3();
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
    const roomWidth = 6;
    const roomHeight = 3.5;
    const roomDepth = 8;

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
    const windowHeight = 1.3;
    const windowX = -roomWidth / 2 + 0.01; // Slightly in front of the wall
    const windowY = 2.1; // Height position
    const windowZ = -2; // Same Z position as the bed and window frame

    // Create a white glass for the window
    const windowGlassGeometry = new THREE.PlaneGeometry(
      windowWidth,
      windowHeight
    );
    const windowGlassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xfa5f55, // Pure white color
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
    targetPosition = new THREE.Vector3(0, 0, 0); // Initialize target position

    // Load all furniture
    loadFurniture(scene, roomWidth, roomHeight, roomDepth);

    // Wolf loading and movement functions
    function loadWolf() {
      console.log("Loading wolf model (FBX)...");
      const fbxLoader = new FBXLoader();
      const textureLoader = new THREE.TextureLoader();

      // Load the base model with idle animation
      fbxLoader.load(
        "/models/idling.fbx",
        (fbx) => {
          console.log("Wolf model loaded:", fbx);
          wolf = fbx;

          // Scale the model to a reasonable size
          wolf.scale.set(0.01, 0.01, 0.01);

          // Position the model in the center of the room
          wolf.position.set(0, 0, 0);
          
          // Apply texture to all meshes with a slightly lighter orange tint
          const texture = textureLoader.load('/models/shaded.png');
          
          wolf.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              // Create a standard material with skinning support and lighter orange tint
              const material = new THREE.MeshStandardMaterial({
                map: texture,
                skinning: true,
                color: new THREE.Color('#ffb38a'), // About 15% lighter than #ff9966
                emissive: new THREE.Color('#000000'), // No emissive effect
                emissiveIntensity: 0 // Turn off emissive
              });
              child.material = material;
              
              // Disable shadows for performance
              child.castShadow = false;
              child.receiveShadow = false;
              console.log("Mesh properties:", child.name);
            }
          });
          
          // Set up animation mixer
          mixer = new THREE.AnimationMixer(wolf);
          
          // Store the idle animation
          const idleAnim = mixer.clipAction(fbx.animations[0]);
          animations['idle'] = idleAnim;
          currentAnimation = 'idle';
          idleAnim.play();
          
          // Add to scene
          scene.add(wolf);
          console.log("Wolf added to scene at position:", wolf.position);
          
          // Make sure model is visible
          wolf.visible = true;
          
          // Force render to update the scene
          renderer.render(scene, camera);
          
          // Load the walking animation
          fbxLoader.load(
            "/models/walking.fbx",
            (walkFbx) => {
              console.log("Walk animation loaded");
              
              // Extract animation and add to our animations dictionary
              const walkAnim = mixer.clipAction(walkFbx.animations[0]);
              animations['walk'] = walkAnim;
            },
            (xhr) => {
              console.log(
                "Loading walk animation progress:",
                (xhr.loaded / xhr.total) * 100 + "% loaded"
              );
            },
            (error) => {
              console.error("Error loading walk animation:", error);
            }
          );
        },
        (xhr) => {
          console.log(
            "Loading progress:",
            (xhr.loaded / xhr.total) * 100 + "% loaded"
          );
        },
        (error) => {
          console.error("Error loading model:", error);
        }
      );
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

    function updateWolfPosition(delta) {
      if (wolf && isWalking) {
        // Calculate direction and distance to target
        const direction = new THREE.Vector3()
          .subVectors(targetPosition, wolf.position)
          .normalize();
        const distance = wolf.position.distanceTo(targetPosition);

        // If we're close enough to the target, stop walking
        if (distance < 0.1) {
          isWalking = false;
          playAnimation('idle'); // Switch to idle animation
          return;
        }

        // Make sure walk animation is playing
        if (currentAnimation !== 'walk') {
          playAnimation('walk');
        }

        // Move the wolf towards the target
        wolf.position.x += direction.x * walkingSpeed;
        wolf.position.z += direction.z * walkingSpeed;

        // Rotate the wolf to face the direction of movement
        const targetRotation = Math.atan2(direction.x, direction.z);
        wolf.rotation.y = targetRotation;

        // Update animation mixer
        if (mixer) {
          mixer.update(delta);
        }
      } else if (mixer) {
        // Keep updating mixer even when not walking for idle animation
        mixer.update(delta);
      }
    }

    // Function to spawn wolf when button is clicked
    function spawnWolf() {
      console.log("Spawn Wolf button clicked");
      if (!wolf) {
        console.log("Metamask not loaded yet, loading now...");
        loadWolf();
      } else {
        console.log(
          "Metamask already loaded, making visible and resetting position"
        );
        // If wolf exists but is not visible, make it visible
        wolf.visible = true;

        // Reset position to center if needed
        wolf.position.set(0, 0, 0);

        // Stop any ongoing walking
        isWalking = false;

        // Force a render to show the wolf
        renderer.render(scene, camera);

        console.log("Metamask is at position:", wolf.position);
      }
    }

    // Initialize the sidebar with callbacks
    initSidebar({
      spawnWolf: spawnWolf,
    });

    // Add right-click event listener for movement
    function onRightClick(event) {
      event.preventDefault(); // Prevent the default context menu

      // Only proceed if the wolf exists
      if (!wolf) {
        console.log(
          "Metamask doesn't exist yet. Please summon the wolf first."
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

        // Set the target position where the wolf should move to
        targetPosition.copy(intersects[0].point);

        // Calculate direction and update wolf rotation
        const direction = new THREE.Vector3()
          .subVectors(targetPosition, wolf.position)
          .normalize();

        // Set the wolf's rotation to face the direction of movement
        const targetRotation = Math.atan2(direction.x, direction.z);
        wolf.rotation.y = targetRotation;

        // Start walking
        isWalking = true;
        playAnimation('walk');
        console.log("Started walking to: ", targetPosition);
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

      // Update wolf position if it's moving
      updateWolfPosition(delta);

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
