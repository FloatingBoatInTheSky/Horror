/**
 * Main 3D Game Engine (Three.js WebGL)
 * Coordinates:
 * - PSX Low-fi atmosphere & dithering tone
 * - Player first-person camera, visible arm mesh, stamina
 * - Entity observation mechanic ("Pretend It's Not There"):
 *   Looking directly at the entity increases paranoia and triggers heartbeat/glitch.
 *   Looking away or doing routine tasks calms the player and advances time.
 */
class HorrorGame {
  constructor() {
    this.container = document.getElementById('webgl-canvas-container');
    this.audio = new HorrorAudio();
    this.gameState = new GameState();
    this.ui = new GameUI(this.gameState, this.audio);
    window.gameUI = this.ui;
    window.game = this;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.player = null;
    this.levelBuilder = null;

    this.flashlight = null;
    this.flashlightTarget = null;

    this.lastTime = performance.now();
    this.interactables = [];
    this.activeInteractable = null;

    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 2.6;

    this.entityCheckTimer = 0;

    this.initThree();
  }

  initThree() {
    this.ui.showLoading(20, 'INICIALIZANDO CASA DE BLACKWOOD PINES...');

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0e1114, 0.095);

    this.camera = new THREE.PerspectiveCamera(
      68,
      window.innerWidth / window.innerHeight,
      0.1,
      35
    );

    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: false,
      stencil: false,
      depth: true
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    this.renderer.setClearColor(0x0a0c0e, 1);

    this.container.appendChild(this.renderer.domElement);

    this.ui.showLoading(50, 'GERANDO MOBÍLIA E TÁBUAS DO PISO...');

    // Flashlight SpotLight attached to player view
    this.flashlight = new THREE.SpotLight(0xfff0cc, 2.6, 14, Math.PI / 6.5, 0.4, 1.3);
    this.flashlightTarget = new THREE.Object3D();
    this.scene.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;
    this.scene.add(this.flashlight);
    this.flashlight.visible = false;

    // Player Controller
    this.player = new PlayerController(this.camera, document.body, this.gameState, this.audio);
    this.scene.add(this.camera);

    // Build House
    this.levelBuilder = new LevelBuilder(this.scene, this.gameState);
    const worldData = this.levelBuilder.buildHouse();
    this.player.setColliders(worldData.colliders);
    this.interactables = worldData.interactables;

    this.ui.showLoading(85, 'SINTETIZANDO FONTES ACÚSTICAS...');

    window.addEventListener('resize', () => this.onWindowResize());
    this.applyQualitySettings();

    setTimeout(() => {
      this.ui.showLoading(100, 'PRONTO.');
      setTimeout(() => {
        this.ui.hideLoading();
      }, 400);
    }, 400);

    requestAnimationFrame((t) => this.renderLoop(t));
  }

  startSession() {
    this.audio.startAmbient();
    // Start in Bedroom beside bed
    this.player.teleport(-1.2, 1.7, 6.2, 0);
    this.updateFlashlightLight();

    if (this.gameState.data.curtainsClosed && this.levelBuilder.curtainsMesh) {
      this.levelBuilder.curtainsMesh.scale.x = 1.0;
    }
  }

  applyQualitySettings() {
    const q = this.gameState.settings.quality;
    const lowPerf = this.gameState.settings.lowPerformanceMode;

    if (q === 'LOW' || lowPerf) {
      this.renderer.setPixelRatio(0.75);
      this.camera.far = 20;
      this.scene.fog.density = 0.14;
    } else if (q === 'MEDIUM') {
      this.renderer.setPixelRatio(1.0);
      this.camera.far = 28;
      this.scene.fog.density = 0.11;
    } else {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
      this.camera.far = 35;
      this.scene.fog.density = 0.095;
    }
    this.camera.updateProjectionMatrix();
  }

  toggleFlashlight() {
    if (!this.gameState.data.hasFlashlight) {
      this.ui.showNotification('Você precisa pegar a lanterna na cômoda primeiro.');
      return;
    }

    this.gameState.data.flashlightOn = !this.gameState.data.flashlightOn;
    this.updateFlashlightLight();
    this.audio.playFlashlightClick();
  }

  updateFlashlightLight() {
    const isVisible = this.gameState.data.hasFlashlight && this.gameState.data.flashlightOn;
    this.flashlight.visible = isVisible;
    if (this.player && this.player.flashlightMesh) {
      this.player.flashlightMesh.visible = isVisible;
    }
  }

  interact() {
    if (this.activeInteractable && this.activeInteractable.onInteract) {
      this.activeInteractable.onInteract();
    }
  }

  triggerPsychologicalEvent(eventId) {
    switch (eventId) {
      case 'basement_opened':
        this.audio.playEntityGlitch();
        this.ui.showNotification('O ar do porão cheira a terra úmida e feno velho...');
        break;
    }
  }

  checkRaycastInteractions() {
    this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);
    let closestItem = null;
    let closestDist = 2.4;

    const pPos = this.camera.position;
    for (let i = 0; i < this.interactables.length; i++) {
      const item = this.interactables[i];
      const dist = pPos.distanceTo(item.position);
      if (dist < (item.radius || 2.0)) {
        const dirToItem = item.position.clone().sub(pPos).normalize();
        const camDir = new THREE.Vector3();
        this.camera.getWorldDirection(camDir);
        const dot = camDir.dot(dirToItem);
        if (dot > 0.65 && dist < closestDist) {
          closestItem = item;
          closestDist = dist;
        }
      }
    }

    this.activeInteractable = closestItem;
    if (closestItem) {
      this.ui.showInteractPrompt(closestItem.prompt || 'Interagir [E]');
    } else {
      this.ui.showInteractPrompt(null);
    }
  }

  updateEntityObservation(delta) {
    // Entity appears during later hours (e.g. routine step >= 4)
    if (!this.levelBuilder.entityMesh) return;

    if (this.gameState.data.routineStep >= 4) {
      this.levelBuilder.entityMesh.visible = true;

      // Check if player is directly looking at entity
      const entPos = this.levelBuilder.entityMesh.position;
      const camPos = this.camera.position;
      const distToEnt = camPos.distanceTo(entPos);

      const dirToEnt = entPos.clone().sub(camPos).normalize();
      const camDir = new THREE.Vector3();
      this.camera.getWorldDirection(camDir);
      const dot = camDir.dot(dirToEnt);

      if (dot > 0.72 && distToEnt < 12) {
        // Player is staring directly at the entity!
        this.gameState.data.paranoia = Math.min(100, this.gameState.data.paranoia + delta * 28);
        this.audio.playHeartbeat();

        if (this.gameState.data.paranoia >= 95) {
          this.ui.showNotification('VOCÊ OLHOU POR MUITO TEMPO! ELA ESTÁ SE APROXIMANDO!');
          this.audio.playEntityGlitch();
        }
      } else {
        // Player is looking away! Paranoia steadily drains (The Core Rule: Pretend It's Not There)
        this.gameState.data.paranoia = Math.max(10, this.gameState.data.paranoia - delta * 14);
      }

      this.ui.updateParanoiaBar(this.gameState.data.paranoia / 100);
    } else {
      this.levelBuilder.entityMesh.visible = false;
    }
  }

  onWindowResize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  renderLoop(time) {
    requestAnimationFrame((t) => this.renderLoop(t));

    const delta = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    if (this.ui.isPlaying && !this.ui.isPaused) {
      this.player.update(delta);
      this.levelBuilder.update(delta);

      if (this.flashlight.visible) {
        this.flashlight.position.copy(this.camera.position);
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        this.flashlightTarget.position.copy(this.camera.position).add(forward.multiplyScalar(5));
      }

      this.checkRaycastInteractions();
      this.updateEntityObservation(delta);
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new HorrorGame();
});
