/**
 * First-person Controller with Visible Player Arms & Hands (holding flashlight)
 * Features:
 * - Dynamic head bobbing & natural camera sway
 * - Stamina bar (Sprint consumes stamina, exhausted panting sound)
 * - Jump & land physics with SFX
 * - Dual inputs (PC, Touch Joystick, Gamepad)
 * - Rigged first-person arm mesh in camera viewport
 */
class PlayerController {
  constructor(camera, domElement, gameState, audio) {
    this.camera = camera;
    this.domElement = domElement || document.body;
    this.gameState = gameState;
    this.audio = audio;

    // Spatial Position & Physics
    this.position = new THREE.Vector3(0, 1.7, 6);
    this.camera.position.copy(this.position);
    this.camera.rotation.order = 'YXZ';

    this.pitch = 0;
    this.yaw = 0;

    // Speeds
    this.walkSpeed = 3.0;
    this.runSpeed = 5.2;
    this.crouchSpeed = 1.6;

    // Jump & Gravity
    this.velocityY = 0;
    this.gravity = -18.0;
    this.jumpForce = 5.6;
    this.isGrounded = true;

    // Heights
    this.standingHeight = 1.7;
    this.crouchHeight = 1.05;
    this.currentHeight = 1.7;

    this.isCrouching = false;
    this.isRunning = false;

    // Stamina
    this.stamina = 100;
    this.maxStamina = 100;
    this.staminaExhausted = false;
    this.exhaustTimer = 0;

    // Movement state
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;

    // Collision radius
    this.radius = 0.42;

    // Head bobbing & camera roll sway
    this.bobTimer = 0;
    this.stepTimer = 0;
    this.cameraRoll = 0;

    // Mobile touch tracking
    this.touchLookId = null;
    this.lastTouchLookX = 0;
    this.lastTouchLookY = 0;
    this.joystickVector = { x: 0, y: 0 };

    this.isLocked = false;
    this.enabled = true;
    this.colliders = [];

    // Visible First-Person Arm & Hand Model
    this.armGroup = null;
    this.flashlightMesh = null;
    this.initFirstPersonArms();

    this.initEvents();
  }

  initFirstPersonArms() {
    this.armGroup = new THREE.Group();

    // Low-poly retro sleeve (dark wool sweater)
    const sleeveGeo = new THREE.CylinderGeometry(0.065, 0.08, 0.38, 8);
    const sleeveMat = new THREE.MeshLambertMaterial({ color: 0x22262a });
    const sleeve = new THREE.Mesh(sleeveGeo, sleeveMat);
    sleeve.position.set(0, 0, -0.15);
    sleeve.rotation.x = Math.PI / 2.3;

    // Low-poly forearm / skin hand
    const handGeo = new THREE.BoxGeometry(0.08, 0.06, 0.14);
    const skinTex = TextureGenerator.createSkinTexture();
    const handMat = new THREE.MeshLambertMaterial({ map: skinTex, color: 0xc49b80 });
    const hand = new THREE.Mesh(handGeo, handMat);
    hand.position.set(0, -0.04, 0.06);

    // Flashlight in hand
    const flGroup = new THREE.Group();
    const flBodyGeo = new THREE.CylinderGeometry(0.024, 0.03, 0.22, 8);
    const flHeadGeo = new THREE.CylinderGeometry(0.045, 0.03, 0.06, 8);
    const flMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1c });
    const flHeadMat = new THREE.MeshLambertMaterial({ color: 0xaa8833 });

    const flBody = new THREE.Mesh(flBodyGeo, flMat);
    flBody.rotation.x = Math.PI / 2;
    const flHead = new THREE.Mesh(flHeadGeo, flHeadMat);
    flHead.rotation.x = Math.PI / 2;
    flHead.position.z = 0.12;

    flGroup.add(flBody);
    flGroup.add(flHead);
    flGroup.position.set(0, -0.02, 0.12);
    flGroup.rotation.x = -0.1;

    this.armGroup.add(sleeve);
    this.armGroup.add(hand);
    this.armGroup.add(flGroup);
    this.flashlightMesh = flGroup;

    // Position arm in bottom right corner of camera view
    this.armGroup.position.set(0.24, -0.22, -0.45);
    this.armGroup.rotation.set(-0.1, -0.2, 0.12);

    this.camera.add(this.armGroup);
  }

  setColliders(boxes) {
    this.colliders = boxes;
  }

  initEvents() {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));

    this.domElement.addEventListener('click', () => {
      if (this.enabled && !this.isMobile() && !this.isLocked && !window.gameUI.isAnyModalOpen()) {
        this.domElement.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === this.domElement;
      if (!this.isLocked && !window.gameUI.isPaused && !window.gameUI.isAnyModalOpen()) {
        if (window.gameUI && window.gameUI.isPlaying) {
          window.gameUI.togglePause(true);
        }
      }
    });

    document.addEventListener('mousemove', (e) => this.onMouseMove(e));

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
      case 'Space':
        this.jump();
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        if (!this.staminaExhausted && this.stamina > 15) {
          this.isRunning = true;
        }
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
      case 'Digit1':
      case 'Digit2':
      case 'Digit3':
      case 'Digit4':
      case 'Digit5':
        const slotIdx = parseInt(e.key) - 1;
        if (window.gameUI) window.gameUI.selectInventorySlot(slotIdx);
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

  jump() {
    if (this.isGrounded && !this.isCrouching) {
      this.velocityY = this.jumpForce;
      this.isGrounded = false;
      if (this.audio) this.audio.playJump();
    }
  }

  onMouseMove(e) {
    if (!this.enabled || !this.isLocked || window.gameUI.isPaused) return;

    const sens = 0.0022 * (this.gameState.settings.mouseSensitivity || 1.0);
    this.yaw -= e.movementX * sens;
    this.pitch -= e.movementY * sens;

    const maxPitch = Math.PI / 2 - 0.08;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));

    // Dynamic camera sway roll when turning mouse quickly
    this.cameraRoll = -e.movementX * 0.0006;
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
        this.cameraRoll = -dx * 0.0008;
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
    const lx = Math.abs(gp.axes[0]) > deadzone ? gp.axes[0] : 0;
    const ly = Math.abs(gp.axes[1]) > deadzone ? gp.axes[1] : 0;
    if (Math.abs(lx) > 0 || Math.abs(ly) > 0) {
      this.joystickVector.x = lx;
      this.joystickVector.y = -ly;
    }

    const rx = Math.abs(gp.axes[2]) > deadzone ? gp.axes[2] : 0;
    const ry = Math.abs(gp.axes[3]) > deadzone ? gp.axes[3] : 0;
    if (Math.abs(rx) > 0 || Math.abs(ry) > 0) {
      const sens = 2.4 * delta * (this.gameState.settings.mouseSensitivity || 1.0);
      this.yaw -= rx * sens;
      this.pitch -= ry * sens;
      const maxPitch = Math.PI / 2 - 0.08;
      this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
    }

    if (gp.buttons[0] && gp.buttons[0].pressed) {
      if (!this._prevButtonA && window.game) window.game.interact();
      this._prevButtonA = true;
    } else {
      this._prevButtonA = false;
    }

    if ((gp.buttons[2] && gp.buttons[2].pressed) || (gp.buttons[3] && gp.buttons[3].pressed)) {
      if (!this._prevButtonFlash && window.game) window.game.toggleFlashlight();
      this._prevButtonFlash = true;
    } else {
      this._prevButtonFlash = false;
    }

    this.isRunning = gp.buttons[1] && gp.buttons[1].pressed;
  }

  update(delta) {
    if (!this.enabled || window.gameUI.isPaused) return;

    this.updateGamepad(delta);

    // Height smoothing for crouch
    const targetHeight = this.isCrouching ? this.crouchHeight : this.standingHeight;
    this.currentHeight += (targetHeight - this.currentHeight) * 10 * delta;

    // Movement direction
    let moveX = 0;
    let moveZ = 0;

    if (this.moveForward) moveZ += 1;
    if (this.moveBackward) moveZ -= 1;
    if (this.moveLeft) moveX -= 1;
    if (this.moveRight) moveX += 1;

    if (Math.abs(this.joystickVector.x) > 0.05 || Math.abs(this.joystickVector.y) > 0.05) {
      moveX += this.joystickVector.x;
      moveZ += this.joystickVector.y;
    }

    const inputLength = Math.hypot(moveX, moveZ);
    const isMoving = inputLength > 0.1;

    // Stamina calculation
    if (isMoving && this.isRunning && !this.isCrouching) {
      this.stamina = Math.max(0, this.stamina - delta * 24);
      if (this.stamina <= 0) {
        this.isRunning = false;
        this.staminaExhausted = true;
        this.audio.playExhaustedPant();
      }
    } else {
      // Regenerate stamina
      this.stamina = Math.min(this.maxStamina, this.stamina + delta * 15);
      if (this.stamina > 35) {
        this.staminaExhausted = false;
      }
    }

    if (window.gameUI) {
      window.gameUI.updateStaminaBar(this.stamina / this.maxStamina);
    }

    // Velocity & Speed
    if (isMoving) {
      const speed = this.isCrouching ? this.crouchSpeed : (this.isRunning ? this.runSpeed : this.walkSpeed);
      const normX = (moveX / Math.max(1, inputLength)) * speed * delta;
      const normZ = (moveZ / Math.max(1, inputLength)) * speed * delta;

      const sin = Math.sin(this.yaw);
      const cos = Math.cos(this.yaw);

      const dx = normX * cos - normZ * sin;
      const dz = -normX * sin - normZ * cos;

      this.moveWithCollision(dx, dz);

      // Footstep & head bobbing
      const bobFreq = this.isRunning ? 13 : (this.isCrouching ? 7 : 9.5);
      this.bobTimer += delta * bobFreq;

      this.stepTimer += delta * (this.isRunning ? 1.7 : 1.0);
      if (this.stepTimer > 0.52) {
        this.stepTimer = 0;
        if (this.audio && this.isGrounded) {
          this.audio.playFootstep('wood', this.isRunning);
        }
      }
    } else {
      this.stepTimer = 0.35;
      this.bobTimer += delta * 1.5; // subtle breathing sway while standing
    }

    // Jump / Gravity Physics
    if (!this.isGrounded) {
      this.velocityY += this.gravity * delta;
      this.position.y += this.velocityY * delta;

      if (this.position.y <= this.standingHeight) {
        this.position.y = this.standingHeight;
        this.velocityY = 0;
        this.isGrounded = true;
        if (this.audio) this.audio.playLand();
      }
    }

    // Smooth return of camera roll
    this.cameraRoll *= (1.0 - 8.0 * delta);

    // Apply head bob
    const bobAmount = (this.gameState.settings.cameraBobbing && !this.gameState.settings.reduceMotion && isMoving && this.isGrounded)
      ? Math.sin(this.bobTimer) * (this.isRunning ? 0.052 : 0.026)
      : Math.sin(this.bobTimer * 0.8) * 0.005;

    const swayX = Math.cos(this.bobTimer * 0.5) * (isMoving ? 0.015 : 0.002);

    this.camera.position.x = this.position.x + swayX;
    this.camera.position.y = this.position.y - (this.standingHeight - this.currentHeight) + bobAmount;
    this.camera.position.z = this.position.z;

    this.camera.rotation.set(this.pitch, this.yaw, this.cameraRoll);

    // Animate Visible Arm Sway & Bobbing
    if (this.armGroup) {
      const armBobY = -0.22 + Math.sin(this.bobTimer) * (isMoving ? 0.02 : 0.004);
      const armBobX = 0.24 + Math.cos(this.bobTimer * 0.5) * (isMoving ? 0.015 : 0.003);
      this.armGroup.position.set(armBobX, armBobY, -0.45);
      this.armGroup.rotation.z = 0.12 + Math.sin(this.bobTimer * 0.5) * 0.04;
    }
  }

  moveWithCollision(dx, dz) {
    const newX = this.position.x + dx;
    if (!this.checkCollision(newX, this.position.z)) {
      this.position.x = newX;
    }

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
