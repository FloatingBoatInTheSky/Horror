/**
 * Blackwood Pines Old House Level Builder
 * Structure:
 * - Master Bedroom (Spawn, dresser, bed, safe, wardrobe)
 * - Long Dim Corridor (Grandfather clock, painting of blurred family, locked basement door)
 * - Living Room (Couch, large rain window with interactive curtains, coffee table with diary)
 * - Kitchen (Kitchen counters, dining table, fridge, eerie dripping sink)
 * - Basement Entrance (Locked until 03:40 AM knocked)
 * - The Tall Faceless Entity (Appears in hallway, reactive to gaze)
 */
class LevelBuilder {
  constructor(scene, gameState) {
    this.scene = scene;
    this.gameState = gameState;
    this.colliders = [];
    this.interactables = [];
    this.flickeringLights = [];
    this.doors = {};

    this.materials = {};
    this.entityMesh = null;
    this.curtainsMesh = null;

    this.initMaterials();
  }

  initMaterials() {
    const wallpaperTex = TextureGenerator.createWallpaper(128, 128);
    const carpetTex = TextureGenerator.createCarpet(128, 128);
    const woodFloorTex = TextureGenerator.createWoodFloor(128, 128);
    const ceilingTex = TextureGenerator.createCeilingPlaster(128, 128);
    const tileTex = TextureGenerator.createTileBathroom(128, 128);

    wallpaperTex.repeat.set(3, 2);
    carpetTex.repeat.set(4, 4);
    woodFloorTex.repeat.set(4, 4);
    ceilingTex.repeat.set(4, 4);

    this.materials.wallpaper = new THREE.MeshLambertMaterial({ map: wallpaperTex, color: 0x6e7062 });
    this.materials.carpet = new THREE.MeshLambertMaterial({ map: carpetTex, color: 0x5a3e3e });
    this.materials.woodFloor = new THREE.MeshLambertMaterial({ map: woodFloorTex, color: 0x584436 });
    this.materials.ceiling = new THREE.MeshLambertMaterial({ map: ceilingTex, color: 0x484a4c });
    this.materials.tiles = new THREE.MeshLambertMaterial({ map: tileTex, color: 0x3e4646 });

    this.materials.woodFurniture = new THREE.MeshLambertMaterial({ color: 0x32241a });
    this.materials.fabric = new THREE.MeshLambertMaterial({ color: 0x422a2c });
    this.materials.curtainRed = new THREE.MeshLambertMaterial({ color: 0x5c1e22, side: THREE.DoubleSide });
    this.materials.metal = new THREE.MeshLambertMaterial({ color: 0x2e3234 });
    this.materials.paper = new THREE.MeshLambertMaterial({ color: 0xd8d0b8 });
  }

  buildHouse() {
    // 1. Bedroom (X: -4 to 2, Z: 3 to 9, H: 2.8) - Carpet floor
    this.createRoom(-4, 2, 3, 9, 2.8, this.materials.carpet);

    // 2. Central Hallway (X: -1.5 to 1.5, Z: -7 to 3, H: 2.8) - Wood floor
    this.createRoom(-1.5, 1.5, -7, 3, 2.8, this.materials.woodFloor);

    // 3. Living Room (X: 1.5 to 8, Z: -5 to 3, H: 2.8) - Wood floor
    this.createRoom(1.5, 8, -5, 3, 2.8, this.materials.woodFloor);

    // 4. Kitchen / Dining (X: -7 to -1.5, Z: -7 to 0, H: 2.8) - Tiles floor
    this.createRoom(-7, -1.5, -7, 0, 2.8, this.materials.tiles);

    // 5. Basement Landing (X: -1.5 to 1.5, Z: -12 to -7, H: 2.8) - Concrete
    this.createRoom(-1.5, 1.5, -12, -7, 2.8, this.materials.woodFloor);

    this.placeHouseProps();
    this.placeLighting();
    this.spawnTheEntity();

    return {
      colliders: this.colliders,
      interactables: this.interactables
    };
  }

  createRoom(minX, maxX, minZ, maxZ, height, floorMat) {
    const width = maxX - minX;
    const depth = maxZ - minZ;
    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;

    // Floor
    const floorGeo = new THREE.PlaneGeometry(width, depth);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(cx, 0, cz);
    this.scene.add(floor);

    // Ceiling
    const ceilGeo = new THREE.PlaneGeometry(width, depth);
    const ceiling = new THREE.Mesh(ceilGeo, this.materials.ceiling);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(cx, height, cz);
    this.scene.add(ceiling);

    this.buildWallsForRoom(minX, maxX, minZ, maxZ, height);
  }

  buildWallsForRoom(minX, maxX, minZ, maxZ, height) {
    const thickness = 0.25;

    const addWallSegment = (x1, z1, x2, z2) => {
      const len = Math.hypot(x2 - x1, z2 - z1);
      const angle = Math.atan2(x2 - x1, z2 - z1);
      const cx = (x1 + x2) / 2;
      const cz = (z1 + z2) / 2;

      const wallGeo = new THREE.BoxGeometry(thickness, height, len);
      const wall = new THREE.Mesh(wallGeo, this.materials.wallpaper);
      wall.position.set(cx, height / 2, cz);
      wall.rotation.y = angle;
      this.scene.add(wall);

      const halfW = (Math.abs(Math.sin(angle)) * len + Math.abs(Math.cos(angle)) * thickness) / 2;
      const halfD = (Math.abs(Math.cos(angle)) * len + Math.abs(Math.sin(angle)) * thickness) / 2;
      this.colliders.push({
        minX: cx - halfW - 0.05,
        maxX: cx + halfW + 0.05,
        minZ: cz - halfD - 0.05,
        maxZ: cz + halfD + 0.05
      });
    };

    // Bedroom (X: -4 to 2, Z: 3 to 9)
    if (minX === -4 && maxX === 2 && minZ === 3 && maxZ === 9) {
      addWallSegment(-4, 9, 2, 9); // South
      addWallSegment(-4, 3, -4, 9); // West
      addWallSegment(2, 3, 2, 9);  // East
      // North wall: door opening at X: -0.6 to 0.6 leading to corridor
      addWallSegment(-4, 3, -0.8, 3);
      addWallSegment(0.8, 3, 2, 3);
      return;
    }

    // Corridor (X: -1.5 to 1.5, Z: -7 to 3)
    if (minX === -1.5 && maxX === 1.5 && minZ === -7 && maxZ === 3) {
      // East wall to Living Room (open arch at Z: -1.5 to 1.5)
      addWallSegment(1.5, 1.5, 1.5, 3);
      addWallSegment(1.5, -7, 1.5, -2);

      // West wall to Kitchen (door opening at Z: -4.5 to -2.5)
      addWallSegment(-1.5, -2, -1.5, 3);
      addWallSegment(-1.5, -7, -1.5, -5);

      // North wall doorway to Basement
      addWallSegment(-1.5, -7, -0.8, -7);
      addWallSegment(0.8, -7, 1.5, -7);
      return;
    }

    // Living Room (X: 1.5 to 8, Z: -5 to 3)
    if (minX === 1.5 && maxX === 8 && minZ === -5 && maxZ === 3) {
      addWallSegment(1.5, 3, 8, 3);   // South
      addWallSegment(1.5, -5, 8, -5); // North
      addWallSegment(8, -5, 8, 3);    // East (Window wall)
      return;
    }

    // Kitchen (X: -7 to -1.5, Z: -7 to 0)
    if (minX === -7 && maxX === -1.5 && minZ === -7 && maxZ === 0) {
      addWallSegment(-7, 0, -1.5, 0);   // South
      addWallSegment(-7, -7, -1.5, -7); // North (Backdoor)
      addWallSegment(-7, -7, -7, 0);    // West
      return;
    }

    // Basement Landing (X: -1.5 to 1.5, Z: -12 to -7)
    if (minX === -1.5 && maxX === 1.5 && minZ === -12 && maxZ === -7) {
      addWallSegment(-1.5, -12, 1.5, -12); // North end
      addWallSegment(-1.5, -12, -1.5, -7);
      addWallSegment(1.5, -12, 1.5, -7);
      return;
    }

    // Generic fallback
    addWallSegment(minX, minZ, maxX, minZ);
    addWallSegment(maxX, minZ, maxX, maxZ);
    addWallSegment(maxX, maxZ, minX, maxZ);
    addWallSegment(minX, maxZ, minX, minZ);
  }

  placeHouseProps() {
    // 1. Bedroom Bed (Spawn is near bed)
    this.createBed(-2.5, 0, 7.2);

    // 2. Dresser with Flashlight & Note #01
    this.createDresser(1.2, 0, 6.0);
    this.createFlashlightItem(1.1, 0.85, 5.8);
    this.createDocumentItem(1.1, 0.82, 6.2, 'rule_note', 'Folha Rasgada');

    // 3. Bedroom Safe on table (Code 1987)
    this.createBedroomSafe(-3.2, 0, 4.2);

    // 4. Grandfather Clock in corridor
    this.createGrandfatherClock(1.1, 0, -0.5);

    // 5. Creepy Painting on Hallway Wall
    this.createPaintingMesh(-1.3, 1.6, -1.0, Math.PI / 2);

    // 6. Living Room: Couch & Coffee table with Diary
    this.createCouch(4.5, 0, -1.0);
    this.createCoffeeTable(4.5, 0, 1.0);
    this.createDocumentItem(4.5, 0.48, 1.0, 'diary_page', 'Diário de Eleanor');

    // 7. Large Rain Window with interactive curtains in Living Room
    this.createLivingRoomWindow(7.85, 1.4, -1.0);

    // 8. Kitchen counter, fridge, and basement key
    this.createKitchenCounter(-4.5, 0, -6.2);
    this.createKeyItem(-3.5, 0.9, -6.1, 'key_basement', 'Chave Antiga do Porão');

    // 9. Backdoor in Kitchen (Knocked at 03:40 AM)
    this.createBackDoor(-5.5, 0, -6.85);

    // 10. Basement Door in Corridor
    this.createBasementDoor(0, 0, -7.0);

    // 11. Telephone in Bedroom
    this.createTelephone(-1.2, 0.85, 3.8);
  }

  createBed(x, y, z) {
    const frameGeo = new THREE.BoxGeometry(1.6, 0.5, 2.2);
    const frame = new THREE.Mesh(frameGeo, this.materials.woodFurniture);
    frame.position.set(x, y + 0.25, z);
    this.scene.add(frame);

    const sheetGeo = new THREE.BoxGeometry(1.5, 0.2, 2.0);
    const sheet = new THREE.Mesh(sheetGeo, this.materials.fabric);
    sheet.position.set(x, y + 0.5, z);
    this.scene.add(sheet);

    this.colliders.push({
      minX: x - 0.9,
      maxX: x + 0.9,
      minZ: z - 1.15,
      maxZ: z + 1.15
    });
  }

  createDresser(x, y, z) {
    const geo = new THREE.BoxGeometry(1.2, 0.8, 0.6);
    const dresser = new THREE.Mesh(geo, this.materials.woodFurniture);
    dresser.position.set(x, y + 0.4, z);
    this.scene.add(dresser);

    this.colliders.push({
      minX: x - 0.65,
      maxX: x + 0.65,
      minZ: z - 0.35,
      maxZ: z + 0.35
    });
  }

  createBedroomSafe(x, y, z) {
    const tableGeo = new THREE.BoxGeometry(0.8, 0.7, 0.8);
    const table = new THREE.Mesh(tableGeo, this.materials.woodFurniture);
    table.position.set(x, y + 0.35, z);
    this.scene.add(table);

    const safeGeo = new THREE.BoxGeometry(0.45, 0.35, 0.45);
    const safe = new THREE.Mesh(safeGeo, this.materials.metal);
    safe.position.set(x, y + 0.88, z);
    this.scene.add(safe);

    this.colliders.push({
      minX: x - 0.45,
      maxX: x + 0.45,
      minZ: z - 0.45,
      maxZ: z + 0.45
    });

    this.interactables.push({
      id: 'safe_bedroom',
      type: 'puzzle',
      name: 'Cofre Trancado',
      prompt: 'Cofre com Segredo [E]',
      position: new THREE.Vector3(x, y + 0.9, z),
      radius: 1.8,
      onInteract: () => {
        if (window.gameUI) {
          window.gameUI.showKeypadModal({
            title: 'COFRE DE ELEANOR',
            correctCode: '1987',
            onSuccess: () => {
              this.gameState.addItem({
                id: 'key_attic',
                name: 'Chave Dourada do Sótão',
                desc: 'Chave pesada e ornamentada encontrada dentro do cofre.'
              });
              this.gameState.data.hasAtticKey = true;
              window.gameUI.showNotification('Cofre aberto: Chave do Sótão obtida!');
              if (this.gameState.data.routineStep === 4) {
                this.gameState.advanceRoutine(5);
              }
            }
          });
        }
      }
    });
  }

  createGrandfatherClock(x, y, z) {
    const clockGeo = new THREE.BoxGeometry(0.5, 2.2, 0.4);
    const clock = new THREE.Mesh(clockGeo, this.materials.woodFurniture);
    clock.position.set(x, y + 1.1, z);
    this.scene.add(clock);

    this.colliders.push({
      minX: x - 0.3,
      maxX: x + 0.3,
      minZ: z - 0.25,
      maxZ: z + 0.25
    });
  }

  createPaintingMesh(x, y, z, rotY) {
    const tex = TextureGenerator.createPainting();
    const geo = new THREE.PlaneGeometry(0.9, 0.9);
    const mat = new THREE.MeshBasicMaterial({ map: tex });
    const p = new THREE.Mesh(geo, mat);
    p.position.set(x, y, z);
    p.rotation.y = rotY;
    this.scene.add(p);
  }

  createCouch(x, y, z) {
    const couchGeo = new THREE.BoxGeometry(2.4, 0.75, 1.0);
    const couch = new THREE.Mesh(couchGeo, this.materials.fabric);
    couch.position.set(x, y + 0.38, z);
    this.scene.add(couch);

    this.colliders.push({
      minX: x - 1.25,
      maxX: x + 1.25,
      minZ: z - 0.55,
      maxZ: z + 0.55
    });
  }

  createCoffeeTable(x, y, z) {
    const tableGeo = new THREE.BoxGeometry(1.4, 0.42, 0.8);
    const table = new THREE.Mesh(tableGeo, this.materials.woodFurniture);
    table.position.set(x, y + 0.21, z);
    this.scene.add(table);

    this.colliders.push({
      minX: x - 0.75,
      maxX: x + 0.75,
      minZ: z - 0.45,
      maxZ: z + 0.45
    });
  }

  createLivingRoomWindow(x, y, z) {
    // Window glass opening
    const glassGeo = new THREE.PlaneGeometry(0.1, 1.6);
    const glassMat = new THREE.MeshBasicMaterial({ color: 0x05070a });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(x - 0.05, y, z);
    this.scene.add(glass);

    // Red curtains
    const curGeo = new THREE.PlaneGeometry(1.4, 2.0);
    this.curtainsMesh = new THREE.Mesh(curGeo, this.materials.curtainRed);
    this.curtainsMesh.position.set(x - 0.08, y, z);
    this.curtainsMesh.rotation.y = -Math.PI / 2;
    this.curtainsMesh.scale.x = 0.3; // Open at start
    this.scene.add(this.curtainsMesh);

    this.interactables.push({
      id: 'living_curtains',
      type: 'curtains',
      name: 'Cortinas da Sala',
      prompt: 'Fechar Cortinas [E]',
      position: new THREE.Vector3(x - 0.8, y, z),
      radius: 2.2,
      onInteract: () => {
        if (!this.gameState.data.curtainsClosed) {
          this.gameState.data.curtainsClosed = true;
          this.curtainsMesh.scale.x = 1.0; // Closed
          if (window.game && window.game.audio) window.game.audio.playCurtainPull();
          window.gameUI.showNotification('Você fechou as cortinas. A escuridão lá fora sumiu.');
          if (this.gameState.data.routineStep === 1) {
            this.gameState.advanceRoutine(2);
          }
        } else {
          window.gameUI.showNotification('As cortinas já estão fechadas com segurança.');
        }
      }
    });
  }

  createKitchenCounter(x, y, z) {
    const counterGeo = new THREE.BoxGeometry(2.4, 0.85, 0.8);
    const counter = new THREE.Mesh(counterGeo, this.materials.woodFurniture);
    counter.position.set(x, y + 0.42, z);
    this.scene.add(counter);

    this.colliders.push({
      minX: x - 1.25,
      maxX: x + 1.25,
      minZ: z - 0.45,
      maxZ: z + 0.45
    });
  }

  createBackDoor(x, y, z) {
    this.interactables.push({
      id: 'back_door',
      type: 'door',
      name: 'Porta dos Fundos',
      prompt: 'Verificar Porta dos Fundos [E]',
      position: new THREE.Vector3(x, y + 1.2, z + 0.6),
      radius: 2.0,
      onInteract: () => {
        if (this.gameState.data.routineStep === 3) {
          window.gameUI.showNotification('Você ouve uma respiração pesada através da madeira... NÃO ABRA.');
          if (window.game && window.game.audio) window.game.audio.playKnockOnDoor();
          this.gameState.advanceRoutine(4);
        } else {
          window.gameUI.showNotification('A porta dos fundos está trancada por fora.');
          if (window.game && window.game.audio) window.game.audio.playDoorLocked();
        }
      }
    });
  }

  createBasementDoor(x, y, z) {
    const doorGroup = new THREE.Group();
    const frameGeo = new THREE.BoxGeometry(1.4, 2.4, 0.1);
    const doorMesh = new THREE.Mesh(frameGeo, this.materials.woodFurniture);
    doorMesh.position.set(0, 1.2, 0);
    doorGroup.add(doorMesh);
    doorGroup.position.set(x, y, z);
    this.scene.add(doorGroup);

    const collider = {
      minX: x - 0.75,
      maxX: x + 0.75,
      minZ: z - 0.15,
      maxZ: z + 0.15,
      active: true
    };
    this.colliders.push(collider);

    this.doors['door_basement'] = {
      group: doorGroup,
      collider: collider,
      isOpen: false
    };

    this.interactables.push({
      id: 'door_basement',
      type: 'door',
      name: 'Porta do Porão',
      prompt: 'Porta do Porão [E]',
      position: new THREE.Vector3(x, y + 1.2, z + 0.6),
      radius: 2.0,
      onInteract: () => {
        if (this.doors['door_basement'].isOpen) return;

        if (this.gameState.hasItem('key_basement')) {
          this.openDoor('door_basement');
          this.gameState.removeItem('key_basement');
          window.gameUI.showNotification('Você destrancou o Porão!');
          if (window.game) window.game.triggerPsychologicalEvent('basement_opened');
        } else {
          window.gameUI.showNotification('A porta está trancada. Encontre a chave antiga na cozinha.');
          if (window.game && window.game.audio) window.game.audio.playDoorLocked();
        }
      }
    });
  }

  createTelephone(x, y, z) {
    const phoneGeo = new THREE.BoxGeometry(0.24, 0.14, 0.24);
    const phone = new THREE.Mesh(phoneGeo, this.materials.metal);
    phone.position.set(x, y, z);
    this.scene.add(phone);

    this.interactables.push({
      id: 'phone_bedroom',
      type: 'phone',
      name: 'Telefone Fixo',
      prompt: 'Usar Telefone [E]',
      position: new THREE.Vector3(x, y, z),
      radius: 1.8,
      onInteract: () => {
        if (this.gameState.data.routineStep >= 5) {
          if (window.gameUI) window.gameUI.showEndingChoiceModal();
        } else {
          window.gameUI.showNotification('Sem sinal de discagem... apenas um zumbido grave e estático.');
          if (window.game && window.game.audio) window.game.audio.playEntityGlitch();
        }
      }
    });
  }

  createFlashlightItem(x, y, z) {
    const geo = new THREE.BoxGeometry(0.12, 0.08, 0.25);
    const mat = new THREE.MeshLambertMaterial({ color: 0xaa8822 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    this.scene.add(mesh);

    this.interactables.push({
      id: 'item_flashlight',
      type: 'item',
      name: 'Lanterna Pesada',
      prompt: 'Pegar Lanterna [E]',
      position: new THREE.Vector3(x, y, z),
      radius: 1.8,
      onInteract: () => {
        this.scene.remove(mesh);
        this.gameState.data.hasFlashlight = true;
        this.gameState.data.flashlightOn = true;
        this.gameState.addItem({
          id: 'item_flashlight',
          name: 'Lanterna',
          desc: 'Lanterna antiga de metal. Pressione [F] para alternar.'
        });
        if (window.game) window.game.updateFlashlightLight();
        if (this.gameState.data.routineStep === 0) {
          this.gameState.advanceRoutine(1);
        }
      }
    });
  }

  createKeyItem(x, y, z, id, name) {
    const geo = new THREE.BoxGeometry(0.08, 0.04, 0.16);
    const mat = new THREE.MeshLambertMaterial({ color: 0x998833 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    this.scene.add(mesh);

    this.interactables.push({
      id: id,
      type: 'item',
      name: name,
      prompt: `Pegar ${name} [E]`,
      position: new THREE.Vector3(x, y, z),
      radius: 1.8,
      onInteract: () => {
        this.scene.remove(mesh);
        this.gameState.data.hasBasementKey = true;
        this.gameState.addItem({
          id: id,
          name: name,
          desc: 'Chave enferrujada encontrada na bancada da cozinha.'
        });
      }
    });
  }

  createDocumentItem(x, y, z, docId, title) {
    const geo = new THREE.PlaneGeometry(0.24, 0.32);
    const mesh = new THREE.Mesh(geo, this.materials.paper);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, y, z);
    this.scene.add(mesh);

    this.interactables.push({
      id: docId,
      type: 'document',
      name: title,
      prompt: `Ler ${title} [E]`,
      position: new THREE.Vector3(x, y, z),
      radius: 1.8,
      onInteract: () => {
        this.gameState.unlockDoc(docId);
        if (window.gameUI) {
          window.gameUI.showDocumentModal(docId);
        }
        if (docId === 'diary_page' && this.gameState.data.routineStep === 2) {
          this.gameState.advanceRoutine(3);
        }
      }
    });
  }

  spawnTheEntity() {
    // The Tall Faceless Entity (PSX Aesthetic)
    const entityGroup = new THREE.Group();

    // Elongated thin body
    const bodyGeo = new THREE.CylinderGeometry(0.18, 0.22, 2.2, 8);
    const bodyMat = new THREE.MeshBasicMaterial({ color: 0x050507 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 1.1, 0);

    // Oval faceless head
    const headGeo = new THREE.SphereGeometry(0.18, 8, 8);
    const headMat = new THREE.MeshBasicMaterial({ color: 0x111215 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 2.3, 0);

    entityGroup.add(body);
    entityGroup.add(head);

    // Initially at the dark end of the central hallway
    entityGroup.position.set(0, 0, -5.8);
    entityGroup.visible = false;
    this.scene.add(entityGroup);

    this.entityMesh = entityGroup;
  }

  openDoor(id) {
    const door = this.doors[id];
    if (!door || door.isOpen) return;

    door.isOpen = true;
    door.collider.active = false;
    if (window.game && window.game.audio) window.game.audio.playDoorOpen();

    let p = 0;
    const anim = () => {
      p += 0.05;
      door.group.rotation.y += 0.08;
      if (p < 1.0) requestAnimationFrame(anim);
    };
    anim();
  }

  placeLighting() {
    // Very dim moon ambient
    const ambient = new THREE.AmbientLight(0x181c22, 0.35);
    this.scene.add(ambient);

    // Bedroom bedside lamp (warm dim amber)
    const bedLamp = new THREE.PointLight(0xcc9944, 0.75, 7.5);
    bedLamp.position.set(1.1, 1.2, 5.8);
    this.scene.add(bedLamp);

    // Hallway flickering dim bulb
    const hallLamp = new THREE.PointLight(0xaacc88, 0.45, 9);
    hallLamp.position.set(0, 2.4, -2.0);
    this.scene.add(hallLamp);
    this.flickeringLights.push({ light: hallLamp, baseIntensity: 0.45 });

    // Living Room window moonlight
    const moonLight = new THREE.PointLight(0x334466, 0.55, 10);
    moonLight.position.set(6.5, 2.2, -1.0);
    this.scene.add(moonLight);

    // Kitchen sickly fluorescent
    const kitchenLight = new THREE.PointLight(0x88bb99, 0.5, 8);
    kitchenLight.position.set(-4.5, 2.4, -3.5);
    this.scene.add(kitchenLight);
    this.flickeringLights.push({ light: kitchenLight, baseIntensity: 0.5 });
  }

  update(delta) {
    for (let i = 0; i < this.flickeringLights.length; i++) {
      const item = this.flickeringLights[i];
      if (Math.random() < 0.035) {
        item.light.intensity = item.baseIntensity * (Math.random() < 0.3 ? 0.05 : 1.3);
      } else {
        item.light.intensity += (item.baseIntensity - item.light.intensity) * 4 * delta;
      }
    }
  }
}

window.LevelBuilder = LevelBuilder;
