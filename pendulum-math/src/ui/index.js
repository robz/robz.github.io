function init() {
  const canvas = document.getElementById('canvas');
  if (!canvas || !canvas.getContext) {
    throw new Error('no canvas or context');
  }

  const body = document.getElementById('root');
  if (!body) {
    throw new Error('no body');
  }
  const {height, width} = body.getBoundingClientRect();
  canvas.height = height;
  canvas.width = width;

  const ctx = canvas.getContext('2d');

  return {ctx, width, height};
}

function draw(ctx, width, height, {theta1, theta2}, {L1, L2}, color) {
  const center = [width / 2, height / 2];
  const x1 = L1 * Math.sin(theta1);
  const y1 = L1 * Math.cos(theta1);
  const p1 = [center[0] + x1, center[1] + y1];
  const x2 = L2 * Math.sin(theta1 + theta2);
  const y2 = L2 * Math.cos(theta1 + theta2);
  const p2 = [p1[0] + x2, p1[1] + y2];

  ctx.fillStyle = 'black';

  ctx.beginPath();
  ctx.arc(...center, 5, 0, Math.PI * 2, true);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.strokeStyle = color;

  ctx.beginPath();
  ctx.moveTo(...center);
  ctx.lineTo(...p1);
  ctx.lineTo(...p2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(...p1, 5, 0, Math.PI * 2, true);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(...p2, 5, 0, Math.PI * 2, true);
  ctx.fill();
}

function calcEnergy({theta1, theta2, theta1Dot, theta2Dot}, {L1, L2, m1, m2}) {
  const kineticEnergy = 0.5 * (m1 * (L1 * theta1Dot) ** 2 + m2 * (L2 * theta2Dot) ** 2);
  const y1 = L1 * Math.cos(theta1);
  const y2 = L2 * Math.cos(theta1 + theta2);
  const height1 = L1 - y1;
  const height2 = L1 + L2 - (y1 + y2);
  const potentialEnergy = 9.8 * (m1 * height1 + m2 * height2);
  return kineticEnergy + potentialEnergy;
}

function makeCompareFunction(name) {
  let max = 0;
  let min = Number.MAX_VALUE;
  return (newValue, i) => {
    let print = false;
    if (newValue > max) {
      max = newValue;
      print = true;
    }
    if (newValue < min) {
      min = newValue;
      print = true;
    }
    if (print) {
      const diff = max - min;
      const average = (max + min) / 2;
      const pct = Math.round((diff / average) * 1000000) / 10000;
      console.log(`${name} @ ${i}: ${max} - ${min} = ${max - min}, ±${pct}%`);
    }
  };
}

function makePendulum(name, color, step, initialConditions, config) {
  const compareEnergy = makeCompareFunction(name);
  let state = {...initialConditions};
  return {
    draw(ctx, width, height) {
      draw(ctx, width, height, state, config, color);
    },
    step(i, dt, mass, L) {
      state = step(state, config, dt);
      const energy = calcEnergy(state, config);
      compareEnergy(energy, i);
    },
  };
}

let add = (...vectors) =>
  vectors[0].map((_, i) => {
    let sum = 0;
    for (const vector of vectors) {
      sum += vector[i];
    }
    return sum;
  });
let mult = (x, a) => a.map(e => e * x);

function stepRungeKutta({theta1, theta2, theta1Dot, theta2Dot}, config, h) {
  let f = (dt, y) => {
    const {theta1DotDot, theta2DotDot} = calcThetaDotDots(
      {
        theta1: y[0],
        theta2: y[1],
        theta1Dot: y[2],
        theta2Dot: y[3],
      },
      config,
    );
    return [y[2], y[3], theta1DotDot, theta2DotDot];
  };

  const yn = [theta1, theta2, theta1Dot, theta2Dot];

  // https://en.wikipedia.org/wiki/Runge%E2%80%93Kutta_methods#The_Runge%E2%80%93Kutta_method
  const k1 = mult(h, f(0, yn));
  const k2 = mult(h, f(h / 2, add(yn, mult(0.5, k1))));
  const k3 = mult(h, f(h / 2, add(yn, mult(0.5, k2))));
  const k4 = mult(h, f(h, add(yn, k3)));

  const [theta1Next, theta2Next, theta1DotNext, theta2DotNext] = add(
    yn,
    mult(1 / 6, add(k1, mult(2, k2), mult(2, k3), k4)),
  );

  return {
    theta1: theta1Next,
    theta2: theta2Next,
    theta1Dot: theta1DotNext,
    theta2Dot: theta2DotNext,
  };
}

async function pause(t) {
  return new Promise(res => setTimeout(res, t));
}

async function main() {
  const {ctx, width, height} = init();

  const dt = 16.7;
  const time_fraction = 1 / 200;

  const initialConditions = {
    theta1: Math.PI / 2,
    theta2: 0.0,
    theta1Dot: 0.0,
    theta2Dot: 0.0,
  };

  const config = {
    L1: 100,
    L2: 100,
    m1: 100,
    m2: 100,
  };

  let i = 0;
  const pendulums = [
    makePendulum(
      'rungeKutta',
      'black',
      stepRungeKutta,
      initialConditions,
      config,
    ),
  ];

  while (true) {
    ctx.clearRect(0, 0, width, height);

    pendulums.forEach(pendulum => {
      pendulum.draw(ctx, width, height);
      pendulum.step(i, dt * time_fraction);
    });

    await pause(dt);
    i++;
  }
}

main();
