/**
 * Game User Interface & Bottom Inventory HUD Manager
 * Styled after "Pretend It's Not There":
 * - Retro title screen with stylized VHS/PSX typography
 * - Bottom screen 5-slot inventory bar
 * - Dynamic stamina bar
 * - Paranoia meter & clock indicator (01:00 AM)
 * - Routine chapter transition prompts
 */
class GameUI {
  constructor(gameState, audio) {
    this.gameState = gameState;
    this.audio = audio;
    this.isPlaying = false;
    this.isPaused = false;

    this.activeKeypadCallback = null;
    this.currentKeypadInput = '';

    this.initElements();
    this.bindEvents();
  }

  initElements() {
    this.loadingScreen = document.getElementById('loading-screen');
    this.mainMenu = document.getElementById('main-menu');
    this.pauseMenu = document.getElementById('pause-menu');
    this.settingsModal = document.getElementById('settings-modal');
    this.controlsModal = document.getElementById('controls-modal');
    this.creditsModal = document.getElementById('credits-modal');
    this.documentModal = document.getElementById('document-modal');
    this.keypadModal = document.getElementById('keypad-modal');
    this.endingModal = document.getElementById('ending-modal');

    this.hud = document.getElementById('game-hud');
    this.timeIndicator = document.getElementById('hud-time');
    this.objectiveText = document.getElementById('hud-objective-text');
    this.interactPrompt = document.getElementById('interact-prompt');
    this.notificationBox = document.getElementById('hud-notification');
    this.staminaFill = document.getElementById('stamina-bar-fill');
    this.paranoiaFill = document.getElementById('paranoia-bar-fill');

    this.inventoryBar = document.getElementById('bottom-inventory-bar');
    this.mobileControls = document.getElementById('mobile-controls');
  }

  bindEvents() {
    document.getElementById('btn-new-game')?.addEventListener('click', () => this.startNewGame());
    document.getElementById('btn-continue')?.addEventListener('click', () => this.continueGame());
    document.getElementById('btn-settings')?.addEventListener('click', () => this.openModal(this.settingsModal));
    document.getElementById('btn-controls')?.addEventListener('click', () => this.openModal(this.controlsModal));
    document.getElementById('btn-credits')?.addEventListener('click', () => this.openModal(this.creditsModal));

    document.getElementById('btn-resume')?.addEventListener('click', () => this.togglePause(false));
    document.getElementById('btn-pause-settings')?.addEventListener('click', () => this.openModal(this.settingsModal));
    document.getElementById('btn-pause-quit')?.addEventListener('click', () => this.quitToMainMenu());

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
    document.getElementById('btn-touch-jump')?.addEventListener('click', () => {
      if (window.game && window.game.player) window.game.player.jump();
    });
    document.getElementById('btn-touch-pause')?.addEventListener('click', () => {
      this.togglePause();
    });

    // Keypad numbers
    document.querySelectorAll('.keypad-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const key = e.target.getAttribute('data-key');
        this.handleKeypadInput(key);
      });
    });

    this.bindSettingsInputs();
    this.initVirtualJoystick();
    this.initBottomInventoryClicks();
  }

  bindSettingsInputs() {
    const qSelect = document.getElementById('setting-quality');
    const lowPerf = document.getElementById('setting-low-perf');
    const masterVol = document.getElementById('setting-master-vol');
    const sens = document.getElementById('setting-mouse-sens');
    const reduceMotion = document.getElementById('setting-reduce-motion');

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
  }

  initBottomInventoryClicks() {
    const slots = document.querySelectorAll('.inv-slot');
    slots.forEach((slot, idx) => {
      slot.addEventListener('click', () => {
        this.selectInventorySlot(idx);
      });
    });
  }

  selectInventorySlot(idx) {
    this.gameState.data.selectedSlot = idx;
    const slots = document.querySelectorAll('.inv-slot');
    slots.forEach((s, i) => {
      s.classList.toggle('selected', i === idx);
    });

    const item = this.gameState.data.inventory[idx];
    if (item) {
      this.showNotification(`Item selecionado: ${item.name}`);
    }
  }

  updateBottomInventory() {
    for (let i = 0; i < 5; i++) {
      const slotElem = document.getElementById(`inv-slot-${i}`);
      const item = this.gameState.data.inventory[i];
      if (slotElem) {
        if (item) {
          slotElem.innerHTML = `<span class="slot-num">${i + 1}</span><span class="slot-text">${item.name}</span>`;
          slotElem.classList.add('has-item');
        } else {
          slotElem.innerHTML = `<span class="slot-num">${i + 1}</span>`;
          slotElem.classList.remove('has-item');
        }
      }
    }
  }

  updateStaminaBar(ratio) {
    if (this.staminaFill) {
      this.staminaFill.style.width = `${Math.floor(ratio * 100)}%`;
    }
  }

  updateParanoiaBar(ratio) {
    if (this.paranoiaFill) {
      this.paranoiaFill.style.width = `${Math.floor(ratio * 100)}%`;
    }
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

  showLoading(progress = 0, message = 'CARREGANDO...') {
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
    this.updateBottomInventory();
    this.updateObjective(this.gameState.data.objective);
    this.showRoutineNotification('01:00 AM', 'A CHEGADA EM SILÊNCIO');
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
    this.updateBottomInventory();
    this.updateObjective(this.gameState.data.objective);
    if (this.timeIndicator) this.timeIndicator.textContent = this.gameState.data.currentHour;
    this.showNotification('Sessão restaurada');
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
    }, 4000);
  }

  showRoutineNotification(hour, title) {
    if (this.timeIndicator) this.timeIndicator.textContent = hour;
    this.audio.playDissonantPianoChord();
    this.showNotification(`[${hour}] ${title}`);
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
    document.getElementById('keypad-title').textContent = options.title || 'DIGITE O CÓDIGO';
    document.getElementById('keypad-display').textContent = '----';
    this.openModal(this.keypadModal);
  }

  handleKeypadInput(key) {
    const display = document.getElementById('keypad-display');
    if (!display) return;

    if (key === 'CLEAR') {
      this.currentKeypadInput = '';
      display.textContent = '----';
      return;
    }

    if (key === 'ENTER') {
      if (!this.activeKeypadCallback) return;
      if (this.currentKeypadInput === this.activeKeypadCallback.correctCode) {
        display.textContent = 'DESTRAVADO';
        display.classList.add('granted');
        this.audio.playPickup();
        setTimeout(() => {
          display.classList.remove('granted');
          this.closeModal(this.keypadModal);
          if (this.activeKeypadCallback.onSuccess) {
            this.activeKeypadCallback.onSuccess();
          }
        }, 800);
      } else {
        display.textContent = 'ERRADO';
        display.classList.add('denied');
        setTimeout(() => {
          display.classList.remove('denied');
          this.currentKeypadInput = '';
          display.textContent = '----';
        }, 700);
      }
      return;
    }

    if (this.currentKeypadInput.length < 4) {
      this.currentKeypadInput += key;
      display.textContent = this.currentKeypadInput.padEnd(4, '-');
    }
  }

  showEndingChoiceModal() {
    this.openModal(this.endingModal);

    const btnRun = document.getElementById('btn-ending-run');
    const btnPretend = document.getElementById('btn-ending-pretend');

    btnRun.onclick = () => {
      this.closeModal(this.endingModal);
      this.triggerEnding('RUN_AWAY');
    };

    btnPretend.onclick = () => {
      this.closeModal(this.endingModal);
      this.triggerEnding('PRETEND_NOT_THERE');
    };
  }

  triggerEnding(endingType) {
    this.gameState.data.chosenEnding = endingType;
    this.gameState.data.gameFinished = true;
    this.gameState.saveGame();

    const resultBox = document.getElementById('ending-result-screen');
    const title = document.getElementById('ending-title');
    const desc = document.getElementById('ending-desc');

    if (endingType === 'PRETEND_NOT_THERE') {
      title.textContent = 'FINAL VERDADEIRO: O VAZIO';
      desc.innerHTML = `Você abaixou a cabeça, virou as costas para a porta e arrumou a colcha da cama com calma.<br><br>
A respiração no corredor foi diminuindo lentamente, como gelo derretendo no escuro.<br><br>
Às 06:00 AM, o alarme do relógio tocou e a luz do sol de inverno invadiu a janela.<br><br>
Você sobreviveu porque não deu a ela o que ela mais queria: o seu olhar.`;
    } else {
      title.textContent = 'FINAL RUIM: O RECONHECIMENTO';
      desc.innerHTML = `Você gritou e correu em direção à porta da frente.<br><br>
Ao olhar diretamente para onde ela estava... você deu forma, ossos e peso àquilo que não deveria existir.<br><br>
Ninguém nunca mais encontrou Mark Linwood.`;
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
