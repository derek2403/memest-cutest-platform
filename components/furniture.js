import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

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
      
      // Position the couch in the room
      model.position.set(-2.2, 0, 2.5); // Adjust these values as needed
      
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
          
          // Position the low table in front of the couch
          lowTable.position.set(0, 0, 2.5); // Center of the room, adjust as needed
          
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
              
              // Position the cactus on the low table
              cactus.position.set(0, 0.6, 3); // Left side of the table
              
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
              
              // Position the book set on the low table
              bookSet.position.set(0.3, 0.9, 2.5); // Right side of the table
              
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

  // Load the picture frame model to place on top of the couch
  const couchPictureLoader = new GLTFLoader();
  couchPictureLoader.load(
    '/gltf/pictureframe_large_A.gltf',
    (gltf) => {
      const couchPicture = gltf.scene;
      
      // Enable shadows for the model
      couchPicture.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      
      // Position the picture frame on top of the couch
      couchPicture.position.set(1.5, 1.5, -0.5);
      
      // Rotate the picture frame to face outward from the couch
      couchPicture.rotation.y = 0;
      
      // Scale the model
      couchPicture.scale.set(0.8, 0.8, 0.8);
      
      scene.add(couchPicture);
      console.log('Couch picture frame loaded successfully');
    },
    (progress) => {
      console.log('Loading couch picture frame progress:', (progress.loaded / progress.total) * 100, '%');
    },
    (error) => {
      console.error('Error loading couch picture frame:', error);
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
      
      // Position the shelf on the back wall
      shelf.position.set(1.5, 0, -roomDepth/2 + 0.8);
      
      // Fix the rotation
      shelf.rotation.y = 0;
      
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
      
      // Position the rug
      rug.position.set(-1, 0.01, 2.5);
      
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
      
      // Position the bed in the room
      bed.position.set(-1.5, 0, -2);
      
      // Rotate the bed
      bed.rotation.y = Math.PI / 2;
      
      scene.add(bed);
      console.log('Double bed loaded successfully');
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
      
      // Position the cabinet next to the bed
      cabinet.position.set(-2.5, 0, 0.2);
      
      // Rotate the cabinet
      cabinet.rotation.y = Math.PI / 2;
      
      scene.add(cabinet);
      console.log('Small cabinet loaded successfully');
    },
    (progress) => {
      console.log('Loading cabinet progress:', (progress.loaded / progress.total) * 100, '%');
    },
    (error) => {
      console.error('Error loading cabinet model:', error);
    }
  );



  // Load the shelf model for under the picture
  const shelfALoader = new GLTFLoader();
  shelfALoader.load(
    '/gltf/shelf_A_big.gltf',
    (gltf) => {
      const shelf = gltf.scene;
      
      // Enable shadows for the model
      shelf.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      
      // Position the shelf on the back wall below the picture frame
      shelf.position.set(0, 0.8, -roomDepth/2 + 0.3);
      
      // Rotate the shelf
      shelf.rotation.y = Math.PI;
      
      scene.add(shelf);
      console.log('Shelf loaded successfully');
    },
    (progress) => {
      console.log('Loading shelf progress:', (progress.loaded / progress.total) * 100, '%');
    },
    (error) => {
      console.error('Error loading shelf:', error);
    }
  );
} 