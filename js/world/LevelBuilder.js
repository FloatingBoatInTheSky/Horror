/**
 * 3D Sub-Level 04 Complex Builder
 * Builds corridors, examination rooms, security checkpoint, generator room, secret archive room
 * Generates low-poly interactive props: doors, flashlights, keypads, fuse boxes, notes, medical beds, computers
 */
class LevelBuilder {
  constructor(scene, gameState) {
    this.scene = scene;
    this.gameState = gameState;
    this.colliders = [];
    this.interactables = [];
    this.lights = [];
    this.doors = {};
    this.flickeringLights = [];

    this.materials = {};
    this.initMaterials();
  }

  initMaterials() {
    const concreteTex = TextureGenerator.createConcrete(256, 256);
    const tileTex = TextureGenerator.createTile(256, 256);
    const rustTex = TextureGenerator.createRustMetal(256, 256);
    const woodTex = TextureGenerator.createWood(256, 256);

    concreteTex.repeat.set(4, 4);
    tileTex.repeat.set(8, 8);

    this.materials.wall = new THREE.MeshLambertMaterial({
      map: concreteTex,
      color: 0x5a5e60
    });

    this.materials.floor = new THREE.MeshLambertMaterial({
      map: tileTex,
      color: 0x484c4e
    });

    this.materials.ceiling = new THREE.MeshLambertMaterial({
      map: concreteTex,
      color: 0x333638
    });

    this.materials.metal = new THREE.MeshLambertMaterial({
      map: rustTex,
      color: 0x6e6560
    });

    this.materials.wood = new THREE.MeshLambertMaterial({
      map: woodTex,
      color: 0x443328
    });

    this.materials.glowGreen = new THREE.MeshBasicMaterial({ color: 0x22ff44 });
    this.materials.glowRed = new THREE.MeshBasicMaterial({ color: 0xff2222 });
    this.materials.glowYellow = new THREE.MeshBasicMaterial({ color: 0xffcc22 });
    this.materials.paper = new THREE.MeshLambertMaterial({ color: 0xded8c8 });
  }

  buildComplex() {
    // 1. Reception & Entrance Hall (Z: 6 to 14, X: -4 to 4, Height: 3.2)
    this.createRoom(-4, 4, 6, 14, 3.2, 'Ala de Recepção');

    // 2. Main Corridor North (Z: -8 to 6, X: -2 to 2, Height: 3.0)
    this.createRoom(-2, 2, -8, 6, 3.0, 'Corredor Central');

    // 3. Security Room (West of reception: X: -10 to -4, Z: 6 to 12, Height: 2.8)
    this.createRoom(-10, -4, 6, 12, 2.8, 'Sala de Guarda');

    // 4. Examination Ward / Infirmary (East of corridor: X: 2 to 9, Z: -2 to 5, Height: 2.8)
    this.createRoom(2, 9, -2, 5, 2.8, 'Enfermaria 03');

    // 5. Generator / Electrical Room (West of corridor: X: -9 to -2, Z: -7 to 0, Height: 3.0)
    this.createRoom(-9, -2, -7, 0, 3.0, 'Sala do Gerador');

    // 6. Sub-Archive Secret Vault (North end of corridor: X: -5 to 5, Z: -18 to -8, Height: 3.5)
    this.createRoom(-5, 5, -18, -8, 3.5, 'Arquivo Central');

    // Add doors, furniture, props and interactive elements
    this.placeProps();
    this.placeLights();

    return {
      colliders: this.colliders,
      interactables: this.interactables
    };
  }

  createRoom(minX, maxX, minZ, maxZ, height, name = '') {
    const width = maxX - minX;
    const depth = maxZ - minZ;
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;

    // Floor
    const floorGeo = new THREE.PlaneGeometry(width, depth);
    const floor = new THREE.Mesh(floorGeo, this.materials.floor);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(centerX, 0, centerZ);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Ceiling
    const ceilGeo = new THREE.PlaneGeometry(width, depth);
    const ceiling = new THREE.Mesh(ceilGeo, this.materials.ceiling);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(centerX, height, centerZ);
    this.scene.add(ceiling);

    // Create perimeter walls with doorways left open
    this.buildWallsForRoom(minX, maxX, minZ, maxZ, height);
  }

  buildWallsForRoom(minX, maxX, minZ, maxZ, height) {
    const thickness = 0.3;

    // Helper to spawn wall segment with collision
    const addWallSegment = (x1, z1, x2, z2) => {
      const len = Math.hypot(x2 - x1, z2 - z1);
      const angle = Math.atan2(x2 - x1, z2 - z1);
      const cx = (x1 + x2) / 2;
      const cz = (z1 + z2) / 2;

      const wallGeo = new THREE.BoxGeometry(thickness, height, len);
      const wall = new THREE.Mesh(wallGeo, this.materials.wall);
      wall.position.set(cx, height / 2, cz);
      wall.rotation.y = angle;
      this.scene.add(wall);

      // AABB for player collision
      const halfW = (Math.abs(Math.sin(angle)) * len + Math.abs(Math.cos(angle)) * thickness) / 2;
      const halfD = (Math.abs(Math.cos(angle)) * len + Math.abs(Math.sin(angle)) * thickness) / 2;
      this.colliders.push({
        minX: cx - halfW - 0.05,
        maxX: cx + halfW + 0.05,
        minZ: cz - halfD - 0.05,
        maxZ: cz + halfD + 0.05
      });
    };

    // Specific openings for rooms:
    // If reception (Z: 6 to 14, X: -4 to 4):
    if (minX === -4 && maxX === 4 && minZ === 6 && maxZ === 14) {
      // South wall (back): solid
      addWallSegment(-4, 14, 4, 14);
      // East wall: solid
      addWallSegment(4, 6, 4, 14);
      // West wall: doorway at Z: 8 to 10 leading to Security Room
      addWallSegment(-4, 6, -4, 8.5);
      addWallSegment(-4, 10.5, -4, 14);
      // North wall: doorway at X: -1.2 to 1.2 leading to Main corridor
      addWallSegment(-4, 6, -1.5, 6);
      addWallSegment(1.5, 6, 4, 6);
      return;
    }

    // Security Room (X: -10 to -4, Z: 6 to 12)
    if (minX === -10 && maxX === -4 && minZ === 6 && maxZ === 12) {
      addWallSegment(-10, 6, -4, 6);   // North
      addWallSegment(-10, 12, -4, 12); // South
      addWallSegment(-10, 6, -10, 12); // West
      // East wall connects with Reception doorway (already opened)
      return;
    }

    // Main Corridor (X: -2 to 2, Z: -8 to 6)
    if (minX === -2 && maxX === 2 && minZ === -8 && maxZ === 6) {
      // West wall: doorway to Generator Room at Z: -4.5 to -2.5
      addWallSegment(-2, 1, -2, 6);
      addWallSegment(-2, -8, -2, -4.5);
      addWallSegment(-2, -2.5, -2, 1);

      // East wall: doorway to Infirmary at Z: 0 to 2.5
      addWallSegment(2, 2.5, 2, 6);
      addWallSegment(2, -8, 2, 0);

      // North wall: doorway to Archive at X: -1.2 to 1.2
      addWallSegment(-2, -8, -1.2, -8);
      addWallSegment(1.2, -8, 2, -8);
      return;
    }

    // Infirmary (X: 2 to 9, Z: -2 to 5)
    if (minX === 2 && maxX === 9 && minZ === -2 && maxZ === 5) {
      addWallSegment(2, 5, 9, 5);   // South
      addWallSegment(2, -2, 9, -2); // North
      addWallSegment(9, -2, 9, 5);  // East
      return;
    }

    // Generator Room (X: -9 to -2, Z: -7 to 0)
    if (minX === -9 && maxX === -2 && minZ === -7 && maxZ === 0) {
      addWallSegment(-9, 0, -2, 0);   // South
      addWallSegment(-9, -7, -2, -7); // North
      addWallSegment(-9, -7, -9, 0);  // West
      return;
    }

    // Archive Central (X: -5 to 5, Z: -18 to -8)
    if (minX === -5 && maxX === 5 && minZ === -18 && maxZ === -8) {
      addWallSegment(-5, -18, 5, -18); // North
      addWallSegment(-5, -18, -5, -8); // West
      addWallSegment(5, -18, 5, -8);   // East
      addWallSegment(-5, -8, -1.2, -8);
      addWallSegment(1.2, -8, 5, -8);
      return;
    }

    // Generic fallback for any other room
    addWallSegment(minX, minZ, maxX, minZ);
    addWallSegment(maxX, minZ, maxX, maxZ);
    addWallSegment(maxX, maxZ, minX, maxZ);
    addWallSegment(minX, maxZ, minX, minZ);
  }

  placeProps() {
    // 1. Reception Desk
    this.createDesk(0, 0, 8.5);

    // 2. Flashlight on reception desk
    this.createFlashlightItem(0.2, 0.85, 8.3);

    // 3. Document #01 on reception counter
    this.createDocumentItem(-0.5, 0.82, 8.4, 'doc_manifest', 'Registro de Entrada (1994)');

    // 4. Block B Heavy Gate (Padlock Puzzle) at Z = 6
    this.createPadlockDoor(0, 0, 6, 'door_block_b', 'Porta do Bloco B');

    // 5. Security Guard Table & Fuse #1
    this.createTable(-7, 0, 9);
    this.createFuseItem(-7.2, 0.85, 8.8, 'fuse_01', 'Fusível Industrial 30A');
    this.createDocumentItem(-6.8, 0.82, 9.1, 'doc_audio_log', 'Fita 07 Transcrita');

    // 6. Security Locker / Safe
    this.createLocker(-9, 0, 7.5);

    // 7. Infirmary Beds and Medical screens
    this.createHospitalBed(4.5, 0, 1.5);
    this.createHospitalBed(7.2, 0, 1.5);
    this.createHospitalBed(4.5, 0, -0.5);

    // Fuse #2 inside Infirmary medicine cabinet
    this.createCabinet(8.2, 0, -1.2);
    this.createFuseItem(8.0, 0.85, -1.2, 'fuse_02', 'Fusível Industrial 50A');

    // Easter egg document in dark corner of infirmary
    this.createDocumentItem(8.2, 0.3, 4.2, 'doc_easter_egg', 'Nota Ensanguentada');

    // 8. Generator Room & Fuse Box Puzzle
    this.createGeneratorMachine(-5.5, 0, -3.5);
    this.createFuseBox(-7.5, 1.4, -6.8);

    // 9. Door to Archive Room (Keypad 1994)
    this.createKeypadDoor(0, 0, -8, 'door_archive', 'Porta Selada do Arquivo');

    // 10. Archive Room Props (Mysterious Pedestal, Final Mirror/Terminal)
    this.createArchivePedestal(0, 0, -13);
    this.createDocumentItem(0, 0.95, -13, 'doc_climax', 'Relatório Confidencial do Diretor');
    this.createFinalMirror(0, 1.6, -17.5);

    // Atmospheric Warning Signs
    this.createSign(-1.8, 1.9, 5.8, 'DANGER: QUARANTINE');
    this.createSign(1.8, 1.9, -7.8, 'RESTRICTED ARCHIVES');
  }

  createDesk(x, y, z) {
    const geo = new THREE.BoxGeometry(2.4, 0.8, 1.2);
    const desk = new THREE.Mesh(geo, this.materials.wood);
    desk.position.set(x, y + 0.4, z);
    this.scene.add(desk);

    this.colliders.push({
      minX: x - 1.25,
      maxX: x + 1.25,
      minZ: z - 0.65,
      maxZ: z + 0.65
    });
  }

  createTable(x, y, z) {
    const geo = new THREE.BoxGeometry(1.8, 0.8, 1.0);
    const table = new THREE.Mesh(geo, this.materials.metal);
    table.position.set(x, y + 0.4, z);
    this.scene.add(table);

    this.colliders.push({
      minX: x - 0.95,
      maxX: x + 0.95,
      minZ: z - 0.55,
      maxZ: z + 0.55
    });
  }

  createLocker(x, y, z) {
    const geo = new THREE.BoxGeometry(1.2, 2.2, 0.7);
    const locker = new THREE.Mesh(geo, this.materials.metal);
    locker.position.set(x, y + 1.1, z);
    this.scene.add(locker);

    this.colliders.push({
      minX: x - 0.65,
      maxX: x + 0.65,
      minZ: z - 0.4,
      maxZ: z + 0.4
    });
  }

  createHospitalBed(x, y, z) {
    const frameGeo = new THREE.BoxGeometry(1.1, 0.55, 2.2);
    const bed = new THREE.Mesh(frameGeo, this.materials.metal);
    bed.position.set(x, y + 0.28, z);
    this.scene.add(bed);

    // Stained mattress
    const matGeo = new THREE.BoxGeometry(0.95, 0.15, 2.0);
    const matMat = new THREE.MeshLambertMaterial({ color: 0x555852 });
    const mat = new THREE.Mesh(matGeo, matMat);
    mat.position.set(x, y + 0.6, z);
    this.scene.add(mat);

    this.colliders.push({
      minX: x - 0.6,
      maxX: x + 0.6,
      minZ: z - 1.15,
      maxZ: z + 1.15
    });
  }

  createCabinet(x, y, z) {
    const geo = new THREE.BoxGeometry(1.0, 1.6, 0.6);
    const cab = new THREE.Mesh(geo, this.materials.metal);
    cab.position.set(x, y + 0.8, z);
    this.scene.add(cab);

    this.colliders.push({
      minX: x - 0.55,
      maxX: x + 0.55,
      minZ: z - 0.35,
      maxZ: z + 0.35
    });
  }

  createGeneratorMachine(x, y, z) {
    const baseGeo = new THREE.BoxGeometry(2.8, 1.8, 2.0);
    const base = new THREE.Mesh(baseGeo, this.materials.metal);
    base.position.set(x, y + 0.9, z);
    this.scene.add(base);

    // Pipes on top
    const pipeGeo = new THREE.CylinderGeometry(0.18, 0.18, 1.2, 8);
    const pipeMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const pipe = new THREE.Mesh(pipeGeo, pipeMat);
    pipe.position.set(x + 0.5, y + 2.1, z);
    this.scene.add(pipe);

    this.colliders.push({
      minX: x - 1.5,
      maxX: x + 1.5,
      minZ: z - 1.1,
      maxZ: z + 1.1
    });
  }

  createSign(x, y, z, text) {
    const tex = TextureGenerator.createWarningSign(text);
    const geo = new THREE.PlaneGeometry(0.9, 0.45);
    const mat = new THREE.MeshBasicMaterial({ map: tex });
    const sign = new THREE.Mesh(geo, mat);
    sign.position.set(x, y, z);
    if (z > 0) sign.rotation.y = Math.PI;
    this.scene.add(sign);
  }

  createFlashlightItem(x, y, z) {
    const group = new THREE.Group();
    const bodyGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.26, 8);
    const headGeo = new THREE.CylinderGeometry(0.07, 0.05, 0.08, 8);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x202020 });
    const headMat = new THREE.MeshLambertMaterial({ color: 0xddaa22 });

    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.x = Math.PI / 2;
    const head = new THREE.Mesh(headGeo, headMat);
    head.rotation.x = Math.PI / 2;
    head.position.z = 0.15;

    group.add(body);
    group.add(head);
    group.position.set(x, y, z);
    this.scene.add(group);

    this.interactables.push({
      id: 'item_flashlight',
      type: 'item',
      name: 'Lanterna Portátil',
      prompt: 'Pegar Lanterna [E]',
      position: new THREE.Vector3(x, y, z),
      radius: 1.8,
      mesh: group,
      onInteract: () => {
        this.scene.remove(group);
        this.gameState.data.hasFlashlight = true;
        this.gameState.data.flashlightOn = true;
        this.gameState.addItem({
          id: 'item_flashlight',
          name: 'Lanterna Portátil',
          desc: 'Lanterna militar resistente. Tecla [F] para ligar/desligar.'
        });
        this.gameState.setObjective('Destranque o Bloco B. Encontre o código no Registro da recepção.');
        if (window.game) window.game.updateFlashlightLight();
      }
    });
  }

  createFuseItem(x, y, z, id, name) {
    const geo = new THREE.CylinderGeometry(0.035, 0.035, 0.16, 8);
    const mat = new THREE.MeshLambertMaterial({ color: 0x3388bb });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.z = Math.PI / 2;
    mesh.position.set(x, y, z);
    this.scene.add(mesh);

    this.interactables.push({
      id: id,
      type: 'item',
      name: name,
      prompt: `Pegar ${name} [E]`,
      position: new THREE.Vector3(x, y, z),
      radius: 1.8,
      mesh: mesh,
      onInteract: () => {
        this.scene.remove(mesh);
        this.gameState.data.fusesCollected++;
        this.gameState.addItem({
          id: id,
          name: name,
          desc: 'Fusível cerâmico industrial necessário para religar o painel do gerador.'
        });
        if (this.gameState.data.fusesCollected >= 2) {
          this.gameState.setObjective('Você possui os 2 fusíveis! Vá até a Sala do Gerador e insira-os no painel.');
        } else {
          this.gameState.setObjective('Encontre mais 1 fusível industrial na Enfermaria 03.');
        }
      }
    });
  }

  createDocumentItem(x, y, z, docId, title) {
    const geo = new THREE.PlaneGeometry(0.24, 0.32);
    const mesh = new THREE.Mesh(geo, this.materials.paper);
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = Math.random() * 0.4 - 0.2;
    mesh.position.set(x, y, z);
    this.scene.add(mesh);

    this.interactables.push({
      id: docId,
      type: 'document',
      name: title,
      prompt: `Ler ${title} [E]`,
      position: new THREE.Vector3(x, y, z),
      radius: 1.8,
      mesh: mesh,
      onInteract: () => {
        this.gameState.unlockDoc(docId);
        if (window.gameUI) {
          window.gameUI.showDocumentModal(docId);
        }
      }
    });
  }

  createPadlockDoor(x, y, z, id, name) {
    const doorGroup = new THREE.Group();
    const frameGeo = new THREE.BoxGeometry(2.2, 2.8, 0.15);
    const doorMesh = new THREE.Mesh(frameGeo, this.materials.metal);
    doorMesh.position.set(0, 1.4, 0);
    doorGroup.add(doorMesh);

    // Status indicator LED
    const ledGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const ledMesh = new THREE.Mesh(ledGeo, this.materials.glowRed);
    ledMesh.position.set(0.7, 1.5, 0.1);
    doorGroup.add(ledMesh);

    doorGroup.position.set(x, y, z);
    this.scene.add(doorGroup);

    const collider = {
      minX: x - 1.2,
      maxX: x + 1.2,
      minZ: z - 0.2,
      maxZ: z + 0.2,
      active: true
    };
    this.colliders.push(collider);

    this.doors[id] = {
      group: doorGroup,
      collider: collider,
      led: ledMesh,
      isOpen: false
    };

    this.interactables.push({
      id: id,
      type: 'puzzle',
      name: name,
      prompt: 'Trava com Código [E]',
      position: new THREE.Vector3(x, y + 1.4, z + 0.5),
      radius: 2.2,
      onInteract: () => {
        if (this.doors[id].isOpen) return;
        if (window.gameUI) {
          window.gameUI.showKeypadModal({
            title: 'PAINEL MANUAL DO BLOCO B',
            correctCode: '4815',
            onSuccess: () => {
              this.openDoor(id);
              this.gameState.data.doors[id] = true;
              this.gameState.data.puzzles.padlock_block_b = true;
              this.gameState.setObjective('Bloco B liberado! Corredor escuro à frente. Procure a Sala do Gerador.');
              if (window.game) window.game.triggerPsychologicalEvent('lights_flicker_block_b');
            }
          });
        }
      }
    });
  }

  createKeypadDoor(x, y, z, id, name) {
    const doorGroup = new THREE.Group();
    const frameGeo = new THREE.BoxGeometry(2.2, 2.8, 0.2);
    const doorMesh = new THREE.Mesh(frameGeo, this.materials.metal);
    doorMesh.position.set(0, 1.4, 0);
    doorGroup.add(doorMesh);

    const ledGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const ledMesh = new THREE.Mesh(ledGeo, this.materials.glowRed);
    ledMesh.position.set(0.7, 1.5, 0.12);
    doorGroup.add(ledMesh);

    doorGroup.position.set(x, y, z);
    this.scene.add(doorGroup);

    const collider = {
      minX: x - 1.2,
      maxX: x + 1.2,
      minZ: z - 0.2,
      maxZ: z + 0.2,
      active: true
    };
    this.colliders.push(collider);

    this.doors[id] = {
      group: doorGroup,
      collider: collider,
      led: ledMesh,
      isOpen: false
    };

    this.interactables.push({
      id: id,
      type: 'puzzle',
      name: name,
      prompt: 'Terminal Selado do Arquivo [E]',
      position: new THREE.Vector3(x, y + 1.4, z + 0.5),
      radius: 2.2,
      onInteract: () => {
        if (this.doors[id].isOpen) return;
        if (!this.gameState.data.puzzles.fuse_box) {
          window.gameUI.showNotification('SEM ENERGIA: Religue o gerador elétrico primeiro!');
          if (window.game && window.game.audio) window.game.audio.playDoorLocked();
          return;
        }

        if (window.gameUI) {
          window.gameUI.showKeypadModal({
            title: 'TERMINAL DO ARQUIVO CONFIDENCIAL',
            correctCode: '1994',
            onSuccess: () => {
              this.openDoor(id);
              this.gameState.data.doors[id] = true;
              this.gameState.data.puzzles.keypad_archive = true;
              this.gameState.setObjective('Arquivo Central aberto! Entre e descubra a origem da gravação.');
              if (window.game) window.game.triggerPsychologicalEvent('archive_opened');
            }
          });
        }
      }
    });
  }

  createFuseBox(x, y, z) {
    const boxGeo = new THREE.BoxGeometry(0.6, 0.8, 0.18);
    const box = new THREE.Mesh(boxGeo, this.materials.metal);
    box.position.set(x, y, z);
    this.scene.add(box);

    const statusLightGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const statusLight = new THREE.Mesh(statusLightGeo, this.materials.glowRed);
    statusLight.position.set(x, y + 0.25, z + 0.1);
    this.scene.add(statusLight);

    this.fuseBoxStatus = statusLight;

    this.interactables.push({
      id: 'puzzle_fuse_box',
      type: 'puzzle',
      name: 'Disjuntor Principal',
      prompt: 'Painel de Fusíveis [E]',
      position: new THREE.Vector3(x, y, z),
      radius: 2.0,
      onInteract: () => {
        if (this.gameState.data.puzzles.fuse_box) {
          window.gameUI.showNotification('O gerador já está em pleno funcionamento.');
          return;
        }

        if (this.gameState.data.fusesCollected < 2) {
          window.gameUI.showNotification(`Faltam fusíveis (${this.gameState.data.fusesCollected}/2 coletados). Procure na Sala de Guarda e na Enfermaria.`);
          return;
        }

        // Insert fuses
        this.gameState.removeItem('fuse_01');
        this.gameState.removeItem('fuse_02');
        this.gameState.data.puzzles.fuse_box = true;
        this.fuseBoxStatus.material = this.materials.glowGreen;

        if (window.game && window.game.audio) {
          window.game.audio.playKeypadBeep(true);
        }

        window.gameUI.showNotification('GERADOR REINICIADO: O terminal do Arquivo Central foi energizado!');
        this.gameState.setObjective('Energia restaurada! Vá até o final do corredor e acerte o código do Arquivo (1994).');

        if (window.game) {
          window.game.turnOnAuxiliaryLighting();
          window.game.triggerPsychologicalEvent('generator_humming');
        }
      }
    });
  }

  createArchivePedestal(x, y, z) {
    const pedGeo = new THREE.CylinderGeometry(0.4, 0.5, 0.9, 12);
    const ped = new THREE.Mesh(pedGeo, this.materials.metal);
    ped.position.set(x, y + 0.45, z);
    this.scene.add(ped);

    this.colliders.push({
      minX: x - 0.5,
      maxX: x + 0.5,
      minZ: z - 0.5,
      maxZ: z + 0.5
    });
  }

  createFinalMirror(x, y, z) {
    const frameGeo = new THREE.BoxGeometry(2.0, 2.4, 0.1);
    const mirror = new THREE.Mesh(frameGeo, new THREE.MeshBasicMaterial({ color: 0x050508 }));
    mirror.position.set(x, y, z);
    this.scene.add(mirror);

    // Interactive Climax Confrontation
    this.interactables.push({
      id: 'climax_choice',
      type: 'climax',
      name: 'O Espelho do Arquivo',
      prompt: 'Confrontar a Verdade [E]',
      position: new THREE.Vector3(x, y, z + 1.2),
      radius: 2.2,
      onInteract: () => {
        if (window.gameUI) {
          window.gameUI.showEndingChoiceModal();
        }
      }
    });
  }

  openDoor(id) {
    const door = this.doors[id];
    if (!door || door.isOpen) return;

    door.isOpen = true;
    door.collider.active = false;
    door.led.material = this.materials.glowGreen;

    if (window.game && window.game.audio) {
      window.game.audio.playDoorOpen();
    }

    // Animate swing
    let progress = 0;
    const animateDoor = () => {
      progress += 0.05;
      door.group.position.x += 0.07;
      if (progress < 1.0) {
        requestAnimationFrame(animateDoor);
      }
    };
    animateDoor();
  }

  placeLights() {
    // Ambient baseline dim light
    const ambient = new THREE.AmbientLight(0x1a1e22, 0.35);
    this.scene.add(ambient);

    // Reception fluorescent
    const recLight = new THREE.PointLight(0xaaccbb, 0.9, 11);
    recLight.position.set(0, 2.9, 9.5);
    this.scene.add(recLight);
    this.flickeringLights.push({ light: recLight, baseIntensity: 0.9 });

    // Corridor dim green tube
    const corrLight = new THREE.PointLight(0x77bb88, 0.45, 12);
    corrLight.position.set(0, 2.8, -1.0);
    this.scene.add(corrLight);
    this.flickeringLights.push({ light: corrLight, baseIntensity: 0.45 });

    // Security room orange bulb
    const secLight = new THREE.PointLight(0xdd9944, 0.65, 8);
    secLight.position.set(-7, 2.6, 9.0);
    this.scene.add(secLight);

    // Infirmary cold blue flicker
    const infLight = new THREE.PointLight(0x4488bb, 0.5, 9);
    infLight.position.set(5.5, 2.6, 1.5);
    this.scene.add(infLight);
    this.flickeringLights.push({ light: infLight, baseIntensity: 0.5 });

    // Generator room red emergency warning light
    const genLight = new THREE.PointLight(0xff2222, 0.7, 8);
    genLight.position.set(-5.5, 2.7, -3.5);
    this.scene.add(genLight);
    this.flickeringLights.push({ light: genLight, baseIntensity: 0.7 });

    // Archive room ominous white spotlight
    const archLight = new THREE.PointLight(0xddeeff, 0.8, 14);
    archLight.position.set(0, 3.2, -13);
    this.scene.add(archLight);
  }

  updateFlickers(delta) {
    for (let i = 0; i < this.flickeringLights.length; i++) {
      const item = this.flickeringLights[i];
      if (Math.random() < 0.04) {
        // Sudden brief dip or flash
        item.light.intensity = item.baseIntensity * (Math.random() < 0.4 ? 0.05 : 1.4);
      } else {
        item.light.intensity += (item.baseIntensity - item.light.intensity) * 5 * delta;
      }
    }
  }
}

window.LevelBuilder = LevelBuilder;
