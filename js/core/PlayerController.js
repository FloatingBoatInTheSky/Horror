/**
 * First-person Controller with Dual Input:
 * - PC: PointerLock, WASD, Shift (Sprint), C (Crouch), F (Flashlight), E (Interact), ESC (Pause)
 * - Mobile: Virtual Joystick (movement), Touch swipe (camera look), on-screen buttons (Interact, Flashlight, Sprint, Pause)
 * - Gamepad: Left stick (move), Right stick (look), A (interact), Y/X (flashlight), B (sprint), Start (pause)
 */
class PlayerController {
  constructor(camera, domElement, gameState, audio) {
    this.camera = camera;
    this.domElement = domElement || document.body;
    this.gameState = gameState;
    this.audio = audio;

    // Spatial Position & Speeds
    this.position = new THREE.Vector3(0, 1.7, 10);
    this.camera.position.copy(this.position);
    this.camera.rotation.order = 'YXZ';

    this.pitch = 0;
    this.yaw = 0;

    this.walkSpeed = 3.2;
    this.runSpeed = 5.2;
    this.crouchSpeed = 1.8;

    this.standingHeight = 1.7;
    this.crouchHeight = 1.05;
    this.currentHeight = 1.7;

    this.isCrouching = false;
    this.isRunning = false;

    // Movement state
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;

    // Collision radius
    this.radius = 0.42;

    // Head bobbing
    this.bobTimer = 0;
    this.stepTimer = 0;

    // Mobile touch tracking
    this.touchLookId = null;
    this.lastTouchLookX = 0;
    this.lastTouchLookY = 0;

    this.joystickVector = { x: 0, y: 0 };

    this.isLocked = false;
    this.enabled = true;

    // World collision boxes (AABBs populated by LevelBuilder)
    this.colliders = [];

    this.initEvents();
  }

  setColliders(boxes) {
    this.colliders = boxes;
  }

  initEvents() {
    // Keyboard
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));

    // Mouse Pointer Lock
    this.domElement.addEventListener('click', () => {
      if (this.enabled && !this.isMobile() && !this.isLocked && !window.gameUI.isAnyModalOpen()) {
        this.domElement.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === this.domElement;
      if (!this.isLocked && !window.gameUI.isPaused && !window.gameUI.isAnyModalOpen()) {
        // Paused if user unlocked mouse during game
        if (window.gameUI && window.gameUI.isPlaying) {
          window.gameUI.togglePause(true);
        }
      }
    });

    document.addEventListener('mousemove', (e) => this.onMouseMove(e));

    // Touch events for right side (camera look)
    const touchLookZone = document.getElementById('touch-look-zone');
    if (touchLookZone) {
      touchLookZone.addEventListener('touchstart', (e) => this.onTouchLookStart(e), { passive: false });
      touchLookZone.addEventListener('touchmove', (e) => this.onTouchLookMove(e), { passive: false });
      touchLookZone.addEventListener('touchend', (e) => this.onTouchLookEnd(e), { passive: false });
      touchLookZone.addEventListener('touchcancel', (e) => this.onTouchLookEnd(e), { passive: false });
    }
  }

  isMobile() {
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.innerWidth < 900;
  }

  onKeyDown(e) {
    if (!this.enabled || window.gameUI.isPaused || window.gameUI.isAnyModalOpen()) return;

    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.isRunning = true;
        break;
      case 'KeyC':
      case 'ControlLeft':
        this.isCrouching = !this.isCrouching;
        break;
      case 'KeyF':
        if (window.game) window.game.toggleFlashlight();
        break;
      case 'KeyE':
        if (window.game) window.game.interact();
        break;
      case 'Escape':
        if (window.gameUI && window.gameUI.isPlaying) {
          window.gameUI.togglePause();
        }
        break;
    }
  }

  onKeyUp(e) {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.isRunning = false;
        break;
    }
  }

  onMouseMove(e) {
    if (!this.enabled || !this.isLocked || window.gameUI.isPaused) return;

    const sens = 0.0022 * (this.gameState.settings.mouseSensitivity || 1.0);
    this.yaw -= e.movementX * sens;
    this.pitch -= e.movementY * sens;

    // Limit pitch to prevent neck snapping
    const maxPitch = Math.PI / 2 - 0.05;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));

    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }

  onTouchLookStart(e) {
    if (!this.enabled || window.gameUI.isPaused) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (this.touchLookId === null) {
        this.touchLookId = touch.identifier;
        this.lastTouchLookX = touch.clientX;
        this.lastTouchLookY = touch.clientY;
        break;
      }
    }
  }

  onTouchLookMove(e) {
    if (!this.enabled || window.gameUI.isPaused) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.touchLookId) {
        const dx = touch.clientX - this.lastTouchLookX;
        const dy = touch.clientY - this.lastTouchLookY;
        this.lastTouchLookX = touch.clientX;
        this.lastTouchLookY = touch.clientY;

        const sens = 0.0045 * (this.gameState.settings.mouseSensitivity || 1.0);
        this.yaw -= dx * sens;
        this.pitch -= dy * sens;

        const maxPitch = Math.PI / 2 - 0.08;
        this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
        this.camera.rotation.set(this.pitch, this.yaw, 0);
        e.preventDefault();
        break;
      }
    }
  }

  onTouchLookEnd(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === this.touchLookId) {
        this.touchLookId = null;
        break;
      }
    }
  }

  updateGamepad(delta) {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    if (!gamepads || !gamepads[0]) return;
    const gp = gamepads[0];

    const deadzone = 0.15;
    // Left stick: movement
    const lx = Math.abs(gp.axes[0]) > deadzone ? gp.axes[0] : 0;
    const ly = Math.abs(gp.axes[1]) > deadzone ? gp.axes[1] : 0;
    if (Math.abs(lx) > 0 || Math.abs(ly) > 0) {
      this.joystickVector.x = lx;
      this.joystickVector.y = -ly;
    }

    // Right stick: look
    const rx = Math.abs(gp.axes[2]) > deadzone ? gp.axes[2] : 0;
    const ry = Math.abs(gp.axes[3]) > deadzone ? gp.axes[3] : 0;
    if (Math.abs(rx) > 0 || Math.abs(ry) > 0) {
      const sens = 2.4 * delta * (this.gameState.settings.mouseSensitivity || 1.0);
      this.yaw -= rx * sens;
      this.pitch -= ry * sens;
      const maxPitch = Math.PI / 2 - 0.08;
      this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
      this.camera.rotation.set(this.pitch, this.yaw, 0);
    }

    // Button A (0): Interact
    if (gp.buttons[0] && gp.buttons[0].pressed) {
      if (!this._prevButtonA && window.game) window.game.interact();
      this._prevButtonA = true;
    } else {
      this._prevButtonA = false;
    }

    // Button X / Y (2 or 3): Flashlight
    if ((gp.buttons[2] && gp.buttons[2].pressed) || (gp.buttons[3] && gp.buttons[3].pressed)) {
      if (!this._prevButtonFlash && window.game) window.game.toggleFlashlight();
      this._prevButtonFlash = true;
    } else {
      this._prevButtonFlash = false;
    }

    // Button B (1): Sprint
    this.isRunning = gp.buttons[1] && gp.buttons[1].pressed;
  }

  update(delta) {
    if (!this.enabled || window.gameUI.isPaused) return;

    this.updateGamepad(delta);

    // Height smoothing for crouch
    const targetHeight = this.isCrouching ? this.crouchHeight : this.standingHeight;
    this.currentHeight += (targetHeight - this.currentHeight) * 10 * delta;

    // Movement direction in local space
    let moveX = 0;
    let moveZ = 0;

    if (this.moveForward) moveZ += 1;
    if (this.moveBackward) moveZ -= 1;
    if (this.moveLeft) moveX -= 1;
    if (this.moveRight) moveX += 1;

    // Add mobile joystick / gamepad inputs
    if (Math.abs(this.joystickVector.x) > 0.05 || Math.abs(this.joystickVector.y) > 0.05) {
      moveX += this.joystickVector.x;
      moveZ += this.joystickVector.y;
    }

    const inputLength = Math.hypot(moveX, moveZ);
    const isMoving = inputLength > 0.1;

    if (isMoving) {
      const speed = this.isCrouching ? this.crouchSpeed : (this.isRunning ? this.runSpeed : this.walkSpeed);
      const normX = (moveX / Math.max(1, inputLength)) * speed * delta;
      const normZ = (moveZ / Math.max(1, inputLength)) * speed * delta;

      // Rotate local input by camera yaw
      const sin = Math.sin(this.yaw);
      const cos = Math.cos(this.yaw);

      const dx = normX * cos - normZ * sin;
      const dz = -normX * sin - normZ * cos;

      // Attempt move with axis-separated collision resolution
      this.moveWithCollision(dx, dz);

      // Footstep & head bobbing
      const bobFreq = this.isRunning ? 14 : (this.isCrouching ? 7 : 10);
      this.bobTimer += delta * bobFreq;

      this.stepTimer += delta * (this.isRunning ? 1.6 : 1.0);
      if (this.stepTimer > 0.48) {
        this.stepTimer = 0;
        if (this.audio) this.audio.playFootstep('concrete', this.isRunning);
      }
    } else {
      this.stepTimer = 0.3;
    }

    // Apply head bob
    const bobAmount = (this.gameState.settings.cameraBobbing && !this.gameState.settings.reduceMotion && isMoving)
      ? Math.sin(this.bobTimer) * (this.isRunning ? 0.045 : 0.025)
      : 0;

    this.camera.position.x = this.position.x;
    this.camera.position.y = this.position.y - (this.standingHeight - this.currentHeight) + bobAmount;
    this.camera.position.z = this.position.z;
  }

  moveWithCollision(dx, dz) {
    // Test X move
    const newX = this.position.x + dx;
    if (!this.checkCollision(newX, this.position.z)) {
      this.position.x = newX;
    }

    // Test Z move
    const newZ = this.position.z + dz;
    if (!this.checkCollision(this.position.x, newZ)) {
      this.position.z = newZ;
    }
  }

  checkCollision(x, z) {
    const minX = x - this.radius;
    const maxX = x + this.radius;
    const minZ = z - this.radius;
    const maxZ = z + this.radius;

    for (let i = 0; i < this.colliders.length; i++) {
      const box = this.colliders[i];
      if (box.active === false) continue;

      // 2D overlap check in XZ plane
      if (maxX > box.minX && minX < box.maxX &&
          maxZ > box.minZ && minZ < box.maxZ) {
        return true;
      }
    }
    return false;
  }

  teleport(x, y, z, yaw = 0) {
    this.position.set(x, y, z);
    this.yaw = yaw;
    this.pitch = 0;
    this.camera.rotation.set(0, yaw, 0);
  }
}

window.PlayerController = PlayerController;
