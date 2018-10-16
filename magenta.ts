import * as mm from '@magenta/music';

const MODEL_CHECK_POINT = 'https://storage.googleapis.com/download.magenta.tensorflow.org/models/music_vae/dljs/mel_small';

export var MusicVAE = new mm.MusicVAE(MODEL_CHECK_POINT);
