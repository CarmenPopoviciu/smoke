import { EmitterConfig, Emitter } from './emitter';
import { makeOctaveNoise } from './utils';

export class Smoke {
  emitters: Array<any> = [];
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;

  constructor(container: HTMLCanvasElement, width: number, height: number) {
    this.canvas = container;
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = container.getContext('2d');
    this.width = width;
    this.height = height;
    
    this.loop();
  }
  
  emit(x: number, y: number, emitterConfig: EmitterConfig) {
    let noiseCanvas = makeOctaveNoise(this.width, this.height, 8);
    let smoke = new Emitter(Object.assign({noiseCanvas: noiseCanvas, x: x, y: y}, emitterConfig));
    
    
    this.emitters.push(smoke);
  }
  
  update() {
    let ctx = this.ctx,
        canvas = this.canvas;

    ctx.globalCompositeOperation = 'normal';
    ctx.fillStyle = 'rgba(5, 15, 16, 1.00)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    this.ctx.globalCompositeOperation = 'lighter';
    this.emitters.forEach(emitter => {
      emitter.update()
      this.ctx.drawImage(emitter.canvas, 0, 0);
      emitter.ctx.restore();
    });
  }
  
  loop() {
    this.update();
    requestAnimationFrame(this.loop.bind(this));
  }

  clearAll() {
    this.emitters = [];
  }
}
