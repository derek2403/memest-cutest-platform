import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

// Function to load all furniture into the scene
export function loadFurniture(scene, roomWidth, roomHeight, roomDepth) {
  // Track loaded models for batch processing
  const loadedModels = [];

  // Use simpler materials for better performance
  const simpleMaterial = new THREE.MeshBasicMaterial({
    color: 0xdddddd,
    flatShading: true,
  });

  // Create a draco loader instance for compressed models
  const loadManager = new THREE.LoadingManager();

  // Performance-optimized model loading function
  const optimizeModel = (model) => {
    model.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = false;
        node.receiveShadow = false;

        // Use simplified materials for better performance
        // Uncomment the next line for extreme performance (but lower quality)
        // node.material = simpleMaterial;

        // Optimize geometry if possible
        if (node.geometry) {
          node.geometry.setDrawRange(
            0,
            node.geometry.attributes.position.count
          );
        }
      }
    });
    return model;
  };

  // Load the couch model
  const couchLoader = new GLTFLoader();
  couchLoader.load(
    "/gltf/couch_pillows.gltf",
    (gltf) => {
      const model = gltf.scene;
      
      // Disable shadows for the model
      model.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = false;
          node.receiveShadow = false;
        }
      });
      
      // Position the couch in the room - adjusted for 6x6 room
      model.position.set(-2.7, 0, 1.5); // Centered more in the room
      
      // You can rotate the couch if needed
      model.rotation.y = Math.PI / 2; // Rotate 90 degrees
      
      scene.add(model);
      console.log("Couch model loaded successfully");

      // Load the low table model
      const lowTableLoader = new GLTFLoader();
      lowTableLoader.load(
        "/gltf/table_low.gltf",
        (gltf) => {
          const lowTable = gltf.scene;
          
          // Disable shadows for the model
          lowTable.traverse((node) => {
            if (node.isMesh) {
              node.castShadow = false;
              node.receiveShadow = false;
            }
          });
          
          // Position the low table in front of the couch - adjusted for 6x6 room
          lowTable.position.set(-0.5, 0.05, 1.5); // Centered in front of couch, lowered slightly
          
          // Rotate the table
          lowTable.rotation.y = Math.PI / 2; // 45 degrees rotation
          
          scene.add(lowTable);
          console.log("Low table loaded successfully");
          
          // Load the book set to place on the table
          const bookSetLoader = new GLTFLoader();
          bookSetLoader.load(
            "/gltf/book_set.gltf",
            (gltf) => {
              const bookSet = gltf.scene;
              
              // Disable shadows for the model
              bookSet.traverse((node) => {
                if (node.isMesh) {
                  node.castShadow = false;
                  node.receiveShadow = false;
                  
                  // Make the book mesh clickable
                  node.userData.clickable = true;
                  node.userData.type = 'books';
                }
              });
              
              // Position the book set on the low table - adjusted for 6x6 room
              bookSet.position.set(-0.5, 0.78, 2.3); // Adjusted position on table, lowered Y position from 0.9 to 0.5
              
              // Increase the rotation of the books for more visual interest
              bookSet.rotation.y = Math.PI / 3; // 60 degrees rotation
              
              // Scale down the book set to make it smaller
              bookSet.scale.set(0.7, 0.7, 0.7); // 70% of original size
              
              // Make the entire book set clickable
              bookSet.userData.clickable = true;
              bookSet.userData.type = 'books';
              
              scene.add(bookSet);
              console.log("Book set loaded successfully");
            },
            (progress) => {
              console.log(
                "Loading book set progress:",
                (progress.loaded / progress.total) * 100,
                "%"
              );
            },
            (error) => {
              console.error("Error loading book set model:", error);
            }
          );
        },
        (progress) => {
          console.log(
            "Loading low table progress:",
            (progress.loaded / progress.total) * 100,
            "%"
          );
        },
        (error) => {
          console.error("Error loading low table model:", error);
        }
      );
    },
    (progress) => {
      console.log(
        "Loading couch progress:",
        (progress.loaded / progress.total) * 100,
        "%"
      );
    },
    (error) => {
      console.error("Error loading couch model:", error);
    }
  );


  // Load the rug model
  const rugLoader = new GLTFLoader();
  rugLoader.load(
    "/gltf/rug_rectangle_stripes_B.gltf",
    (gltf) => {
      const rug = gltf.scene;
      
      // Disable shadows for the model
      rug.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = false;
          node.receiveShadow = false;
        }
      });
      
      // Position the rug - adjusted for 6x6 room
      rug.position.set(-0.5, -0.05, 1.5); // Centered in the living area, lowered slightly
      
      // Rotate the rug
      rug.rotation.y = 1.6;
      
      scene.add(rug);
      console.log("Rug loaded successfully");
    },
    (progress) => {
      console.log(
        "Loading rug progress:",
        (progress.loaded / progress.total) * 100,
        "%"
      );
    },
    (error) => {
      console.error("Error loading rug:", error);
    }
  );

  // Load the single bed model
  const bedLoader = new GLTFLoader();
  bedLoader.load(
    "/gltf/bed_single_A.gltf",
    (gltf) => {
      const bed = gltf.scene;
      
      // Disable shadows for the model
      bed.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = false;
          node.receiveShadow = false;
        }
      });
      
      // Position the bed in the room - adjusted for 6x6 room
      bed.position.set(-2, 0, -2.2); // Moved toward the back wall
      
      // Rotate the bed
      bed.rotation.y = Math.PI / 2;
      
      scene.add(bed);
      console.log("Double bed loaded successfully");

    },
    (progress) => {
      console.log(
        "Loading bed progress:",
        (progress.loaded / progress.total) * 100,
        "%"
      );
    },
    (error) => {
      console.error("Error loading bed model:", error);
    }
  );

  // Load the small cabinet model
  const cabinetLoader = new GLTFLoader();
  cabinetLoader.load(
    "/gltf/cabinet_small.gltf",
    (gltf) => {
      const cabinet = gltf.scene;
      
      // Disable shadows for the model
      cabinet.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = false;
          node.receiveShadow = false;
        }
      });
      
      // Position the bed cabinet next to the bed - adjusted for 6x6 room
      cabinet.position.set(-3, 0, -0.8); // Moved closer to the bed
      
      // Rotate the cabinet
      cabinet.rotation.y = Math.PI / 2;
      
      scene.add(cabinet);
      console.log("Small cabinet loaded successfully");
      
      // Load a picture frame to place on top of the cabinet
      const cabinetPictureLoader = new GLTFLoader();
      cabinetPictureLoader.load(
        "/gltf/lamp_table.gltf",
        (gltf) => {
          const cabinetPicture = gltf.scene;
          
          // Disable shadows for the model
          cabinetPicture.traverse((node) => {
            if (node.isMesh) {
              node.castShadow = false;
              node.receiveShadow = false;
            }
          });
          
          // Position the picture frame on top of the cabinet - adjusted for 6x6 room
          cabinetPicture.position.set(-3, 1, -0.8); // Adjusted to match new cabinet position
          
          // Rotate the picture frame to match the cabinet's orientation
          cabinetPicture.rotation.y = Math.PI / 2;
          
          // Scale down the picture frame if needed
          cabinetPicture.scale.set(0.6, 0.6, 0.6);
          
          scene.add(cabinetPicture);
          console.log("Cabinet picture frame loaded successfully");
        },
        (progress) => {
          console.log(
            "Loading cabinet picture frame progress:",
            (progress.loaded / progress.total) * 100,
            "%"
          );
        },
        (error) => {
          console.error("Error loading cabinet picture frame:", error);
        }
      );
    },
    (progress) => {
      console.log(
        "Loading cabinet progress:",
        (progress.loaded / progress.total) * 100,
        "%"
      );
    },
    (error) => {
      console.error("Error loading cabinet model:", error);
    }
  );

  // Load the medium table model for the right wall
  const mediumTableLoader = new GLTFLoader();
  mediumTableLoader.load(
    '/gltf/table_medium.gltf',
    (gltf) => {
      const mediumTable = gltf.scene;
      
      // Enable shadows for the model
      mediumTable.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      
      // Position the medium table against the right wall - adjusted for 6x6 room
      mediumTable.position.set(2, 0, -2.5); // Moved to fit in the 6x6 room
      
      // Rotate the table to face into the room
      mediumTable.rotation.y = -Math.PI / 2; // Rotate to face left (into the room)
      
      scene.add(mediumTable);
      console.log('Medium table loaded successfully');
      
    },
    (progress) => {
      console.log('Loading medium table progress:', (progress.loaded / progress.total) * 100, '%');
    },
    (error) => {
      console.error('Error loading medium table:', error);
    }
  );

  // After loading the medium table and laptop, add a wooden stool chair in front of it
  const stoolChairLoader = new GLTFLoader();
  stoolChairLoader.load(
    '/gltf/chair_B.gltf',
    (gltf) => {
      const stoolChair = gltf.scene;
      
      // Enable shadows for the model
      stoolChair.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      
      // Position the stool chair in front of the medium table - adjusted for 6x6 room
      stoolChair.position.set(2, 0, -1); // Moved to fit in the 6x6 room
      
      // Rotate the chair to face the table
      stoolChair.rotation.y = Math.PI / 1; // Rotate to face right (toward the table)
      
      // Scale the chair if needed
      stoolChair.scale.set(1, 1, 1); // Adjust if necessary
      
      scene.add(stoolChair);
      console.log('Wooden stool chair loaded successfully');
    },
    (progress) => {
      console.log('Loading wooden stool chair progress:', (progress.loaded / progress.total) * 100, '%');
    },
    (error) => {
      console.error('Error loading wooden stool chair:', error);
    }
  );

  // Load the drawers model
  const drawersLoader = new FBXLoader();
  drawersLoader.load(
    '/fbx/drawers/drawerb.fbx',
    (fbx) => {
      // Disable shadows for the model and add material
      fbx.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = false;
          node.receiveShadow = false;
          
          // Add a material to the drawers
          node.material = new THREE.MeshStandardMaterial({
            color: 0xd2c8b5, // Light wood/beige color
            roughness: 0.7,
            metalness: 0.1, // Mostly non-metallic
          });
          
          // Make each mesh in the drawers clickable
          node.userData.clickable = true;
          node.userData.type = 'airConditioner'; // Use the same type that shortcut.js is looking for
        }
      });
      
      // Position the drawers beside the laptop on the medium table
      fbx.position.set(2.6, 1.4, -3.1); // On the table next to the laptop
      
      // Rotate the drawers to face the same direction as the laptop
      fbx.rotation.y = -Math.PI / 40; // Facing the same direction as the laptop
      
      // Make the drawers much smaller to fit on the table
      fbx.scale.set(0.002, 0.002, 0.002); // Significantly smaller scale
      
      // Make the entire model clickable with the same type that shortcut.js is looking for
      fbx.userData.clickable = true;
      fbx.userData.type = 'airConditioner'; // Use the same type that shortcut.js is looking for
      
      // Add name property for easier identification in raycaster
      fbx.name = 'airConditioner'; // Use the same name that shortcut.js might be looking for

      scene.add(fbx);
      console.log("Drawers loaded successfully");
    },
    (progress) => {
      console.log(
        "Loading drawers progress:",
        (progress.loaded / progress.total) * 100,
        "%"
      );
    },
    (error) => {
      console.error("Error loading drawers model:", error);
    }
  );
} 