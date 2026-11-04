/**
 * GameState & LocalStorage Manager
 * Handles routine progression, inventory slots (bottom HUD), paranoia meter, settings, and endings
 */
class GameState {
  constructor() {
    this.storageKey = 'pretend_its_not_there_save_v2';
    this.settingsKey = 'pretend_its_not_there_settings_v2';

    this.defaultSettings = {
      quality: 'HIGH',
      lowPerformanceMode: false,
      masterVolume: 0.85,
      sfxVolume: 0.9,
      mouseSensitivity: 1.0,
      cameraBobbing: true,
      recEffectsIntensity: 0.85,
      reduceMotion: false
    };

    this.settings = Object.assign({}, this.defaultSettings);
    this.loadSettings();

    this.defaultState = {
      routineStep: 0,
      currentHour: '01:00 AM',
      objective: 'Acenda as luzes ou pegue a lanterna na cômoda do quarto.',
      inventory: [null, null, null, null, null], // 5 bottom slots
      selectedSlot: 0,
      discoveredDocs: [],
      curtainsClosed: false,
      hasFlashlight: false,
      flashlightOn: false,
      hasBasementKey: false,
      hasAtticKey: false,
      fuseRepaired: false,
      paranoia: 10, // 0 to 100
      entityAppeared: false,
      entityLookDuration: 0,
      stamina: 100, // 0 to 100
      gameFinished: false,
      chosenEnding: null,
      timestamp: Date.now()
    };

    this.data = Object.assign({}, this.defaultState);
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem(this.settingsKey);
      if (saved) {
        this.settings = Object.assign({}, this.defaultSettings, JSON.parse(saved));
      }
    } catch (e) {}
  }

  saveSettings() {
    try {
      localStorage.setItem(this.settingsKey, JSON.stringify(this.settings));
    } catch (e) {}
  }

  hasSave() {
    try {
      return localStorage.getItem(this.storageKey) !== null;
    } catch (e) {
      return false;
    }
  }

  loadGame() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        this.data = Object.assign({}, this.defaultState, JSON.parse(saved));
        return true;
      }
    } catch (e) {}
    return false;
  }

  saveGame() {
    try {
      this.data.timestamp = Date.now();
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
      return true;
    } catch (e) {
      return false;
    }
  }

  resetGame() {
    this.data = JSON.parse(JSON.stringify(this.defaultState));
    try {
      localStorage.removeItem(this.storageKey);
    } catch (e) {}
  }

  setObjective(text) {
    this.data.objective = text;
    this.saveGame();
    if (window.gameUI) {
      window.gameUI.updateObjective(text);
    }
  }

  addItem(item) {
    // Find first empty slot among the 5
    for (let i = 0; i < 5; i++) {
      if (!this.data.inventory[i]) {
        this.data.inventory[i] = item;
        this.saveGame();
        if (window.gameUI) {
          window.gameUI.updateBottomInventory();
          window.gameUI.showNotification(`Item obtido: ${item.name}`);
        }
        return true;
      }
    }
    if (window.gameUI) {
      window.gameUI.showNotification('Inventário cheio!');
    }
    return false;
  }

  hasItem(id) {
    return this.data.inventory.some(it => it && it.id === id);
  }

  removeItem(id) {
    for (let i = 0; i < 5; i++) {
      if (this.data.inventory[i] && this.data.inventory[i].id === id) {
        const item = this.data.inventory[i];
        this.data.inventory[i] = null;
        this.saveGame();
        if (window.gameUI) {
          window.gameUI.updateBottomInventory();
          window.gameUI.showNotification(`Item usado: ${item.name}`);
        }
        return true;
      }
    }
    return false;
  }

  unlockDoc(docId) {
    if (!this.data.discoveredDocs.includes(docId)) {
      this.data.discoveredDocs.push(docId);
      this.saveGame();
      return true;
    }
    return false;
  }

  advanceRoutine(nextStep) {
    if (nextStep >= GAME_LORE.routine.length) return;
    this.data.routineStep = nextStep;
    const r = GAME_LORE.routine[nextStep];
    this.data.currentHour = r.hour;
    this.setObjective(r.task);
    if (window.gameUI) {
      window.gameUI.showRoutineNotification(r.hour, r.title);
    }
  }
}

window.GameState = GameState;
