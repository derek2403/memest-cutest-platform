import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { initSidebar } from "../components/sidebar.js";
import { loadFurniture } from "../components/furniture.js";
import { loadAIAgent } from "../components/aiagent.js";
import { spawn1inchUnicorn } from "../components/oneinch.js";
import { spawnMetamaskWolf } from "../components/metawallet.js";
import dynamic from 'next/dynamic';
const Shortcut = dynamic(() => import('../components/shortcut'), { ssr: false });
const MetamaskShortcut = dynamic(() => import('../components/shortcutdetails.js'), { ssr: false });

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

  // Floor boundaries (will be set in useEffect)
  let floorBoundaries = {
    minX: -3.5,
    maxX: 3.5,
    minZ: -3.5,
    maxZ: 3.5
  };

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

  // Add these state variables
  const [showShortcutPopup, setShowShortcutPopup] = useState(false);
  const [showMetamaskShortcut, setShowMetamaskShortcut] = useState(false);
  
  // Debug mode for visualizing obstacles
  const DEBUG_MODE = true;
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
    
    // Load image background instead of video
    const textureLoader = new THREE.TextureLoader();
    const backgroundTexture = textureLoader.load('/assets/qwe.jpg');
    scene.background = backgroundTexture;

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
    const roomWidth = 7;
    const roomHeight = 3.5;
    const roomDepth = 7;

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
    
    // Set floor boundaries based on room dimensions
    floorBoundaries = {
      minX: -roomWidth / 2 + 0.2, // Add some padding to avoid walking right at the edge
      maxX: roomWidth / 2 - 0.2,
      minZ: -roomDepth / 2 + 0.2,
      maxZ: roomDepth / 2 - 0.2
    };
    
    // If in debug mode, visualize the floor boundaries
    if (DEBUG_MODE) {
      visualizeFloorBoundaries(floorBoundaries);
    }

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
    
    // Visualize the obstacle boundaries in debug mode
    if (DEBUG_MODE) {
      visualizeObstacles();
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
        }
      }
      return false;
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

    // Function to check if a point is inside a polygon (furniture obstacle)
    function isPointInPolygon(point, polygon) {
      // Check if point or polygon is undefined
      if (!point || !polygon || !Array.isArray(polygon) || polygon.length < 3) {
        return false;
      }
      
      const x = point.x;
      const z = point.z;
      let inside = false;
      
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x;
        const zi = polygon[i].z;
        const xj = polygon[j].x;
        const zj = polygon[j].z;
        
        const intersect = ((zi > z) !== (zj > z)) && 
                          (x < (xj - xi) * (z - zi) / (zj - zi) + xi);
        if (intersect) inside = !inside;
      }
      
      return inside;
    }
    
    // Function to check if a path intersects with a polygon
    function doesPathIntersectPolygon(start, end, polygon) {
      // Check for undefined/invalid inputs
      if (!start || !end || !polygon || !Array.isArray(polygon) || polygon.length < 3) {
        return false;
      }
      
      // First check if either start or end point is inside the polygon
      if (isPointInPolygon(start, polygon) || isPointInPolygon(end, polygon)) {
        return true;
      }
      
      // Check if any of the polygon edges intersect with the path
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const polyStart = polygon[j];
        const polyEnd = polygon[i];
        
        if (lineSegmentsIntersect(
          start.x, start.z, 
          end.x, end.z, 
          polyStart.x, polyStart.z, 
          polyEnd.x, polyEnd.z
        )) {
          return true;
        }
      }
      
      return false;
    }
    
    // More reliable line segment intersection
    function lineSegmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
      // Check for undefined inputs
      if (x1 === undefined || y1 === undefined || x2 === undefined || y2 === undefined ||
          x3 === undefined || y3 === undefined || x4 === undefined || y4 === undefined) {
        return false;
      }
      
      // Calculate the direction of the vectors
      const denominator = ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));
      
      // Lines are parallel or coincident
      if (denominator === 0) {
        return false;
      }
      
      const uA = ((x4-x3)*(y1-y3) - (y4-y3)*(x1-x3)) / denominator;
      const uB = ((x2-x1)*(y1-y3) - (y2-y1)*(x1-x3)) / denominator;
      
      // If uA and uB are between 0-1, lines are colliding
      if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
        return true;
      }
      return false;
    }
    
    // Function to find a path around an obstacle
    function findPathAroundObstacle(start, end, obstacle) {
      // Make sure obstacle is valid and has points
      if (!obstacle || !obstacle.points || !Array.isArray(obstacle.points)) {
        console.error("Invalid obstacle object:", obstacle);
        return [];
      }
      
      // Get the expanded bounding box of the obstacle
      const boundingBox = getExpandedBoundingBox(obstacle.points, OBSTACLE_BUFFER);
      
      // If using grid movement, generate cardinal direction waypoints
      if (USE_GRID_MOVEMENT) {
        return findGridBasedPath(start, end, boundingBox, obstacle.points);
      }
      
      // Original waypoint generation code from before
      const waypoints = [];
      
      // Generate waypoints around the expanded bounding box
      // Top, bottom, left, right corners with buffer
      waypoints.push(new THREE.Vector3(boundingBox.maxX, 0, boundingBox.maxZ)); // Top-right
      waypoints.push(new THREE.Vector3(boundingBox.maxX, 0, boundingBox.minZ)); // Bottom-right
      waypoints.push(new THREE.Vector3(boundingBox.minX, 0, boundingBox.maxZ)); // Top-left
      waypoints.push(new THREE.Vector3(boundingBox.minX, 0, boundingBox.minZ)); // Bottom-left
      
      // Add midpoints along the sides for better navigation options
      waypoints.push(new THREE.Vector3(boundingBox.minX, 0, (boundingBox.minZ + boundingBox.maxZ) / 2)); // Left middle
      waypoints.push(new THREE.Vector3(boundingBox.maxX, 0, (boundingBox.minZ + boundingBox.maxZ) / 2)); // Right middle
      waypoints.push(new THREE.Vector3((boundingBox.minX + boundingBox.maxX) / 2, 0, boundingBox.minZ)); // Bottom middle
      waypoints.push(new THREE.Vector3((boundingBox.minX + boundingBox.maxX) / 2, 0, boundingBox.maxZ)); // Top middle
      
      // Find a valid sequence of waypoints
      let bestPath = null;
      let shortestDistance = Infinity;
      
      // First check direct waypoints
      for (const waypoint of waypoints) {
        // Check if the waypoint is itself clear of the obstacle
        if (isPointInPolygon(waypoint, obstacle.points)) {
          continue; // Skip waypoints inside the obstacle
        }
        
        const toWaypointClear = !doesPathIntersectPolygon(start, waypoint, obstacle.points);
        const fromWaypointClear = !doesPathIntersectPolygon(waypoint, end, obstacle.points);
        
        if (toWaypointClear && fromWaypointClear) {
          const totalDistance = start.distanceTo(waypoint) + waypoint.distanceTo(end);
          if (totalDistance < shortestDistance) {
            shortestDistance = totalDistance;
            bestPath = [waypoint];
          }
        }
      }
      
      // If no direct path works, try using two waypoints
      if (!bestPath) {
        // Sort waypoints by distance to start + end
        const sortedWaypoints = [...waypoints].sort((a, b) => {
          const distA = start.distanceTo(a) + end.distanceTo(a);
          const distB = start.distanceTo(b) + end.distanceTo(b);
          return distA - distB;
        });
        
        // Try combinations of the closest waypoints first (limit to top 4 for performance)
        const topWaypoints = sortedWaypoints.slice(0, 4);
        
        for (let i = 0; i < topWaypoints.length; i++) {
          for (let j = 0; j < waypoints.length; j++) {
            if (i === j) continue;
            
            const wp1 = topWaypoints[i];
            const wp2 = waypoints[j];
            
            const toWp1Clear = !doesPathIntersectPolygon(start, wp1, obstacle.points);
            const wp1ToWp2Clear = !doesPathIntersectPolygon(wp1, wp2, obstacle.points);
            const wp2ToEndClear = !doesPathIntersectPolygon(wp2, end, obstacle.points);
            
            if (toWp1Clear && wp1ToWp2Clear && wp2ToEndClear) {
              const totalDistance = start.distanceTo(wp1) + wp1.distanceTo(wp2) + wp2.distanceTo(end);
              if (totalDistance < shortestDistance) {
                shortestDistance = totalDistance;
                bestPath = [wp1, wp2];
              }
            }
          }
        }
      }
      
      return bestPath;
    }
    
    // New function to find grid-based paths (horizontal/vertical only)
    function findGridBasedPath(start, end, boundingBox, polygon) {
      // Verify inputs
      if (!start || !end || !boundingBox || !polygon) {
        console.error("Invalid inputs to findGridBasedPath");
        return [];
      }
      
      // Ensure both start and end points are within floor boundaries
      const constrainedStart = constrainToFloor(start.clone());
      const constrainedEnd = constrainToFloor(end.clone());
      
      // Calculate Manhattan distance directly (sum of horizontal and vertical distances)
      const getManhattanDistance = (pointA, pointB) => {
        return Math.abs(pointA.x - pointB.x) + Math.abs(pointA.z - pointB.z);
      };
      
      // Determine which side of the obstacle is optimal based on Manhattan distance
      
      // Calculate the bounding box of the start and end points
      const startEndBoundingBox = {
        minX: Math.min(constrainedStart.x, constrainedEnd.x),
        maxX: Math.max(constrainedStart.x, constrainedEnd.x),
        minZ: Math.min(constrainedStart.z, constrainedEnd.z),
        maxZ: Math.max(constrainedStart.z, constrainedEnd.z)
      };
      
      // Check if the obstacle intersects with the bounding box of start and end
      const obstacleIntersectsPath = 
        boundingBox.minX <= startEndBoundingBox.maxX &&
        boundingBox.maxX >= startEndBoundingBox.minX &&
        boundingBox.minZ <= startEndBoundingBox.maxZ &&
        boundingBox.maxZ >= startEndBoundingBox.minZ;
      
      // If obstacle doesn't intersect the direct path area, try a direct Manhattan path
      if (!obstacleIntersectsPath) {
        // Try direct horizontal then vertical path
        const hFirst = [constrainToFloor(new THREE.Vector3(constrainedEnd.x, 0, constrainedStart.z))];
        // Check if this path is clear
        if (!doesPathIntersectPolygon(constrainedStart, hFirst[0], polygon) && 
            !doesPathIntersectPolygon(hFirst[0], constrainedEnd, polygon)) {
          return hFirst;
        }
        
        // Try direct vertical then horizontal path
        const vFirst = [constrainToFloor(new THREE.Vector3(constrainedStart.x, 0, constrainedEnd.z))];
        // Check if this path is clear
        if (!doesPathIntersectPolygon(constrainedStart, vFirst[0], polygon) && 
            !doesPathIntersectPolygon(vFirst[0], constrainedEnd, polygon)) {
          return vFirst;
        }
      }
      
      // We'll generate multiple potential paths and select the shortest valid one
      const candidatePaths = [];
      const extraBuffer = 0.2; // Extra space for safety
      
      // Top path (go around the top of the obstacle)
      const topY = boundingBox.minZ - extraBuffer;
      candidatePaths.push({
        path: [
          constrainToFloor(new THREE.Vector3(constrainedStart.x, 0, topY)),
          constrainToFloor(new THREE.Vector3(constrainedEnd.x, 0, topY))
        ],
        distance: getManhattanDistance(constrainedStart, new THREE.Vector3(constrainedStart.x, 0, topY)) +
                  getManhattanDistance(new THREE.Vector3(constrainedStart.x, 0, topY), new THREE.Vector3(constrainedEnd.x, 0, topY)) +
                  getManhattanDistance(new THREE.Vector3(constrainedEnd.x, 0, topY), constrainedEnd)
      });
      
      // Bottom path (go around the bottom of the obstacle)
      const bottomY = boundingBox.maxZ + extraBuffer;
      candidatePaths.push({
        path: [
          constrainToFloor(new THREE.Vector3(constrainedStart.x, 0, bottomY)),
          constrainToFloor(new THREE.Vector3(constrainedEnd.x, 0, bottomY))
        ],
        distance: getManhattanDistance(constrainedStart, new THREE.Vector3(constrainedStart.x, 0, bottomY)) +
                  getManhattanDistance(new THREE.Vector3(constrainedStart.x, 0, bottomY), new THREE.Vector3(constrainedEnd.x, 0, bottomY)) +
                  getManhattanDistance(new THREE.Vector3(constrainedEnd.x, 0, bottomY), constrainedEnd)
      });
      
      // Left path (go around the left of the obstacle)
      const leftX = boundingBox.minX - extraBuffer;
      candidatePaths.push({
        path: [
          constrainToFloor(new THREE.Vector3(leftX, 0, constrainedStart.z)),
          constrainToFloor(new THREE.Vector3(leftX, 0, constrainedEnd.z))
        ],
        distance: getManhattanDistance(constrainedStart, new THREE.Vector3(leftX, 0, constrainedStart.z)) +
                  getManhattanDistance(new THREE.Vector3(leftX, 0, constrainedStart.z), new THREE.Vector3(leftX, 0, constrainedEnd.z)) +
                  getManhattanDistance(new THREE.Vector3(leftX, 0, constrainedEnd.z), constrainedEnd)
      });
      
      // Right path (go around the right of the obstacle)
      const rightX = boundingBox.maxX + extraBuffer;
      candidatePaths.push({
        path: [
          constrainToFloor(new THREE.Vector3(rightX, 0, constrainedStart.z)),
          constrainToFloor(new THREE.Vector3(rightX, 0, constrainedEnd.z))
        ],
        distance: getManhattanDistance(constrainedStart, new THREE.Vector3(rightX, 0, constrainedStart.z)) +
                  getManhattanDistance(new THREE.Vector3(rightX, 0, constrainedStart.z), new THREE.Vector3(rightX, 0, constrainedEnd.z)) +
                  getManhattanDistance(new THREE.Vector3(rightX, 0, constrainedEnd.z), constrainedEnd)
      });
      
      // Add corner routes with horizontal-first or vertical-first preference
      // Top-left corner
      const topLeft = constrainToFloor(new THREE.Vector3(boundingBox.minX - extraBuffer, 0, boundingBox.minZ - extraBuffer));
      
      // Horizontal first to top-left
      candidatePaths.push({
        path: [
          constrainToFloor(new THREE.Vector3(topLeft.x, 0, constrainedStart.z)),
          topLeft,
          constrainToFloor(new THREE.Vector3(constrainedEnd.x, 0, topLeft.z))
        ],
        distance: getManhattanDistance(constrainedStart, new THREE.Vector3(topLeft.x, 0, constrainedStart.z)) +
                 getManhattanDistance(new THREE.Vector3(topLeft.x, 0, constrainedStart.z), topLeft) +
                 getManhattanDistance(topLeft, new THREE.Vector3(constrainedEnd.x, 0, topLeft.z)) +
                 getManhattanDistance(new THREE.Vector3(constrainedEnd.x, 0, topLeft.z), constrainedEnd)
      });
      
      // Add additional corner paths and their variants (omitted for brevity, same pattern as above)
      // ... existing corner paths ...
      
      // Add floor boundary-following paths
      // These paths follow the edges of the floor when the direct path would go through space
      
      // First, check if the path would cross a floor boundary
      const wouldCrossFloorBoundary = 
        (constrainedStart.x === floorBoundaries.minX && constrainedEnd.x === floorBoundaries.minX) ||
        (constrainedStart.x === floorBoundaries.maxX && constrainedEnd.x === floorBoundaries.maxX) ||
        (constrainedStart.z === floorBoundaries.minZ && constrainedEnd.z === floorBoundaries.minZ) ||
        (constrainedStart.z === floorBoundaries.maxZ && constrainedEnd.z === floorBoundaries.maxZ);
      
      if (wouldCrossFloorBoundary || 
          constrainedStart.x === floorBoundaries.minX || constrainedStart.x === floorBoundaries.maxX ||
          constrainedStart.z === floorBoundaries.minZ || constrainedStart.z === floorBoundaries.maxZ ||
          constrainedEnd.x === floorBoundaries.minX || constrainedEnd.x === floorBoundaries.maxX ||
          constrainedEnd.z === floorBoundaries.minZ || constrainedEnd.z === floorBoundaries.maxZ) {
        
        // Add paths that follow the floor boundaries
        
        // Bottom-left corner of the floor
        const floorBL = new THREE.Vector3(floorBoundaries.minX + 0.3, 0, floorBoundaries.maxZ - 0.3);
        candidatePaths.push({
          path: [floorBL],
          distance: getManhattanDistance(constrainedStart, floorBL) + getManhattanDistance(floorBL, constrainedEnd)
        });
        
        // Bottom-right corner of the floor
        const floorBR = new THREE.Vector3(floorBoundaries.maxX - 0.3, 0, floorBoundaries.maxZ - 0.3);
        candidatePaths.push({
          path: [floorBR],
          distance: getManhattanDistance(constrainedStart, floorBR) + getManhattanDistance(floorBR, constrainedEnd)
        });
        
        // Top-left corner of the floor
        const floorTL = new THREE.Vector3(floorBoundaries.minX + 0.3, 0, floorBoundaries.minZ + 0.3);
        candidatePaths.push({
          path: [floorTL],
          distance: getManhattanDistance(constrainedStart, floorTL) + getManhattanDistance(floorTL, constrainedEnd)
        });
        
        // Top-right corner of the floor
        const floorTR = new THREE.Vector3(floorBoundaries.maxX - 0.3, 0, floorBoundaries.minZ + 0.3);
        candidatePaths.push({
          path: [floorTR],
          distance: getManhattanDistance(constrainedStart, floorTR) + getManhattanDistance(floorTR, constrainedEnd)
        });
        
        // Two-point paths via floor corners
        candidatePaths.push({
          path: [floorBL, floorTL],
          distance: getManhattanDistance(constrainedStart, floorBL) + getManhattanDistance(floorBL, floorTL) + getManhattanDistance(floorTL, constrainedEnd)
        });
        
        candidatePaths.push({
          path: [floorBL, floorBR],
          distance: getManhattanDistance(constrainedStart, floorBL) + getManhattanDistance(floorBL, floorBR) + getManhattanDistance(floorBR, constrainedEnd)
        });
        
        candidatePaths.push({
          path: [floorBR, floorTR],
          distance: getManhattanDistance(constrainedStart, floorBR) + getManhattanDistance(floorBR, floorTR) + getManhattanDistance(floorTR, constrainedEnd)
        });
        
        candidatePaths.push({
          path: [floorTL, floorTR],
          distance: getManhattanDistance(constrainedStart, floorTL) + getManhattanDistance(floorTL, floorTR) + getManhattanDistance(floorTR, constrainedEnd)
        });
      }
      
      // Sort the paths by Manhattan distance (not Euclidean)
      candidatePaths.sort((a, b) => a.distance - b.distance);
      
      // Function to check if a path crosses outside the floor boundaries
      const doesPathCrossOutsideFloor = (pathPoints) => {
        let lastPoint = constrainedStart;
        for (const point of pathPoints) {
          // Check if the direct line between lastPoint and point crosses outside the floor
          // We do this by checking if any point along the line would be constrained
          const steps = 10; // Check multiple points along the path
          for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const checkPoint = new THREE.Vector3(
              lastPoint.x + (point.x - lastPoint.x) * t,
              0,
              lastPoint.z + (point.z - lastPoint.z) * t
            );
            
            const constrained = constrainToFloor(checkPoint.clone());
            if (Math.abs(constrained.x - checkPoint.x) > 0.001 || 
                Math.abs(constrained.z - checkPoint.z) > 0.001) {
              return true; // Path would go outside floor
            }
          }
          lastPoint = point;
        }
        
        // Check final segment to end
        const steps = 10;
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const checkPoint = new THREE.Vector3(
            lastPoint.x + (constrainedEnd.x - lastPoint.x) * t,
            0,
            lastPoint.z + (constrainedEnd.z - lastPoint.z) * t
          );
          
          const constrained = constrainToFloor(checkPoint.clone());
          if (Math.abs(constrained.x - checkPoint.x) > 0.001 || 
              Math.abs(constrained.z - checkPoint.z) > 0.001) {
            return true; // Path would go outside floor
          }
        }
        
        return false;
      };
      
      // Check each path, starting with the shortest, until we find a valid one
      for (const candidate of candidatePaths) {
        // First check if the path stays entirely within floor boundaries
        if (doesPathCrossOutsideFloor(candidate.path)) {
          continue; // Skip paths that go outside the floor
        }
        
        let isPathValid = true;
        let lastPoint = constrainedStart;
        
        // Check each segment of the path
        for (const point of candidate.path) {
          if (doesPathIntersectPolygon(lastPoint, point, polygon)) {
            isPathValid = false;
            break;
          }
          lastPoint = point;
        }
        
        // Check the final segment to the end point
        if (isPathValid && !doesPathIntersectPolygon(lastPoint, constrainedEnd, polygon)) {
          console.log("Selected path with Manhattan distance:", candidate.distance);
          return candidate.path;
        }
      }
      
      // If we couldn't find a valid path, create a safe default path with additional waypoints
      console.log("No valid direct path found, generating floor-following path");
      
      // Create a path that follows the floor edges
      // Start by determining which quadrant of the floor the start and end points are in
      const startQuadrant = {
        x: constrainedStart.x < (floorBoundaries.minX + floorBoundaries.maxX) / 2 ? 'left' : 'right',
        z: constrainedStart.z < (floorBoundaries.minZ + floorBoundaries.maxZ) / 2 ? 'top' : 'bottom'
      };
      
      const endQuadrant = {
        x: constrainedEnd.x < (floorBoundaries.minX + floorBoundaries.maxX) / 2 ? 'left' : 'right',
        z: constrainedEnd.z < (floorBoundaries.minZ + floorBoundaries.maxZ) / 2 ? 'top' : 'bottom'
      };
      
      // Generate waypoints depending on the quadrants
      const safeWaypoints = [];
      
      // If start and end are in different quadrants, create intermediate points
      if (startQuadrant.x !== endQuadrant.x || startQuadrant.z !== endQuadrant.z) {
        // Create a path that goes around the edges of the floor
        const padding = 0.5; // Distance from the edge
        
        // Select intermediate corner based on quadrants
        if (startQuadrant.x === 'left' && startQuadrant.z === 'top') {
          // Top-left corner
          safeWaypoints.push(new THREE.Vector3(floorBoundaries.minX + padding, 0, floorBoundaries.minZ + padding));
        } else if (startQuadrant.x === 'right' && startQuadrant.z === 'top') {
          // Top-right corner
          safeWaypoints.push(new THREE.Vector3(floorBoundaries.maxX - padding, 0, floorBoundaries.minZ + padding));
        } else if (startQuadrant.x === 'left' && startQuadrant.z === 'bottom') {
          // Bottom-left corner
          safeWaypoints.push(new THREE.Vector3(floorBoundaries.minX + padding, 0, floorBoundaries.maxZ - padding));
        } else {
          // Bottom-right corner
          safeWaypoints.push(new THREE.Vector3(floorBoundaries.maxX - padding, 0, floorBoundaries.maxZ - padding));
        }
        
        // If diagonal movement across quadrants, add another waypoint
        if (startQuadrant.x !== endQuadrant.x && startQuadrant.z !== endQuadrant.z) {
          if (endQuadrant.x === 'left' && endQuadrant.z === 'top') {
            // Top-left corner
            safeWaypoints.push(new THREE.Vector3(floorBoundaries.minX + padding, 0, floorBoundaries.minZ + padding));
          } else if (endQuadrant.x === 'right' && endQuadrant.z === 'top') {
            // Top-right corner
            safeWaypoints.push(new THREE.Vector3(floorBoundaries.maxX - padding, 0, floorBoundaries.minZ + padding));
          } else if (endQuadrant.x === 'left' && endQuadrant.z === 'bottom') {
            // Bottom-left corner
            safeWaypoints.push(new THREE.Vector3(floorBoundaries.minX + padding, 0, floorBoundaries.maxZ - padding));
          } else {
            // Bottom-right corner
            safeWaypoints.push(new THREE.Vector3(floorBoundaries.maxX - padding, 0, floorBoundaries.maxZ - padding));
          }
        }
      }
      
      return safeWaypoints;
    }
    
    // Helper to get the expanded bounding box of a polygon with buffer
    function getExpandedBoundingBox(polygon, buffer) {
      if (!polygon || !Array.isArray(polygon) || polygon.length === 0) {
        console.error("Invalid polygon in getExpandedBoundingBox:", polygon);
        return { minX: -5, minZ: -5, maxX: 5, maxZ: 5 }; // Default fallback
      }
      
      let minX = Infinity, minZ = Infinity;
      let maxX = -Infinity, maxZ = -Infinity;
      
      // Find min/max coordinates
      for (const point of polygon) {
        if (!point || typeof point.x !== 'number' || typeof point.z !== 'number') {
          continue; // Skip invalid points
        }
        minX = Math.min(minX, point.x);
        minZ = Math.min(minZ, point.z);
        maxX = Math.max(maxX, point.x);
        maxZ = Math.max(maxZ, point.z);
      }
      
      // If we didn't find valid coordinates, return a default
      if (minX === Infinity || minZ === Infinity || maxX === -Infinity || maxZ === -Infinity) {
        console.error("Failed to calculate bounding box, using default");
        return { minX: -5, minZ: -5, maxX: 5, maxZ: 5 };
      }
      
      // Expand by buffer
      return {
        minX: minX - buffer,
        minZ: minZ - buffer,
        maxX: maxX + buffer,
        maxZ: maxZ + buffer
      };
    }
    
    // Find the farthest corner from both start and end points
    function findFarthestCorner(polygon, start, end) {
      let farthestDist = -Infinity;
      let farthestPoint = null;
      
      for (const point of polygon) {
        const totalDist = start.distanceTo(point) + end.distanceTo(point);
        if (totalDist > farthestDist) {
          farthestDist = totalDist;
          farthestPoint = point;
        }
      }
      
      return farthestPoint;
    }
    
    // Helper function to get the center of a polygon
    function getCenterOfPolygon(polygon) {
      const center = new THREE.Vector3();
      for (const point of polygon) {
        center.add(point);
      }
      center.divideScalar(polygon.length);
      return center;
    }

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
        let clickPosition = intersects[0].point.clone();
        
        // Constrain the click position to the floor boundaries
        clickPosition = constrainToFloor(clickPosition);
        
        // Check if the click is inside any obstacle and adjust if needed
        let isInsideObstacle = false;
        let closestObstacle = null;
        
        for (const obstacle of furnitureObstacles) {
          if (!obstacle || !obstacle.points) continue;
          
          // Get the expanded bounding box for visual purposes
          const boundingBox = getExpandedBoundingBox(obstacle.points, 0); // No extra buffer
          
          // Check if the click is inside this bounding box
          if (clickPosition.x >= boundingBox.minX && clickPosition.x <= boundingBox.maxX &&
              clickPosition.z >= boundingBox.minZ && clickPosition.z <= boundingBox.maxZ) {
            console.log("Click detected inside obstacle bounding box");
            isInsideObstacle = true;
            closestObstacle = obstacle;
            break;
          }
        }
        
        // If the click is inside an obstacle, redirect to nearest edge
        if (isInsideObstacle && closestObstacle) {
          console.log("Moving target position to nearest edge of obstacle");
          
          // Get the obstacle bounding box
          const boundingBox = getExpandedBoundingBox(closestObstacle.points, 0.3); // With small buffer
          
          // Get the position of the agent
          const agentPos = aiAgent.position;
          
          // Calculate the nearest edge point based on agent position
          const nearestEdgePoint = findNearestEdgePoint(clickPosition, boundingBox, agentPos);
          
          // Use this edge point as the new target (and ensure it's on the floor)
          clickPosition.copy(constrainToFloor(nearestEdgePoint));
          
          // Visualize the adjusted point if in debug mode
          if (DEBUG_MODE) {
            visualizePoint(clickPosition, 0xff0000); // Red marker for adjusted point
          }
        }
        
        // Store this as our ultimate destination
        finalDestination = clickPosition.clone();
        
        // Reset waypoint queue
        waypointQueue = [];
        
        // Check if the direct path intersects with any furniture obstacle
        let pathBlocked = false;
        let immediateTarget = clickPosition.clone();
        let currentPosition = aiAgent.position.clone();
        
        try {
          // Check each obstacle
          for (const obstacle of furnitureObstacles) {
            if (!obstacle || !obstacle.points) {
              console.warn("Invalid obstacle found:", obstacle);
              continue;
            }
            
            if (doesPathIntersectPolygon(currentPosition, immediateTarget, obstacle.points)) {
              console.log("Path intersects with obstacle, finding path around");
              pathBlocked = true;
              
              // Find waypoints to route around the obstacle - pass the entire obstacle object
              const waypoints = findPathAroundObstacle(currentPosition, immediateTarget, obstacle);
              
              if (waypoints && waypoints.length > 0) {
                console.log("Found waypoints around obstacle:", waypoints);
                
                // If it's a multi-waypoint path
                if (waypoints.length > 1) {
                  // Add all waypoints except the first one to the queue
                  for (let i = 1; i < waypoints.length; i++) {
                    // Ensure each waypoint is within floor boundaries
                    waypointQueue.push(constrainToFloor(waypoints[i]));
                  }
                  // The first waypoint becomes our immediate target
                  immediateTarget = constrainToFloor(waypoints[0]);
                } else {
                  // Single waypoint, just use it
                  immediateTarget = constrainToFloor(waypoints[0]);
                }
              }
            }
          }
          
          // Ensure we're not setting a target inside an obstacle
          for (const obstacle of furnitureObstacles) {
            if (obstacle && obstacle.points && isPointInPolygon(immediateTarget, obstacle.points)) {
              console.warn("Target point is inside obstacle, finding safer point");
              immediateTarget = constrainToFloor(findSafestPoint(currentPosition, clickPosition));
              break;
            }
          }
          
          // Double-check the path is clear from our current position to immediateTarget
          // If not, try a more aggressive avoidance strategy
          if (doesAnyObstacleBlockPath(currentPosition, immediateTarget)) {
            // Try picking a point that's far away from all obstacles
            console.log("Path still blocked, finding safest point");
            immediateTarget = constrainToFloor(findSafestPoint(currentPosition, clickPosition));
          }
          
          // Visualize path for debugging
          if (DEBUG_MODE) {
            visualizePath(currentPosition, immediateTarget, waypointQueue, pathBlocked);
          }
          
          // Copy the final calculated target position
          agentTargetPosition.copy(immediateTarget);

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
        } catch (error) {
          console.error("Error in pathfinding:", error);
          // Fallback to direct movement if pathfinding fails
          agentTargetPosition.copy(constrainToFloor(clickPosition));
          isAgentWalking = true;
          playAnimation('walk');
        }
      } else {
        console.log("No intersection with floor detected");
      }
    }
    
    // Function to find the nearest edge point of a bounding box
    function findNearestEdgePoint(point, boundingBox, referencePoint) {
      // Determine which edge of the bounding box is closest to the reference point
      
      // Calculate distances to each edge
      const distToLeft = Math.abs(boundingBox.minX - referencePoint.x);
      const distToRight = Math.abs(boundingBox.maxX - referencePoint.x);
      const distToTop = Math.abs(boundingBox.minZ - referencePoint.z);
      const distToBottom = Math.abs(boundingBox.maxZ - referencePoint.z);
      
      // Find the minimum distance
      const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
      
      // Create the edge point based on which edge is closest
      const edgePoint = new THREE.Vector3();
      
      if (minDist === distToLeft) {
        // Left edge is closest
        edgePoint.set(boundingBox.minX, 0, point.z);
      } else if (minDist === distToRight) {
        // Right edge is closest
        edgePoint.set(boundingBox.maxX, 0, point.z);
      } else if (minDist === distToTop) {
        // Top edge is closest
        edgePoint.set(point.x, 0, boundingBox.minZ);
      } else {
        // Bottom edge is closest
        edgePoint.set(point.x, 0, boundingBox.maxZ);
      }
      
      // Clamp the edge point to be within the bounds of the edge
      edgePoint.x = Math.max(boundingBox.minX, Math.min(boundingBox.maxX, edgePoint.x));
      edgePoint.z = Math.max(boundingBox.minZ, Math.min(boundingBox.maxZ, edgePoint.z));
      
      return edgePoint;
    }
    
    // Function to visualize a point for debugging
    function visualizePoint(point, color = 0xffff00) {
      // Remove any existing point visualization with the same color
      scene.children.forEach(child => {
        if (child.userData && child.userData.isPointVisualization && child.userData.color === color) {
          scene.remove(child);
        }
      });
      
      // Create a sphere to mark the point
      const geometry = new THREE.SphereGeometry(0.1);
      const material = new THREE.MeshBasicMaterial({ color: color });
      const sphere = new THREE.Mesh(geometry, material);
      
      sphere.position.copy(point);
      sphere.userData = { isPointVisualization: true, color: color };
      
      scene.add(sphere);
    }

    // Find a safe point away from all obstacles
    function findSafestPoint(start, end) {
      if (USE_GRID_MOVEMENT) {
        // In grid movement mode, prefer cardinal directions
        const directions = [
          new THREE.Vector3(1, 0, 0),  // Right
          new THREE.Vector3(-1, 0, 0), // Left
          new THREE.Vector3(0, 0, 1),  // Down
          new THREE.Vector3(0, 0, -1)  // Up
        ];
        
        // Try each cardinal direction
        for (let distance = OBSTACLE_BUFFER; distance <= OBSTACLE_BUFFER * 3; distance += OBSTACLE_BUFFER) {
          for (const dir of directions) {
            const safePoint = new THREE.Vector3()
              .copy(start)
              .add(dir.clone().multiplyScalar(distance));
              
            if (!doesAnyObstacleBlockPath(start, safePoint)) {
              return safePoint;
            }
          }
        }
      }
      
      // Fall back to the original approach if grid movement fails
      // Start with a point perpendicular to the direct path
      const directVector = new THREE.Vector3().subVectors(end, start).normalize();
      
      // Perpendicular vector
      const perpVector = new THREE.Vector3(-directVector.z, 0, directVector.x);
      
      // Try points at increasing distances in both perpendicular directions
      for (let distance = OBSTACLE_BUFFER; distance <= OBSTACLE_BUFFER * 3; distance += OBSTACLE_BUFFER) {
        // Try left side
        const leftPoint = new THREE.Vector3()
          .copy(start)
          .add(perpVector.clone().multiplyScalar(distance));
          
        if (!doesAnyObstacleBlockPath(start, leftPoint)) {
          return leftPoint;
        }
        
        // Try right side
        const rightPoint = new THREE.Vector3()
          .copy(start)
          .add(perpVector.clone().multiplyScalar(-distance));
          
        if (!doesAnyObstacleBlockPath(start, rightPoint)) {
          return rightPoint;
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
        }
        
        if (clickableObject) {
          console.log('Clicked on:', clickableObject.userData.type);
          
          // Handle different clickable objects
          if (clickableObject.userData.type === 'airConditioner') {
            setShowShortcutPopup(true);
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
        console.log("Metamask button clicked");
        // This will now spawn the Metamask wolf
        spawnMetamaskWolf(scene);
      },
      'gmail-button': () => {
        console.log("Gmail button clicked");
      },
      'oneinch-button': () => {
        console.log("1inch button clicked");
        // Add 1inch functionality to spawn the unicorn
        spawn1inchUnicorn(scene);
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
      <style jsx global>{`
        html, body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
            Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
        }
        * { box-sizing: border-box; }
      `}</style>
      <div style={{ width: "100%", height: "100vh" }} ref={mountRef}></div>
      
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
    </>
  );
}
