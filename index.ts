import { Smoke } from './smoke';
import { WIDTH, HEIGHT } from './constants';

import * as Tone from 'tone';
import * as mm from '@magenta/music';

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

let playedSequence: mm.INoteSequence = {
  ticksPerQuarter: 220,
  totalTime: 1.5,
  timeSignatures: [{ time: 0, numerator: 4, denominator: 4 }],
  tempos: [{ time: 0, qpm: 120 }],
  notes: []
};

let improvSequence: mm.INoteSequence = {
  notes: []
};

// const MELODY_NS: mm.INoteSequence = {
//   ticksPerQuarter: 220,
//   totalTime: 1.5,
//   timeSignatures: [{ time: 0, numerator: 4, denominator: 4 }],
//   tempos: [{ time: 0, qpm: 120 }],
//   notes: [
//     {
//       instrument: 0,
//       program: 0,
//       startTime: 0,
//       endTime: 0.5,
//       pitch: 60,
//       velocity: 100,
//       isDrum: false
//     },
//     {
//       instrument: 0,
//       program: 0,
//       startTime: 0.5,
//       endTime: 1.0,
//       pitch: 60,
//       velocity: 100,
//       isDrum: false
//     },
//     {
//       instrument: 0,
//       program: 0,
//       startTime: 1.0,
//       endTime: 1.5,
//       pitch: 67,
//       velocity: 100,
//       isDrum: false
//     },
//     {
//       instrument: 0,
//       program: 0,
//       startTime: 1.5,
//       endTime: 2.0,
//       pitch: 67,
//       velocity: 100,
//       isDrum: false
//     }
//   ]
// };
let rnn = new mm.MusicRNN(
  'https://storage.googleapis.com/download.magenta.tensorflow.org/tfjs_checkpoints/music_rnn/chord_pitches_improv'
);
rnn.initialize().then(() => {
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

    // randomize first played note and have magenta continue from there
    if (!playedSequence.notes.length) {
      let note = playRandomNote();
      playedSequence.notes.push({
        instrument: 0,
        program: 0,
        startTime: 1.0,
        endTime: 1.5,
        pitch: 60, //Tone.Frequency(note),
        velocity: 100,
        isDrum: false
      });
    } else if (improvSequence.notes.length) {
      let note = improvSequence.notes.shift();
      playNote(note.pitch);
      playedSequence.notes.push({
        instrument: 0,
        program: 0,
        startTime: 1.0,
        endTime: 1.5,
        pitch: note.pitch,
        velocity: 100,
        isDrum: false
      });
    } else {
      improvise(playedSequence).then(improvSeq => {
        improvSequence.notes = improvSeq.notes;
        let note = improvSequence.notes.shift();
        playNote(note.pitch);
        playedSequence.notes.push({
          instrument: 0,
          program: 0,
          startTime: 1.0,
          endTime: 1.5,
          pitch: note.pitch,
          velocity: 100,
          isDrum: false
        });
      });
    }
  });
});

function clearCanvas(): void {
  smoke.clearAll();
  canvas.getContext('2d').clearRect(0, 0, WIDTH, HEIGHT);
}

function improvise(seq): Promise<mm.INoteSequence> {
  // quantize sequence first because that's what `continueSequence` expects
  const qns = mm.sequences.quantizeNoteSequence(seq, 4);

  // `chordProgression` parameter is needed for this type of RNN
  // `continueSequence` will error otherwise
  return rnn.continueSequence(qns, 20, 0.5, ['Am']).then(improvSeq => {
    console.log('improv', improvSeq);
    if (!improvSeq.notes.length) return;
    return improvSeq;
  });
}

function playNote(pitch: number): void {
  console.log('Playing note', Tone.Frequency(pitch).toNote());
  sampler.triggerAttack(Tone.Frequency(pitch).toNote());
}

function playRandomNote(): string {
  let notes = ['A', 'B', 'C', 'D'];
  let note = `${notes[Math.floor(Math.random() * 4)]}${Math.floor(
    Math.random() * 3
  )}`;
  console.log(`Playing random note`, note);
  sampler.triggerAttack(note);

  return note;
}
