`src/equations/pendulum_math.py` derives the differential equations for a double pendulum using Newton's equations. They are printed out in Javascript syntax (see `src/ui/calcThetaDotDots.js`), and then simulated in a webpage.

See `double_pendulum.jpg` for an diagram indicating what the variables are.
See `single_pendulum_math.py` for a simplier derivation for a single pendulum.

Prereqs:
  - python: https://www.python.org/
  - sympy: https://www.sympy.org/en/index.html
  - yarn: https://yarnpkg.com/en/

To build the equations:
1. Clone this repo, then run `yarn install` to get prettier (a JS code formatter)
2. Run `yarn build-equations` to execute the derivation. This takes about 30 secs to to execute on a macbook pro.

To run the simulation, open index.html in a browser. It is also hosted here: http://robz.github.io/pendulum-math
