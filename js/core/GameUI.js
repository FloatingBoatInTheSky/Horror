/**
 * Game User Interface & Retro Cam HUD Manager
 * Coordinates menus, settings, inventory, documents, keypad puzzle, endings, touch controls, and VHS camera effects
 */
class GameUI {
  constructor(gameState, audio) {
    this.gameState = gameState;
    this.audio = audio;
    this.isPlaying = false;
    this.isPaused = false;

    this.activeKeypadCallback = null;
    this.currentKeypadInput = '';

    this.recSeconds = 872; // Start around 00:14:32
    this.battery = 87;

    this.initElements();
    this.bindEvents();
    this.startHudTimers();
  }

  initElements() {
    this.loadingScreen = document.getElementById('loading-screen');
    this.mainMenu = document.getElementById('main-menu');
    this.pauseMenu = document.getElementById('pause-menu');
    this.settingsModal = document.getElementById('settings-modal');
    this.controlsModal = document.getElementById('controls-modal');
    this.creditsModal = document.getElementById('credits-modal');
    this.inventoryModal = document.getElementById('inventory-modal');
    this.documentModal = document.getElementById('document-modal');
    this.keypadModal = document.getElementById('keypad-modal');
    this.endingModal = document.getElementById('ending-modal');

    this.hud = document.getElementById('camera-hud');
    this.recTimestamp = document.getElementById('rec-timestamp');
    this.recBattery = document.getElementById('rec-battery');
    this.objectiveText = document.getElementById('hud-objective-text');
    this.interactPrompt = document.getElementById('interact-prompt');
    this.notificationBox = document.getElementById('hud-notification');

    this.mobileControls = document.getElementById('mobile-controls');
    this.vhsOverlay = document.getElementById('vhs-post-overlay');
  }

  bindEvents() {
    // Main Menu Buttons
    document.getElementById('btn-new-game')?.addEventListener('click', () => this.startNewGame());
    document.getElementById('btn-continue')?.addEventListener('click', () => this.continueGame());
    document.getElementById('btn-settings')?.addEventListener('click', () => this.openModal(this.settingsModal));
    document.getElementById('btn-controls')?.addEventListener('click', () => this.openModal(this.controlsModal));
    document.getElementById('btn-credits')?.addEventListener('click', () => this.openModal(this.creditsModal));

    // Pause Menu Buttons
    document.getElementById('btn-resume')?.addEventListener('click', () => this.togglePause(false));
    document.getElementById('btn-pause-inventory')?.addEventListener('click', () => this.openInventory());
    document.getElementById('btn-pause-settings')?.addEventListener('click', () => this.openModal(this.settingsModal));
    document.getElementById('btn-pause-quit')?.addEventListener('click', () => this.quitToMainMenu());

    // Modal Close Buttons
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.game-modal');
        if (modal) this.closeModal(modal);
      });
    });

    // Mobile Virtual Buttons
    document.getElementById('btn-touch-interact')?.addEventListener('click', () => {
      if (window.game) window.game.interact();
    });
    document.getElementById('btn-touch-flashlight')?.addEventListener('click', () => {
      if (window.game) window.game.toggleFlashlight();
    });
    document.getElementById('btn-touch-pause')?.addEventListener('click', () => {
      this.togglePause();
    });
    document.getElementById('btn-touch-inventory')?.addEventListener('click', () => {
      this.openInventory();
    });

    // Keypad number buttons
    document.querySelectorAll('.keypad-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const key = e.target.getAttribute('data-key');
        this.handleKeypadInput(key);
      });
    });

    // Settings inputs
    this.bindSettingsInputs();

    // Virtual Joystick on mobile
    this.initVirtualJoystick();
  }

  bindSettingsInputs() {
    const qSelect = document.getElementById('setting-quality');
    const lowPerf = document.getElementById('setting-low-perf');
    const masterVol = document.getElementById('setting-master-vol');
    const sens = document.getElementById('setting-mouse-sens');
    const reduceMotion = document.getElementById('setting-reduce-motion');
    const recIntensity = document.getElementById('setting-rec-effects');

    if (qSelect) {
      qSelect.value = this.gameState.settings.quality;
      qSelect.addEventListener('change', (e) => {
        this.gameState.settings.quality = e.target.value;
        this.gameState.saveSettings();
        if (window.game) window.game.applyQualitySettings();
      });
    }

    if (lowPerf) {
      lowPerf.checked = this.gameState.settings.lowPerformanceMode;
      lowPerf.addEventListener('change', (e) => {
        this.gameState.settings.lowPerformanceMode = e.target.checked;
        this.gameState.saveSettings();
        if (window.game) window.game.applyQualitySettings();
      });
    }

    if (masterVol) {
      masterVol.value = this.gameState.settings.masterVolume * 100;
      masterVol.addEventListener('input', (e) => {
        const v = parseFloat(e.target.value) / 100;
        this.gameState.settings.masterVolume = v;
        this.gameState.saveSettings();
        this.audio.setVolumes({ master: v });
      });
    }

    if (sens) {
      sens.value = this.gameState.settings.mouseSensitivity * 100;
      sens.addEventListener('input', (e) => {
        this.gameState.settings.mouseSensitivity = parseFloat(e.target.value) / 100;
        this.gameState.saveSettings();
      });
    }

    if (reduceMotion) {
      reduceMotion.checked = this.gameState.settings.reduceMotion;
      reduceMotion.addEventListener('change', (e) => {
        this.gameState.settings.reduceMotion = e.target.checked;
        this.gameState.saveSettings();
      });
    }

    if (recIntensity) {
      recIntensity.value = (this.gameState.settings.recEffectsIntensity || 1.0) * 100;
      recIntensity.addEventListener('input', (e) => {
        this.gameState.settings.recEffectsIntensity = parseFloat(e.target.value) / 100;
        this.gameState.saveSettings();
        this.updateVhsOverlayIntensity();
      });
    }
  }

  updateVhsOverlayIntensity() {
    const intensity = this.gameState.settings.recEffectsIntensity;
    if (this.vhsOverlay) {
      this.vhsOverlay.style.opacity = intensity.toString();
    }
  }

  startHudTimers() {
    setInterval(() => {
      if (!this.isPlaying || this.isPaused) return;
      this.recSeconds++;
      const hrs = Math.floor(this.recSeconds / 3600).toString().padStart(2, '0');
      const mins = Math.floor((this.recSeconds % 3600) / 60).toString().padStart(2, '0');
      const secs = (this.recSeconds % 60).toString().padStart(2, '0');
      if (this.recTimestamp) {
        this.recTimestamp.textContent = `${hrs}:${mins}:${secs}`;
      }

      // Very slow battery drain for psychological realism
      if (this.recSeconds % 45 === 0 && this.battery > 5) {
        this.battery--;
        if (this.recBattery) {
          this.recBattery.textContent = `BATTERY ${this.battery}%`;
        }
      }
    }, 1000);
  }

  initVirtualJoystick() {
    const zone = document.getElementById('joystick-zone');
    const knob = document.getElementById('joystick-knob');
    if (!zone || !knob) return;

    let activeTouchId = null;
    let startX = 0;
    let startY = 0;
    const maxRadius = 45;

    zone.addEventListener('touchstart', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (activeTouchId === null) {
          activeTouchId = touch.identifier;
          const rect = zone.getBoundingClientRect();
          startX = rect.left + rect.width / 2;
          startY = rect.top + rect.height / 2;
          break;
        }
      }
    }, { passive: false });

    zone.addEventListener('touchmove', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === activeTouchId) {
          const dx = touch.clientX - startX;
          const dy = touch.clientY - startY;
          const dist = Math.hypot(dx, dy);
          const angle = Math.atan2(dy, dx);
          const clampedDist = Math.min(dist, maxRadius);

          const nx = Math.cos(angle) * clampedDist;
          const ny = Math.sin(angle) * clampedDist;

          knob.style.transform = `translate(${nx}px, ${ny}px)`;

          if (window.game && window.game.player) {
            window.game.player.joystickVector = {
              x: nx / maxRadius,
              y: -ny / maxRadius
            };
          }
          e.preventDefault();
          break;
        }
      }
    }, { passive: false });

    const resetJoystick = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === activeTouchId) {
          activeTouchId = null;
          knob.style.transform = 'translate(0px, 0px)';
          if (window.game && window.game.player) {
            window.game.player.joystickVector = { x: 0, y: 0 };
          }
          break;
        }
      }
    };

    zone.addEventListener('touchend', resetJoystick);
    zone.addEventListener('touchcancel', resetJoystick);
  }

  showLoading(progress = 0, message = 'RECUPERANDO GRAVAÇÃO DO SISTEMA...') {
    if (this.loadingScreen) {
      this.loadingScreen.classList.remove('hidden');
      const bar = document.getElementById('loading-bar-fill');
      const pct = document.getElementById('loading-percentage');
      const msg = document.getElementById('loading-subtext');
      if (bar) bar.style.width = `${progress}%`;
      if (pct) pct.textContent = `${Math.floor(progress)}%`;
      if (msg) msg.textContent = message;
    }
  }

  hideLoading() {
    if (this.loadingScreen) {
      this.loadingScreen.classList.add('hidden');
    }
  }

  startNewGame() {
    this.audio.resume();
    this.gameState.resetGame();
    this.mainMenu.classList.add('hidden');
    this.isPlaying = true;
    this.isPaused = false;
    this.hud.classList.remove('hidden');
    if (this.isMobile()) this.mobileControls.classList.remove('hidden');

    if (window.game) {
      window.game.startSession();
    }
    this.updateObjective(this.gameState.data.objective);
    this.showNotification('Gravação iniciada: Subsolo 04 — James Vance');
  }

  continueGame() {
    this.audio.resume();
    const hasSave = this.gameState.loadGame();
    if (!hasSave) {
      this.startNewGame();
      return;
    }

    this.mainMenu.classList.add('hidden');
    this.isPlaying = true;
    this.isPaused = false;
    this.hud.classList.remove('hidden');
    if (this.isMobile()) this.mobileControls.classList.remove('hidden');

    if (window.game) {
      window.game.startSession();
    }
    this.updateObjective(this.gameState.data.objective);
    this.showNotification('Sessão restaurada da fita magnética');
  }

  togglePause(forceState = null) {
    if (!this.isPlaying) return;
    this.isPaused = (forceState !== null) ? forceState : !this.isPaused;

    if (this.isPaused) {
      this.pauseMenu.classList.remove('hidden');
      if (document.exitPointerLock) document.exitPointerLock();
    } else {
      this.pauseMenu.classList.add('hidden');
      this.closeAllModals();
      if (!this.isMobile() && window.game) {
        document.body.requestPointerLock?.();
      }
    }
  }

  quitToMainMenu() {
    this.isPlaying = false;
    this.isPaused = false;
    this.pauseMenu.classList.add('hidden');
    this.hud.classList.add('hidden');
    this.mobileControls.classList.add('hidden');
    this.closeAllModals();
    this.mainMenu.classList.remove('hidden');
    if (document.exitPointerLock) document.exitPointerLock();
  }

  updateObjective(text) {
    if (this.objectiveText) {
      this.objectiveText.textContent = text;
    }
  }

  showInteractPrompt(text = null) {
    if (!this.interactPrompt) return;
    if (text) {
      this.interactPrompt.textContent = text;
      this.interactPrompt.classList.remove('hidden');
    } else {
      this.interactPrompt.classList.add('hidden');
    }
  }

  showNotification(msg) {
    if (!this.notificationBox) return;
    this.notificationBox.textContent = msg;
    this.notificationBox.classList.remove('hidden');
    clearTimeout(this._notifTimeout);
    this._notifTimeout = setTimeout(() => {
      this.notificationBox.classList.add('hidden');
    }, 3800);
  }

  openInventory() {
    const list = document.getElementById('inventory-list');
    if (!list) return;
    list.innerHTML = '';

    if (this.gameState.data.inventory.length === 0) {
      list.innerHTML = '<p class="empty-inv">Nenhum item coletado ainda.</p>';
    } else {
      this.gameState.data.inventory.forEach(item => {
        const div = document.createElement('div');
        div.className = 'inventory-item-card';
        div.innerHTML = `<h4>${item.name}</h4><p>${item.desc || ''}</p>`;
        list.appendChild(div);
      });
    }

    this.openModal(this.inventoryModal);
  }

  showDocumentModal(docId) {
    const doc = GAME_LORE.documents[docId];
    if (!doc) return;

    document.getElementById('doc-modal-title').textContent = doc.title;
    document.getElementById('doc-modal-meta').textContent = `${doc.date} | ${doc.author}`;
    document.getElementById('doc-modal-body').textContent = doc.content;

    this.audio.playPickup();
    this.openModal(this.documentModal);
  }

  showKeypadModal(options) {
    this.activeKeypadCallback = options;
    this.currentKeypadInput = '';
    document.getElementById('keypad-title').textContent = options.title || 'PAINEL ELETRÔNICO';
    document.getElementById('keypad-display').textContent = '----';
    this.openModal(this.keypadModal);
  }

  handleKeypadInput(key) {
    const display = document.getElementById('keypad-display');
    if (!display) return;

    if (key === 'CLEAR') {
      this.currentKeypadInput = '';
      display.textContent = '----';
      this.audio.playKeypadBeep(false);
      return;
    }

    if (key === 'ENTER') {
      if (!this.activeKeypadCallback) return;
      if (this.currentKeypadInput === this.activeKeypadCallback.correctCode) {
        display.textContent = 'ACESSO CONCEDIDO';
        display.classList.add('granted');
        this.audio.playKeypadBeep(true);
        setTimeout(() => {
          display.classList.remove('granted');
          this.closeModal(this.keypadModal);
          if (this.activeKeypadCallback.onSuccess) {
            this.activeKeypadCallback.onSuccess();
          }
        }, 900);
      } else {
        display.textContent = 'NEGADO';
        display.classList.add('denied');
        this.audio.playKeypadBeep(false);
        setTimeout(() => {
          display.classList.remove('denied');
          this.currentKeypadInput = '';
          display.textContent = '----';
        }, 800);
      }
      return;
    }

    if (this.currentKeypadInput.length < 4) {
      this.currentKeypadInput += key;
      display.textContent = this.currentKeypadInput.padEnd(4, '-');
      this.audio.playKeypadBeep(true);
    }
  }

  showEndingChoiceModal() {
    this.audio.playJumpscareStinger();
    this.openModal(this.endingModal);

    const btnBreak = document.getElementById('btn-ending-break');
    const btnAccept = document.getElementById('btn-ending-accept');

    btnBreak.onclick = () => {
      this.closeModal(this.endingModal);
      this.triggerEnding('BREAK_LOOP');
    };

    btnAccept.onclick = () => {
      this.closeModal(this.endingModal);
      this.triggerEnding('ACCEPT_RECORDING');
    };
  }

  triggerEnding(endingType) {
    this.gameState.data.chosenEnding = endingType;
    this.gameState.data.gameFinished = true;
    this.gameState.saveGame();

    const resultBox = document.getElementById('ending-result-screen');
    const title = document.getElementById('ending-title');
    const desc = document.getElementById('ending-desc');

    if (endingType === 'BREAK_LOOP') {
      title.textContent = 'FINAL VERDADEIRO: O DESPERTAR';
      desc.innerHTML = `Você estilhaçou a lente da câmera e desligou a fonte de alimentação do Subsolo 04.<br><br>
A gravação que você assistia parou de rodar. Pela primeira vez em trinta anos, as luzes de emergência do mundo exterior acenderam.<br><br>
O ciclo de James Vance foi finalmente encerrado.`;
    } else {
      title.textContent = 'FINAL PSICOLÓGICO: A FITA ETERNA';
      desc.innerHTML = `Você inseriu a fita magnética no arquivo perpétuo e sentou-se na cadeira de recepção.<br><br>
O timestamp da câmera voltou para 00:00:00.<br><br>
Passos desconhecidos ecoam no corredor norte... Um novo James Vance acaba de entrar pela porta de entrada.`;
    }

    resultBox.classList.remove('hidden');

    document.getElementById('btn-restart-game').onclick = () => {
      resultBox.classList.add('hidden');
      this.startNewGame();
    };
  }

  openModal(modal) {
    if (!modal) return;
    modal.classList.remove('hidden');
    if (document.exitPointerLock) document.exitPointerLock();
  }

  closeModal(modal) {
    if (!modal) return;
    modal.classList.add('hidden');
    if (this.isPlaying && !this.isPaused && !this.isMobile()) {
      document.body.requestPointerLock?.();
    }
  }

  closeAllModals() {
    document.querySelectorAll('.game-modal').forEach(m => m.classList.add('hidden'));
  }

  isAnyModalOpen() {
    return Array.from(document.querySelectorAll('.game-modal')).some(m => !m.classList.contains('hidden'));
  }

  isMobile() {
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.innerWidth < 900;
  }
}

window.GameUI = GameUI;
