import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

// Function to load all furniture into the scene
export function loadFurniture(scene, roomWidth, roomHeight, roomDepth) {
  // Load the couch model
  const couchLoader = new GLTFLoader();
  couchLoader.load(
    '/gltf/couch_pillows.gltf',
    (gltf) => {
      const model = gltf.scene;
      
      // Enable shadows for the model
      model.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      
      // Position the couch in the room - adjusted for larger room
      //back, 
      model.position.set(-4.5, 0, 1.5); // Moved further to the left and forward
      
      // You can rotate the couch if needed
      model.rotation.y = Math.PI / 2; // Rotate 90 degrees - adjust as needed
      
      scene.add(model);
      console.log('Couch model loaded successfully');

      // Load the low table model
      const lowTableLoader = new GLTFLoader();
      lowTableLoader.load(
        '/gltf/table_low.gltf',
        (gltf) => {
          const lowTable = gltf.scene;
          
          // Enable shadows for the model
          lowTable.traverse((node) => {
            if (node.isMesh) {
              node.castShadow = true;
              node.receiveShadow = true;
            }
          });
          
          // Position the low table in front of the couch - adjusted for larger room
          lowTable.position.set(-1.5, 0,1.5); // Moved to be in front of the repositioned couch
          
          // Rotate the table
          lowTable.rotation.y = Math.PI / 2; // 45 degrees rotation
          
          scene.add(lowTable);
          console.log('Low table loaded successfully');
          
          // Now load the cactus to place on the table
          const cactusLoader = new GLTFLoader();
          cactusLoader.load(
            '/gltf/cactus_small_A.gltf',
            (gltf) => {
              const cactus = gltf.scene;
              
              // Enable shadows for the model
              cactus.traverse((node) => {
                if (node.isMesh) {
                  node.castShadow = true;
                  node.receiveShadow = true;
                }
              });
              
              // Position the cactus on the low table - adjusted for larger room
              cactus.position.set(-1, 0.6, 2); // Adjusted to match new table position
              
              scene.add(cactus);
              console.log('Small cactus loaded successfully');
            },
            (progress) => {
              console.log('Loading cactus progress:', (progress.loaded / progress.total) * 100, '%');
            },
            (error) => {
              console.error('Error loading cactus model:', error);
            }
          );
          
          // Load the book set to place on the table
          const bookSetLoader = new GLTFLoader();
          bookSetLoader.load(
            '/gltf/book_set.gltf',
            (gltf) => {
              const bookSet = gltf.scene;
              
              // Enable shadows for the model
              bookSet.traverse((node) => {
                if (node.isMesh) {
                  node.castShadow = true;
                  node.receiveShadow = true;
                }
              });
              
              // Position the book set on the low table - adjusted for larger room
              bookSet.position.set(-0.7, 0.9, 1.5); // Adjusted to match new table position
              
              // Increase the rotation of the books for more visual interest
              bookSet.rotation.y = Math.PI / 3; // 60 degrees rotation
              
              // Scale down the book set to make it smaller
              bookSet.scale.set(0.7, 0.7, 0.7); // 70% of original size
              
              scene.add(bookSet);
              console.log('Book set loaded successfully');
            },
            (progress) => {
              console.log('Loading book set progress:', (progress.loaded / progress.total) * 100, '%');
            },
            (error) => {
              console.error('Error loading book set model:', error);
            }
          );
        },
        (progress) => {
          console.log('Loading low table progress:', (progress.loaded / progress.total) * 100, '%');
        },
        (error) => {
          console.error('Error loading low table model:', error);
        }
      );
    },
    (progress) => {
      console.log('Loading couch progress:', (progress.loaded / progress.total) * 100, '%');
    },
    (error) => {
      console.error('Error loading couch model:', error);
    }
  );


  // Load the shelf model
  const shelfLoader = new GLTFLoader();
  shelfLoader.load(
    '/gltf/cabinet_medium_decorated.gltf',
    (gltf) => {
      const shelf = gltf.scene;
      
      // Enable shadows for the model
      shelf.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      
      // Position the shelf on the left side of the couch - adjusted for larger room
      shelf.position.set(-4.5, 0, 4);
      
      // Rotate the shelf to face into the room
      shelf.rotation.y = Math.PI / 2;
      
      scene.add(shelf);
      console.log('Cabinet loaded successfully');
    },
    (progress) => {
      console.log('Loading cabinet progress:', (progress.loaded / progress.total) * 100, '%');
    },
    (error) => {
      console.error('Error loading cabinet:', error);
    }
  );

  // Load the rug model
  const rugLoader = new GLTFLoader();
  rugLoader.load(
    '/gltf/rug_rectangle_stripes_B.gltf',
    (gltf) => {
      const rug = gltf.scene;
      
      // Enable shadows for the model
      rug.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      
      // Position the rug - adjusted for larger room
      rug.position.set(-2, 0.1, 1.5);
      
      // Rotate the rug
      rug.rotation.y = 1.6;
      
      scene.add(rug);
      console.log('Rug loaded successfully');
    },
    (progress) => {
      console.log('Loading rug progress:', (progress.loaded / progress.total) * 100, '%');
    },
    (error) => {
      console.error('Error loading rug:', error);
    }
  );

  // Load the double bed model
  const bedLoader = new GLTFLoader();
  bedLoader.load(
    '/gltf/bed_double_A.gltf',
    (gltf) => {
      const bed = gltf.scene;
      
      // Enable shadows for the model
      bed.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      
      // Position the bed in the room - adjusted for larger room
      bed.position.set(-3, 0, -3);
      
      // Rotate the bed
      bed.rotation.y = Math.PI / 2;
      
      scene.add(bed);
      console.log('Double bed loaded successfully');
      
      // Load a pillow or blanket to place on top of the bed
      const bedPillowLoader = new GLTFLoader();
      bedPillowLoader.load(
        '/gltf/pillow_B.gltf', // You can replace with another item like 'blanket.gltf' if available
        (gltf) => {
          const bedPillow = gltf.scene;
          
          // Enable shadows for the model
          bedPillow.traverse((node) => {
            if (node.isMesh) {
              node.castShadow = true;
              node.receiveShadow = true;
            }
          });
          
          // Position the pillow on top of the bed - adjusted for larger room
          bedPillow.position.set(-3, 0.6, -2.5);
          
          // Rotate the pillow to match the bed's orientation
          bedPillow.rotation.y = Math.PI / 2;
          
          // Scale the pillow if needed
          bedPillow.scale.set(1.2, 1.2, 1.2);
          
          scene.add(bedPillow);
          console.log('Bed pillow loaded successfully');
        },
        (progress) => {
          console.log('Loading bed pillow progress:', (progress.loaded / progress.total) * 100, '%');
        },
        (error) => {
          console.error('Error loading bed pillow:', error);
        }
      );
    },
    (progress) => {
      console.log('Loading bed progress:', (progress.loaded / progress.total) * 100, '%');
    },
    (error) => {
      console.error('Error loading bed model:', error);
    }
  );

  // Load the small cabinet model
  const cabinetLoader = new GLTFLoader();
  cabinetLoader.load(
    '/gltf/cabinet_small.gltf',
    (gltf) => {
      const cabinet = gltf.scene;
      
      // Enable shadows for the model
      cabinet.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      
      // Position the cabinet next to the bed - adjusted for larger room
      cabinet.position.set(-4.5, 0, -1);
      
      // Rotate the cabinet
      cabinet.rotation.y = Math.PI / 2;
      
      scene.add(cabinet);
      console.log('Small cabinet loaded successfully');
      
      // Load a picture frame to place on top of the cabinet
      const cabinetPictureLoader = new GLTFLoader();
      cabinetPictureLoader.load(
        '/gltf/lamp_table.gltf',
        (gltf) => {
          const cabinetPicture = gltf.scene;
          
          // Enable shadows for the model
          cabinetPicture.traverse((node) => {
            if (node.isMesh) {
              node.castShadow = true;
              node.receiveShadow = true;
            }
          });
          
          // Position the picture frame on top of the cabinet - adjusted for larger room
          cabinetPicture.position.set(-4.5, 1, -1);
          
          // Rotate the picture frame to match the cabinet's orientation
          cabinetPicture.rotation.y = Math.PI / 2;
          
          // Scale down the picture frame if needed
          cabinetPicture.scale.set(0.6, 0.6, 0.6);
          
          scene.add(cabinetPicture);
          console.log('Cabinet picture frame loaded successfully');
        },
        (progress) => {
          console.log('Loading cabinet picture frame progress:', (progress.loaded / progress.total) * 100, '%');
        },
        (error) => {
          console.error('Error loading cabinet picture frame:', error);
        }
      );
    },
    (progress) => {
      console.log('Loading cabinet progress:', (progress.loaded / progress.total) * 100, '%');
    },
    (error) => {
      console.error('Error loading cabinet model:', error);
    }
  );

  // Load the picture frame model for the wall above the couch
  const couchWallPictureLoader = new GLTFLoader();
  couchWallPictureLoader.load(
    '/gltf/pictureframe_large_B.gltf',
    (gltf) => {
      const couchWallPicture = gltf.scene;
      
      // Enable shadows for the model
      couchWallPicture.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      
      // Position the picture frame on the wall above the couch - adjusted for larger room
      couchWallPicture.position.set(-roomWidth/2 + 0.05, 2, 1.5);
      
      // Rotate the picture frame to face into the room
      couchWallPicture.rotation.y = Math.PI / 2;
      
      scene.add(couchWallPicture);
      console.log('Couch wall picture frame loaded successfully');
    },
    (progress) => {
      console.log('Loading couch wall picture frame progress:', (progress.loaded / progress.total) * 100, '%');
    },
    (error) => {
      console.error('Error loading couch wall picture frame:', error);
    }
  );

  // Load the air conditioner model
  const airConditionerLoader = new FBXLoader();
  airConditionerLoader.load(
    '/fbx/Air Conditioner.fbx',
    (fbx) => {
      // Enable shadows for the model and add material
      fbx.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
          
          // Add a light gray material to the air conditioner
          node.material = new THREE.MeshStandardMaterial({
            color: 0xf0f0f0,  // Light gray color
            roughness: 0.5,
            metalness: 0.7    // Make it slightly metallic
          });
        }
      });
      
      // Position the air conditioner high on the wall - adjusted for larger room
      fbx.position.set(0, roomHeight - 1, -roomDepth/2 + 0.1); // Top of back wall
      
      // Scale the model if needed (adjust these values based on the model size)
      fbx.scale.set(0.015, 0.015, 0.015);
      
      scene.add(fbx);
      console.log('Air conditioner loaded successfully');
    },
    (progress) => {
      console.log('Loading air conditioner progress:', (progress.loaded / progress.total) * 100, '%');
    },
    (error) => {
      console.error('Error loading air conditioner model:', error);
    }
  );

  // Load the window frame model
  const windowFrameLoader = new FBXLoader();
  windowFrameLoader.load(
    '/fbx/Window Frame 1.fbx',
    (fbx) => {
      // Enable shadows for the model and add material
      fbx.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
          
          // Add a material to the window frame
          node.material = new THREE.MeshStandardMaterial({
            color: 0xd2c8b5,  // Light wood/beige color
            roughness: 0.7,
            metalness: 0.1    // Mostly non-metallic
          });
        }
      });
      
      // Position the window frame on the left wall above the bed - adjusted for larger room
      fbx.position.set(-roomWidth/2 + 0.05, 0.7, -2); // Left wall above the bed
      
      // Scale the model if needed
      fbx.scale.set(0.01, 0.01, 0.01);
      
      // Rotate to face into the room (from left wall)
      fbx.rotation.y = Math.PI / 2; // 90 degrees rotation
      
      scene.add(fbx);
      console.log('Window frame loaded successfully');
      
      // Load the second window frame (AC) model
      const windowFrameAcLoader = new FBXLoader();
      windowFrameAcLoader.load(
        '/fbx/Window Frame Ac 1.fbx',
        (acFbx) => {
          // Enable shadows for the model and add material
          acFbx.traverse((node) => {
            if (node.isMesh) {
              node.castShadow = true;
              node.receiveShadow = true;
              
              // Check if this is the middle part to make transparent
              if (node.name.includes('middle') || node.name.includes('glass') || node.name.includes('pane')) {
                // Make the middle part transparent
                node.material = new THREE.MeshPhysicalMaterial({
                  color: 0xffffff,
                  roughness: 0.1,
                  metalness: 0.0,
                  transparent: true,
                  opacity: 0.3,
                  transmission: 0.9, // Glass-like transparency
                  clearcoat: 1.0
                });
              } else {
                // For the frame parts
                node.material = new THREE.MeshStandardMaterial({
                  color: 0xd2c8b5,  // Match the first window frame
                  roughness: 0.7,
                  metalness: 0.1
                });
              }
            }
          });
          
          // Position the AC window frame at the same position as the first window - adjusted for larger room
          acFbx.position.set(-roomWidth/2 + 0.05, 0.7, -2); // Same as first window
          
          // Scale the model if needed
          acFbx.scale.set(0.01, 0.01, 0.01);
          
          // Rotate to face into the room (from left wall)
          acFbx.rotation.y = Math.PI / 2; // 90 degrees rotation
          
          scene.add(acFbx);
          console.log('Window frame AC loaded successfully');
        },
        (progress) => {
          console.log('Loading window frame AC progress:', (progress.loaded / progress.total) * 100, '%');
        },
        (error) => {
          console.error('Error loading window frame AC model:', error);
        }
      );
    },
    (progress) => {
      console.log('Loading window frame progress:', (progress.loaded / progress.total) * 100, '%');
    },
    (error) => {
      console.error('Error loading window frame model:', error);
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
      
      // Position the medium table against the right wall
      mediumTable.position.set(roomWidth/2 - 4.5, 0, -4.5); // Right wall, middle of the room
      
      // Rotate the table to face into the room
      mediumTable.rotation.y = -Math.PI / 2; // Rotate to face left (into the room)
      
      scene.add(mediumTable);
      console.log('Medium table loaded successfully');
      
      // Add a laptop on the table
      const laptopLoader = new FBXLoader();
      laptopLoader.load(
        '/fbx/laptop.fbx', // Make sure this path is correct
        (fbx) => {
          console.log('Laptop model loaded, processing...');
          
          // Enable shadows for the model and add material
          fbx.traverse((node) => {
            if (node.isMesh) {
              console.log('Found mesh in laptop model:', node.name);
              node.castShadow = true;
              node.receiveShadow = true;
              
              // Add a simple material to all parts
              node.material = new THREE.MeshStandardMaterial({
                color: 0x888888,  // Silver/gray for laptop body
                roughness: 0.3,
                metalness: 0.8
              });
            }
          });
          
          // Position the laptop on the table - adjusted position
          fbx.position.set(roomWidth/2 - 4.5, 1.01, -4); // Lower height on the table
          
          // Rotate the laptop to face into the room
          fbx.rotation.y = -Math.PI / 2;
          
          // Make the laptop smaller
          fbx.scale.set(0.0025, 0.0025, 0.0025); // Much smaller scale
          
          scene.add(fbx);
          console.log('Laptop added to scene successfully');
          

        },
        (progress) => {
          console.log('Loading laptop progress:', (progress.loaded / progress.total) * 100, '%');
        },
        (error) => {
          console.error('Error loading laptop model:', error);
          // Try an alternative model if the laptop fails to load
          const alternativeLoader = new GLTFLoader();
          alternativeLoader.load(
            '/gltf/book_set.gltf', // Use a book set as an alternative
            (gltf) => {
              const alternative = gltf.scene;
              
              alternative.traverse((node) => {
                if (node.isMesh) {
                  node.castShadow = true;
                  node.receiveShadow = true;
                }
              });
              
              alternative.position.set(roomWidth/2 - 0.8, 0.75, 0);
              alternative.rotation.y = -Math.PI / 4;
              alternative.scale.set(0.5, 0.5, 0.5); // Smaller scale
              
              scene.add(alternative);
              console.log('Alternative item (book set) loaded successfully');
            },
            null,
            (altError) => {
              console.error('Error loading alternative model:', altError);
            }
          );
        }
      );
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
      
      // Position the stool chair in front of the medium table
      stoolChair.position.set(roomWidth/2 - 4.5, 0, -2.5); // In front of the table
      
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
} 