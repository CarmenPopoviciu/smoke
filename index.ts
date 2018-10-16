import { Smoke } from './smoke';
import { WIDTH, HEIGHT } from './constants';

import * as Tone from 'tone';
import * as Piano from 'tone-piano';

let canvas: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById('smoke');
canvas.setAttribute('style', `width: ${WIDTH}px`);
canvas.setAttribute('style', `height: ${HEIGHT}px`);
let smoke = new Smoke(canvas, WIDTH, HEIGHT);

let loadingDiv = document.createElement('div');
loadingDiv.setAttribute('id', 'instructions');
loadingDiv.textContent = 'Initialize...';
document.body.appendChild(loadingDiv);

let refreshBtn: HTMLElement = <HTMLElement>document.getElementsByClassName('refresh-btn')[0];
refreshBtn.addEventListener('click', clearCanvas);

let reverb = new Tone.Convolver('https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/icel.wav').toMaster();
let piano = new Piano.Piano({
  range: [48, 84]
}).connect(reverb);

// load piano stuff first before doing anything else
piano.load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/').then(() => {
  loadingDiv.parentNode.removeChild(loadingDiv);

  // generate new noise only when user interracts with the canvas
  canvas.addEventListener('click', function(ev) {
    let div = document.createElement("div");
    div.className = "clickEffect";
    div.style.top = ev.clientY + "px";
    div.style.left = ev.clientX + "px";
    document.body.appendChild(div);
    div.addEventListener('animationend', function() {
      // first finish rendering click effects before getting 
      // into the Perlin noise stuff, otherwise effects won't
      // be as smooth
      div.parentElement.removeChild(div);
      smoke.emit(ev.clientX, ev.clientY, {
        maxAge: 300,
        width: canvas.width,
        height: canvas.height,
        damping: Math.random() * (0.9 - 0.75) + 0.75,
        exposure: 0.05,
        intensity: Math.random() * (1 - 0.7) + 0.7,
        color: {
          r: Math.random() * 50,
          g: Math.random() * 25,
          b: Math.random() * 70
        }
      });
    });
    playNote(Math.floor(Math.random()*(84-48)) + 48);
  });
});

function clearCanvas() {
  smoke.clearAll();
  canvas.getContext('2d').clearRect(0, 0, WIDTH, HEIGHT);
}

function playNote(note: number, velocity?: number, time?: number) {
  piano.keyUp(note, velocity, time);
  piano.keyDown(note, velocity, time);
}
