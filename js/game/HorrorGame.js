/**
 * Main 3D Game Engine (Three.js WebGL)
 * Coordinates render loop, level instantiation, player camera, flashlight spotlight, raycasting interactions, audio cues, and psychological events
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

    // Raycaster for interact prompt
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 2.8;

    this.initThree();
  }

  initThree() {
    this.ui.showLoading(15, 'INICIALIZANDO MOTOR GRÁFICO WEBGL...');

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0c0e10, 0.085);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      40
    );

    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: false, // Performance optimization for horror grainy look
      stencil: false,
      depth: true
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setClearColor(0x0c0e10, 1);

    this.container.appendChild(this.renderer.domElement);

    this.ui.showLoading(45, 'RECONSTRUINDO SUBSOLO 04...');

    // Flashlight SpotLight attached to camera
    this.flashlight = new THREE.SpotLight(0xfff5dd, 2.8, 16, Math.PI / 6.5, 0.45, 1.2);
    this.flashlightTarget = new THREE.Object3D();
    this.scene.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;
    this.scene.add(this.flashlight);
    this.flashlight.visible = false;

    // Player Controller
    this.player = new PlayerController(this.camera, document.body, this.gameState, this.audio);

    // Build World
    this.levelBuilder = new LevelBuilder(this.scene, this.gameState);
    const worldData = this.levelBuilder.buildComplex();
    this.player.setColliders(worldData.colliders);
    this.interactables = worldData.interactables;

    this.ui.showLoading(85, 'CALIBRANDO SENSORES DE ÁUDIO E CÂMERA...');

    window.addEventListener('resize', () => this.onWindowResize());

    this.applyQualitySettings();

    // Finish loading
    setTimeout(() => {
      this.ui.showLoading(100, 'SISTEMA PRONTO.');
      setTimeout(() => {
        this.ui.hideLoading();
      }, 500);
    }, 400);

    // Start render loop
    requestAnimationFrame((t) => this.renderLoop(t));
  }

  startSession() {
    this.audio.startAmbient();
    this.player.teleport(0, 1.7, 12, 0); // Reception start facing North
    this.updateFlashlightLight();

    // Check if player had completed doors/puzzles from save
    if (this.gameState.data.puzzles.padlock_block_b) {
      this.levelBuilder.openDoor('door_block_b');
    }
    if (this.gameState.data.puzzles.keypad_archive) {
      this.levelBuilder.openDoor('door_archive');
    }
    if (this.gameState.data.puzzles.fuse_box && this.levelBuilder.fuseBoxStatus) {
      this.levelBuilder.fuseBoxStatus.material = this.levelBuilder.materials.glowGreen;
    }
  }

  applyQualitySettings() {
    const q = this.gameState.settings.quality;
    const lowPerf = this.gameState.settings.lowPerformanceMode;

    if (q === 'LOW' || lowPerf) {
      this.renderer.setPixelRatio(0.85);
      this.camera.far = 22;
      this.scene.fog.density = 0.12;
    } else if (q === 'MEDIUM') {
      this.renderer.setPixelRatio(1.0);
      this.camera.far = 30;
      this.scene.fog.density = 0.09;
    } else { // HIGH
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      this.camera.far = 40;
      this.scene.fog.density = 0.085;
    }
    this.camera.updateProjectionMatrix();
    this.ui.updateVhsOverlayIntensity();
  }

  toggleFlashlight() {
    if (!this.gameState.data.hasFlashlight) {
      this.ui.showNotification('Você ainda não possui uma lanterna.');
      return;
    }

    this.gameState.data.flashlightOn = !this.gameState.data.flashlightOn;
    this.updateFlashlightLight();
    this.audio.playFlashlightClick();
  }

  updateFlashlightLight() {
    const isVisible = this.gameState.data.hasFlashlight && this.gameState.data.flashlightOn;
    this.flashlight.visible = isVisible;
  }

  interact() {
    if (this.activeInteractable && this.activeInteractable.onInteract) {
      this.activeInteractable.onInteract();
    }
  }

  turnOnAuxiliaryLighting() {
    const auxLight = new THREE.PointLight(0xccddaa, 0.7, 16);
    auxLight.position.set(0, 2.8, -6);
    this.scene.add(auxLight);
  }

  triggerPsychologicalEvent(eventId) {
    if (this.gameState.data.eventsTriggered[eventId]) return;
    this.gameState.data.eventsTriggered[eventId] = true;

    switch (eventId) {
      case 'lights_flicker_block_b':
        this.audio.playGlitchStatic(0.4);
        this.ui.showNotification('ELETROMAGNETISMO INSTÁVEL: As luzes do Bloco B oscilaram...');
        break;

      case 'generator_humming':
        this.audio.playDistortedRadio();
        break;

      case 'archive_opened':
        this.audio.playBreathing();
        this.ui.showNotification('"Não confie na gravação... você esteve aqui antes."');
        break;
    }
  }

  checkRaycastInteractions() {
    // Check distance and facing vector from camera
    this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);
    let closestItem = null;
    let closestDist = 2.4;

    const pPos = this.camera.position;
    for (let i = 0; i < this.interactables.length; i++) {
      const item = this.interactables[i];
      const dist = pPos.distanceTo(item.position);
      if (dist < (item.radius || 2.0)) {
        // Also check if looking generally in its direction
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
      this.levelBuilder.updateFlickers(delta);

      // Keep flashlight aligned with camera view
      if (this.flashlight.visible) {
        this.flashlight.position.copy(this.camera.position);
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        this.flashlightTarget.position.copy(this.camera.position).add(forward.multiplyScalar(5));
      }

      this.checkRaycastInteractions();
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new HorrorGame();
});
