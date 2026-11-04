/**
 * Procedural Texture Generator
 * Generates lightweight textures for horror aesthetic: grime concrete, rusted metal, decayed tiles, dark wood, blood stains, tape reel
 */
class TextureGenerator {
  static createConcrete(width = 256, height = 256) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Base concrete dark tone
    ctx.fillStyle = '#262828';
    ctx.fillRect(0, 0, width, height);

    // Perlin-like noise simulation
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 35;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    // Cracks and stains
    ctx.strokeStyle = 'rgba(10, 10, 10, 0.4)';
    ctx.lineWidth = 1.5;
    for (let j = 0; j < 6; j++) {
      ctx.beginPath();
      let x = Math.random() * width;
      let y = Math.random() * height;
      ctx.moveTo(x, y);
      for (let k = 0; k < 5; k++) {
        x += (Math.random() - 0.5) * 40;
        y += (Math.random() - 0.5) * 40;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  static createTile(width = 256, height = 256) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1c1f20';
    ctx.fillRect(0, 0, width, height);

    const tileSize = 32;
    ctx.strokeStyle = '#0e0f10';
    ctx.lineWidth = 2;

    for (let x = 0; x <= width; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Grime stains
    for (let i = 0; i < 8; i++) {
      const gx = Math.random() * width;
      const gy = Math.random() * height;
      const gr = 10 + Math.random() * 30;
      const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
      grad.addColorStop(0, 'rgba(18, 12, 8, 0.6)');
      grad.addColorStop(1, 'rgba(18, 12, 8, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(gx, gy, gr, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  static createRustMetal(width = 256, height = 256) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#2c2928';
    ctx.fillRect(0, 0, width, height);

    // Rust patches
    for (let i = 0; i < 15; i++) {
      const rx = Math.random() * width;
      const ry = Math.random() * height;
      const radius = 15 + Math.random() * 45;
      const grad = ctx.createRadialGradient(rx, ry, 0, rx, ry, radius);
      grad.addColorStop(0, 'rgba(84, 42, 22, 0.7)');
      grad.addColorStop(0.6, 'rgba(56, 32, 18, 0.4)');
      grad.addColorStop(1, 'rgba(44, 41, 40, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(rx, ry, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  static createWood(width = 256, height = 256) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#221914';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(18, 11, 8, 0.4)';
    ctx.lineWidth = 1;
    for (let y = 0; y < height; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y + (Math.random() - 0.5) * 2);
      ctx.lineTo(width, y + (Math.random() - 0.5) * 2);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  static createWarningSign(text = 'RESTRICTED AREA') {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#8f7e2c';
    ctx.fillRect(0, 0, 256, 128);

    // Hazard stripes at top and bottom
    ctx.fillStyle = '#111111';
    for (let x = -30; x < 280; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 12, 0);
      ctx.lineTo(x + 2, 20);
      ctx.lineTo(x - 10, 20);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x, 108);
      ctx.lineTo(x + 12, 108);
      ctx.lineTo(x + 2, 128);
      ctx.lineTo(x - 10, 128);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = '#111111';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SUB-LEVEL 04', 128, 50);

    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = '#6b1717';
    ctx.fillText(text, 128, 76);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }
}

window.TextureGenerator = TextureGenerator;
