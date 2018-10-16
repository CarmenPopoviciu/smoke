import { fuzzy } from './utils';
import { WIDTH, HEIGHT } from './constants';
import { times } from 'lodash';

export interface EmitterConfig {
  maxAge?: number,
  exposure?: number,
  damping?: number,
  noise?: number,
  fuzz?: number,
  intensity?: number,
  vx?: number,
  vy?: number,
  spawn?: number,
  octaves?: number,
  color?: {
    r?: number,
    g?: number,
    b?: number
  },
  width?: number,
  height?: number,
  x?: number,
  y?: number,
  noiseCanvas?: HTMLCanvasElement,
  velocity?: {
    x: number,
    y: number
  }
}

let defaults: EmitterConfig = {
    maxAge: 70,
    exposure: 0.1,
    damping: 0.8,
    noise: 1.0,
    fuzz: 1.0,
    intensity: 1.0,
    vx: 10,
    vy: 10,
    spawn: 5,
    octaves: 8,
    color: {
      r: 25,
      g: 100,
      b: 75
    },
    width: WIDTH,
    height: HEIGHT,
    x: WIDTH * 0.5,
    y: HEIGHT * 0.5,
    noiseCanvas: null,
    velocity: {
      x: Math.random(),
      y: Math.random()
    }
  }



export class Emitter {
  config: EmitterConfig = defaults;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  noiseData: Uint8ClampedArray;
  imgData: ImageData;
  data: Uint8ClampedArray;
  hdrData: Float32Array;
  particles = [];

  constructor(config: EmitterConfig) {
    this.config = { ...this.config, ...config };
    this._init();
  }

  private _init(): void {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.config.width;
    this.canvas.height = this.config.height;
    this.ctx = this.canvas.getContext('2d');
    this.noiseData = this.config.noiseCanvas.getContext('2d').getImageData(0,0, this.config.width, this.config.height).data;
    

    this.ctx.fillStyle='black';
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);
    this.imgData = this.ctx.getImageData(0, 0, this.config.width, this.config.height);
    this.data = this.imgData.data;
    this.ctx.clearRect(0,0, this.config.width, this.config.height);

    this.hdrData = new Float32Array(this.data.length);
    times(this.noiseData.length, n => {
      this.hdrData[n] = 0;
    });
  }

  tonemap(n) {
    return (1 - Math.pow(2, -n * 0.005 * this.config.exposure)) * 255;
  }

  getNoise(x, y, channel) {
    // ~~  DOUBLE NOT BITWISE OPERATOR
    return this.noiseData[(~~x + ~~y * this.config.width) * 4 + channel] / 127 - 1.0;
  }

  update() {
    // this.config.x === this.config.width -> reached max width
    // this.config.y === this.config.height -> reached max height
    // console.log(this.config.x, this.config.y, this.config.width, this.config.height)
    if(this.config.x < 0 || this.config.x > this.config.width) {
      // console.log('x', this.config.x, this.config.width)
      // console.log('y', this.config.y, this.config.height)
      return;
    }
    if(this.config.y < 0 || this.config.y > this.config.height) {
      // console.log('y', this.config.y, this.config.height)
      // console.log('x', this.config.x, this.config.width)
      return;
    }

    this.config.x += this.config.velocity.x;
    this.config.y += this.config.velocity.y;

    let {x, y, vx, vy, width, height, color, maxAge, damping, noise, fuzz, intensity, spawn} = this.config;
    let {r,g,b} = color;

    times(spawn, n => {
      this.particles.push({
        vx: fuzzy(vx),
        vy: fuzzy(vy),
        x: x,
        y: y,
        age: 0
      });
    });

    let alive = [];

    this.particles.forEach(p => {
      p.vx = p.vx * damping + this.getNoise(p.x, p.y, 0) * 4 * noise + fuzzy(0.1) * fuzz;
      p.vy = p.vy * damping + this.getNoise(p.x, p.y, 1) * 4 * noise + fuzzy(0.1) * fuzz;
      p.age++;
      times(10, x => {
        p.x += p.vx * 0.1;
        p.y += p.vy * 0.1;
        let index = (~~p.x + ~~p.y * width) * 4;
        this.data[index] = this.tonemap(this.hdrData[index] += r * intensity);
        this.data[index + 1] = this.tonemap(this.hdrData[index + 1] += g * intensity);
        this.data[index + 2] = this.tonemap(this.hdrData[index + 2] += b * intensity);
      });
      if(p.age < maxAge) {
        alive.push(p);
      }
    });
    this.ctx.putImageData(this.imgData, 0, 0);
    this.particles = alive;
  }
}
