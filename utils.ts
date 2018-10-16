export function makeOctaveNoise(width: number, height: number, octaves: number): HTMLCanvasElement {
  let canvas: HTMLCanvasElement = document.createElement('canvas');
  let ctx: CanvasRenderingContext2D = canvas.getContext('2d');

  canvas.width = width;
  canvas.height = height;

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, width, height);

  ctx.globalAlpha = 1 / octaves;
  ctx.globalCompositeOperation = 'lighter';

  for (let i = 0; i < octaves; i++) {
    let octave = makeNoise(width >> i, height >> i);
    ctx.drawImage(octave, 0, 0, width, height);
  }
  return canvas;
}

export function fuzzy(range: number, base = 0): number {
  return (base + (Math.random() - 0.5) * range * 2);
}

function makeNoise(width: number, height: number): HTMLCanvasElement {
  let canvas: HTMLCanvasElement = document.createElement('canvas');
  let ctx: CanvasRenderingContext2D = canvas.getContext('2d');

  canvas.width = width;
  canvas.height = height;

  let imgData = ctx.getImageData(0, 0, width, height),
    data = imgData.data,
    pixels = data.length;

  for (let i = 0; i < pixels; i += 4) {
    data[i] = Math.random() * 255;
    data[i + 1] = Math.random() * 255;
    data[i + 2] = Math.random() * 255;
    data[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);

  return canvas;
}