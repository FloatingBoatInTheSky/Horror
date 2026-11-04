/**
 * GameState & LocalStorage Manager
 * Handles objectives, inventory, puzzle states, settings, and multiple endings
 */
class GameState {
  constructor() {
    this.storageKey = 'valenwood_sublevel04_save_v1';
    this.settingsKey = 'valenwood_sublevel04_settings_v1';

    this.defaultSettings = {
      quality: 'HIGH', // HIGH, MEDIUM, LOW
      lowPerformanceMode: false,
      masterVolume: 0.8,
      sfxVolume: 0.9,
      musicVolume: 0.7,
      mouseSensitivity: 1.0,
      cameraBobbing: true,
      recEffectsIntensity: 1.0, // 0 to 1
      reduceMotion: false
    };

    this.settings = Object.assign({}, this.defaultSettings);
    this.loadSettings();

    this.defaultState = {
      chapter: 0,
      objective: 'Explore a ala de recepção e encontre a lanterna na mesa.',
      inventory: [],
      discoveredDocs: [],
      puzzles: {
        padlock_block_b: false,
        fuse_box: false,
        keypad_archive: false
      },
      fusesCollected: 0,
      fusesInserted: 0,
      hasFlashlight: false,
      flashlightOn: false,
      flashlightBattery: 100,
      doors: {
        door_block_b: false,
        door_generator: false,
        door_archive: false,
        door_exit: false
      },
      eventsTriggered: {},
      sanity: 100, // 0 - 100
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
    } catch (e) {
      console.warn('LocalStorage settings load failed:', e);
    }
  }

  saveSettings() {
    try {
      localStorage.setItem(this.settingsKey, JSON.stringify(this.settings));
    } catch (e) {
      console.warn('LocalStorage settings save failed:', e);
    }
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
    } catch (e) {
      console.warn('LocalStorage game load failed:', e);
    }
    return false;
  }

  saveGame() {
    try {
      this.data.timestamp = Date.now();
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
      return true;
    } catch (e) {
      console.warn('LocalStorage game save failed:', e);
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
    if (!this.data.inventory.find(i => i.id === item.id)) {
      this.data.inventory.push(item);
      this.saveGame();
      if (window.gameUI) {
        window.gameUI.updateInventory(this.data.inventory);
        window.gameUI.showNotification(`Item obtido: ${item.name}`);
      }
      return true;
    }
    return false;
  }

  hasItem(id) {
    return !!this.data.inventory.find(i => i.id === id);
  }

  removeItem(id) {
    const idx = this.data.inventory.findIndex(i => i.id === id);
    if (idx !== -1) {
      const item = this.data.inventory.splice(idx, 1)[0];
      this.saveGame();
      if (window.gameUI) {
        window.gameUI.updateInventory(this.data.inventory);
        window.gameUI.showNotification(`Item usado: ${item.name}`);
      }
      return true;
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
}

window.GameState = GameState;
