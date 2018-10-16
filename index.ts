import { Smoke } from './smoke';
import { WIDTH, HEIGHT } from './constants';

import * as Tone from 'tone';

let canvas: HTMLCanvasElement = <HTMLCanvasElement>(
  document.getElementById('smoke')
);
canvas.setAttribute('style', `width: ${WIDTH}px`);
canvas.setAttribute('style', `height: ${HEIGHT}px`);
let smoke = new Smoke(canvas, WIDTH, HEIGHT);

let loadingDiv = document.createElement('div');
loadingDiv.setAttribute('id', 'instructions');
loadingDiv.textContent = 'Hold your horses, initializing...';
document.body.appendChild(loadingDiv);

let refreshBtn: HTMLElement = <HTMLElement>(
  document.getElementsByClassName('refresh-btn')[0]
);
refreshBtn.addEventListener('click', clearCanvas);

let reverb = new Tone.Convolver('samples/bouncy-drop_C_major.wav').toMaster();

// background sound
let player = new Tone.Player('samples/vinyl-static.wav').toMaster();
player.loop = true;
player.fadeIn = 1;
player.volume.value = -20;

let sampler = new Tone.Sampler({
  C3: 'samples/epiano-chop-1_C_major.wav',
  'A#3': 'samples/epiano-chop-2_A#_minor.wav'
}).connect(reverb);

// time takes the time time takes :)
setTimeout(() => {
  loadingDiv.parentNode.removeChild(loadingDiv);

  // start playing background sound
  player.start();

  // generate new noise only when user interracts with the canvas
  canvas.addEventListener('click', function(ev) {
    let div = document.createElement('div');
    div.className = 'clickEffect';
    div.style.top = ev.clientY + 'px';
    div.style.left = ev.clientX + 'px';
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

    // play random stuff for now
    playRandomNote();
  });
}, 3000);

function clearCanvas() {
  smoke.clearAll();
  canvas.getContext('2d').clearRect(0, 0, WIDTH, HEIGHT);
}

function playNote(note: string) {
  sampler.triggerAttack(note);
}

function playRandomNote() {
  let notes = ['A', 'B', 'C', 'D'];
  let note = `${notes[Math.floor(Math.random() * 4)]}${Math.floor(
    Math.random() * 3
  )}`;
  console.log(`Playing`, note);
  sampler.triggerAttack(note);
}
