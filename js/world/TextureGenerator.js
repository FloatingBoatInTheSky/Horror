/**
 * PRETEND IT'S NOT THERE - Procedural Texture Generator
 * PSX / Retro Low-fi Aesthetic (64x64 to 128x128 with dither, noise, grime, wood grains, wallpaper, carpets)
 */
class TextureGenerator {
  static createWallpaper(width = 128, height = 128) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Desaturated sickly yellowish-green / beige 1990s wallpaper
    ctx.fillStyle = '#2f3128';
    ctx.fillRect(0, 0, width, height);

    // Subtle stripe / diamond pattern
    ctx.strokeStyle = '#272922';
    ctx.lineWidth = 2;
    for (let x = 0; x < width; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Mold / decay patches
    for (let i = 0; i < 6; i++) {
      const gx = Math.random() * width;
      const gy = Math.random() * height;
      const gr = 8 + Math.random() * 20;
      const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
      grad.addColorStop(0, 'rgba(16, 20, 14, 0.7)');
      grad.addColorStop(1, 'rgba(16, 20, 14, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(gx, gy, gr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dither / noise
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 22;
      data[i] = Math.min(255, Math.max(0, data[i] + n));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  static createCarpet(width = 128, height = 128) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Muted burgundy / dark muddy red hotel carpet
    ctx.fillStyle = '#2c191a';
    ctx.fillRect(0, 0, width, height);

    // Grid flecks
    ctx.fillStyle = '#221213';
    for (let x = 0; x < width; x += 4) {
      for (let y = 0; y < height; y += 4) {
        if ((x + y) % 8 === 0) {
          ctx.fillRect(x, y, 2, 2);
        }
      }
    }

    // Noise
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 18;
      data[i] = Math.min(255, Math.max(0, data[i] + n));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  static createCeilingPlaster(width = 128, height = 128) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#282a2b';
    ctx.fillRect(0, 0, width, height);

    // Stains
    for (let i = 0; i < 4; i++) {
      const gx = Math.random() * width;
      const gy = Math.random() * height;
      const gr = 12 + Math.random() * 24;
      const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
      grad.addColorStop(0, 'rgba(18, 16, 12, 0.6)');
      grad.addColorStop(1, 'rgba(18, 16, 12, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(gx, gy, gr, 0, Math.PI * 2);
      ctx.fill();
    }

    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 16;
      data[i] = Math.min(255, Math.max(0, data[i] + n));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  static createWoodFloor(width = 128, height = 128) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#261c16';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#18120d';
    ctx.lineWidth = 1.5;
    for (let y = 0; y < height; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Wood grain lines
    ctx.strokeStyle = 'rgba(14, 10, 8, 0.35)';
    ctx.lineWidth = 1;
    for (let y = 0; y < height; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y + (Math.random() - 0.5) * 2);
      ctx.lineTo(width, y + (Math.random() - 0.5) * 2);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  static createTileBathroom(width = 128, height = 128) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#222828';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#121616';
    ctx.lineWidth = 2;
    for (let x = 0; x <= width; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  static createPainting(title = 'FAMILY') {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Heavy dark wooden frame
    ctx.fillStyle = '#2a1a10';
    ctx.fillRect(0, 0, 128, 128);

    // Canvas inside
    ctx.fillStyle = '#1c1b18';
    ctx.fillRect(12, 12, 104, 104);

    // Creepy blurred portrait silhouette (2 figures with blurred/erased faces)
    ctx.fillStyle = '#0a0a0c';
    ctx.beginPath();
    ctx.arc(50, 48, 14, 0, Math.PI * 2);
    ctx.arc(78, 52, 12, 0, Math.PI * 2);
    ctx.fill();

    // Dark bodies
    ctx.fillRect(36, 62, 28, 48);
    ctx.fillRect(66, 64, 26, 46);

    // Red smudge or anomaly
    ctx.fillStyle = 'rgba(90, 18, 18, 0.6)';
    ctx.fillRect(44, 44, 14, 8);
    ctx.fillRect(72, 48, 12, 8);

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    return texture;
  }

  static createSkinTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#9c7b68';
    ctx.fillRect(0, 0, 64, 64);

    // Knuckle / shadow tones
    ctx.fillStyle = '#7a5a4a';
    ctx.fillRect(0, 48, 64, 16);

    const imgData = ctx.getImageData(0, 0, 64, 64);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 14;
      data[i] = Math.min(255, Math.max(0, data[i] + n));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    return texture;
  }
}

window.TextureGenerator = TextureGenerator;
