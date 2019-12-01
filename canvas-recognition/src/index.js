import * as tf from '@tensorflow/tfjs';
const tfvis = require('@tensorflow/tfjs-vis');

const arr = require('./example');

const NUM_ROWS = 28;
const NUM_COLS = 28;
const HEIGHT = 500;
const WIDTH = 500;
const NUM_CLASSES = 10;

const YINC = HEIGHT / NUM_ROWS;
const XINC = WIDTH / NUM_COLS;

class Canvas {
  constructor(id, onChange) {
    this.canvas = document.getElementById('canvas');
    this.onChange = onChange;
    this.canvas.onmousedown = this.onMouseDown.bind(this);
    this.canvas.onmouseup = this.onMouseUp.bind(this);
    this.canvas.onmousemove = this.onMouseMove.bind(this);
    this.ctx = this.canvas.getContext('2d');
    this.down = false;
    this.clearData();
  }

  clearData() {
    this.data = Array(NUM_ROWS * NUM_COLS).fill(0);
    this.draw(this.data);
  }

  draw(data) {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, WIDTH, HEIGHT);
    this.ctx.fillStyle = '#000000';
    for (let r = 0; r < NUM_ROWS; r++) {
      for (let c = 0; c < NUM_COLS; c++) {
        if (data[r * NUM_COLS + c] > 0) {
          this.ctx.fillRect(XINC * c, YINC * r, XINC, YINC);
        }
      }
    }
  }

  onMouseDown(e) {
    this.down = true;
    this.clearData();
  }

  onMouseMove(e) {
    if (!this.down) {
      return;
    }
    const x = e.clientX - this.canvas.offsetLeft;
    const y = e.clientY - this.canvas.offsetTop;
    const r = Math.round(y / YINC);
    const c = Math.round(x / XINC);
    // TODO: why is this necessary
    if (r >= 0 && r < NUM_ROWS && c >= 0 && c < NUM_COLS) {
      this.data[r * NUM_COLS + c] = 1;
      if (r > 0) {
        this.data[(r - 1) * NUM_COLS + c] = 1;
      }
      if (c > 0) {
        this.data[r * NUM_COLS + (c - 1)] = 1;
      }
    }
    this.draw(this.data);
    this.onChange(this.data);
  }

  onMouseUp(e) {
    this.down = false;
  }
}

async function predict(model, data) {
  return Array.from(
    await model.predict(tf.tensor2d(data, [1, NUM_ROWS * NUM_COLS])).data(),
  );
}

function writePrediction(prediction) {
  prediction
    .map(e => Math.round(e * 100) / 100)
    .forEach(
      (v, i) => (document.getElementById('prediction' + i).innerHTML = v),
    );
}

async function main() {
  const model = await tf.loadLayersModel('/model/model.json', false);
  writePrediction(await predict(model, arr));

  let id;
  const canvas = new Canvas('canvas', data => {
    // cancel pending prediction, since it's stale
    // (debounce for better responsiveness when drawing)
    clearTimeout(id);
    id = setTimeout(async () => writePrediction(await predict(model, data)));
  });
  canvas.draw(arr);

  for (let i = 0; i < NUM_CLASSES; i++) {
    document.getElementById('button' + i).onclick = () => {
      console.log('button ' + i + '!!!');
    };
  }

  document.getElementById('model_link').onclick = () =>
    tfvis.show.modelSummary({name: 'Model Summary'}, model);
}

main();
