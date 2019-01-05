/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/Renderer.js":
/*!*************************!*\
  !*** ./src/Renderer.js ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("const wait = t => new Promise((res, rej) => setTimeout(res, t));\n\nclass Renderer {\n\n  constructor(canvasID) {\n    _initialiseProps.call(this);\n\n    const canvasElement = document.getElementById(canvasID);\n    if (!(canvasElement instanceof HTMLCanvasElement)) {\n      throw new Error(`element with id ${canvasID} is not a canvas`);\n    }\n    const canvas = canvasElement;\n    const { width, height } = canvas;\n    const ctx = canvas.getContext('2d');\n    ctx.scale(width / 20, -height / 20);\n    ctx.translate(10, -10);\n    ctx.lineWidth = 0.1;\n\n    this.width = width;\n    this.height = height;\n    this.ctx = ctx;\n    this.path = [];\n    this.isDragging = false;\n\n    canvas.onmousedown = this.onMouseDown;\n    canvas.onmousemove = this.onMouseMove;\n    canvas.onmouseup = this.onMouseUp;\n  }\n\n}\n\nvar _initialiseProps = function () {\n  this.onMouseDown = () => {\n    this.path = [];\n    this.isDragging = true;\n  };\n\n  this.onMouseMove = ({ offsetX, offsetY }) => {\n    if (!this.isDragging ||\n    /* border */\n    offsetX < 0 || offsetY < 0 || offsetX > this.width || offsetY > this.height) {\n      return;\n    }\n\n    const x = offsetX / this.width * 20 - 10;\n    const y = -offsetY / this.height * 20 + 10;\n\n    this.path.push({ x, y });\n    this.render();\n  };\n\n  this.__onMouseUp = () => {};\n\n  this.onMouseUp = () => {\n    this.isDragging = false;\n    this.__onMouseUp();\n    this.render();\n  };\n\n  this.__render = () => {};\n\n  this.render = async () => {\n    const { ctx, path } = this;\n\n    ctx.clearRect(-10, -10, 20, 20);\n\n    ctx.strokeStyle = 'black';\n    // draw grid\n    ctx.lineWidth = 0.04;\n\n    ctx.beginPath();\n    ctx.moveTo(0, -10);\n    ctx.lineTo(0, 10);\n    ctx.stroke();\n\n    ctx.beginPath();\n    ctx.moveTo(-10, 0);\n    ctx.lineTo(10, 0);\n    ctx.stroke();\n\n    ctx.lineWidth = 0.01;\n\n    for (let x = -10; x <= 10; x += 1) {\n      ctx.beginPath();\n      ctx.moveTo(x, -10);\n      ctx.lineTo(x, 10);\n      ctx.stroke();\n    }\n    for (let y = -10; y <= 10; y += 1) {\n      ctx.beginPath();\n      ctx.moveTo(-10, y);\n      ctx.lineTo(10, y);\n      ctx.stroke();\n    }\n\n    this.__render();\n\n    // draw path\n    if (path.length >= 2) {\n      ctx.strokeStyle = 'blue';\n      ctx.lineWidth = 0.01;\n      ctx.beginPath();\n      ctx.moveTo(path[0].x, path[0].y);\n      for (let i = 0; i < path.length; i += 1) {\n        ctx.lineTo(path[i].x, path[i].y);\n      }\n      ctx.stroke();\n    }\n\n    if (!this.isDragging) {\n      await wait(100);\n      // this.render();\n    }\n  };\n};\n\nmodule.exports = Renderer;\n\n//# sourceURL=webpack:///./src/Renderer.js?");

/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("const Renderer = __webpack_require__(/*! ./Renderer */ \"./src/Renderer.js\");\n\nconst grid_ = [];\nconst rows = 200;\nconst cols = 200;\n\nconst iterate = cb => {\n  for (let r = 0; r < rows; r += 1) {\n    for (let c = 0; c < cols; c += 1) {\n      cb(grid_, r, c);\n    }\n  }\n};\n\nfunction fillGrid() {\n  iterate((grid, r, c) => {\n    if (!grid[r]) {\n      grid[r] = [];\n    }\n    grid[r][c] = Math.floor(Math.random() * 3);\n  });\n}\n\nfunction smoothGrid() {\n  const newGrid = [];\n  iterate((grid, r, c) => {\n    const filledAdjacents = [0, 0, 0];\n    for (let dr = -1; dr <= 1; dr += 1) {\n      for (let dc = -1; dc <= 1; dc += 1) {\n        if (grid[r + dr] && grid[r + dr][c + dc] !== undefined) {\n          filledAdjacents[grid[r + dr][c + dc]] += 1;\n        }\n      }\n    }\n    if (!newGrid[r]) {\n      newGrid[r] = [];\n    }\n\n    let maxV = -1;\n    let maxI = -1;\n    for (let i = 0; i < filledAdjacents.length; i += 1) {\n      if (filledAdjacents[i] > maxV) {\n        maxV = filledAdjacents[i];\n        maxI = i;\n      }\n    }\n\n    newGrid[r][c] = maxI;\n  });\n  iterate((grid, r, c) => grid[r][c] = newGrid[r][c]);\n}\n\nclass ProcMap extends Renderer {\n  constructor(...args) {\n    var _temp;\n\n    return _temp = super(...args), this.__render = () => {\n      const { ctx } = this;\n      iterate((grid, r, c) => {\n        switch (grid[r][c]) {\n          case 0:\n            ctx.fillStyle = 'white';\n            break;\n          case 1:\n            ctx.fillStyle = 'blue';\n            break;\n          case 2:\n            ctx.fillStyle = 'black';\n            break;\n          default:\n            throw new Error('unknown value');\n        }\n        ctx.fillRect((r - rows / 2) / (rows / 20), (c - cols / 2) / (cols / 20), 20 / rows, 20 / cols);\n      });\n    }, _temp;\n  }\n\n}\n\nconst m = new ProcMap('canvas');\n\nasync function wait(t) {\n  return new Promise(res => setTimeout(res, t));\n}\n\nfillGrid();\nasync function f() {\n  m.render();\n  smoothGrid();\n  await wait(100);\n  await f();\n}\n\nf();\n\n//# sourceURL=webpack:///./src/index.js?");

/***/ })

/******/ });