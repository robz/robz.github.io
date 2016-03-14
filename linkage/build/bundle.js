(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/rjnevels/Development/Linkages3/src/Linkage.js":[function(require,module,exports){
/* @flow */
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var Geom = require("./math/GeometryUtils");
var smallestNumberDivisibleBy = require("./math/smallestNumberDivisibleBy");

var Linkage = (function () {
  function Linkage(spec) {
    _classCallCheck(this, Linkage);

    this.spec = spec;
    this.positions = {};
    this.speed = 1 / 20;
  }

  _createClass(Linkage, {
    scaleSpeed: {
      value: function scaleSpeed(scale) {
        if (scale <= 0) {
          throw new Error("can only scale speed by position amount");
        }

        this.speed *= scale;
      }
    },
    getPath: {
      value: function getPath(id) {
        var extenders = this.spec.extenders;

        // save current state
        var oldInputs = Object.keys(extenders).map(function (id) {
          return {
            id: id,
            angle: extenders[id].angle };
        });

        var speeds = Object.keys(extenders).map(function (extID) {
          return extenders[extID].speed;
        });
        var numRotations = smallestNumberDivisibleBy(speeds);

        var size = Math.abs(Math.PI * 2 / this.speed);
        var path = [];
        for (var i = 0; i < size * numRotations; i++) {
          var success = this.tryRotatingLinkageInput();
          if (!success) {
            path = null;
            break;
          }
          path.push(this.getPoint(id));
        }

        // restore old state
        oldInputs.forEach(function (o) {
          extenders[o.id].angle = o.angle;
        });
        this.calculatePositions();

        return path;
      }
    },
    _deletePointFromSpec: {
      value: function _deletePointFromSpec(spec, id) {
        delete spec.groundPoints[id];
        delete spec.points[id];
        delete spec.rotaries[id];
        delete spec.extenders[id];
      }
    },
    tryRemovingPoint: {
      value: function tryRemovingPoint(id) {
        var _this = this;

        if (!id) {
          throw new Error("id must be defined");
        }

        // remove point from spec, all adjacents that are not connected to anything
        var newSpec = JSON.parse(JSON.stringify(this.spec));
        var adjacentPoints = Object.keys(newSpec.points[id]);
        adjacentPoints.forEach(function (adjID) {
          delete newSpec.points[adjID][id];
          if (Object.keys(newSpec.points[adjID]).length === 0) {
            _this._deletePointFromSpec(newSpec, adjID);
          }
        });
        this._deletePointFromSpec(newSpec, id);

        try {
          var newPositions = this._calculatePositionsAux(newSpec);
        } catch (e) {
          return false;
        }

        this.positions = newPositions;
        this.spec = newSpec;
        return true;
      }
    },
    getPoint: {
      value: function getPoint(id) {
        if (!id) {
          throw new Error("id must be defined");
        }

        return this.positions[id];
      }
    },
    reverseRotary: {
      value: function reverseRotary(rotID) {
        var _this = this;

        if (!rotID) {
          // if an id was not provided, apply reversal to all rotaries
          Object.keys(this.spec.extenders).forEach(function (id) {
            _this.spec.extenders[id].speed *= -1;
          });
        } else {
          // otherwise just apply reversal to the provided rotary
          var extID = this.spec.rotaries[rotID];
          this.spec.extenders[extID].speed *= -1;
        }
      }
    },
    _changeRotarySpeed: {
      value: function _changeRotarySpeed(difference, extID) {
        var currentSpeed = this.spec.extenders[extID].speed;

        if (currentSpeed === 0) {
          throw new Error("rotary cannot be at zero speed!");
        }

        this.spec.extenders[extID].speed += difference;

        if (this.spec.extenders[extID].speed === 0) {
          // right now I don't allow zero-speed rotaries,
          // so apply difference twice to prevent that
          this.spec.extenders[extID].speed += difference;
        }
      }
    },
    changeSpeed: {
      value: function changeSpeed(difference, rotID) {
        var _this = this;

        if (difference !== 1 && difference !== -1) {
          throw new Error("difference not supported:" + difference);
        }

        if (!rotID) {
          // if an id was not provided, apply changes to all rotaries
          Object.keys(this.spec.extenders).forEach(function (id) {
            _this._changeRotarySpeed(difference, id);
          });
        } else {
          // otherwise just apply difference to the provided rotary
          var extID = this.spec.rotaries[rotID];
          this._changeRotarySpeed(difference, extID);
        }
      }
    },
    moveNotGroundPoint: {
      value: function moveNotGroundPoint(newPos, p0id) {
        var _this = this;

        if (this.spec.extenders[p0id]) {
          var basePoint = this.positions[this.spec.extenders[p0id].base];
          var refPoint = this.positions[this.spec.extenders[p0id].ref];
          var newDist = Geom.euclid(newPos, basePoint);
          this.spec.extenders[p0id].len = newDist;
          this.spec.extenders[p0id].angle = Math.atan2(newPos.y - basePoint.y, newPos.x - basePoint.x) - Math.atan2(refPoint.y - basePoint.y, refPoint.x - basePoint.x);
        }

        Object.keys(this.spec.points[p0id]).forEach(function (p1id) {
          var newDist = Geom.euclid(newPos, _this.positions[p1id]);
          _this.spec.points[p0id][p1id].len = newDist;
          _this.spec.points[p1id][p0id].len = newDist;
        });

        if (!this.calculatePositions()) {
          throw new Error("wat");
        }
      }
    },
    tryMovingGroundPoints: {
      value: function tryMovingGroundPoints(points) {
        var _this = this;

        var prevPoints = {};

        // move the ground points
        points.forEach(function (_ref) {
          var point = _ref.point;
          var id = _ref.id;

          var groundPoint = _this.spec.groundPoints[id];

          if (!groundPoint) {
            throw new Error("ground point " + id + " doesn't exist");
          }

          var prevX = groundPoint.x;
          var prevY = groundPoint.y;

          groundPoint.x = point.x;
          groundPoint.y = point.y;
          prevPoints[id] = { x: prevX, y: prevY };
        });

        if (!this.calculatePositions()) {
          // revert if it failed
          points.forEach(function (_ref) {
            var point = _ref.point;
            var id = _ref.id;

            var groundPoint = _this.spec.groundPoints[id];
            groundPoint.x = prevPoints[id].x;
            groundPoint.y = prevPoints[id].y;
          });
          this.calculatePositions();
        }
      }
    },
    tryRotatingLinkageInput: {
      value: function tryRotatingLinkageInput() {
        var _this = this;

        var flag = true;

        Object.keys(this.spec.extenders).forEach(function (id) {
          var rotaryInput = _this.spec.extenders[id];
          rotaryInput.angle += rotaryInput.speed * _this.speed;
          if (!_this.calculatePositions()) {
            _this.reverseRotary(id.base);
            rotaryInput.angle += rotaryInput.speed * _this.speed;
            _this.calculatePositions();
            flag = false;
          }
        });

        return flag;
      }
    },
    tryChangingBarLength: {
      value: function tryChangingBarLength(lenChange, p0id, p1id) {
        if (!p0id || !p1id) {
          throw new Error("p0id and p1id must be defined");
        }

        var oldLen = this.spec.points[p0id][p1id].len;
        var newLen = oldLen + lenChange;

        this._changeBarLength(newLen, p0id, p1id);
        if (!this.calculatePositions()) {
          this._changeBarLength(oldLen, p0id, p1id);
          this.calculatePositions();
        }
      }
    },
    _changeBarLength: {
      value: function _changeBarLength(len, p0id, p1id) {
        this.spec.points[p0id][p1id].len = len;
        this.spec.points[p1id][p0id].len = len;

        var ext0 = this.spec.extenders[p0id];
        var ext1 = this.spec.extenders[p1id];

        if (ext0 && ext0.base === p1id) {
          ext0.len = len;
        } else if (ext1 && ext1.base === p0id) {
          ext1.len = len;
        }
      }
    },
    _addSegment: {
      value: function _addSegment(point0Id, point1Id, dist) {
        if (!this.spec.points[point0Id]) {
          this.spec.points[point0Id] = {};
        }
        if (!this.spec.points[point1Id]) {
          this.spec.points[point1Id] = {};
        }
        this.spec.points[point0Id][point1Id] = { len: dist };
        this.spec.points[point1Id][point0Id] = { len: dist };
      }
    },
    addRotaryInput: {
      value: function addRotaryInput(point1, len) {
        var numPoints = Object.keys(this.spec.points).length;
        var point0Id = "p" + numPoints;
        var point1Id = "p" + (numPoints + 1);
        var point2Id = "p" + (numPoints + 2);

        this.spec.extenders[point2Id] = {
          base: point1Id,
          ref: point0Id,
          angle: Math.atan(4 / 3),
          speed: 1,
          len: 5 };
        this.spec.groundPoints[point0Id] = { x: point1.x + 1, y: point1.y };
        this.spec.groundPoints[point1Id] = { x: point1.x, y: point1.y };
        this.spec.rotaries[point1Id] = point2Id;

        this._addSolution(point0Id, point2Id, point1Id, 0);

        this._addSegment(point0Id, point1Id, 1);
        this._addSegment(point1Id, point2Id, 5);
      }
    },
    _addSolution: {
      value: function _addSolution(p1ID, p2ID, p3ID, solutionIndex) {
        if (!this.spec.solutionMap[p1ID]) {
          this.spec.solutionMap[p1ID] = {};
        }
        if (!this.spec.solutionMap[p1ID][p2ID]) {
          this.spec.solutionMap[p1ID][p2ID] = {};
        }
        this.spec.solutionMap[p1ID][p2ID][p3ID] = solutionIndex;

        if (!this.spec.solutionMap[p2ID]) {
          this.spec.solutionMap[p2ID] = {};
        }
        if (!this.spec.solutionMap[p2ID][p1ID]) {
          this.spec.solutionMap[p2ID][p1ID] = {};
        }
        this.spec.solutionMap[p2ID][p1ID][p3ID] = solutionIndex ? 0 : 1;
      }
    },
    addTriangle: {
      value: function addTriangle(point1Id, point2Id, point3) {
        var position1 = this.positions[point1Id];
        var position2 = this.positions[point2Id];
        var numPoints = Object.keys(this.spec.points).length;
        var point3Id = "p" + numPoints;
        var dist1To3 = Geom.euclid(point3, this.positions[point1Id]);
        var dist2To3 = Geom.euclid(point3, this.positions[point2Id]);

        this.spec.points[point3Id] = {};

        // there are two possible solutions to a triangle--so figure out which
        // is desired based on the closest calculated third point
        var res = Geom.calcPointFromTriangle(position1, position2, dist1To3, dist2To3);

        var solutionIndex = 1;
        if (Geom.euclid(res.sol1, point3) < Geom.euclid(res.sol2, point3)) {
          solutionIndex = 0;
        }
        this._addSolution(point1Id, point2Id, point3Id, solutionIndex);

        this._addSegment(point3Id, point1Id, dist1To3);
        this._addSegment(point3Id, point2Id, dist2To3);
      }
    },
    addGroundSegment: {
      value: function addGroundSegment(groundPoint, auxPoint, connectedID) {
        var numPoints = Object.keys(this.spec.points).length;
        var groundID = "p" + numPoints;
        var auxID = "p" + (numPoints + 1);

        this.spec.groundPoints[groundID] = {
          x: groundPoint.x,
          y: groundPoint.y };

        var connectedPoint = this.positions[connectedID];
        var distGroundToAux = Geom.euclid(groundPoint, auxPoint);
        var distAuxToConnected = Geom.euclid(auxPoint, connectedPoint);

        this.spec.points[groundID] = {};
        this.spec.points[groundID][auxID] = { len: distGroundToAux };

        this.spec.points[auxID] = {};

        var res = Geom.calcPointFromTriangle(groundPoint, connectedPoint, distGroundToAux, distAuxToConnected);

        var solutionIndex = 0;
        if (Geom.euclid(res.sol1, auxPoint) < Geom.euclid(res.sol2, auxPoint)) {
          solutionIndex = 1;
        }
        this._addSolution(connectedID, groundID, auxID, solutionIndex);

        // TODO: use _addSegment here
        this.spec.points[auxID][connectedID] = { len: distAuxToConnected };
        this.spec.points[auxID][groundID] = { len: distGroundToAux };
        this.spec.points[connectedID][auxID] = { len: distAuxToConnected };
      }
    },
    getClosestThings: {
      value: function getClosestThings(currentPoint) {
        var _this = this;

        var points = Object.keys(this.positions).map(function (id) {
          var res = _this.positions[id];
          res.id = id;
          return res;
        });

        var closestPointInfo = Geom.findClosestThingToPoint(points, currentPoint, Geom.euclid);

        var closestSegmentInfo = Geom.findClosestThingToPoint(this._makeSegments(), currentPoint, Geom.calcMinDistFromSegmentToPoint);

        return { closestPointInfo: closestPointInfo, closestSegmentInfo: closestSegmentInfo };
      }
    },
    _makeSegments: {
      value: function _makeSegments() {
        var _this = this;

        var segments = [];

        Object.keys(this.spec.points).forEach(function (pointID) {
          var p0 = _this.positions[pointID];
          p0.id = pointID;
          Object.keys(_this.spec.points[pointID]).forEach(function (point2ID) {
            var p1 = _this.positions[point2ID];
            p1.id = point2ID;
            segments.push([p0, p1]);
          });
        });

        return segments;
      }
    },
    calculatePositions: {
      value: function calculatePositions() {
        try {
          var positions = this._calculatePositionsAux(this.spec);
        } catch (e) {
          return false;
        }

        this.positions = positions;
        return true;
      }
    },
    _calculatePositionsAux: {
      value: function _calculatePositionsAux(spec) {
        var points = spec.points;
        var extenders = spec.extenders;
        var groundPoints = spec.groundPoints;

        var positions = {};

        var idList = Object.keys(points);
        var oldLength;

        do {
          oldLength = idList.length;
          idList = idList.filter(function (id) {
            if (groundPoints[id]) {
              positions[id] = groundPoints[id];
            } else if (extenders[id] && positions[extenders[id].base] && positions[extenders[id].ref]) {
              positions[id] = Geom.calcPointFromExtender(positions[extenders[id].base], positions[extenders[id].ref], extenders[id].len, extenders[id].angle);
            } else {
              var knownAdjacents = Object.keys(points[id]).filter(function (adj) {
                return positions[adj];
              });

              if (knownAdjacents.length >= 2) {
                var solutionIndex = spec.solutionMap[knownAdjacents[0]][knownAdjacents[1]][id];
                positions[id] = Geom.calcPointFromTriangle(positions[knownAdjacents[0]], positions[knownAdjacents[1]], points[id][knownAdjacents[0]].len, points[id][knownAdjacents[1]].len)["sol" + (solutionIndex + 1)];
              }
            }

            return !positions[id];
          });
        } while (idList.length > 0 && idList.length < oldLength);

        if (idList.length > 0) {
          throw new Error("failed to compute all points");
        }

        return positions;
      }
    }
  });

  return Linkage;
})();

module.exports = Linkage;

},{"./math/GeometryUtils":"/Users/rjnevels/Development/Linkages3/src/math/GeometryUtils.js","./math/smallestNumberDivisibleBy":"/Users/rjnevels/Development/Linkages3/src/math/smallestNumberDivisibleBy.js"}],"/Users/rjnevels/Development/Linkages3/src/graphics/LinkageRenderer.js":[function(require,module,exports){
/* @flow */
"use strict";

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var SCALE = 10;
var POINT_COLOR = "black";
var LINE_COLOR = "darkGray";
var BACKGROUND_COLOR = "white";
var POINT_RADIUS = 4;
var LINE_WIDTH = 4;

function getOptions(opts) {
  opts = {
    pointColor: opts && opts.pointColor ? opts.pointColor : POINT_COLOR,
    lineColor: opts && opts.lineColor ? opts.lineColor : LINE_COLOR,
    pointRadius: opts && opts.pointRadius ? opts.pointRadius : POINT_RADIUS,
    lineWidth: opts && opts.lineWidth ? opts.lineWidth : LINE_WIDTH };

  opts.pointRadius = opts.pointRadius / SCALE;
  opts.lineWidth = opts.lineWidth / SCALE;

  return opts;
}

var CanvasRenderer = (function () {
  function CanvasRenderer(canvasID) {
    _classCallCheck(this, CanvasRenderer);

    var canvas = document.getElementById(canvasID);
    this.ctx = canvas.getContext("2d");

    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
    this._width = canvas.width;
    this._height = canvas.height;

    this.ctx.scale(1, -1);
    this.ctx.translate(this._width / 2, -this._height / 2);
    this.ctx.scale(SCALE, SCALE);
  }

  _createClass(CanvasRenderer, {
    inverseTransform: {
      value: function inverseTransform(_ref) {
        var x = _ref.x;
        var y = _ref.y;

        x *= 1;
        y *= -1;
        x -= this._width / 2;
        y -= -this._height / 2;
        x /= SCALE;
        y /= SCALE;
        return { x: x, y: y };
      }
    },
    __drawPointAux: {
      value: function __drawPointAux(_ref, pointRadius) {
        var x = _ref.x;
        var y = _ref.y;

        this.ctx.beginPath();
        this.ctx.arc(x, y, pointRadius, 0, 2 * Math.PI, true);
        this.ctx.fill();
      }
    },
    drawPoint: {
      value: function drawPoint(point, options) {
        var _getOptions = getOptions(options);

        var pointColor = _getOptions.pointColor;
        var pointRadius = _getOptions.pointRadius;

        this.ctx.save();
        this.ctx.fillStyle = pointColor;
        this.__drawPointAux(point, pointRadius);
        this.ctx.restore();
      }
    },
    __drawLineAux: {
      value: function __drawLineAux(p1, p2) {
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.stroke();
      }
    },
    drawLine: {
      value: function drawLine(p1, p2, options) {
        var _getOptions = getOptions(options);

        var lineColor = _getOptions.lineColor;
        var lineWidth = _getOptions.lineWidth;

        this.ctx.save();
        this.ctx.strokeStyle = lineColor;
        this.ctx.lineWidth = lineWidth;
        this.__drawLineAux(p1, p2);
        this.ctx.restore();
      }
    },
    __drawBackground: {
      value: function __drawBackground() {
        this.ctx.save();
        this.ctx.fillStyle = BACKGROUND_COLOR;
        this.ctx.fillRect(-this._width / 2, -this._height / 2, this._width, this._height);
        this.ctx.restore();
      }
    },
    drawLines: {

      // TODO how to get rid of any type here?

      value: function drawLines(points, options) {
        var _this = this;

        if (points.length === 0) {
          return;
        }

        var _getOptions = getOptions(options);

        var lineColor = _getOptions.lineColor;
        var lineWidth = _getOptions.lineWidth;
        var pointColor = _getOptions.pointColor;
        var pointRadius = _getOptions.pointRadius;

        this.ctx.save();
        this.ctx.strokeStyle = lineColor;
        this.ctx.lineWidth = lineWidth;
        this.ctx.fillStyle = pointColor;

        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        points.forEach(function (point, i) {
          if (i !== 0) {
            _this.ctx.lineTo(point.x, point.y);
          }
        });
        this.ctx.stroke();

        if (options && options.drawPoints) {
          points.forEach(function (_ref) {
            var x = _ref.x;
            var y = _ref.y;

            _this.ctx.beginPath();
            _this.ctx.arc(x, y, pointRadius, 0, 2 * Math.PI, true);
            _this.ctx.fill();
          });
        }

        this.ctx.restore();
      }
    }
  });

  return CanvasRenderer;
})();

var LinkageRenderer = (function (_CanvasRenderer) {
  function LinkageRenderer() {
    _classCallCheck(this, LinkageRenderer);

    if (_CanvasRenderer != null) {
      _CanvasRenderer.apply(this, arguments);
    }
  }

  _inherits(LinkageRenderer, _CanvasRenderer);

  _createClass(LinkageRenderer, {
    drawLinkage: {
      value: function drawLinkage(_ref) {
        var _this = this;

        var points = _ref.points;
        var positions = _ref.positions;

        this.__drawBackground();

        Object.keys(points).forEach(function (pointID) {
          var p0 = positions[pointID];
          Object.keys(points[pointID]).forEach(function (pointIDi) {
            var pi = positions[pointIDi];
            _this.drawLine(p0, pi);
          });
        });

        Object.keys(points).forEach(function (pointID) {
          _this.drawPoint(positions[pointID]);
        });
      }
    }
  });

  return LinkageRenderer;
})(CanvasRenderer);

module.exports = LinkageRenderer;

},{}],"/Users/rjnevels/Development/Linkages3/src/linkageData.js":[function(require,module,exports){
"use strict";

module.exports = {
  points: {
    p0: {
      p1: { len: 1 } },
    p1: {
      p0: { len: 1 },
      p2: { len: 5 } },
    p2: {
      p1: { len: 5 } } },
  extenders: {
    p2: {
      base: "p1",
      ref: "p0",
      angle: 0,
      len: 5,
      speed: 1 } },
  rotaries: {
    p1: "p2" },
  groundPoints: {
    p0: { x: 1, y: 0 },
    p1: { x: 0, y: 0 } },
  solutionMap: {
    p0: {
      p2: {
        p1: 0 } },
    p2: {
      p0: {
        p1: 1 } } } };

},{}],"/Users/rjnevels/Development/Linkages3/src/main.js":[function(require,module,exports){
/* @flow */

"use strict";

var Linkage = require("./Linkage.js");
var LinkageRenderer = require("./graphics/LinkageRenderer");
var UI = require("./ui/UI.js");
var UIState = require("./ui/UIState");

var linkageData = require("./linkageData.js");

var urlData;
try {
  var s = window.location.search.substring(1);
  urlData = JSON.parse(window.unescape(s));
} catch (e) {}

if (urlData) {
  linkageData = urlData;
}

document.getElementById("button").onclick = function () {
  var location = window.location;
  var url = location.search ? location.href.split(location.search)[0] : location.href;
  location.href = url + "?" + window.escape(JSON.stringify(ui.state.linkage.spec));
};

var linkage = new Linkage(linkageData);
var initialState = UIState.getInitialUnpausedState(linkage);
var renderer = new LinkageRenderer("mycanvas");

var ui = new UI(initialState, renderer, []);
ui.animate();

},{"./Linkage.js":"/Users/rjnevels/Development/Linkages3/src/Linkage.js","./graphics/LinkageRenderer":"/Users/rjnevels/Development/Linkages3/src/graphics/LinkageRenderer.js","./linkageData.js":"/Users/rjnevels/Development/Linkages3/src/linkageData.js","./ui/UI.js":"/Users/rjnevels/Development/Linkages3/src/ui/UI.js","./ui/UIState":"/Users/rjnevels/Development/Linkages3/src/ui/UIState.js"}],"/Users/rjnevels/Development/Linkages3/src/math/GeometryUtils.js":[function(require,module,exports){
/* @flow */

"use strict";

var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) { _arr.push(_step.value); if (i && _arr.length === i) break; } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } };

function euclid(p1, p2) {
  var dx = p2.x - p1.x;
  var dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function calcSumOfMins(path1, path2) {
  var sum = 0;

  path1.forEach(function (p1) {
    var minDist = Number.MAX_VALUE;

    path2.forEach(function (p2) {
      var dist = euclid(p1, p2);
      if (dist < minDist) {
        minDist = dist;
      }
    });

    sum += minDist;
  });

  return sum;
}

function calcMinDistFromSegmentToPoint(segment, p3) {
  var point = null;

  var _segment = _slicedToArray(segment, 2);

  var p1 = _segment[0];
  var p2 = _segment[1];

  var theta = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  var t = Math.sin(theta) * (p3.y - p1.y) + Math.cos(theta) * (p3.x - p1.x);

  if (t < 0) {
    point = p1;
  } else if (t > euclid(p1, p2)) {
    point = p2;
  } else {
    point = {
      x: p1.x + t * Math.cos(theta),
      y: p1.y + t * Math.sin(theta) };
  }

  return euclid(point, p3);
}

function findClosestThingToPoint(things, point, distanceBetween, startingThing, startingDistance) {
  return things.reduce(function (best, thing) {
    var dist = distanceBetween(thing, point);
    if (dist < best.dist) {
      best.dist = dist;
      best.thing = thing;
    }
    return best;
  }, { thing: startingThing, dist: startingDistance || 1 });
}

function calcPointFromTriangle(p1, p2, a1, a2) {
  var a3 = euclid(p1, p2);
  if (a3 > a1 + a2) {
    throw new Error("lengths of bars less that distance between joints", p1, p2, a1, a2);
  }

  var alpha1 = Math.acos((a1 * a1 + a3 * a3 - a2 * a2) / (2 * a1 * a3));
  if (!isFinite(alpha1)) {
    throw new Error("bad acos calculation");
  }

  var dx = p2.x - p1.x;
  var dy = p2.y - p1.y;
  if (dx === 0 && dy === 0) {
    throw new Error("enpoints are equal -> unknown angle");
  }
  var theta1 = Math.atan2(dy, dx);

  return {
    sol1: {
      x: p1.x + a1 * Math.cos(alpha1 + theta1),
      y: p1.y + a1 * Math.sin(alpha1 + theta1) },
    sol2: {
      x: p1.x + a1 * Math.cos(-alpha1 + theta1),
      y: p1.y + a1 * Math.sin(-alpha1 + theta1) } };
}

function calcPointFromExtender(p1, p2, len, angle) {
  var baseAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  angle += baseAngle;
  return {
    x: p1.x + len * Math.cos(angle),
    y: p1.y + len * Math.sin(angle) };
}

module.exports = {
  euclid: euclid,
  calcMinDistFromSegmentToPoint: calcMinDistFromSegmentToPoint,
  findClosestThingToPoint: findClosestThingToPoint,
  calcPointFromTriangle: calcPointFromTriangle,
  calcPointFromExtender: calcPointFromExtender,
  calcSumOfMins: calcSumOfMins };

},{}],"/Users/rjnevels/Development/Linkages3/src/math/smallestNumberDivisibleBy.js":[function(require,module,exports){
/* @flow */

"use strict";

function primeFactors(x) {
  var map = {};

  var res = x;
  for (var n = 2; n <= x; n++) {
    var count = 0;

    while (res % n === 0) {
      res = res / n;
      count += 1;
    }

    if (count > 0) {
      map[n] = count;
    }
  }

  return map;
}

function smallestNumberDivisibleBy(list) {
  var occurences = {};

  // find occurences of all prime factors for each number
  list.forEach(function (x) {
    var map = primeFactors(x);
    Object.keys(map).forEach(function (factor) {
      if (typeof occurences[factor] !== "number" || occurences[factor] < map[factor]) {
        occurences[factor] = map[factor];
      }
    });
  });

  // multiply factors raised to their occurrence
  return Object.keys(occurences).reduce(function (acc, f) {
    return acc * Math.pow(f, occurences[f]);
  }, 1);
}

module.exports = smallestNumberDivisibleBy;

},{}],"/Users/rjnevels/Development/Linkages3/src/optimize/LinkageOptObj.js":[function(require,module,exports){
"use strict";

var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) { _arr.push(_step.value); if (i && _arr.length === i) break; } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

/* @flow */

var OptObj = require("./OptObj");
var Linkage = require("../Linkage");

var calcSumOfMins = require("../math/GeometryUtils").calcSumOfMins;

var LinkageOptObj = (function (_OptObj) {
  function LinkageOptObj(data) {
    _classCallCheck(this, LinkageOptObj);

    _get(Object.getPrototypeOf(LinkageOptObj.prototype), "constructor", this).call(this, data);
    this.linkage = new Linkage(data.linkageSpec);
    this.linkage.calculatePositions();
  }

  _inherits(LinkageOptObj, _OptObj);

  _createClass(LinkageOptObj, {
    __calcPerf: {
      value: function __calcPerf() {
        var path1 = this.linkage.getPath(this.__data.id);

        if (!path1) {
          throw new Error("incomplete loop");
        }

        var path2 = this.__data.path;

        if (path1.length === 0) {
          throw new Error("linkage path has to have points");
        }

        if (path2.length === 0) {
          throw new Error("provided path has to have points");
        }

        return this.__calcPathPerf(path1, path2);
      }
    },
    __calcPathPerf: {
      value: function __calcPathPerf(path1, path2) {
        return calcSumOfMins(path1, path2) + calcSumOfMins(path2, path1);
      }
    },
    getFeatures: {
      value: function getFeatures() {
        var _this = this;

        var that = this;
        var spec = this.__data.linkageSpec;

        var points = spec.points;
        var rotaries = spec.rotaries;
        var extenders = spec.extenders;
        var groundPoints = spec.groundPoints;

        var _map = [groundPoints, extenders, points].map(Object.keys);

        var _map2 = _slicedToArray(_map, 3);

        var groundIDs = _map2[0];
        var extenderIDs = _map2[1];
        var pointIDs = _map2[2];

        var refPoints = {};
        extenderIDs.forEach(function (id) {
          refPoints[extenders[id].ref] = true;
        });

        var groundFeatures = groundIDs.filter(function (id) {
          return !refPoints[id];
        }).map(function (id) {
          var orig = spec.groundPoints[id];

          return function () {
            var deltaX = (Math.random() - 0.5) * 2 * 0.5;
            var deltaY = (Math.random() - 0.5) * 2 * 0.5;

            var point = {
              x: orig.x + deltaX,
              y: orig.y + deltaY };

            var moves = [{ id: id, point: point }];

            if (rotaries[id]) {
              var refID = extenders[rotaries[id]].ref;
              var refCurPoint = groundPoints[refID];
              var refNextPoint = {
                x: refCurPoint.x + deltaX,
                y: refCurPoint.y + deltaY };
              moves.push({ point: refNextPoint, id: refID });
            }

            _this.linkage.tryMovingGroundPoints(moves);
          };
        });

        var notGroundFeatures = pointIDs.filter(function (id) {
          return !groundPoints[id] && !refPoints[id];
        }).map(function (id) {
          var orig = _this.linkage.positions[id];

          return function () {
            var deltaX = (Math.random() - 0.5) * 2 * 0.5;
            var deltaY = (Math.random() - 0.5) * 2 * 0.5;

            var point = {
              x: orig.x + deltaX,
              y: orig.y + deltaY };

            _this.linkage.moveNotGroundPoint(point, id);
          };
        });

        return groundFeatures.concat(notGroundFeatures);
      }
    },
    isValid: {
      value: function isValid() {
        try {
          this.calcPerfCached();
          return true;
        } catch (e) {
          return false;
        }
      }
    }
  });

  return LinkageOptObj;
})(OptObj);

module.exports = LinkageOptObj;

},{"../Linkage":"/Users/rjnevels/Development/Linkages3/src/Linkage.js","../math/GeometryUtils":"/Users/rjnevels/Development/Linkages3/src/math/GeometryUtils.js","./OptObj":"/Users/rjnevels/Development/Linkages3/src/optimize/OptObj.js"}],"/Users/rjnevels/Development/Linkages3/src/optimize/OptObj.js":[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

/* @flow */

var OptObj = (function () {
  function OptObj(data) {
    _classCallCheck(this, OptObj);

    this.__data = data;
    this._perf = null;
  }

  _createClass(OptObj, {
    calcPerfCached: {
      value: function calcPerfCached() {
        if (typeof this._perf === "number") {
          return this._perf;
        }

        var perf = this.__calcPerf();
        this._perf = perf;
        return perf;
      }
    },
    __calcPerf: {
      value: function __calcPerf() {
        throw new Error("__calcPerf not implemented");
      }
    },
    copy: {
      value: function copy() {
        var dataCopy = JSON.parse(JSON.stringify(this.__data));
        var objCopy = new this.constructor(dataCopy);
        return objCopy;
      }
    },
    getFeatures: {
      value: function getFeatures() {
        throw new Error("getFeatures not implemented");
      }
    },
    isValid: {
      value: function isValid() {
        throw new Error("isValid not implemented");
      }
    }
  });

  return OptObj;
})();

module.exports = OptObj;

},{}],"/Users/rjnevels/Development/Linkages3/src/optimize/optimizeStep.js":[function(require,module,exports){
/* @flow */

"use strict";

var OptObj = require("./OptObj");

function optimizeStep(thing) {
  var newThing = thing.copy();

  // loop through all features and tweak them
  newThing.getFeatures().forEach(function (tweak) {
    return tweak();
  });

  // if the new thing is not invalid,
  if (!newThing.isValid()) {
    // return the old thing
    return thing;
  }

  // return the old thing if its perf is better
  //  (the lower the perf value the better)
  if (thing.calcPerfCached() <= newThing.calcPerfCached()) {
    return thing;
  }

  // return the new thing and its performance
  return newThing;
}

module.exports = optimizeStep;

},{"./OptObj":"/Users/rjnevels/Development/Linkages3/src/optimize/OptObj.js"}],"/Users/rjnevels/Development/Linkages3/src/ui/KEYS.js":[function(require,module,exports){
"use strict";

module.exports = {
  D: 68,
  ESC: 27,
  O: 79,
  R: 82,
  S: 83,
  SPACE: 32,
  T: 84,
  W: 87,
  d: 100,
  o: 111,
  r: 120,
  s: 115,
  t: 116,
  w: 119 };

},{}],"/Users/rjnevels/Development/Linkages3/src/ui/LoggedUIEvent.js":[function(require,module,exports){
/* @flow */
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var LoggedUIEvent = (function () {
  function LoggedUIEvent(handlerName, eventData) {
    _classCallCheck(this, LoggedUIEvent);

    this.handlerName = handlerName;
    this.eventData = eventData;
  }

  _createClass(LoggedUIEvent, {
    callHandler: {
      value: function callHandler(ui) {
        ui[this.handlerName](this.eventData);
      }
    }
  });

  return LoggedUIEvent;
})();

module.exports = LoggedUIEvent;

},{}],"/Users/rjnevels/Development/Linkages3/src/ui/UI.js":[function(require,module,exports){
/* @flow */
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var Linkage = require("../Linkage");
var LinkageRenderer = require("../graphics/LinkageRenderer");
var LoggedUIEvent = require("./LoggedUIEvent");
var UIState = require("./UIState");

var UI = (function () {
  function UI(state, renderer) {
    var _this = this;

    _classCallCheck(this, UI);

    this.state = state;
    this.renderer = renderer;
    this.eventLog = [];
    this.stateLog = [this.state.constructor.name];
    this.initialSpec = JSON.stringify(this.state.linkage.spec);

    // need to have initial positions calculated for hover to work
    this.state.linkage.calculatePositions();

    this.mousePoint = { x: 0, y: 0 };
    this.dragging = false;

    this.hoverSegmentIDs = null;
    this.hoverPointID = ""; // ugh flow
    this.hoverPoint = false;
    this.hoverGround = false;
    this.hoverRotary = false;

    //
    // wrap key and mouse handler methods, logging the event name, and key
    // pressed or mouse position. we can extract the log from the console, and
    // use it to make integration tests that are abstracted from the browser.
    // (see src/__tests__/Integration-test.js)
    //
    var makeHandler = function (name, getData) {
      return function (e) {
        var data = getData(e);

        var prevEvent = _this.eventLog.slice(-1)[0];
        if (prevEvent && prevEvent.handlerName === name) {
          _this.eventLog.pop();
        }
        _this.eventLog.push(new LoggedUIEvent(name, data));

        _this[name](data);

        var stateName = _this.state.constructor.name;
        if (_this.stateLog.slice(-1)[0] !== stateName) {
          _this.stateLog.push(stateName);
        }
      };
    };

    var getKey = function (e) {
      return e.which;
    };
    var getMousePoint = function (e) {
      return _this.renderer.inverseTransform(e);
    };

    var doc = document;
    doc.onkeyup = makeHandler("onKeyUp", getKey);
    doc.onkeydown = makeHandler("onKeyDown", getKey);
    doc.onkeypress = makeHandler("onKeyPress", getKey);
    doc.onmousemove = makeHandler("onMouseMove", getMousePoint);
    doc.onmousedown = makeHandler("onMouseDown", getMousePoint);
    doc.onmouseup = makeHandler("onMouseUp", getMousePoint);
  }

  _createClass(UI, {
    logAndReset: {

      // called from the browser console to extract logs

      value: function logAndReset() {
        var name = this.stateLog.join("_");
        var finalSpec = JSON.stringify(this.state.linkage.spec);
        console.log("var " + name + " = {\n  initialSpec: " + this.initialSpec + ",\n  finalSpec: " + finalSpec + ",\n  eventLog: " + JSON.stringify(this.eventLog) + ",\n};");
        this.initialSpec = finalSpec;
        this.eventLog = [];
        this.stateLog = [];
      }
    },
    animate: {
      value: function animate() {
        var mouseInfo = {
          mousePoint: this.mousePoint
        };

        var _ref = this;

        var hoverSegmentIDs = _ref.hoverSegmentIDs;
        var hoverPointID = _ref.hoverPointID;

        if (hoverSegmentIDs) {
          mouseInfo.p0id = hoverSegmentIDs[0];
          mouseInfo.p1id = hoverSegmentIDs[1];
        } else if (hoverPointID) {
          mouseInfo.p0id = hoverPointID;
        }

        this.state.draw(this.renderer, mouseInfo);
        window.requestAnimationFrame(this.animate.bind(this));
      }
    },
    onMouseDown: {
      value: function onMouseDown(mousePoint) {
        this.dragging = true;

        var newState = null;

        if (this.hoverSegmentIDs) {
          newState = this.state.onSegmentDown(this.hoverSegmentIDs[0], this.hoverSegmentIDs[1]);
        } else if (this.hoverRotary) {
          newState = this.state.onRotaryDown(this.hoverPointID);
        } else if (this.hoverGround) {
          newState = this.state.onGroundDown(this.hoverPointID);
        } else if (this.hoverPoint) {
          newState = this.state.onPointDown(this.hoverPointID);
        } else {
          newState = this.state.onCanvasDown(mousePoint);
          if (!newState) {
            newState = this.state.onMouseDown(mousePoint);
          }
        }

        this.state = newState ? newState : this.state;
        this.setHovers(mousePoint);
      }
    },
    onMouseUp: {
      value: function onMouseUp(mousePoint) {
        this.dragging = false;

        var newState = this.state.onMouseUp(mousePoint);

        if (!newState) {
          if (this.hoverSegmentIDs) {
            newState = this.state.onSegmentUp(this.hoverSegmentIDs[0], this.hoverSegmentIDs[1]);
          } else if (this.hoverPointID) {
            newState = this.state.onAnyPointUp(this.hoverPointID);
          } else {
            newState = this.state.onCanvasUp(mousePoint);
          }
        }

        this.state = newState ? newState : this.state;
        this.setHovers(mousePoint);
      }
    },
    onMouseMove: {
      value: function onMouseMove(mousePoint) {
        if (this.dragging) {
          var newState = this.state.onMouseDrag(mousePoint);
          this.state = newState ? newState : this.state;
        }

        this.setHovers(mousePoint);
        this.mousePoint = mousePoint;
      }
    },
    onKeyUp: {
      value: function onKeyUp(which) {
        var newState = this.state.onKeyUp(which);
        this.state = newState ? newState : this.state;
        this.mousePoint && this.setHovers(this.mousePoint);
      }
    },
    onKeyDown: {
      value: function onKeyDown(which) {
        var newState = this.state.onKeyDown(which);
        this.state = newState ? newState : this.state;
        this.mousePoint && this.setHovers(this.mousePoint);
      }
    },
    onKeyPress: {
      value: function onKeyPress(which) {
        var newState = this.state.onKeyPress(which);
        this.state = newState ? newState : this.state;
        this.mousePoint && this.setHovers(this.mousePoint);
      }
    },
    setHovers: {
      value: function setHovers(currentPoint) {
        this.hoverSegmentIDs = null;
        this.hoverPointID = "";
        this.hoverPoint = false;
        this.hoverGround = false;
        this.hoverRotary = false;

        var _state$linkage$getClosestThings = this.state.linkage.getClosestThings(currentPoint);

        var closestPointInfo = _state$linkage$getClosestThings.closestPointInfo;
        var closestSegmentInfo = _state$linkage$getClosestThings.closestSegmentInfo;

        if (closestPointInfo.thing) {
          this.hoverPointID = closestPointInfo.thing.id;

          if (this.state.linkage.spec.rotaries[this.hoverPointID]) {
            this.hoverRotary = true;
          } else if (this.state.linkage.spec.groundPoints[this.hoverPointID]) {
            this.hoverGround = true;
          } else if (this.state.linkage.spec.points[this.hoverPointID]) {
            this.hoverPoint = true;
          }
        } else if (closestSegmentInfo.thing) {
          this.hoverSegmentIDs = [closestSegmentInfo.thing[0].id, closestSegmentInfo.thing[1].id];
        }
      }
    }
  });

  return UI;
})();

module.exports = UI;

},{"../Linkage":"/Users/rjnevels/Development/Linkages3/src/Linkage.js","../graphics/LinkageRenderer":"/Users/rjnevels/Development/Linkages3/src/graphics/LinkageRenderer.js","./LoggedUIEvent":"/Users/rjnevels/Development/Linkages3/src/ui/LoggedUIEvent.js","./UIState":"/Users/rjnevels/Development/Linkages3/src/ui/UIState.js"}],"/Users/rjnevels/Development/Linkages3/src/ui/UIState.js":[function(require,module,exports){
/*
 * This file contains all the UI state transitions and behaviors. Unfortunately,
 * since state transitions are inherently circular, this file cannot easily be
 * broken up into separate files because the CommonJS require system has zero
 * tolerance for circular references. To solve this, we'd need to add our own
 * require or registrar system on top of CommonJS. I'll tackle that when this
 * file reaches 1000 lines or so.
 */
"use strict";

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var Linkage = require("../Linkage");
var LinkageRenderer = require("../graphics/LinkageRenderer");
var LinkageOptObj = require("../optimize/LinkageOptObj");
var KEYS = require("./KEYS");

var mixinPointValidation = require("./mixinPointValidation");
var optimizeStep = require("../optimize/optimizeStep");

var MAX_TRACE_POINTS = 100;

var PREVIEW_OPTIONS = {
  lineColor: "pink",
  pointColor: "red",
  drawPoints: true };

var TRACE_OPTIONS = {
  lineColor: "pink",
  pointColor: "red",
  drawPoints: false };

var OPTIMIZE_PATH_OPTIONS = {
  lineColor: "hotPink",
  pointColor: "magenta",
  drawPoints: false };

var BaseState = (function () {
  function BaseState(linkage, spec) {
    _classCallCheck(this, BaseState);

    //console.log(this.constructor);
    this.linkage = linkage;

    if (spec) {
      this.p0id = spec.p0id;
      this.p1id = spec.p1id;
      this.pointA = spec.pointA;
      this.pointB = spec.pointB;
    }
  }

  _createClass(BaseState, {
    draw: {
      value: function draw(renderer, mouseInfo) {
        renderer.drawLinkage({
          positions: this.linkage.positions,
          points: this.linkage.spec.points });
      }
    },
    onMouseDrag: {

      // Basic handlers

      value: function onMouseDrag(mousePoint) {}
    },
    onMouseDown: {
      value: function onMouseDown() {}
    },
    onMouseUp: {
      value: function onMouseUp(mousePoint) {}
    },
    onKeyPress: {
      value: function onKeyPress(key) {}
    },
    onKeyDown: {
      value: function onKeyDown(key) {}
    },
    onKeyUp: {
      value: function onKeyUp(key) {}
    },
    onAnyPointUp: {

      // UI element-specific hanlders (convenience)

      value: function onAnyPointUp(p0id) {}
    },
    onCanvasDown: {
      value: function onCanvasDown(pointA) {}
    },
    onCanvasUp: {
      value: function onCanvasUp(pointA) {}
    },
    onGroundDown: {
      value: function onGroundDown(p0id) {}
    },
    onPointDown: {
      value: function onPointDown(p0id) {}
    },
    onRotaryDown: {
      value: function onRotaryDown(p0id) {}
    },
    onSegmentDown: {
      value: function onSegmentDown(p0id, p1id) {}
    },
    onSegmentUp: {
      value: function onSegmentUp(p0id, p1id) {}
    }
  }, {
    getInitialUnpausedState: {
      value: function getInitialUnpausedState(linkage) {
        return new UnpausedState(linkage);
      }
    },
    getInitialPausedState: {
      value: function getInitialPausedState(linkage) {
        return new State0(linkage);
      }
    }
  });

  return BaseState;
})();

var UnpausedState = (function (_BaseState) {
  function UnpausedState() {
    _classCallCheck(this, UnpausedState);

    if (_BaseState != null) {
      _BaseState.apply(this, arguments);
    }
  }

  _inherits(UnpausedState, _BaseState);

  _createClass(UnpausedState, {
    draw: { // initial unpaused

      value: function draw(renderer, mouseInfo) {
        this.linkage.tryRotatingLinkageInput();
        _get(Object.getPrototypeOf(UnpausedState.prototype), "draw", this).call(this, renderer, mouseInfo);
      }
    },
    onKeyUp: {
      value: function onKeyUp(key) {
        switch (key) {
          case KEYS.SPACE:
            return new State0(this.linkage);
          default:
            return this;
        }
      }
    },
    onKeyPress: {
      value: function onKeyPress(key) {
        switch (key) {
          case KEYS.S:
          case KEYS.s:
            this.linkage.scaleSpeed(0.9);
            return this;
          case KEYS.W:
          case KEYS.w:
            this.linkage.scaleSpeed(1.1);
            return this;
          case KEYS.T:
          case KEYS.t:
            this.linkage.reverseRotary();
            return this;
          default:
            return this;
        }
      }
    }
  });

  return UnpausedState;
})(BaseState);

var State10 = (function (_UnpausedState) {
  function State10() {
    _classCallCheck(this, State10);

    if (_UnpausedState != null) {
      _UnpausedState.apply(this, arguments);
    }
  }

  _inherits(State10, _UnpausedState);

  _createClass(State10, {
    draw: { // rotary selected moving

      value: function draw(renderer, mouseInfo) {
        _get(Object.getPrototypeOf(State10.prototype), "draw", this).call(this, renderer, mouseInfo);

        var p1id = this.linkage.spec.rotaries[this.p0id];
        var p2id = this.linkage.spec.extenders[p1id].ref;
        renderer.drawLines([this.linkage.getPoint(p1id), this.linkage.getPoint(this.p0id), this.linkage.getPoint(p2id)], PREVIEW_OPTIONS);
      }
    },
    onKeyPress: {
      value: function onKeyPress(key) {
        switch (key) {
          case KEYS.S:
          case KEYS.s:
            this.linkage.changeSpeed(-1, this.p0id);
            return this;
          case KEYS.W:
          case KEYS.w:
            this.linkage.changeSpeed(1, this.p0id);
            return this;
          case KEYS.T:
          case KEYS.t:
            this.linkage.reverseRotary(this.p0id);
            return this;
          default:
            return this;
        }
      }
    }
  });

  return State10;
})(UnpausedState);

var State12 = (function (_UnpausedState2) {
  function State12(linkage, spec) {
    _classCallCheck(this, State12);

    _get(Object.getPrototypeOf(State12.prototype), "constructor", this).call(this, linkage, spec);
    this.tracePoints = [];
  }

  _inherits(State12, _UnpausedState2);

  _createClass(State12, {
    draw: {
      value: function draw(renderer, mouseInfo) {
        _get(Object.getPrototypeOf(State12.prototype), "draw", this).call(this, renderer, mouseInfo);

        // record the current position
        var curPoint = this.linkage.positions[this.p0id];
        this.tracePoints.push({
          x: curPoint.x,
          y: curPoint.y });
        if (this.tracePoints.length > MAX_TRACE_POINTS) {
          this.tracePoints.shift();
        }

        renderer.drawLines(this.tracePoints, TRACE_OPTIONS);
        renderer.drawPoint(curPoint, PREVIEW_OPTIONS);
      }
    }
  });

  return State12;
})(UnpausedState);

var PausedState = (function (_BaseState2) {
  function PausedState() {
    _classCallCheck(this, PausedState);

    if (_BaseState2 != null) {
      _BaseState2.apply(this, arguments);
    }
  }

  _inherits(PausedState, _BaseState2);

  _createClass(PausedState, {
    draw: {
      value: function draw(renderer, mouseInfo) {
        var p0id = mouseInfo.p0id;
        var p1id = mouseInfo.p1id;

        _get(Object.getPrototypeOf(PausedState.prototype), "draw", this).call(this, renderer, mouseInfo);

        if (p0id && p1id) {
          renderer.drawLines([this.linkage.positions[p0id], this.linkage.positions[p1id]], PREVIEW_OPTIONS);
        } else if (p0id) {
          renderer.drawPoint(this.linkage.positions[p0id], PREVIEW_OPTIONS);
        }
      }
    },
    onKeyUp: {
      value: function onKeyUp(key) {
        switch (key) {
          case KEYS.SPACE:
            return new UnpausedState(this.linkage);
          case KEYS.ESC:
            return new State0(this.linkage);
          default:
            return this;
        }
      }
    }
  });

  return PausedState;
})(BaseState);

var State0 = (function (_PausedState) {
  function State0() {
    _classCallCheck(this, State0);

    if (_PausedState != null) {
      _PausedState.apply(this, arguments);
    }
  }

  _inherits(State0, _PausedState);

  _createClass(State0, {
    onGroundDown: { // initial paused

      value: function onGroundDown(p0id) {
        return new State3(this.linkage, { p0id: p0id });
      }
    },
    onRotaryDown: {
      value: function onRotaryDown(p0id) {
        return new State7(this.linkage, { p0id: p0id });
      }
    },
    onPointDown: {
      value: function onPointDown(p0id) {
        return new State14(this.linkage, { p0id: p0id });
      }
    },
    onSegmentDown: {
      value: function onSegmentDown(p0id, p1id) {
        return new State9(this.linkage, { p0id: p0id, p1id: p1id });
      }
    },
    onCanvasDown: {
      value: function onCanvasDown(pointA) {
        return new State1(this.linkage, { pointA: pointA });
      }
    },
    onKeyDown: {
      value: function onKeyDown(key) {
        switch (key) {
          case KEYS.R:
          case KEYS.r:
            return new State11(this.linkage);
          default:
            return this;
        }
      }
    }
  });

  return State0;
})(PausedState);

var OptimizeState = (function (_PausedState2) {
  function OptimizeState() {
    _classCallCheck(this, OptimizeState);

    if (_PausedState2 != null) {
      _PausedState2.apply(this, arguments);
    }
  }

  _inherits(OptimizeState, _PausedState2);

  _createClass(OptimizeState, {
    onKeyUp: {
      value: function onKeyUp(key) {
        switch (key) {
          case KEYS.SPACE:
            return new State12(this.linkage, { p0id: this.p0id });
          default:
            return _get(Object.getPrototypeOf(OptimizeState.prototype), "onKeyUp", this).call(this, key);
        }
      }
    },
    draw: {
      value: function draw(renderer, mouseInfo) {
        _get(Object.getPrototypeOf(OptimizeState.prototype), "draw", this).call(this, renderer, mouseInfo);
        renderer.drawLines(this.__drawnPoints, OPTIMIZE_PATH_OPTIONS);
        renderer.drawLines(this.__pointPath, TRACE_OPTIONS);
      }
    }
  });

  return OptimizeState;
})(PausedState);

var State15 = (function (_OptimizeState) {
  // draw optimize path

  function State15(linkage, spec) {
    _classCallCheck(this, State15);

    _get(Object.getPrototypeOf(State15.prototype), "constructor", this).call(this, linkage, spec);
    this.__drawnPoints = [];
    this.__pointPath = this.linkage.getPath(this.p0id);
  }

  _inherits(State15, _OptimizeState);

  _createClass(State15, {
    onMouseDrag: {
      value: function onMouseDrag(mousePoint) {
        this.__drawnPoints.push(mousePoint);
        return this;
      }
    },
    onMouseUp: {
      value: function onMouseUp(mousePoint) {
        return new State16(this.linkage, { p0id: this.p0id }, this.__drawnPoints);
      }
    },
    draw: {
      value: function draw(renderer, mouseInfo) {
        var mousePoint = mouseInfo.mousePoint;

        _get(Object.getPrototypeOf(State15.prototype), "draw", this).call(this, renderer, mouseInfo);

        renderer.drawPoint(this.linkage.getPoint(this.p0id), PREVIEW_OPTIONS);
        renderer.drawPoint(mousePoint, OPTIMIZE_PATH_OPTIONS);
      }
    }
  });

  return State15;
})(OptimizeState);

var State16 = (function (_OptimizeState2) {
  function State16(linkage, spec, drawnPoints) {
    _classCallCheck(this, State16);

    _get(Object.getPrototypeOf(State16.prototype), "constructor", this).call(this, linkage, spec);
    this.__pointPath = this.linkage.getPath(this.p0id);
    this.__drawnPoints = drawnPoints;
    this._stopOptimizing = false;
    this._startOptimization();
  }

  _inherits(State16, _OptimizeState2);

  _createClass(State16, {
    onKeyUp: {
      value: function onKeyUp(key) {
        this._stopOptimizing = true;
        return _get(Object.getPrototypeOf(State16.prototype), "onKeyUp", this).call(this, key);
      }
    },
    _startOptimization: {
      value: function _startOptimization() {
        var optObj = new LinkageOptObj({
          path: this.__drawnPoints,
          linkageSpec: this.linkage.spec,
          id: this.p0id });

        var pauseTime = 0;

        var iterate = (function (_iterate) {
          var _iterateWrapper = function iterate() {
            return _iterate.apply(this, arguments);
          };

          _iterateWrapper.toString = function () {
            return _iterate.toString();
          };

          return _iterateWrapper;
        })(function () {
          if (!this._stopOptimizing) {
            setTimeout(iterate, pauseTime);
            optObj = optimizeStep(optObj);
            this.linkage = optObj.linkage;
            this.__pointPath = this.linkage.getPath(this.p0id);
          }
        });

        iterate = iterate.bind(this);

        setTimeout(iterate, pauseTime);
      }
    },
    draw: {
      value: function draw(renderer, mouseInfo) {
        _get(Object.getPrototypeOf(State16.prototype), "draw", this).call(this, renderer, mouseInfo);

        renderer.drawPoint(this.linkage.getPoint(this.p0id), PREVIEW_OPTIONS);
      }
    }
  });

  return State16;
})(OptimizeState);

var State14 = (function (_PausedState3) {
  function State14() {
    _classCallCheck(this, State14);

    if (_PausedState3 != null) {
      _PausedState3.apply(this, arguments);
    }
  }

  _inherits(State14, _PausedState3);

  _createClass(State14, {
    onMouseUp: {
      value: function onMouseUp(mousePoint) {
        return this.dragged ? new State0(this.linkage) : new State4(this.linkage, { p0id: this.p0id });
      }
    },
    onMouseDrag: {
      value: function onMouseDrag(mousePoint) {
        this.dragged = true;
        this.linkage.moveNotGroundPoint(mousePoint, this.p0id);
        return this;
      }
    },
    draw: {
      value: function draw(renderer, mouseInfo) {
        _get(Object.getPrototypeOf(State14.prototype), "draw", this).call(this, renderer, mouseInfo);
        renderer.drawPoint(this.linkage.getPoint(this.p0id), PREVIEW_OPTIONS);
      }
    }
  });

  return State14;
})(PausedState);

var State11 = (function (_PausedState4) {
  function State11() {
    _classCallCheck(this, State11);

    if (_PausedState4 != null) {
      _PausedState4.apply(this, arguments);
    }
  }

  _inherits(State11, _PausedState4);

  _createClass(State11, {
    onKeyUp: { // adding rotary

      value: function onKeyUp(key) {
        switch (key) {
          case KEYS.R:
          case KEYS.r:
            return new State0(this.linkage);
          default:
            return _get(Object.getPrototypeOf(State11.prototype), "onKeyUp", this).call(this, key);
        }
      }
    },
    onMouseUp: {
      value: function onMouseUp(mousePoint) {
        this.linkage.addRotaryInput(mousePoint);
        this.linkage.calculatePositions();
        return new State0(this.linkage);
      }
    },
    draw: {
      value: function draw(renderer, mouseInfo) {
        var mousePoint = mouseInfo.mousePoint;

        _get(Object.getPrototypeOf(State11.prototype), "draw", this).call(this, renderer, mouseInfo);

        renderer.drawLines([{ x: mousePoint.x + 3, y: mousePoint.y + 4 }, mousePoint, { x: mousePoint.x + 1, y: mousePoint.y }], PREVIEW_OPTIONS);
      }
    }
  });

  return State11;
})(PausedState);

var State1 = (function (_PausedState5) {
  // canvas1

  function State1(linkage, spec) {
    _classCallCheck(this, State1);

    _get(Object.getPrototypeOf(State1.prototype), "constructor", this).call(this, linkage, spec);

    mixinPointValidation([this.pointA], ["onCanvasUp", "onAnyPointUp"], this);
  }

  _inherits(State1, _PausedState5);

  _createClass(State1, {
    onCanvasUp: {
      value: function onCanvasUp(pointB) {
        return new State2(this.linkage, { pointA: this.pointA, pointB: pointB });
      }
    },
    onAnyPointUp: {
      value: function onAnyPointUp(p0id) {
        return new State13(this.linkage, { pointA: this.pointA, p0id: p0id });
      }
    },
    draw: {
      value: function draw(renderer, mouseInfo) {
        var mousePoint = mouseInfo.mousePoint;

        _get(Object.getPrototypeOf(State1.prototype), "draw", this).call(this, renderer, mouseInfo);
        renderer.drawLines([this.pointA, mousePoint], PREVIEW_OPTIONS);
      }
    }
  });

  return State1;
})(PausedState);

var State13 = (function (_PausedState6) {
  // canvas then point

  function State13(linkage, spec) {
    _classCallCheck(this, State13);

    _get(Object.getPrototypeOf(State13.prototype), "constructor", this).call(this, linkage, spec);

    mixinPointValidation([this.pointA, this.linkage.getPoint(this.p0id)], ["onCanvasUp"], this);
  }

  _inherits(State13, _PausedState6);

  _createClass(State13, {
    onCanvasUp: {
      value: function onCanvasUp(pointB) {
        this.linkage.addGroundSegment(this.pointA, pointB, this.p0id);
        this.linkage.calculatePositions();
        return new State0(this.linkage);
      }
    },
    draw: {
      value: function draw(renderer, mouseInfo) {
        var mousePoint = mouseInfo.mousePoint;

        _get(Object.getPrototypeOf(State13.prototype), "draw", this).call(this, renderer, mouseInfo);
        renderer.drawLines([this.pointA, mousePoint, this.linkage.getPoint(this.p0id)], PREVIEW_OPTIONS);
      }
    }
  });

  return State13;
})(PausedState);

var State2 = (function (_PausedState7) {
  // canvas1 + canvas2

  function State2(linkage, spec) {
    _classCallCheck(this, State2);

    _get(Object.getPrototypeOf(State2.prototype), "constructor", this).call(this, linkage, spec);

    mixinPointValidation([this.pointB], ["onAnyPointUp"], this);
  }

  _inherits(State2, _PausedState7);

  _createClass(State2, {
    onAnyPointUp: {
      value: function onAnyPointUp(p0id) {
        this.linkage.addGroundSegment(this.pointA, this.pointB, p0id);
        this.linkage.calculatePositions();
        return new State0(this.linkage);
      }
    },
    draw: {
      value: function draw(renderer, mouseInfo) {
        var mousePoint = mouseInfo.mousePoint;

        _get(Object.getPrototypeOf(State2.prototype), "draw", this).call(this, renderer, mouseInfo);
        renderer.drawLines([this.pointA, this.pointB], PREVIEW_OPTIONS);
        renderer.drawLines([this.pointB, mousePoint], PREVIEW_OPTIONS);
      }
    }
  });

  return State2;
})(PausedState);

var State3 = (function (_PausedState8) {
  function State3() {
    _classCallCheck(this, State3);

    if (_PausedState8 != null) {
      _PausedState8.apply(this, arguments);
    }
  }

  _inherits(State3, _PausedState8);

  _createClass(State3, {
    onMouseUp: {
      value: function onMouseUp(mousePoint) {
        return this.dragged ? new State0(this.linkage) : new State4(this.linkage, { p0id: this.p0id });
      }
    },
    onMouseDrag: {
      value: function onMouseDrag(mousePoint) {
        this.dragged = true;
        this.linkage.tryMovingGroundPoints([{ point: mousePoint, id: this.p0id }]);
        return this;
      }
    },
    draw: {
      value: function draw(renderer, mouseInfo) {
        _get(Object.getPrototypeOf(State3.prototype), "draw", this).call(this, renderer, mouseInfo);
        renderer.drawPoint(this.linkage.getPoint(this.p0id), PREVIEW_OPTIONS);
      }
    }
  });

  return State3;
})(PausedState);

var State4 = (function (_PausedState9) {
  // point1

  function State4(linkage, spec) {
    _classCallCheck(this, State4);

    _get(Object.getPrototypeOf(State4.prototype), "constructor", this).call(this, linkage, spec);

    mixinPointValidation([this.linkage.getPoint(this.p0id)], ["onAnyPointUp", "onCanvasUp"], this);
  }

  _inherits(State4, _PausedState9);

  _createClass(State4, {
    onAnyPointUp: {
      value: function onAnyPointUp(p1id) {
        return new State5(this.linkage, { p0id: this.p0id, p1id: p1id });
      }
    },
    onCanvasUp: {
      value: function onCanvasUp(pointA) {
        return new State6(this.linkage, { p0id: this.p0id, pointA: pointA });
      }
    },
    onKeyUp: {
      value: function onKeyUp(key) {
        switch (key) {
          case KEYS.D:
          case KEYS.d:
            if (this.linkage.tryRemovingPoint(this.p0id)) {
              return new State0(this.linkage);
            } else {
              return this;
            }
          case KEYS.o:
          case KEYS.O:
            if (this.linkage.getPath(this.p0id)) {
              return new State15(this.linkage, { p0id: this.p0id });
            } else {
              return this;
            }
          case KEYS.SPACE:
            return new State12(this.linkage, { p0id: this.p0id });
          default:
            return _get(Object.getPrototypeOf(State4.prototype), "onKeyUp", this).call(this, key);
        }
      }
    },
    draw: {
      value: function draw(renderer, mouseInfo) {
        var mousePoint = mouseInfo.mousePoint;

        _get(Object.getPrototypeOf(State4.prototype), "draw", this).call(this, renderer, mouseInfo);
        renderer.drawLines([this.linkage.getPoint(this.p0id), mousePoint], PREVIEW_OPTIONS);
      }
    }
  });

  return State4;
})(PausedState);

var State5 = (function (_PausedState10) {
  // point2

  function State5(linkage, spec) {
    _classCallCheck(this, State5);

    _get(Object.getPrototypeOf(State5.prototype), "constructor", this).call(this, linkage, spec);

    mixinPointValidation([this.linkage.getPoint(this.p0id), this.linkage.getPoint(this.p1id)], ["onCanvasUp"], this);
  }

  _inherits(State5, _PausedState10);

  _createClass(State5, {
    onCanvasUp: {
      value: function onCanvasUp(pointA) {
        this.linkage.addTriangle(this.p0id, this.p1id, pointA);
        this.linkage.calculatePositions();
        return new State0(this.linkage);
      }
    },
    draw: {
      value: function draw(renderer, mouseInfo) {
        var mousePoint = mouseInfo.mousePoint;

        _get(Object.getPrototypeOf(State5.prototype), "draw", this).call(this, renderer, mouseInfo);
        renderer.drawLines([this.linkage.getPoint(this.p0id), mousePoint, this.linkage.getPoint(this.p1id)], PREVIEW_OPTIONS);
      }
    }
  });

  return State5;
})(PausedState);

var State6 = (function (_PausedState11) {
  // point1 + canvas1

  function State6(linkage, spec) {
    _classCallCheck(this, State6);

    _get(Object.getPrototypeOf(State6.prototype), "constructor", this).call(this, linkage, spec);

    mixinPointValidation([this.pointA, this.linkage.getPoint(this.p0id)], ["onCanvasUp", "onAnyPointUp"], this);
  }

  _inherits(State6, _PausedState11);

  _createClass(State6, {
    onCanvasUp: {
      value: function onCanvasUp(pointB) {
        this.linkage.addGroundSegment(pointB, this.pointA, this.p0id);
        this.linkage.calculatePositions();
        return new State0(this.linkage);
      }
    },
    onAnyPointUp: {
      value: function onAnyPointUp(p1id) {
        this.linkage.addTriangle(this.p0id, p1id, this.pointA);
        this.linkage.calculatePositions();
        return new State0(this.linkage);
      }
    },
    draw: {
      value: function draw(renderer, mouseInfo) {
        var mousePoint = mouseInfo.mousePoint;

        _get(Object.getPrototypeOf(State6.prototype), "draw", this).call(this, renderer, mouseInfo);
        renderer.drawLines([this.linkage.getPoint(this.p0id), this.pointA, mousePoint], PREVIEW_OPTIONS);
      }
    }
  });

  return State6;
})(PausedState);

var State7 = (function (_PausedState12) {
  function State7() {
    _classCallCheck(this, State7);

    if (_PausedState12 != null) {
      _PausedState12.apply(this, arguments);
    }
  }

  _inherits(State7, _PausedState12);

  _createClass(State7, {
    onMouseUp: {
      value: function onMouseUp(mousePoint) {
        return this.dragged ? new State0(this.linkage) : new State8(this.linkage, { p0id: this.p0id });
      }
    },
    onMouseDrag: {
      value: function onMouseDrag(mousePoint) {
        this.dragged = true;

        var _linkage$spec = this.linkage.spec;
        var rotaries = _linkage$spec.rotaries;
        var extenders = _linkage$spec.extenders;
        var groundPoints = _linkage$spec.groundPoints;
        var _groundPoints$p0id = groundPoints[this.p0id];
        var prevX = _groundPoints$p0id.x;
        var prevY = _groundPoints$p0id.y;

        var refID = extenders[rotaries[this.p0id]].ref;
        var refCurPoint = groundPoints[refID];
        var refNextPoint = {
          x: refCurPoint.x + mousePoint.x - prevX,
          y: refCurPoint.y + mousePoint.y - prevY };

        this.linkage.tryMovingGroundPoints([{ point: mousePoint, id: this.p0id }, { point: refNextPoint, id: refID }]);

        return this;
      }
    },
    draw: {
      value: function draw(renderer, mouseInfo) {
        _get(Object.getPrototypeOf(State7.prototype), "draw", this).call(this, renderer, mouseInfo);
        var p1id = this.linkage.spec.rotaries[this.p0id];
        var p2id = this.linkage.spec.extenders[p1id].ref;
        renderer.drawLines([this.linkage.getPoint(p1id), this.linkage.getPoint(this.p0id), this.linkage.getPoint(p2id)], PREVIEW_OPTIONS);
      }
    }
  });

  return State7;
})(PausedState);

var State8 = (function (_State0) {
  function State8() {
    _classCallCheck(this, State8);

    if (_State0 != null) {
      _State0.apply(this, arguments);
    }
  }

  _inherits(State8, _State0);

  _createClass(State8, {
    onKeyUp: { // rotary selected

      value: function onKeyUp(key) {
        switch (key) {
          case KEYS.SPACE:
            return new State10(this.linkage, { p0id: this.p0id });
          case KEYS.d:
          case KEYS.D:
            if (this.linkage.tryRemovingPoint(this.p0id)) {
              return new State0(this.linkage);
            } else {
              return this;
            }
          default:
            return _get(Object.getPrototypeOf(State8.prototype), "onKeyUp", this).call(this, key);
        }
      }
    },
    draw: {
      value: function draw(renderer, mouseInfo) {
        _get(Object.getPrototypeOf(State8.prototype), "draw", this).call(this, renderer, mouseInfo);
        var p1id = this.linkage.spec.rotaries[this.p0id];
        var p2id = this.linkage.spec.extenders[p1id].ref;
        renderer.drawLines([this.linkage.getPoint(p1id), this.linkage.getPoint(this.p0id), this.linkage.getPoint(p2id)], PREVIEW_OPTIONS);
      }
    }
  });

  return State8;
})(State0);

var State9 = (function (_PausedState13) {
  // segment selected

  function State9(linkage, spec) {
    _classCallCheck(this, State9);

    _get(Object.getPrototypeOf(State9.prototype), "constructor", this).call(this, linkage, spec);

    mixinPointValidation([this.linkage.getPoint(this.p0id), this.linkage.getPoint(this.p1id)], ["onCanvasUp"], this);
  }

  _inherits(State9, _PausedState13);

  _createClass(State9, {
    onCanvasUp: {
      value: function onCanvasUp(pointA) {
        this.linkage.addTriangle(this.p0id, this.p1id, pointA);
        this.linkage.calculatePositions();
        return new State0(this.linkage);
      }
    },
    onKeyPress: {
      value: function onKeyPress(key) {
        switch (key) {
          case KEYS.S:
          case KEYS.s:
            this.linkage.tryChangingBarLength(-1, this.p0id, this.p1id);
            return this;
          case KEYS.W:
          case KEYS.w:
            this.linkage.tryChangingBarLength(1, this.p0id, this.p1id);
            return this;
          default:
            return _get(Object.getPrototypeOf(State9.prototype), "onKeyPress", this).call(this, key);
        }
      }
    },
    draw: {
      value: function draw(renderer, mouseInfo) {
        var mousePoint = mouseInfo.mousePoint;

        _get(Object.getPrototypeOf(State9.prototype), "draw", this).call(this, renderer, mouseInfo);
        renderer.drawLines([mousePoint, this.linkage.getPoint(this.p0id), this.linkage.getPoint(this.p1id), mousePoint], PREVIEW_OPTIONS);
      }
    }
  });

  return State9;
})(PausedState);

module.exports = BaseState;
// trace point
// actually optimize
// point down
// ground down
// rotary down

},{"../Linkage":"/Users/rjnevels/Development/Linkages3/src/Linkage.js","../graphics/LinkageRenderer":"/Users/rjnevels/Development/Linkages3/src/graphics/LinkageRenderer.js","../optimize/LinkageOptObj":"/Users/rjnevels/Development/Linkages3/src/optimize/LinkageOptObj.js","../optimize/optimizeStep":"/Users/rjnevels/Development/Linkages3/src/optimize/optimizeStep.js","./KEYS":"/Users/rjnevels/Development/Linkages3/src/ui/KEYS.js","./mixinPointValidation":"/Users/rjnevels/Development/Linkages3/src/ui/mixinPointValidation.js"}],"/Users/rjnevels/Development/Linkages3/src/ui/mixinPointValidation.js":[function(require,module,exports){
/* @flow */
"use strict";

var euclid = require("../math/GeometryUtils").euclid;

var MIN_SEGMENT_LENGTH = 0.5;

function mixinPointValidation(points, functNames, that) {
  var isPointValid = function isPointValid(point) {
    return points.reduce(function (accum, p2) {
      return accum && euclid(point, p2) >= MIN_SEGMENT_LENGTH;
    }, true);
  };

  var validateFuncts = {
    onMouseDrag: function onMouseDrag(point) {
      return isPointValid(point);
    },

    onMouseUp: function onMouseUp(point) {
      return isPointValid(point);
    },

    onGroundDown: function onGroundDown(p0id) {
      return isPointValid(this.linkage.getPoint(p0id));
    },

    onRotaryDown: function onRotaryDown(p0id) {
      return isPointValid(this.linkage.getPoint(p0id));
    },

    onAnyPointUp: function onAnyPointUp(p0id) {
      return isPointValid(this.linkage.getPoint(p0id));
    },

    onPointUp: function onPointUp(p0id) {
      return isPointValid(this.linkage.getPoint(p0id));
    },

    onCanvasUp: function onCanvasUp(pointA) {
      return isPointValid(pointA);
    } };

  // replace each provided method (call it F) with new method (call it G) that
  // wraps F. G executes the validation function first, and if the validation
  // function returns true, G returns the result of calling F. otherwise, it
  // returns the context of the method (resulting in a no-op for state
  // transitions)
  functNames.forEach(function (functName) {
    var validateFunct = validateFuncts[functName];
    var originalFunct = that[functName];

    that[functName] = function () {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      // use `this` instead of `that` for the context so that the new method
      // can be used in whatever context it's need (especially useful for
      // inheritance)
      return validateFunct.apply(this, args) ? originalFunct.apply(this, args) : this;
    };
  });
}

module.exports = mixinPointValidation;

},{"../math/GeometryUtils":"/Users/rjnevels/Development/Linkages3/src/math/GeometryUtils.js"}]},{},["/Users/rjnevels/Development/Linkages3/src/main.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL3JqbmV2ZWxzL0RldmVsb3BtZW50L0xpbmthZ2VzMy9zcmMvTGlua2FnZS5qcyIsIi9Vc2Vycy9yam5ldmVscy9EZXZlbG9wbWVudC9MaW5rYWdlczMvc3JjL2dyYXBoaWNzL0xpbmthZ2VSZW5kZXJlci5qcyIsIi9Vc2Vycy9yam5ldmVscy9EZXZlbG9wbWVudC9MaW5rYWdlczMvc3JjL2xpbmthZ2VEYXRhLmpzIiwiL1VzZXJzL3JqbmV2ZWxzL0RldmVsb3BtZW50L0xpbmthZ2VzMy9zcmMvbWFpbi5qcyIsIi9Vc2Vycy9yam5ldmVscy9EZXZlbG9wbWVudC9MaW5rYWdlczMvc3JjL21hdGgvR2VvbWV0cnlVdGlscy5qcyIsIi9Vc2Vycy9yam5ldmVscy9EZXZlbG9wbWVudC9MaW5rYWdlczMvc3JjL21hdGgvc21hbGxlc3ROdW1iZXJEaXZpc2libGVCeS5qcyIsIi9Vc2Vycy9yam5ldmVscy9EZXZlbG9wbWVudC9MaW5rYWdlczMvc3JjL29wdGltaXplL0xpbmthZ2VPcHRPYmouanMiLCIvVXNlcnMvcmpuZXZlbHMvRGV2ZWxvcG1lbnQvTGlua2FnZXMzL3NyYy9vcHRpbWl6ZS9PcHRPYmouanMiLCIvVXNlcnMvcmpuZXZlbHMvRGV2ZWxvcG1lbnQvTGlua2FnZXMzL3NyYy9vcHRpbWl6ZS9vcHRpbWl6ZVN0ZXAuanMiLCIvVXNlcnMvcmpuZXZlbHMvRGV2ZWxvcG1lbnQvTGlua2FnZXMzL3NyYy91aS9LRVlTLmpzIiwiL1VzZXJzL3JqbmV2ZWxzL0RldmVsb3BtZW50L0xpbmthZ2VzMy9zcmMvdWkvTG9nZ2VkVUlFdmVudC5qcyIsIi9Vc2Vycy9yam5ldmVscy9EZXZlbG9wbWVudC9MaW5rYWdlczMvc3JjL3VpL1VJLmpzIiwiL1VzZXJzL3JqbmV2ZWxzL0RldmVsb3BtZW50L0xpbmthZ2VzMy9zcmMvdWkvVUlTdGF0ZS5qcyIsIi9Vc2Vycy9yam5ldmVscy9EZXZlbG9wbWVudC9MaW5rYWdlczMvc3JjL3VpL21peGluUG9pbnRWYWxpZGF0aW9uLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0NBLFlBQVksQ0FBQzs7Ozs7O0FBRWIsSUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLHNCQUFzQixDQUFDLENBQUM7QUFDM0MsSUFBSSx5QkFBeUIsR0FBRyxPQUFPLENBQUMsa0NBQWtDLENBQUMsQ0FBQzs7SUFVdEUsT0FBTztBQUtBLFdBTFAsT0FBTyxDQUtDLElBQXFCLEVBQUU7MEJBTC9CLE9BQU87O0FBTVQsUUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7QUFDakIsUUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7QUFDcEIsUUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLEdBQUMsRUFBRSxDQUFDO0dBQ25COztlQVRHLE9BQU87QUFXWCxjQUFVO2FBQUEsb0JBQUMsS0FBYSxFQUFFO0FBQ3hCLFlBQUksS0FBSyxJQUFJLENBQUMsRUFBRTtBQUNkLGdCQUFNLElBQUksS0FBSyxDQUFDLHlDQUF5QyxDQUFDLENBQUM7U0FDNUQ7O0FBRUQsWUFBSSxDQUFDLEtBQUssSUFBSSxLQUFLLENBQUM7T0FDckI7O0FBRUQsV0FBTzthQUFBLGlCQUFDLEVBQVUsRUFBaUI7QUFDakMsWUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7OztBQUdwQyxZQUFJLFNBQVMsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFBLEVBQUUsRUFBSTtBQUMvQyxpQkFBTztBQUNMLGNBQUUsRUFBRixFQUFFO0FBQ0YsaUJBQUssRUFBRSxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxFQUMzQixDQUFDO1NBQ0gsQ0FBQyxDQUFDOztBQUVILFlBQUksTUFBTSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FB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Y2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qIEBmbG93ICovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBHZW9tID0gcmVxdWlyZSgnLi9tYXRoL0dlb21ldHJ5VXRpbHMnKTtcbnZhciBzbWFsbGVzdE51bWJlckRpdmlzaWJsZUJ5ID0gcmVxdWlyZSgnLi9tYXRoL3NtYWxsZXN0TnVtYmVyRGl2aXNpYmxlQnknKTtcblxudHlwZSBQb2ludCA9IHt4OiBudW1iZXI7IHk6IG51bWJlcn07XG50eXBlIExpbmthZ2VTcGVjVHlwZSA9IHtcbiAgZ3JvdW5kUG9pbnRzOiB7W2tleTpzdHJpbmddOiBQb2ludH07XG4gIHBvaW50czogT2JqZWN0O1xuICBleHRlbmRlcnM6IE9iamVjdDtcbiAgcm90YXJpZXM6IE9iamVjdDtcbn07XG5cbmNsYXNzIExpbmthZ2Uge1xuICBzcGVjOiBMaW5rYWdlU3BlY1R5cGU7XG4gIHBvc2l0aW9uczoge1trZXk6c3RyaW5nXTogUG9pbnR9O1xuICBzcGVlZDogbnVtYmVyO1xuXG4gIGNvbnN0cnVjdG9yKHNwZWM6IExpbmthZ2VTcGVjVHlwZSkge1xuICAgIHRoaXMuc3BlYyA9IHNwZWM7XG4gICAgdGhpcy5wb3NpdGlvbnMgPSB7fTtcbiAgICB0aGlzLnNwZWVkID0gMS8yMDtcbiAgfVxuXG4gIHNjYWxlU3BlZWQoc2NhbGU6IG51bWJlcikge1xuICAgIGlmIChzY2FsZSA8PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NhbiBvbmx5IHNjYWxlIHNwZWVkIGJ5IHBvc2l0aW9uIGFtb3VudCcpO1xuICAgIH1cblxuICAgIHRoaXMuc3BlZWQgKj0gc2NhbGU7XG4gIH1cblxuICBnZXRQYXRoKGlkOiBzdHJpbmcpOiA/QXJyYXk8UG9pbnQ+IHtcbiAgICB2YXIgZXh0ZW5kZXJzID0gdGhpcy5zcGVjLmV4dGVuZGVycztcblxuICAgIC8vIHNhdmUgY3VycmVudCBzdGF0ZVxuICAgIHZhciBvbGRJbnB1dHMgPSBPYmplY3Qua2V5cyhleHRlbmRlcnMpLm1hcChpZCA9PiB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBpZCxcbiAgICAgICAgYW5nbGU6IGV4dGVuZGVyc1tpZF0uYW5nbGUsXG4gICAgICB9O1xuICAgIH0pO1xuXG4gICAgdmFyIHNwZWVkcyA9IE9iamVjdC5rZXlzKGV4dGVuZGVycykubWFwKGV4dElEID0+IGV4dGVuZGVyc1tleHRJRF0uc3BlZWQpO1xuICAgIHZhciBudW1Sb3RhdGlvbnMgPSBzbWFsbGVzdE51bWJlckRpdmlzaWJsZUJ5KHNwZWVkcyk7XG5cbiAgICB2YXIgc2l6ZSA9IE1hdGguYWJzKE1hdGguUEkqMi90aGlzLnNwZWVkKTtcbiAgICB2YXIgcGF0aCA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2l6ZSAqIG51bVJvdGF0aW9uczsgaSsrKSB7XG4gICAgICB2YXIgc3VjY2VzcyA9IHRoaXMudHJ5Um90YXRpbmdMaW5rYWdlSW5wdXQoKTtcbiAgICAgIGlmICghc3VjY2Vzcykge1xuICAgICAgICBwYXRoID0gbnVsbDtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBwYXRoLnB1c2godGhpcy5nZXRQb2ludChpZCkpO1xuICAgIH1cblxuICAgIC8vIHJlc3RvcmUgb2xkIHN0YXRlXG4gICAgb2xkSW5wdXRzLmZvckVhY2gobyA9PiB7XG4gICAgICBleHRlbmRlcnNbby5pZF0uYW5nbGUgPSBvLmFuZ2xlO1xuICAgIH0pO1xuICAgIHRoaXMuY2FsY3VsYXRlUG9zaXRpb25zKCk7XG5cbiAgICByZXR1cm4gcGF0aDtcbiAgfVxuXG4gIF9kZWxldGVQb2ludEZyb21TcGVjKHNwZWM6IExpbmthZ2VTcGVjVHlwZSwgaWQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGRlbGV0ZSBzcGVjLmdyb3VuZFBvaW50c1tpZF07XG4gICAgZGVsZXRlIHNwZWMucG9pbnRzW2lkXTtcbiAgICBkZWxldGUgc3BlYy5yb3Rhcmllc1tpZF07XG4gICAgZGVsZXRlIHNwZWMuZXh0ZW5kZXJzW2lkXTtcbiAgfVxuXG4gIHRyeVJlbW92aW5nUG9pbnQoaWQ6ID9zdHJpbmcpOiBib29sZWFuIHtcbiAgICBpZiAoIWlkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2lkIG11c3QgYmUgZGVmaW5lZCcpO1xuICAgIH1cblxuICAgIC8vIHJlbW92ZSBwb2ludCBmcm9tIHNwZWMsIGFsbCBhZGphY2VudHMgdGhhdCBhcmUgbm90IGNvbm5lY3RlZCB0byBhbnl0aGluZ1xuICAgIHZhciBuZXdTcGVjID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeSh0aGlzLnNwZWMpKTtcbiAgICB2YXIgYWRqYWNlbnRQb2ludHMgPSBPYmplY3Qua2V5cyhuZXdTcGVjLnBvaW50c1tpZF0pO1xuICAgIGFkamFjZW50UG9pbnRzLmZvckVhY2goYWRqSUQgPT4ge1xuICAgICAgZGVsZXRlIG5ld1NwZWMucG9pbnRzW2FkaklEXVtpZF07XG4gICAgICBpZiAoT2JqZWN0LmtleXMobmV3U3BlYy5wb2ludHNbYWRqSURdKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgdGhpcy5fZGVsZXRlUG9pbnRGcm9tU3BlYyhuZXdTcGVjLCBhZGpJRCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy5fZGVsZXRlUG9pbnRGcm9tU3BlYyhuZXdTcGVjLCBpZCk7XG5cbiAgICB0cnkge1xuICAgICAgdmFyIG5ld1Bvc2l0aW9ucyA9IHRoaXMuX2NhbGN1bGF0ZVBvc2l0aW9uc0F1eChuZXdTcGVjKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdGhpcy5wb3NpdGlvbnMgPSBuZXdQb3NpdGlvbnM7XG4gICAgdGhpcy5zcGVjID0gbmV3U3BlYztcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGdldFBvaW50KGlkOiA/c3RyaW5nKTogUG9pbnQge1xuICAgIGlmICghaWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignaWQgbXVzdCBiZSBkZWZpbmVkJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMucG9zaXRpb25zW2lkXTtcbiAgfVxuXG4gIHJldmVyc2VSb3Rhcnkocm90SUQ/OiBzdHJpbmcpIHtcbiAgICBpZiAoIXJvdElEKSB7XG4gICAgICAvLyBpZiBhbiBpZCB3YXMgbm90IHByb3ZpZGVkLCBhcHBseSByZXZlcnNhbCB0byBhbGwgcm90YXJpZXNcbiAgICAgIE9iamVjdC5rZXlzKHRoaXMuc3BlYy5leHRlbmRlcnMpLmZvckVhY2goaWQgPT4ge1xuICAgICAgICB0aGlzLnNwZWMuZXh0ZW5kZXJzW2lkXS5zcGVlZCAqPSAtMTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBvdGhlcndpc2UganVzdCBhcHBseSByZXZlcnNhbCB0byB0aGUgcHJvdmlkZWQgcm90YXJ5XG4gICAgICB2YXIgZXh0SUQgPSB0aGlzLnNwZWMucm90YXJpZXNbcm90SURdO1xuICAgICAgdGhpcy5zcGVjLmV4dGVuZGVyc1tleHRJRF0uc3BlZWQgKj0gLTE7XG4gICAgfVxuICB9XG5cbiAgX2NoYW5nZVJvdGFyeVNwZWVkKGRpZmZlcmVuY2U6IG51bWJlciwgZXh0SUQ6IHN0cmluZykge1xuICAgIHZhciBjdXJyZW50U3BlZWQgPSB0aGlzLnNwZWMuZXh0ZW5kZXJzW2V4dElEXS5zcGVlZDtcblxuICAgIGlmIChjdXJyZW50U3BlZWQgPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcigncm90YXJ5IGNhbm5vdCBiZSBhdCB6ZXJvIHNwZWVkIScpO1xuICAgIH1cblxuICAgIHRoaXMuc3BlYy5leHRlbmRlcnNbZXh0SURdLnNwZWVkICs9IGRpZmZlcmVuY2U7XG5cbiAgICBpZiAodGhpcy5zcGVjLmV4dGVuZGVyc1tleHRJRF0uc3BlZWQgPT09IDApIHtcbiAgICAgIC8vIHJpZ2h0IG5vdyBJIGRvbid0IGFsbG93IHplcm8tc3BlZWQgcm90YXJpZXMsXG4gICAgICAvLyBzbyBhcHBseSBkaWZmZXJlbmNlIHR3aWNlIHRvIHByZXZlbnQgdGhhdFxuICAgICAgdGhpcy5zcGVjLmV4dGVuZGVyc1tleHRJRF0uc3BlZWQgKz0gZGlmZmVyZW5jZTtcbiAgICB9XG4gIH1cblxuICBjaGFuZ2VTcGVlZChkaWZmZXJlbmNlOiBudW1iZXIsIHJvdElEPzogc3RyaW5nKSB7XG4gICAgaWYgKGRpZmZlcmVuY2UgIT09IDEgJiYgZGlmZmVyZW5jZSAhPT0gLTEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignZGlmZmVyZW5jZSBub3Qgc3VwcG9ydGVkOicgKyBkaWZmZXJlbmNlKTtcbiAgICB9XG5cbiAgICBpZiAoIXJvdElEKSB7XG4gICAgICAvLyBpZiBhbiBpZCB3YXMgbm90IHByb3ZpZGVkLCBhcHBseSBjaGFuZ2VzIHRvIGFsbCByb3Rhcmllc1xuICAgICAgT2JqZWN0LmtleXModGhpcy5zcGVjLmV4dGVuZGVycykuZm9yRWFjaChpZCA9PiB7XG4gICAgICAgIHRoaXMuX2NoYW5nZVJvdGFyeVNwZWVkKGRpZmZlcmVuY2UsIGlkKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBvdGhlcndpc2UganVzdCBhcHBseSBkaWZmZXJlbmNlIHRvIHRoZSBwcm92aWRlZCByb3RhcnlcbiAgICAgIHZhciBleHRJRCA9IHRoaXMuc3BlYy5yb3Rhcmllc1tyb3RJRF07XG4gICAgICB0aGlzLl9jaGFuZ2VSb3RhcnlTcGVlZChkaWZmZXJlbmNlLCBleHRJRCk7XG4gICAgfVxuICB9XG5cbiAgbW92ZU5vdEdyb3VuZFBvaW50KFxuICAgIG5ld1BvczogUG9pbnQsXG4gICAgcDBpZDogc3RyaW5nXG4gICk6IHZvaWQge1xuICAgIGlmICh0aGlzLnNwZWMuZXh0ZW5kZXJzW3AwaWRdKSB7XG4gICAgICB2YXIgYmFzZVBvaW50ID0gdGhpcy5wb3NpdGlvbnNbdGhpcy5zcGVjLmV4dGVuZGVyc1twMGlkXS5iYXNlXTtcbiAgICAgIHZhciByZWZQb2ludCA9IHRoaXMucG9zaXRpb25zW3RoaXMuc3BlYy5leHRlbmRlcnNbcDBpZF0ucmVmXTtcbiAgICAgIHZhciBuZXdEaXN0ID0gR2VvbS5ldWNsaWQobmV3UG9zLCBiYXNlUG9pbnQpO1xuICAgICAgdGhpcy5zcGVjLmV4dGVuZGVyc1twMGlkXS5sZW4gPSBuZXdEaXN0O1xuICAgICAgdGhpcy5zcGVjLmV4dGVuZGVyc1twMGlkXS5hbmdsZSA9IE1hdGguYXRhbjIoXG4gICAgICAgIG5ld1Bvcy55IC0gYmFzZVBvaW50LnksXG4gICAgICAgIG5ld1Bvcy54IC0gYmFzZVBvaW50LnhcbiAgICAgICkgLSBNYXRoLmF0YW4yKFxuICAgICAgICByZWZQb2ludC55IC0gYmFzZVBvaW50LnksXG4gICAgICAgIHJlZlBvaW50LnggLSBiYXNlUG9pbnQueFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBPYmplY3Qua2V5cyh0aGlzLnNwZWMucG9pbnRzW3AwaWRdKS5mb3JFYWNoKHAxaWQgPT4ge1xuICAgICAgdmFyIG5ld0Rpc3QgPSBHZW9tLmV1Y2xpZChuZXdQb3MsIHRoaXMucG9zaXRpb25zW3AxaWRdKTtcbiAgICAgIHRoaXMuc3BlYy5wb2ludHNbcDBpZF1bcDFpZF0ubGVuID0gbmV3RGlzdDtcbiAgICAgIHRoaXMuc3BlYy5wb2ludHNbcDFpZF1bcDBpZF0ubGVuID0gbmV3RGlzdDtcbiAgICB9KTtcblxuICAgIGlmICghdGhpcy5jYWxjdWxhdGVQb3NpdGlvbnMoKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCd3YXQnKTtcbiAgICB9XG4gIH1cblxuICB0cnlNb3ZpbmdHcm91bmRQb2ludHMoXG4gICAgcG9pbnRzOiBBcnJheTx7cG9pbnQ6IFBvaW50OyBpZDogc3RyaW5nfT5cbiAgKSB7XG4gICAgdmFyIHByZXZQb2ludHMgPSB7fTtcblxuICAgIC8vIG1vdmUgdGhlIGdyb3VuZCBwb2ludHNcbiAgICBwb2ludHMuZm9yRWFjaCgoe3BvaW50LCBpZH0pID0+IHtcbiAgICAgIHZhciBncm91bmRQb2ludCA9IHRoaXMuc3BlYy5ncm91bmRQb2ludHNbaWRdO1xuXG4gICAgICBpZiAoIWdyb3VuZFBvaW50KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgZ3JvdW5kIHBvaW50ICR7aWR9IGRvZXNuJ3QgZXhpc3RgKTtcbiAgICAgIH1cblxuICAgICAgdmFyIHt4OiBwcmV2WCwgeTogcHJldll9ID0gZ3JvdW5kUG9pbnQ7XG4gICAgICBncm91bmRQb2ludC54ID0gcG9pbnQueDtcbiAgICAgIGdyb3VuZFBvaW50LnkgPSBwb2ludC55O1xuICAgICAgcHJldlBvaW50c1tpZF0gPSB7eDogcHJldlgsIHk6IHByZXZZfTtcbiAgICB9KTtcblxuICAgIGlmICghdGhpcy5jYWxjdWxhdGVQb3NpdGlvbnMoKSkge1xuICAgICAgLy8gcmV2ZXJ0IGlmIGl0IGZhaWxlZFxuICAgICAgcG9pbnRzLmZvckVhY2goKHtwb2ludCwgaWR9KSA9PiB7XG4gICAgICAgIHZhciBncm91bmRQb2ludCA9IHRoaXMuc3BlYy5ncm91bmRQb2ludHNbaWRdO1xuICAgICAgICBncm91bmRQb2ludC54ID0gcHJldlBvaW50c1tpZF0ueDtcbiAgICAgICAgZ3JvdW5kUG9pbnQueSA9IHByZXZQb2ludHNbaWRdLnk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMuY2FsY3VsYXRlUG9zaXRpb25zKCk7XG4gICAgfVxuICB9XG5cbiAgdHJ5Um90YXRpbmdMaW5rYWdlSW5wdXQoKTogYm9vbGVhbiB7XG4gICAgdmFyIGZsYWcgPSB0cnVlO1xuXG4gICAgT2JqZWN0LmtleXModGhpcy5zcGVjLmV4dGVuZGVycykuZm9yRWFjaCgoaWQpID0+IHtcbiAgICAgIHZhciByb3RhcnlJbnB1dCA9IHRoaXMuc3BlYy5leHRlbmRlcnNbaWRdO1xuICAgICAgcm90YXJ5SW5wdXQuYW5nbGUgKz0gcm90YXJ5SW5wdXQuc3BlZWQgKiB0aGlzLnNwZWVkO1xuICAgICAgaWYgKCF0aGlzLmNhbGN1bGF0ZVBvc2l0aW9ucygpKSB7XG4gICAgICAgIHRoaXMucmV2ZXJzZVJvdGFyeShpZC5iYXNlKTtcbiAgICAgICAgcm90YXJ5SW5wdXQuYW5nbGUgKz0gcm90YXJ5SW5wdXQuc3BlZWQgKiB0aGlzLnNwZWVkO1xuICAgICAgICB0aGlzLmNhbGN1bGF0ZVBvc2l0aW9ucygpO1xuICAgICAgICBmbGFnID0gZmFsc2U7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZmxhZztcbiAgfVxuXG4gIHRyeUNoYW5naW5nQmFyTGVuZ3RoKGxlbkNoYW5nZTogbnVtYmVyLCBwMGlkPzogc3RyaW5nLCBwMWlkPzogc3RyaW5nKSB7XG4gICAgaWYgKCFwMGlkIHx8ICFwMWlkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3AwaWQgYW5kIHAxaWQgbXVzdCBiZSBkZWZpbmVkJyk7XG4gICAgfVxuXG4gICAgdmFyIG9sZExlbiA9IHRoaXMuc3BlYy5wb2ludHNbcDBpZF1bcDFpZF0ubGVuO1xuICAgIHZhciBuZXdMZW4gPSBvbGRMZW4gKyBsZW5DaGFuZ2U7XG5cbiAgICB0aGlzLl9jaGFuZ2VCYXJMZW5ndGgobmV3TGVuLCBwMGlkLCBwMWlkKTtcbiAgICBpZiAoIXRoaXMuY2FsY3VsYXRlUG9zaXRpb25zKCkpIHtcbiAgICAgIHRoaXMuX2NoYW5nZUJhckxlbmd0aChvbGRMZW4sIHAwaWQsIHAxaWQpO1xuICAgICAgdGhpcy5jYWxjdWxhdGVQb3NpdGlvbnMoKTtcbiAgICB9XG4gIH1cblxuICBfY2hhbmdlQmFyTGVuZ3RoKGxlbjogbnVtYmVyLCBwMGlkOiBzdHJpbmcsIHAxaWQ6IHN0cmluZykge1xuICAgIHRoaXMuc3BlYy5wb2ludHNbcDBpZF1bcDFpZF0ubGVuID0gbGVuO1xuICAgIHRoaXMuc3BlYy5wb2ludHNbcDFpZF1bcDBpZF0ubGVuID0gbGVuO1xuXG4gICAgdmFyIGV4dDAgPSB0aGlzLnNwZWMuZXh0ZW5kZXJzW3AwaWRdO1xuICAgIHZhciBleHQxID0gdGhpcy5zcGVjLmV4dGVuZGVyc1twMWlkXTtcblxuICAgIGlmIChleHQwICYmIGV4dDAuYmFzZSA9PT0gcDFpZCkge1xuICAgICAgZXh0MC5sZW4gPSBsZW47XG4gICAgfSBlbHNlIGlmIChleHQxICYmIGV4dDEuYmFzZSA9PT0gcDBpZCkge1xuICAgICAgZXh0MS5sZW4gPSBsZW47XG4gICAgfVxuICB9XG5cbiAgX2FkZFNlZ21lbnQoXG4gICAgcG9pbnQwSWQ6IHN0cmluZyxcbiAgICBwb2ludDFJZDogc3RyaW5nLFxuICAgIGRpc3Q6IG51bWJlclxuICApIHtcbiAgICBpZiAoIXRoaXMuc3BlYy5wb2ludHNbcG9pbnQwSWRdKSB7XG4gICAgICB0aGlzLnNwZWMucG9pbnRzW3BvaW50MElkXSA9IHt9O1xuICAgIH1cbiAgICBpZiAoIXRoaXMuc3BlYy5wb2ludHNbcG9pbnQxSWRdKSB7XG4gICAgICB0aGlzLnNwZWMucG9pbnRzW3BvaW50MUlkXSA9IHt9O1xuICAgIH1cbiAgICB0aGlzLnNwZWMucG9pbnRzW3BvaW50MElkXVtwb2ludDFJZF0gPSB7bGVuOiBkaXN0fTtcbiAgICB0aGlzLnNwZWMucG9pbnRzW3BvaW50MUlkXVtwb2ludDBJZF0gPSB7bGVuOiBkaXN0fTtcbiAgfVxuXG4gIGFkZFJvdGFyeUlucHV0KFxuICAgIHBvaW50MTogUG9pbnQsXG4gICAgbGVuOiBudW1iZXJcbiAgKSB7XG4gICAgdmFyIG51bVBvaW50cyA9IE9iamVjdC5rZXlzKHRoaXMuc3BlYy5wb2ludHMpLmxlbmd0aDtcbiAgICB2YXIgcG9pbnQwSWQgPSAncCcgKyBudW1Qb2ludHM7XG4gICAgdmFyIHBvaW50MUlkID0gJ3AnICsgKG51bVBvaW50cyArIDEpO1xuICAgIHZhciBwb2ludDJJZCA9ICdwJyArIChudW1Qb2ludHMgKyAyKTtcblxuICAgIHRoaXMuc3BlYy5leHRlbmRlcnNbcG9pbnQySWRdID0ge1xuICAgICAgYmFzZTogcG9pbnQxSWQsXG4gICAgICByZWY6IHBvaW50MElkLFxuICAgICAgYW5nbGU6IE1hdGguYXRhbig0LzMpLFxuICAgICAgc3BlZWQ6IDEsXG4gICAgICBsZW46IDUsXG4gICAgfTtcbiAgICB0aGlzLnNwZWMuZ3JvdW5kUG9pbnRzW3BvaW50MElkXSA9IHt4OiBwb2ludDEueCArIDEsIHk6IHBvaW50MS55fTtcbiAgICB0aGlzLnNwZWMuZ3JvdW5kUG9pbnRzW3BvaW50MUlkXSA9IHt4OiBwb2ludDEueCwgeTogcG9pbnQxLnl9O1xuICAgIHRoaXMuc3BlYy5yb3Rhcmllc1twb2ludDFJZF0gPSBwb2ludDJJZDtcblxuICAgIHRoaXMuX2FkZFNvbHV0aW9uKHBvaW50MElkLCBwb2ludDJJZCwgcG9pbnQxSWQsIDApO1xuXG4gICAgdGhpcy5fYWRkU2VnbWVudChwb2ludDBJZCwgcG9pbnQxSWQsIDEpO1xuICAgIHRoaXMuX2FkZFNlZ21lbnQocG9pbnQxSWQsIHBvaW50MklkLCA1KTtcbiAgfVxuXG4gIF9hZGRTb2x1dGlvbihcbiAgICBwMUlEOiBzdHJpbmcsXG4gICAgcDJJRDogc3RyaW5nLFxuICAgIHAzSUQ6IHN0cmluZyxcbiAgICBzb2x1dGlvbkluZGV4OiBudW1iZXJcbiAgKSB7XG4gICAgaWYgKCF0aGlzLnNwZWMuc29sdXRpb25NYXBbcDFJRF0pIHtcbiAgICAgIHRoaXMuc3BlYy5zb2x1dGlvbk1hcFtwMUlEXSA9IHt9O1xuICAgIH1cbiAgICBpZiAoIXRoaXMuc3BlYy5zb2x1dGlvbk1hcFtwMUlEXVtwMklEXSkge1xuICAgICAgdGhpcy5zcGVjLnNvbHV0aW9uTWFwW3AxSURdW3AySURdID0ge307XG4gICAgfVxuICAgIHRoaXMuc3BlYy5zb2x1dGlvbk1hcFtwMUlEXVtwMklEXVtwM0lEXSA9IHNvbHV0aW9uSW5kZXg7XG5cbiAgICBpZiAoIXRoaXMuc3BlYy5zb2x1dGlvbk1hcFtwMklEXSkge1xuICAgICAgdGhpcy5zcGVjLnNvbHV0aW9uTWFwW3AySURdID0ge307XG4gICAgfVxuICAgIGlmICghdGhpcy5zcGVjLnNvbHV0aW9uTWFwW3AySURdW3AxSURdKSB7XG4gICAgICB0aGlzLnNwZWMuc29sdXRpb25NYXBbcDJJRF1bcDFJRF0gPSB7fTtcbiAgICB9XG4gICAgdGhpcy5zcGVjLnNvbHV0aW9uTWFwW3AySURdW3AxSURdW3AzSURdID0gc29sdXRpb25JbmRleCA/IDAgOiAxO1xuICB9XG5cbiAgYWRkVHJpYW5nbGUoXG4gICAgcG9pbnQxSWQ6IHN0cmluZyxcbiAgICBwb2ludDJJZDogc3RyaW5nLFxuICAgIHBvaW50MzogUG9pbnRcbiAgKSB7XG4gICAgdmFyIHBvc2l0aW9uMSA9IHRoaXMucG9zaXRpb25zW3BvaW50MUlkXTtcbiAgICB2YXIgcG9zaXRpb24yID0gdGhpcy5wb3NpdGlvbnNbcG9pbnQySWRdO1xuICAgIHZhciBudW1Qb2ludHMgPSBPYmplY3Qua2V5cyh0aGlzLnNwZWMucG9pbnRzKS5sZW5ndGg7XG4gICAgdmFyIHBvaW50M0lkID0gJ3AnICsgbnVtUG9pbnRzO1xuICAgIHZhciBkaXN0MVRvMyA9IEdlb20uZXVjbGlkKHBvaW50MywgdGhpcy5wb3NpdGlvbnNbcG9pbnQxSWRdKTtcbiAgICB2YXIgZGlzdDJUbzMgPSBHZW9tLmV1Y2xpZChwb2ludDMsIHRoaXMucG9zaXRpb25zW3BvaW50MklkXSk7XG5cbiAgICB0aGlzLnNwZWMucG9pbnRzW3BvaW50M0lkXSA9IHt9O1xuXG4gICAgLy8gdGhlcmUgYXJlIHR3byBwb3NzaWJsZSBzb2x1dGlvbnMgdG8gYSB0cmlhbmdsZS0tc28gZmlndXJlIG91dCB3aGljaFxuICAgIC8vIGlzIGRlc2lyZWQgYmFzZWQgb24gdGhlIGNsb3Nlc3QgY2FsY3VsYXRlZCB0aGlyZCBwb2ludFxuICAgIHZhciByZXMgPSBHZW9tLmNhbGNQb2ludEZyb21UcmlhbmdsZShcbiAgICAgIHBvc2l0aW9uMSxcbiAgICAgIHBvc2l0aW9uMixcbiAgICAgIGRpc3QxVG8zLFxuICAgICAgZGlzdDJUbzNcbiAgICApO1xuXG4gICAgdmFyIHNvbHV0aW9uSW5kZXggPSAxO1xuICAgIGlmIChHZW9tLmV1Y2xpZChyZXMuc29sMSwgcG9pbnQzKSA8IEdlb20uZXVjbGlkKHJlcy5zb2wyLCBwb2ludDMpKSB7XG4gICAgICBzb2x1dGlvbkluZGV4ID0gMDtcbiAgICB9XG4gICAgdGhpcy5fYWRkU29sdXRpb24ocG9pbnQxSWQsIHBvaW50MklkLCBwb2ludDNJZCwgc29sdXRpb25JbmRleCk7XG5cbiAgICB0aGlzLl9hZGRTZWdtZW50KHBvaW50M0lkLCBwb2ludDFJZCwgZGlzdDFUbzMpO1xuICAgIHRoaXMuX2FkZFNlZ21lbnQocG9pbnQzSWQsIHBvaW50MklkLCBkaXN0MlRvMyk7XG4gIH1cblxuICBhZGRHcm91bmRTZWdtZW50KFxuICAgIGdyb3VuZFBvaW50OiBQb2ludCxcbiAgICBhdXhQb2ludDogUG9pbnQsXG4gICAgY29ubmVjdGVkSUQ6IHN0cmluZ1xuICApIHtcbiAgICB2YXIgbnVtUG9pbnRzID0gT2JqZWN0LmtleXModGhpcy5zcGVjLnBvaW50cykubGVuZ3RoO1xuICAgIHZhciBncm91bmRJRCA9ICdwJyArIG51bVBvaW50cztcbiAgICB2YXIgYXV4SUQgPSAncCcgKyAobnVtUG9pbnRzICsgMSk7XG5cbiAgICB0aGlzLnNwZWMuZ3JvdW5kUG9pbnRzW2dyb3VuZElEXSA9IHtcbiAgICAgIHg6IGdyb3VuZFBvaW50LngsXG4gICAgICB5OiBncm91bmRQb2ludC55LFxuICAgIH07XG5cbiAgICB2YXIgY29ubmVjdGVkUG9pbnQgPSB0aGlzLnBvc2l0aW9uc1tjb25uZWN0ZWRJRF07XG4gICAgdmFyIGRpc3RHcm91bmRUb0F1eCA9IEdlb20uZXVjbGlkKGdyb3VuZFBvaW50LCBhdXhQb2ludCk7XG4gICAgdmFyIGRpc3RBdXhUb0Nvbm5lY3RlZCA9IEdlb20uZXVjbGlkKGF1eFBvaW50LCBjb25uZWN0ZWRQb2ludCk7XG5cbiAgICB0aGlzLnNwZWMucG9pbnRzW2dyb3VuZElEXSA9IHt9O1xuICAgIHRoaXMuc3BlYy5wb2ludHNbZ3JvdW5kSURdW2F1eElEXSA9IHtsZW46IGRpc3RHcm91bmRUb0F1eH07XG5cbiAgICB0aGlzLnNwZWMucG9pbnRzW2F1eElEXSA9IHt9O1xuXG4gICAgdmFyIHJlcyA9IEdlb20uY2FsY1BvaW50RnJvbVRyaWFuZ2xlKFxuICAgICAgZ3JvdW5kUG9pbnQsXG4gICAgICBjb25uZWN0ZWRQb2ludCxcbiAgICAgIGRpc3RHcm91bmRUb0F1eCxcbiAgICAgIGRpc3RBdXhUb0Nvbm5lY3RlZFxuICAgICk7XG5cbiAgICB2YXIgc29sdXRpb25JbmRleCA9IDA7XG4gICAgaWYgKEdlb20uZXVjbGlkKHJlcy5zb2wxLCBhdXhQb2ludCkgPCBHZW9tLmV1Y2xpZChyZXMuc29sMiwgYXV4UG9pbnQpKSB7XG4gICAgICBzb2x1dGlvbkluZGV4ID0gMTtcbiAgICB9XG4gICAgdGhpcy5fYWRkU29sdXRpb24oY29ubmVjdGVkSUQsIGdyb3VuZElELCBhdXhJRCwgc29sdXRpb25JbmRleCk7XG5cbiAgICAvLyBUT0RPOiB1c2UgX2FkZFNlZ21lbnQgaGVyZVxuICAgIHRoaXMuc3BlYy5wb2ludHNbYXV4SURdW2Nvbm5lY3RlZElEXSA9IHtsZW46IGRpc3RBdXhUb0Nvbm5lY3RlZH07XG4gICAgdGhpcy5zcGVjLnBvaW50c1thdXhJRF1bZ3JvdW5kSURdID0ge2xlbjogZGlzdEdyb3VuZFRvQXV4fTtcbiAgICB0aGlzLnNwZWMucG9pbnRzW2Nvbm5lY3RlZElEXVthdXhJRF0gPSB7bGVuOiBkaXN0QXV4VG9Db25uZWN0ZWR9O1xuICB9XG5cbiAgZ2V0Q2xvc2VzdFRoaW5ncyhcbiAgICBjdXJyZW50UG9pbnQ6IFBvaW50XG4gICk6IE9iamVjdCB7XG4gICAgdmFyIHBvaW50cyA9IE9iamVjdC5rZXlzKHRoaXMucG9zaXRpb25zKS5tYXAoaWQgPT4ge1xuICAgICAgdmFyIHJlcyA9IHRoaXMucG9zaXRpb25zW2lkXTtcbiAgICAgIHJlcy5pZCA9IGlkO1xuICAgICAgcmV0dXJuIHJlcztcbiAgICB9KTtcblxuICAgIHZhciBjbG9zZXN0UG9pbnRJbmZvID0gR2VvbS5maW5kQ2xvc2VzdFRoaW5nVG9Qb2ludChcbiAgICAgIHBvaW50cyxcbiAgICAgIGN1cnJlbnRQb2ludCxcbiAgICAgIEdlb20uZXVjbGlkXG4gICAgKTtcblxuICAgIHZhciBjbG9zZXN0U2VnbWVudEluZm8gPSBHZW9tLmZpbmRDbG9zZXN0VGhpbmdUb1BvaW50KFxuICAgICAgdGhpcy5fbWFrZVNlZ21lbnRzKCksXG4gICAgICBjdXJyZW50UG9pbnQsXG4gICAgICBHZW9tLmNhbGNNaW5EaXN0RnJvbVNlZ21lbnRUb1BvaW50XG4gICAgKTtcblxuICAgIHJldHVybiB7Y2xvc2VzdFBvaW50SW5mbywgY2xvc2VzdFNlZ21lbnRJbmZvfTtcbiAgfVxuXG4gIF9tYWtlU2VnbWVudHMoKTogQXJyYXk8QXJyYXk8UG9pbnQ+PiB7XG4gICAgdmFyIHNlZ21lbnRzID0gW107XG5cbiAgICBPYmplY3Qua2V5cyh0aGlzLnNwZWMucG9pbnRzKS5mb3JFYWNoKChwb2ludElEKSA9PiB7XG4gICAgICB2YXIgcDAgPSB0aGlzLnBvc2l0aW9uc1twb2ludElEXTtcbiAgICAgIHAwLmlkID0gcG9pbnRJRDtcbiAgICAgIE9iamVjdC5rZXlzKHRoaXMuc3BlYy5wb2ludHNbcG9pbnRJRF0pLmZvckVhY2goKHBvaW50MklEKSA9PiB7XG4gICAgICAgIHZhciBwMSA9IHRoaXMucG9zaXRpb25zW3BvaW50MklEXTtcbiAgICAgICAgcDEuaWQgPSBwb2ludDJJRDtcbiAgICAgICAgc2VnbWVudHMucHVzaChbcDAsIHAxXSk7XG4gICAgICB9KVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHNlZ21lbnRzO1xuICB9XG5cbiAgY2FsY3VsYXRlUG9zaXRpb25zKCk6IGJvb2xlYW4ge1xuICAgIHRyeSB7XG4gICAgICB2YXIgcG9zaXRpb25zID0gdGhpcy5fY2FsY3VsYXRlUG9zaXRpb25zQXV4KHRoaXMuc3BlYyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHRoaXMucG9zaXRpb25zID0gcG9zaXRpb25zO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgX2NhbGN1bGF0ZVBvc2l0aW9uc0F1eChzcGVjOiBMaW5rYWdlU3BlY1R5cGUpOiB7W2tleTpzdHJpbmddOiBQb2ludH0ge1xuICAgIHZhciB7cG9pbnRzLCBleHRlbmRlcnMsIGdyb3VuZFBvaW50c30gPSBzcGVjO1xuICAgIHZhciBwb3NpdGlvbnMgPSB7fTtcblxuICAgIHZhciBpZExpc3QgPSBPYmplY3Qua2V5cyhwb2ludHMpO1xuICAgIHZhciBvbGRMZW5ndGg7XG5cbiAgICBkbyB7XG4gICAgICBvbGRMZW5ndGggPSBpZExpc3QubGVuZ3RoO1xuICAgICAgaWRMaXN0ID0gaWRMaXN0LmZpbHRlcihpZCA9PiB7XG4gICAgICAgIGlmIChncm91bmRQb2ludHNbaWRdKSB7XG4gICAgICAgICAgcG9zaXRpb25zW2lkXSA9IGdyb3VuZFBvaW50c1tpZF07XG4gICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgZXh0ZW5kZXJzW2lkXSAmJlxuICAgICAgICAgIHBvc2l0aW9uc1tleHRlbmRlcnNbaWRdLmJhc2VdICYmXG4gICAgICAgICAgcG9zaXRpb25zW2V4dGVuZGVyc1tpZF0ucmVmXVxuICAgICAgICApIHtcbiAgICAgICAgICBwb3NpdGlvbnNbaWRdID0gR2VvbS5jYWxjUG9pbnRGcm9tRXh0ZW5kZXIoXG4gICAgICAgICAgICBwb3NpdGlvbnNbZXh0ZW5kZXJzW2lkXS5iYXNlXSxcbiAgICAgICAgICAgIHBvc2l0aW9uc1tleHRlbmRlcnNbaWRdLnJlZl0sXG4gICAgICAgICAgICBleHRlbmRlcnNbaWRdLmxlbixcbiAgICAgICAgICAgIGV4dGVuZGVyc1tpZF0uYW5nbGVcbiAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBrbm93bkFkamFjZW50cyA9IE9iamVjdC5rZXlzKHBvaW50c1tpZF0pLmZpbHRlcihcbiAgICAgICAgICAgIGFkaiA9PiBwb3NpdGlvbnNbYWRqXVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBpZiAoa25vd25BZGphY2VudHMubGVuZ3RoID49IDIpIHtcbiAgICAgICAgICAgIHZhciBzb2x1dGlvbkluZGV4ID0gc3BlYy5zb2x1dGlvbk1hcFtrbm93bkFkamFjZW50c1swXV1ba25vd25BZGphY2VudHNbMV1dW2lkXTtcbiAgICAgICAgICAgIHBvc2l0aW9uc1tpZF0gPSBHZW9tLmNhbGNQb2ludEZyb21UcmlhbmdsZShcbiAgICAgICAgICAgICAgcG9zaXRpb25zW2tub3duQWRqYWNlbnRzWzBdXSxcbiAgICAgICAgICAgICAgcG9zaXRpb25zW2tub3duQWRqYWNlbnRzWzFdXSxcbiAgICAgICAgICAgICAgcG9pbnRzW2lkXVtrbm93bkFkamFjZW50c1swXV0ubGVuLFxuICAgICAgICAgICAgICBwb2ludHNbaWRdW2tub3duQWRqYWNlbnRzWzFdXS5sZW5cbiAgICAgICAgICAgIClbJ3NvbCcgKyAoc29sdXRpb25JbmRleCArIDEpXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gIXBvc2l0aW9uc1tpZF07XG4gICAgICB9KTtcbiAgICB9IHdoaWxlIChpZExpc3QubGVuZ3RoID4gMCAmJiBpZExpc3QubGVuZ3RoIDwgb2xkTGVuZ3RoKTtcblxuICAgIGlmIChpZExpc3QubGVuZ3RoID4gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdmYWlsZWQgdG8gY29tcHV0ZSBhbGwgcG9pbnRzJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHBvc2l0aW9ucztcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IExpbmthZ2U7XG4iLCIvKiBAZmxvdyAqL1xuJ3VzZSBzdHJpY3QnO1xuXG50eXBlIE9wdGlvbnNUeXBlID0ge1xuICBwb2ludENvbG9yPzogc3RyaW5nO1xuICBsaW5lQ29sb3I/OiBzdHJpbmc7XG4gIHBvaW50UmFkaXVzPzogbnVtYmVyO1xuICBsaW5lV2lkdGg/OiBudW1iZXI7XG4gIGRyYXdQb2ludHM/OiBib29sZWFuO1xufTtcblxudHlwZSBQb2ludCA9IHt4OiBudW1iZXI7IHk6IG51bWJlcn07XG5cbnZhciBTQ0FMRSA9IDEwO1xudmFyIFBPSU5UX0NPTE9SID0gJ2JsYWNrJztcbnZhciBMSU5FX0NPTE9SID0gJ2RhcmtHcmF5JztcbnZhciBCQUNLR1JPVU5EX0NPTE9SID0gJ3doaXRlJztcbnZhciBQT0lOVF9SQURJVVMgPSA0O1xudmFyIExJTkVfV0lEVEggPSA0O1xuXG5mdW5jdGlvbiBnZXRPcHRpb25zKG9wdHM6ID9PcHRpb25zVHlwZSk6IE9wdGlvbnNUeXBlIHtcbiAgb3B0cyA9IHtcbiAgICBwb2ludENvbG9yOiAob3B0cyAmJiBvcHRzLnBvaW50Q29sb3IpID8gb3B0cy5wb2ludENvbG9yIDogUE9JTlRfQ09MT1IsXG4gICAgbGluZUNvbG9yOiAob3B0cyAmJiBvcHRzLmxpbmVDb2xvcikgPyBvcHRzLmxpbmVDb2xvciA6IExJTkVfQ09MT1IsXG4gICAgcG9pbnRSYWRpdXM6IChvcHRzICYmIG9wdHMucG9pbnRSYWRpdXMpID8gb3B0cy5wb2ludFJhZGl1cyA6IFBPSU5UX1JBRElVUyxcbiAgICBsaW5lV2lkdGg6IChvcHRzICYmIG9wdHMubGluZVdpZHRoKSA/IG9wdHMubGluZVdpZHRoIDogTElORV9XSURUSCxcbiAgfTtcblxuICBvcHRzLnBvaW50UmFkaXVzID0gb3B0cy5wb2ludFJhZGl1cyAvIFNDQUxFO1xuICBvcHRzLmxpbmVXaWR0aCA9IG9wdHMubGluZVdpZHRoIC8gU0NBTEU7XG5cbiAgcmV0dXJuIG9wdHM7XG59XG5cbmNsYXNzIENhbnZhc1JlbmRlcmVyIHtcbiAgY3R4OiBhbnk7XG4gIF93aWR0aDogbnVtYmVyO1xuICBfaGVpZ2h0OiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3IoY2FudmFzSUQ6IHN0cmluZykge1xuICAgIHZhciBjYW52YXM6IGFueSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGNhbnZhc0lEKTtcbiAgICB0aGlzLmN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgY2FudmFzLndpZHRoID0gZG9jdW1lbnQuYm9keS5jbGllbnRXaWR0aDtcbiAgICBjYW52YXMuaGVpZ2h0ID0gZG9jdW1lbnQuYm9keS5jbGllbnRIZWlnaHQ7XG4gICAgdGhpcy5fd2lkdGggPSBjYW52YXMud2lkdGg7XG4gICAgdGhpcy5faGVpZ2h0ID0gY2FudmFzLmhlaWdodDtcblxuICAgIHRoaXMuY3R4LnNjYWxlKDEsIC0xKTtcbiAgICB0aGlzLmN0eC50cmFuc2xhdGUodGhpcy5fd2lkdGgvMiwgLXRoaXMuX2hlaWdodC8yKTtcbiAgICB0aGlzLmN0eC5zY2FsZShTQ0FMRSwgU0NBTEUpO1xuICB9XG5cbiAgaW52ZXJzZVRyYW5zZm9ybSh7eCwgeX06IFBvaW50KTogUG9pbnQge1xuICAgIHggKj0gMTtcbiAgICB5ICo9IC0xO1xuICAgIHggLT0gdGhpcy5fd2lkdGgvMjtcbiAgICB5IC09IC10aGlzLl9oZWlnaHQvMjtcbiAgICB4IC89IFNDQUxFO1xuICAgIHkgLz0gU0NBTEU7XG4gICAgcmV0dXJuIHt4LCB5fTtcbiAgfVxuXG4gIF9fZHJhd1BvaW50QXV4KHt4LCB5fTogUG9pbnQsIHBvaW50UmFkaXVzKSB7XG4gICAgdGhpcy5jdHguYmVnaW5QYXRoKCk7XG4gICAgdGhpcy5jdHguYXJjKHgsIHksIHBvaW50UmFkaXVzLCAwLCAyICogTWF0aC5QSSwgdHJ1ZSk7XG4gICAgdGhpcy5jdHguZmlsbCgpO1xuICB9XG5cbiAgZHJhd1BvaW50KHBvaW50OiBQb2ludCwgb3B0aW9ucz86ID9PcHRpb25zVHlwZSkge1xuICAgIHZhciB7cG9pbnRDb2xvciwgcG9pbnRSYWRpdXN9ID0gZ2V0T3B0aW9ucyhvcHRpb25zKTtcbiAgICB0aGlzLmN0eC5zYXZlKCk7XG4gICAgdGhpcy5jdHguZmlsbFN0eWxlID0gcG9pbnRDb2xvcjtcbiAgICB0aGlzLl9fZHJhd1BvaW50QXV4KHBvaW50LCBwb2ludFJhZGl1cyk7XG4gICAgdGhpcy5jdHgucmVzdG9yZSgpO1xuICB9XG5cbiAgX19kcmF3TGluZUF1eChwMTogUG9pbnQsIHAyOiBQb2ludCkge1xuICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpO1xuICAgIHRoaXMuY3R4Lm1vdmVUbyhwMS54LCBwMS55KTtcbiAgICB0aGlzLmN0eC5saW5lVG8ocDIueCwgcDIueSk7XG4gICAgdGhpcy5jdHguc3Ryb2tlKCk7XG4gIH1cblxuICBkcmF3TGluZShwMTogUG9pbnQsIHAyOiBQb2ludCwgb3B0aW9ucz86ID9PcHRpb25zVHlwZSkge1xuICAgIHZhciB7bGluZUNvbG9yLCBsaW5lV2lkdGh9ID0gZ2V0T3B0aW9ucyhvcHRpb25zKTtcbiAgICB0aGlzLmN0eC5zYXZlKCk7XG4gICAgdGhpcy5jdHguc3Ryb2tlU3R5bGUgPSBsaW5lQ29sb3I7XG4gICAgdGhpcy5jdHgubGluZVdpZHRoID0gbGluZVdpZHRoO1xuICAgIHRoaXMuX19kcmF3TGluZUF1eChwMSwgcDIpO1xuICAgIHRoaXMuY3R4LnJlc3RvcmUoKTtcbiAgfVxuXG4gIF9fZHJhd0JhY2tncm91bmQoKSB7XG4gICAgdGhpcy5jdHguc2F2ZSgpO1xuICAgIHRoaXMuY3R4LmZpbGxTdHlsZSA9IEJBQ0tHUk9VTkRfQ09MT1I7XG4gICAgdGhpcy5jdHguZmlsbFJlY3QoLXRoaXMuX3dpZHRoLzIsIC10aGlzLl9oZWlnaHQvMiwgdGhpcy5fd2lkdGgsIHRoaXMuX2hlaWdodCk7XG4gICAgdGhpcy5jdHgucmVzdG9yZSgpO1xuICB9XG5cbiAgLy8gVE9ETyBob3cgdG8gZ2V0IHJpZCBvZiBhbnkgdHlwZSBoZXJlP1xuICBkcmF3TGluZXMocG9pbnRzOiBBcnJheTxhbnk+LCBvcHRpb25zPzogT3B0aW9uc1R5cGUpIHtcbiAgICBpZiAocG9pbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciB7bGluZUNvbG9yLCBsaW5lV2lkdGgsIHBvaW50Q29sb3IsIHBvaW50UmFkaXVzfSA9IGdldE9wdGlvbnMob3B0aW9ucyk7XG4gICAgdGhpcy5jdHguc2F2ZSgpO1xuICAgIHRoaXMuY3R4LnN0cm9rZVN0eWxlID0gbGluZUNvbG9yO1xuICAgIHRoaXMuY3R4LmxpbmVXaWR0aCA9IGxpbmVXaWR0aDtcbiAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSBwb2ludENvbG9yO1xuXG4gICAgdGhpcy5jdHguYmVnaW5QYXRoKCk7XG4gICAgdGhpcy5jdHgubW92ZVRvKHBvaW50c1swXS54LCBwb2ludHNbMF0ueSk7XG4gICAgcG9pbnRzLmZvckVhY2goKHBvaW50LCBpKSA9PiB7XG4gICAgICBpZiAoaSAhPT0gMCkge1xuICAgICAgICB0aGlzLmN0eC5saW5lVG8ocG9pbnQueCwgcG9pbnQueSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy5jdHguc3Ryb2tlKCk7XG5cbiAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLmRyYXdQb2ludHMpIHtcbiAgICAgIHBvaW50cy5mb3JFYWNoKCh7eCwgeX0pID0+IHtcbiAgICAgICAgdGhpcy5jdHguYmVnaW5QYXRoKCk7XG4gICAgICAgIHRoaXMuY3R4LmFyYyh4LCB5LCBwb2ludFJhZGl1cywgMCwgMiAqIE1hdGguUEksIHRydWUpO1xuICAgICAgICB0aGlzLmN0eC5maWxsKCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB0aGlzLmN0eC5yZXN0b3JlKCk7XG4gIH1cbn1cblxuY2xhc3MgTGlua2FnZVJlbmRlcmVyIGV4dGVuZHMgQ2FudmFzUmVuZGVyZXIge1xuICBkcmF3TGlua2FnZSAoe3BvaW50cywgcG9zaXRpb25zfTogT2JqZWN0KSB7XG4gICAgdGhpcy5fX2RyYXdCYWNrZ3JvdW5kKCk7XG5cbiAgICBPYmplY3Qua2V5cyhwb2ludHMpLmZvckVhY2gocG9pbnRJRCA9PiB7XG4gICAgICB2YXIgcDAgPSBwb3NpdGlvbnNbcG9pbnRJRF07XG4gICAgICBPYmplY3Qua2V5cyhwb2ludHNbcG9pbnRJRF0pLmZvckVhY2gocG9pbnRJRGkgPT4ge1xuICAgICAgICB2YXIgcGkgPSBwb3NpdGlvbnNbcG9pbnRJRGldO1xuICAgICAgICB0aGlzLmRyYXdMaW5lKHAwLCBwaSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIE9iamVjdC5rZXlzKHBvaW50cykuZm9yRWFjaCgocG9pbnRJRCkgPT4ge1xuICAgICAgdGhpcy5kcmF3UG9pbnQocG9zaXRpb25zW3BvaW50SURdKTtcbiAgICB9KTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IExpbmthZ2VSZW5kZXJlcjtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBwb2ludHM6IHtcbiAgICBwMDoge1xuICAgICAgcDE6IHsgbGVuOiAxIH0sXG4gICAgfSxcbiAgICBwMToge1xuICAgICAgcDA6IHsgbGVuOiAxIH0sXG4gICAgICBwMjogeyBsZW46IDUgfSxcbiAgICB9LFxuICAgIHAyOiB7XG4gICAgICBwMTogeyBsZW46IDUgfSxcbiAgICB9LFxuICB9LFxuICBleHRlbmRlcnM6IHtcbiAgICBwMjoge1xuICAgICAgYmFzZTogJ3AxJyxcbiAgICAgIHJlZjogJ3AwJyxcbiAgICAgIGFuZ2xlOiAwLjAsXG4gICAgICBsZW46IDUsXG4gICAgICBzcGVlZDogMSxcbiAgICB9LFxuICB9LFxuICByb3Rhcmllczoge1xuICAgIHAxOiAncDInLFxuICB9LFxuICBncm91bmRQb2ludHM6IHtcbiAgICBwMDogeyB4OiAxLCB5OiAwIH0sXG4gICAgcDE6IHsgeDogMCwgeTogMCB9LFxuICB9LFxuICBzb2x1dGlvbk1hcDoge1xuICAgIHAwOiB7XG4gICAgICBwMjoge1xuICAgICAgICBwMTogMCxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBwMjoge1xuICAgICAgcDA6IHtcbiAgICAgICAgcDE6IDEsXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG59O1xuIiwiLyogQGZsb3cgKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgTGlua2FnZSA9IHJlcXVpcmUoJy4vTGlua2FnZS5qcycpO1xudmFyIExpbmthZ2VSZW5kZXJlciA9IHJlcXVpcmUoJy4vZ3JhcGhpY3MvTGlua2FnZVJlbmRlcmVyJyk7XG52YXIgVUkgPSByZXF1aXJlKCcuL3VpL1VJLmpzJyk7XG52YXIgVUlTdGF0ZSA9IHJlcXVpcmUoJy4vdWkvVUlTdGF0ZScpO1xuXG52YXIgbGlua2FnZURhdGEgPSByZXF1aXJlKCcuL2xpbmthZ2VEYXRhLmpzJyk7XG5cbnZhciB1cmxEYXRhO1xudHJ5IHtcbiAgdmFyIHMgPSB3aW5kb3cubG9jYXRpb24uc2VhcmNoLnN1YnN0cmluZygxKTtcbiAgdXJsRGF0YSA9IEpTT04ucGFyc2Uod2luZG93LnVuZXNjYXBlKHMpKTtcbn0gY2F0Y2ggKGUpIHt9XG5cbmlmICh1cmxEYXRhKSB7XG4gIGxpbmthZ2VEYXRhID0gdXJsRGF0YTtcbn1cblxuZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J1dHRvbicpLm9uY2xpY2sgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBsb2NhdGlvbiA9IHdpbmRvdy5sb2NhdGlvbjtcbiAgdmFyIHVybCA9IGxvY2F0aW9uLnNlYXJjaFxuICAgID8gbG9jYXRpb24uaHJlZi5zcGxpdChsb2NhdGlvbi5zZWFyY2gpWzBdXG4gICAgOiBsb2NhdGlvbi5ocmVmO1xuICBsb2NhdGlvbi5ocmVmID0gdXJsICsgJz8nICsgd2luZG93LmVzY2FwZShKU09OLnN0cmluZ2lmeSh1aS5zdGF0ZS5saW5rYWdlLnNwZWMpKTtcbn1cblxudmFyIGxpbmthZ2UgPSBuZXcgTGlua2FnZShsaW5rYWdlRGF0YSk7XG52YXIgaW5pdGlhbFN0YXRlID0gVUlTdGF0ZS5nZXRJbml0aWFsVW5wYXVzZWRTdGF0ZShsaW5rYWdlKTtcbnZhciByZW5kZXJlciA9IG5ldyBMaW5rYWdlUmVuZGVyZXIoJ215Y2FudmFzJyk7XG5cbnZhciB1aSA9IG5ldyBVSShpbml0aWFsU3RhdGUsIHJlbmRlcmVyLCBbXSk7XG51aS5hbmltYXRlKCk7XG4iLCIvKiBAZmxvdyAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnR5cGUgUG9pbnQgPSB7eDogbnVtYmVyOyB5OiBudW1iZXJ9O1xuXG5mdW5jdGlvbiBldWNsaWQocDE6IFBvaW50LCBwMjogUG9pbnQpOiBudW1iZXIge1xuICB2YXIgZHggPSBwMi54IC0gcDEueDtcbiAgdmFyIGR5ID0gcDIueSAtIHAxLnk7XG4gIHJldHVybiBNYXRoLnNxcnQoZHggKiBkeCArIGR5ICogZHkpO1xufVxuXG5mdW5jdGlvbiBjYWxjU3VtT2ZNaW5zKFxuICBwYXRoMTogQXJyYXk8UG9pbnQ+LFxuICBwYXRoMjogQXJyYXk8UG9pbnQ+XG4pOiBudW1iZXIge1xuICB2YXIgc3VtID0gMDtcblxuICBwYXRoMS5mb3JFYWNoKHAxID0+IHtcbiAgICB2YXIgbWluRGlzdCA9IE51bWJlci5NQVhfVkFMVUU7XG5cbiAgICBwYXRoMi5mb3JFYWNoKHAyID0+IHtcbiAgICAgIHZhciBkaXN0ID0gZXVjbGlkKHAxLCBwMik7XG4gICAgICBpZiAoZGlzdCA8IG1pbkRpc3QpIHtcbiAgICAgICAgbWluRGlzdCA9IGRpc3Q7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBzdW0gKz0gbWluRGlzdDtcbiAgfSk7XG5cbiAgcmV0dXJuIHN1bTtcbn1cblxuZnVuY3Rpb24gY2FsY01pbkRpc3RGcm9tU2VnbWVudFRvUG9pbnQoXG4gIHNlZ21lbnQ6IE9iamVjdCxcbiAgcDM6IFBvaW50XG4pOiBudW1iZXIge1xuICB2YXIgcG9pbnQgPSBudWxsO1xuICB2YXIgW3AxLCBwMl0gPSBzZWdtZW50O1xuXG4gIHZhciB0aGV0YSA9IE1hdGguYXRhbjIocDIueSAtIHAxLnksIHAyLnggLSBwMS54KTtcbiAgdmFyIHQgPSBNYXRoLnNpbih0aGV0YSkgKiAocDMueSAtIHAxLnkpICsgTWF0aC5jb3ModGhldGEpICogKHAzLnggLSBwMS54KTtcblxuICBpZiAodCA8IDApIHtcbiAgICBwb2ludCA9IHAxO1xuICB9IGVsc2UgaWYgKHQgPiBldWNsaWQocDEsIHAyKSkge1xuICAgIHBvaW50ID0gcDI7XG4gIH0gZWxzZSB7XG4gICAgcG9pbnQgPSB7XG4gICAgICB4OiBwMS54ICsgdCAqIE1hdGguY29zKHRoZXRhKSxcbiAgICAgIHk6IHAxLnkgKyB0ICogTWF0aC5zaW4odGhldGEpLFxuICAgIH07XG4gIH1cblxuICByZXR1cm4gZXVjbGlkKHBvaW50LCBwMyk7XG59XG5cbmZ1bmN0aW9uIGZpbmRDbG9zZXN0VGhpbmdUb1BvaW50KFxuICB0aGluZ3M6IEFycmF5PGFueT4sXG4gIHBvaW50OiBQb2ludCxcbiAgZGlzdGFuY2VCZXR3ZWVuOiAocG9pbnQ6IFBvaW50LCB0aGluZzogYW55KSA9PiBudW1iZXIsXG4gIHN0YXJ0aW5nVGhpbmc/OiBhbnksXG4gIHN0YXJ0aW5nRGlzdGFuY2U/OiBudW1iZXJcbik6IHt0aGluZzogP2FueTsgZGlzdDogbnVtYmVyfSB7XG4gIHJldHVybiB0aGluZ3MucmVkdWNlKChiZXN0LCB0aGluZykgPT4ge1xuICAgIHZhciBkaXN0ID0gZGlzdGFuY2VCZXR3ZWVuKHRoaW5nLCBwb2ludCk7XG4gICAgaWYgKGRpc3QgPCBiZXN0LmRpc3QpIHtcbiAgICAgIGJlc3QuZGlzdCA9IGRpc3Q7XG4gICAgICBiZXN0LnRoaW5nID0gdGhpbmc7XG4gICAgfVxuICAgIHJldHVybiBiZXN0O1xuICB9LCB7dGhpbmc6c3RhcnRpbmdUaGluZywgZGlzdDpzdGFydGluZ0Rpc3RhbmNlIHx8IDF9KTtcbn1cblxuZnVuY3Rpb24gY2FsY1BvaW50RnJvbVRyaWFuZ2xlKFxuICBwMTogUG9pbnQsXG4gIHAyOiBQb2ludCxcbiAgYTE6IG51bWJlcixcbiAgYTI6IG51bWJlclxuKToge3NvbDE6IFBvaW50OyBzb2wyOiBQb2ludH0ge1xuICB2YXIgYTMgPSBldWNsaWQocDEsIHAyKTtcbiAgaWYgKGEzID4gYTEgKyBhMikge1xuICAgIHRocm93IG5ldyBFcnJvcignbGVuZ3RocyBvZiBiYXJzIGxlc3MgdGhhdCBkaXN0YW5jZSBiZXR3ZWVuIGpvaW50cycsIHAxLCBwMiwgYTEsIGEyKTtcbiAgfVxuXG4gIHZhciBhbHBoYTEgPSBNYXRoLmFjb3MoKGExKmExICsgYTMqYTMgLSBhMiphMikvKDIqYTEqYTMpKTtcbiAgaWYgKCFpc0Zpbml0ZShhbHBoYTEpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdiYWQgYWNvcyBjYWxjdWxhdGlvbicpO1xuICB9XG5cbiAgdmFyIGR4ID0gcDIueCAtIHAxLng7XG4gIHZhciBkeSA9IHAyLnkgLSBwMS55O1xuICBpZiAoZHggPT09IDAgJiYgZHkgPT09IDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2VucG9pbnRzIGFyZSBlcXVhbCAtPiB1bmtub3duIGFuZ2xlJyk7XG4gIH1cbiAgdmFyIHRoZXRhMSA9IE1hdGguYXRhbjIoZHksIGR4KTtcblxuICByZXR1cm4ge1xuICAgIHNvbDE6IHtcbiAgICAgIHg6IHAxLnggKyBhMSAqIE1hdGguY29zKGFscGhhMSArIHRoZXRhMSksXG4gICAgICB5OiBwMS55ICsgYTEgKiBNYXRoLnNpbihhbHBoYTEgKyB0aGV0YTEpLFxuICAgIH0sXG4gICAgc29sMjoge1xuICAgICAgeDogcDEueCArIGExICogTWF0aC5jb3MoLWFscGhhMSArIHRoZXRhMSksXG4gICAgICB5OiBwMS55ICsgYTEgKiBNYXRoLnNpbigtYWxwaGExICsgdGhldGExKSxcbiAgICB9LFxuICB9O1xufVxuXG5mdW5jdGlvbiBjYWxjUG9pbnRGcm9tRXh0ZW5kZXIoXG4gIHAxOiBQb2ludCxcbiAgcDI6IFBvaW50LFxuICBsZW46IG51bWJlcixcbiAgYW5nbGU6IG51bWJlclxuKTogUG9pbnQge1xuICB2YXIgYmFzZUFuZ2xlID0gTWF0aC5hdGFuMihwMi55IC0gcDEueSwgcDIueCAtIHAxLngpO1xuICBhbmdsZSArPSBiYXNlQW5nbGU7XG4gIHJldHVybiB7XG4gICAgeDogcDEueCArIGxlbiAqIE1hdGguY29zKGFuZ2xlKSxcbiAgICB5OiBwMS55ICsgbGVuICogTWF0aC5zaW4oYW5nbGUpLFxuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZXVjbGlkLFxuICBjYWxjTWluRGlzdEZyb21TZWdtZW50VG9Qb2ludCxcbiAgZmluZENsb3Nlc3RUaGluZ1RvUG9pbnQsXG4gIGNhbGNQb2ludEZyb21UcmlhbmdsZSxcbiAgY2FsY1BvaW50RnJvbUV4dGVuZGVyLFxuICBjYWxjU3VtT2ZNaW5zLFxufTtcbiIsIi8qIEBmbG93ICovXG5cbmZ1bmN0aW9uIHByaW1lRmFjdG9ycyh4OiBudW1iZXIpOiBPYmplY3Qge1xuICB2YXIgbWFwID0ge307XG5cbiAgdmFyIHJlcyA9IHg7XG4gIGZvciAodmFyIG4gPSAyOyBuIDw9IHg7IG4rKykge1xuICAgIHZhciBjb3VudCA9IDA7XG5cbiAgICB3aGlsZSAocmVzICUgbiA9PT0gMCkge1xuICAgICAgcmVzID0gcmVzIC8gbjtcbiAgICAgIGNvdW50ICs9IDE7XG4gICAgfVxuXG4gICAgaWYgKGNvdW50ID4gMCkge1xuICAgICAgbWFwW25dID0gY291bnQ7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG1hcDtcbn1cblxuZnVuY3Rpb24gc21hbGxlc3ROdW1iZXJEaXZpc2libGVCeShsaXN0OiBBcnJheTxudW1iZXI+KTogbnVtYmVyIHtcbiAgdmFyIG9jY3VyZW5jZXMgPSB7fTtcblxuICAvLyBmaW5kIG9jY3VyZW5jZXMgb2YgYWxsIHByaW1lIGZhY3RvcnMgZm9yIGVhY2ggbnVtYmVyXG4gIGxpc3QuZm9yRWFjaCh4ID0+IHtcbiAgICB2YXIgbWFwID0gcHJpbWVGYWN0b3JzKHgpO1xuICAgIE9iamVjdC5rZXlzKG1hcCkuZm9yRWFjaChmYWN0b3IgPT4ge1xuICAgICAgaWYgKFxuICAgICAgICB0eXBlb2Ygb2NjdXJlbmNlc1tmYWN0b3JdICE9PSAnbnVtYmVyJyB8fFxuICAgICAgICBvY2N1cmVuY2VzW2ZhY3Rvcl0gPCBtYXBbZmFjdG9yXVxuICAgICAgKSB7XG4gICAgICAgIG9jY3VyZW5jZXNbZmFjdG9yXSA9IG1hcFtmYWN0b3JdO1xuICAgICAgfVxuICAgIH0pO1xuICB9KTtcblxuICAvLyBtdWx0aXBseSBmYWN0b3JzIHJhaXNlZCB0byB0aGVpciBvY2N1cnJlbmNlXG4gIHJldHVybiBPYmplY3Qua2V5cyhvY2N1cmVuY2VzKS5yZWR1Y2UoXG4gICAgKGFjYywgZikgPT4gYWNjICogTWF0aC5wb3coZiwgb2NjdXJlbmNlc1tmXSksXG4gICAgMVxuICApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNtYWxsZXN0TnVtYmVyRGl2aXNpYmxlQnk7XG4iLCIvKiBAZmxvdyAqL1xuXG52YXIgT3B0T2JqID0gcmVxdWlyZSgnLi9PcHRPYmonKTtcbnZhciBMaW5rYWdlID0gcmVxdWlyZSgnLi4vTGlua2FnZScpO1xuXG52YXIgY2FsY1N1bU9mTWlucyA9IHJlcXVpcmUoJy4uL21hdGgvR2VvbWV0cnlVdGlscycpLmNhbGNTdW1PZk1pbnM7XG5cbnR5cGUgUG9pbnQgPSB7XG4gIHg6IG51bWJlcjtcbiAgeTogbnVtYmVyO1xufTtcblxudHlwZSBEYXRhVHlwZSA9IHtcbiAgbGlua2FnZVNwZWM6IE9iamVjdDtcbiAgcGF0aDogQXJyYXk8UG9pbnQ+O1xuICBpZDogc3RyaW5nO1xufTtcblxuY2xhc3MgTGlua2FnZU9wdE9iaiBleHRlbmRzIE9wdE9iaiB7XG4gIGxpbmthZ2U6IExpbmthZ2U7XG5cbiAgY29uc3RydWN0b3IoZGF0YTogRGF0YVR5cGUpOiB2b2lkIHtcbiAgICBzdXBlcihkYXRhKTtcbiAgICB0aGlzLmxpbmthZ2UgPSBuZXcgTGlua2FnZShkYXRhLmxpbmthZ2VTcGVjKTtcbiAgICB0aGlzLmxpbmthZ2UuY2FsY3VsYXRlUG9zaXRpb25zKCk7XG4gIH1cblxuICBfX2NhbGNQZXJmKCk6IG51bWJlciB7XG4gICAgdmFyIHBhdGgxID0gdGhpcy5saW5rYWdlLmdldFBhdGgodGhpcy5fX2RhdGEuaWQpO1xuXG4gICAgaWYgKCFwYXRoMSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbmNvbXBsZXRlIGxvb3AnKTtcbiAgICB9XG5cbiAgICB2YXIgcGF0aDIgPSB0aGlzLl9fZGF0YS5wYXRoO1xuXG4gICAgaWYgKHBhdGgxLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdsaW5rYWdlIHBhdGggaGFzIHRvIGhhdmUgcG9pbnRzJyk7XG4gICAgfVxuXG4gICAgaWYgKHBhdGgyLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdwcm92aWRlZCBwYXRoIGhhcyB0byBoYXZlIHBvaW50cycpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9fY2FsY1BhdGhQZXJmKHBhdGgxLCBwYXRoMik7XG4gIH1cblxuICBfX2NhbGNQYXRoUGVyZihwYXRoMTogQXJyYXk8UG9pbnQ+LCBwYXRoMjogQXJyYXk8UG9pbnQ+KTogbnVtYmVyIHtcbiAgICByZXR1cm4gY2FsY1N1bU9mTWlucyhwYXRoMSwgcGF0aDIpICsgY2FsY1N1bU9mTWlucyhwYXRoMiwgcGF0aDEpO1xuICB9XG5cbiAgZ2V0RmVhdHVyZXMoKTogQXJyYXk8RnVuY3Rpb24+IHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdmFyIHNwZWMgPSB0aGlzLl9fZGF0YS5saW5rYWdlU3BlYztcblxuICAgIHZhciB7cG9pbnRzLCByb3RhcmllcywgZXh0ZW5kZXJzLCBncm91bmRQb2ludHN9ID0gc3BlYztcbiAgICB2YXIgW2dyb3VuZElEcywgZXh0ZW5kZXJJRHMsIHBvaW50SURzXSA9XG4gICAgICBbZ3JvdW5kUG9pbnRzLCBleHRlbmRlcnMsIHBvaW50c10ubWFwKE9iamVjdC5rZXlzKTtcblxuICAgIHZhciByZWZQb2ludHMgPSB7fTtcbiAgICBleHRlbmRlcklEcy5mb3JFYWNoKGlkID0+IHtyZWZQb2ludHNbZXh0ZW5kZXJzW2lkXS5yZWZdID0gdHJ1ZX0pO1xuXG4gICAgdmFyIGdyb3VuZEZlYXR1cmVzID0gZ3JvdW5kSURzXG4gICAgICAuZmlsdGVyKGlkID0+ICFyZWZQb2ludHNbaWRdKVxuICAgICAgLm1hcChpZCA9PiB7XG4gICAgICAgIHZhciBvcmlnID0gc3BlYy5ncm91bmRQb2ludHNbaWRdO1xuXG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgdmFyIGRlbHRhWCA9IChNYXRoLnJhbmRvbSgpIC0gLjUpICogMiAqIC41O1xuICAgICAgICAgIHZhciBkZWx0YVkgPSAoTWF0aC5yYW5kb20oKSAtIC41KSAqIDIgKiAuNTtcblxuICAgICAgICAgIHZhciBwb2ludCA9IHtcbiAgICAgICAgICAgIHg6IG9yaWcueCArIGRlbHRhWCxcbiAgICAgICAgICAgIHk6IG9yaWcueSArIGRlbHRhWSxcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgdmFyIG1vdmVzID0gW3tpZCwgcG9pbnR9XTtcblxuICAgICAgICAgIGlmIChyb3Rhcmllc1tpZF0pIHtcbiAgICAgICAgICAgIHZhciByZWZJRCA9IGV4dGVuZGVyc1tyb3Rhcmllc1tpZF1dLnJlZjtcbiAgICAgICAgICAgIHZhciByZWZDdXJQb2ludCA9IGdyb3VuZFBvaW50c1tyZWZJRF07XG4gICAgICAgICAgICB2YXIgcmVmTmV4dFBvaW50ID0ge1xuICAgICAgICAgICAgICB4OiByZWZDdXJQb2ludC54ICsgZGVsdGFYLFxuICAgICAgICAgICAgICB5OiByZWZDdXJQb2ludC55ICsgZGVsdGFZLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIG1vdmVzLnB1c2goe3BvaW50OiByZWZOZXh0UG9pbnQsIGlkOiByZWZJRH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMubGlua2FnZS50cnlNb3ZpbmdHcm91bmRQb2ludHMobW92ZXMpO1xuICAgICAgICB9O1xuICAgICAgfSk7XG5cbiAgICB2YXIgbm90R3JvdW5kRmVhdHVyZXMgPSBwb2ludElEc1xuICAgICAgLmZpbHRlcihpZCA9PiAhZ3JvdW5kUG9pbnRzW2lkXSAmJiAhcmVmUG9pbnRzW2lkXSlcbiAgICAgIC5tYXAoaWQgPT4ge1xuICAgICAgICB2YXIgb3JpZyA9IHRoaXMubGlua2FnZS5wb3NpdGlvbnNbaWRdO1xuXG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgdmFyIGRlbHRhWCA9IChNYXRoLnJhbmRvbSgpIC0gLjUpICogMiAqIC41O1xuICAgICAgICAgIHZhciBkZWx0YVkgPSAoTWF0aC5yYW5kb20oKSAtIC41KSAqIDIgKiAuNTtcblxuICAgICAgICAgIHZhciBwb2ludCA9IHtcbiAgICAgICAgICAgIHg6IG9yaWcueCArIGRlbHRhWCxcbiAgICAgICAgICAgIHk6IG9yaWcueSArIGRlbHRhWSxcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgdGhpcy5saW5rYWdlLm1vdmVOb3RHcm91bmRQb2ludChwb2ludCwgaWQpXG4gICAgICAgIH07XG4gICAgICB9KTtcblxuICAgIHJldHVybiBncm91bmRGZWF0dXJlcy5jb25jYXQobm90R3JvdW5kRmVhdHVyZXMpO1xuICB9XG5cbiAgaXNWYWxpZCgpOiBib29sZWFuIHtcbiAgICB0cnkge1xuICAgICAgdGhpcy5jYWxjUGVyZkNhY2hlZCgpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IExpbmthZ2VPcHRPYmo7XG4iLCIvKiBAZmxvdyAqL1xuXG5jbGFzcyBPcHRPYmoge1xuICBfX2RhdGE6IE9iamVjdDtcbiAgX3BlcmY6ID9udW1iZXI7XG5cbiAgY29uc3RydWN0b3IoZGF0YTogT2JqZWN0KTogdm9pZCB7XG4gICAgdGhpcy5fX2RhdGEgPSBkYXRhO1xuICAgIHRoaXMuX3BlcmYgPSBudWxsO1xuICB9XG5cbiAgY2FsY1BlcmZDYWNoZWQoKTogbnVtYmVyIHtcbiAgICBpZiAodHlwZW9mIHRoaXMuX3BlcmYgPT09ICdudW1iZXInKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcGVyZjtcbiAgICB9XG5cbiAgICB2YXIgcGVyZiA9IHRoaXMuX19jYWxjUGVyZigpO1xuICAgIHRoaXMuX3BlcmYgPSBwZXJmO1xuICAgIHJldHVybiBwZXJmO1xuICB9XG5cbiAgX19jYWxjUGVyZigpOiBudW1iZXIge1xuICAgIHRocm93IG5ldyBFcnJvcignX19jYWxjUGVyZiBub3QgaW1wbGVtZW50ZWQnKTtcbiAgfVxuXG4gIGNvcHkoKTogT3B0T2JqIHtcbiAgICB2YXIgZGF0YUNvcHkgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHRoaXMuX19kYXRhKSk7XG4gICAgdmFyIG9iakNvcHk6IGFueSA9IG5ldyB0aGlzLmNvbnN0cnVjdG9yKGRhdGFDb3B5KTtcbiAgICByZXR1cm4gb2JqQ29weTtcbiAgfVxuXG4gIGdldEZlYXR1cmVzKCk6IEFycmF5PEZ1bmN0aW9uPiB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdnZXRGZWF0dXJlcyBub3QgaW1wbGVtZW50ZWQnKTtcbiAgfVxuXG4gIGlzVmFsaWQoKTogYm9vbGVhbiB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdpc1ZhbGlkIG5vdCBpbXBsZW1lbnRlZCcpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gT3B0T2JqO1xuIiwiLyogQGZsb3cgKi9cblxudmFyIE9wdE9iaiA9IHJlcXVpcmUoJy4vT3B0T2JqJyk7XG5cbmZ1bmN0aW9uIG9wdGltaXplU3RlcCh0aGluZzogT3B0T2JqKTogT3B0T2JqIHtcbiAgdmFyIG5ld1RoaW5nID0gdGhpbmcuY29weSgpO1xuXG4gIC8vIGxvb3AgdGhyb3VnaCBhbGwgZmVhdHVyZXMgYW5kIHR3ZWFrIHRoZW1cbiAgbmV3VGhpbmcuZ2V0RmVhdHVyZXMoKS5mb3JFYWNoKHR3ZWFrID0+IHR3ZWFrKCkpO1xuXG4gIC8vIGlmIHRoZSBuZXcgdGhpbmcgaXMgbm90IGludmFsaWQsXG4gIGlmICghbmV3VGhpbmcuaXNWYWxpZCgpKSB7XG4gICAgLy8gcmV0dXJuIHRoZSBvbGQgdGhpbmdcbiAgICByZXR1cm4gdGhpbmc7XG4gIH1cblxuICAvLyByZXR1cm4gdGhlIG9sZCB0aGluZyBpZiBpdHMgcGVyZiBpcyBiZXR0ZXJcbiAgLy8gICh0aGUgbG93ZXIgdGhlIHBlcmYgdmFsdWUgdGhlIGJldHRlcilcbiAgaWYgKHRoaW5nLmNhbGNQZXJmQ2FjaGVkKCkgPD0gbmV3VGhpbmcuY2FsY1BlcmZDYWNoZWQoKSkge1xuICAgIHJldHVybiB0aGluZztcbiAgfVxuXG4gIC8vIHJldHVybiB0aGUgbmV3IHRoaW5nIGFuZCBpdHMgcGVyZm9ybWFuY2VcbiAgcmV0dXJuIG5ld1RoaW5nO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG9wdGltaXplU3RlcDtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBEOiA2OCxcbiAgRVNDOiAyNyxcbiAgTzogNzksXG4gIFI6IDgyLFxuICBTOiA4MyxcbiAgU1BBQ0U6IDMyLFxuICBUOiA4NCxcbiAgVzogODcsXG4gIGQ6IDEwMCxcbiAgbzogMTExLFxuICByOiAxMjAsXG4gIHM6IDExNSxcbiAgdDogMTE2LFxuICB3OiAxMTksXG59O1xuIiwiLyogQGZsb3cgKi9cbid1c2Ugc3RyaWN0JztcblxuY2xhc3MgTG9nZ2VkVUlFdmVudCB7XG4gIGhhbmRsZXJOYW1lOiBzdHJpbmc7XG4gIGV2ZW50RGF0YTogYW55O1xuXG4gIGNvbnN0cnVjdG9yKGhhbmRsZXJOYW1lOiBzdHJpbmcsIGV2ZW50RGF0YTogYW55KSB7XG4gICAgdGhpcy5oYW5kbGVyTmFtZSA9IGhhbmRsZXJOYW1lO1xuICAgIHRoaXMuZXZlbnREYXRhID0gZXZlbnREYXRhO1xuICB9XG5cbiAgY2FsbEhhbmRsZXIodWk6IGFueSk6IHZvaWQge1xuICAgIHVpW3RoaXMuaGFuZGxlck5hbWVdKHRoaXMuZXZlbnREYXRhKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IExvZ2dlZFVJRXZlbnQ7XG4iLCIvKiBAZmxvdyAqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgTGlua2FnZSA9IHJlcXVpcmUoJy4uL0xpbmthZ2UnKTtcbnZhciBMaW5rYWdlUmVuZGVyZXIgPSByZXF1aXJlKCcuLi9ncmFwaGljcy9MaW5rYWdlUmVuZGVyZXInKTtcbnZhciBMb2dnZWRVSUV2ZW50ID0gcmVxdWlyZSgnLi9Mb2dnZWRVSUV2ZW50Jyk7XG52YXIgVUlTdGF0ZSA9IHJlcXVpcmUoJy4vVUlTdGF0ZScpO1xuXG50eXBlIFBvaW50ID0ge3g6IG51bWJlcjsgeTogbnVtYmVyfTtcblxuY2xhc3MgVUkge1xuICByZW5kZXJlcjogTGlua2FnZVJlbmRlcmVyO1xuICBzdGF0ZTogVUlTdGF0ZTtcblxuICBtb3VzZVBvaW50OiBQb2ludDtcbiAgZHJhZ2dpbmc6IGJvb2xlYW47XG5cbiAgaG92ZXJTZWdtZW50SURzOiA/QXJyYXk8c3RyaW5nPjtcbiAgaG92ZXJQb2ludElEOiBzdHJpbmc7XG4gIGhvdmVyUG9pbnQ6IGJvb2xlYW47XG4gIGhvdmVyR3JvdW5kOiBib29sZWFuO1xuICBob3ZlclJvdGFyeTogYm9vbGVhbjtcblxuICBzdGF0ZUxvZzogQXJyYXk8c3RyaW5nPjtcbiAgZXZlbnRMb2c6IEFycmF5PExvZ2dlZFVJRXZlbnQ+O1xuICBpbml0aWFsU3BlYzogc3RyaW5nO1xuXG4gIC8vIGNhbGxlZCBmcm9tIHRoZSBicm93c2VyIGNvbnNvbGUgdG8gZXh0cmFjdCBsb2dzXG4gIGxvZ0FuZFJlc2V0KCkge1xuICAgIHZhciBuYW1lID0gdGhpcy5zdGF0ZUxvZy5qb2luKCdfJyk7XG4gICAgdmFyIGZpbmFsU3BlYyA9IEpTT04uc3RyaW5naWZ5KHRoaXMuc3RhdGUubGlua2FnZS5zcGVjKTtcbiAgICBjb25zb2xlLmxvZyhgdmFyICR7bmFtZX0gPSB7XG4gIGluaXRpYWxTcGVjOiAke3RoaXMuaW5pdGlhbFNwZWN9LFxuICBmaW5hbFNwZWM6ICR7ZmluYWxTcGVjfSxcbiAgZXZlbnRMb2c6ICR7SlNPTi5zdHJpbmdpZnkodGhpcy5ldmVudExvZyl9LFxufTtgKTtcbiAgICB0aGlzLmluaXRpYWxTcGVjID0gZmluYWxTcGVjO1xuICAgIHRoaXMuZXZlbnRMb2cgPSBbXTtcbiAgICB0aGlzLnN0YXRlTG9nID0gW107XG4gIH1cblxuICBjb25zdHJ1Y3RvcihcbiAgICBzdGF0ZTogVUlTdGF0ZSxcbiAgICByZW5kZXJlcjogTGlua2FnZVJlbmRlcmVyXG4gICkge1xuICAgIHRoaXMuc3RhdGUgPSBzdGF0ZTtcbiAgICB0aGlzLnJlbmRlcmVyID0gcmVuZGVyZXI7XG4gICAgdGhpcy5ldmVudExvZyA9IFtdO1xuICAgIHRoaXMuc3RhdGVMb2cgPSBbdGhpcy5zdGF0ZS5jb25zdHJ1Y3Rvci5uYW1lXTtcbiAgICB0aGlzLmluaXRpYWxTcGVjID0gSlNPTi5zdHJpbmdpZnkodGhpcy5zdGF0ZS5saW5rYWdlLnNwZWMpO1xuXG4gICAgLy8gbmVlZCB0byBoYXZlIGluaXRpYWwgcG9zaXRpb25zIGNhbGN1bGF0ZWQgZm9yIGhvdmVyIHRvIHdvcmtcbiAgICB0aGlzLnN0YXRlLmxpbmthZ2UuY2FsY3VsYXRlUG9zaXRpb25zKCk7XG5cbiAgICB0aGlzLm1vdXNlUG9pbnQgPSB7eDowLCB5OjB9O1xuICAgIHRoaXMuZHJhZ2dpbmcgPSBmYWxzZTtcblxuICAgIHRoaXMuaG92ZXJTZWdtZW50SURzID0gbnVsbDtcbiAgICB0aGlzLmhvdmVyUG9pbnRJRCA9ICcnOyAvLyB1Z2ggZmxvd1xuICAgIHRoaXMuaG92ZXJQb2ludCA9IGZhbHNlO1xuICAgIHRoaXMuaG92ZXJHcm91bmQgPSBmYWxzZTtcbiAgICB0aGlzLmhvdmVyUm90YXJ5ID0gZmFsc2U7XG5cbiAgICAvL1xuICAgIC8vIHdyYXAga2V5IGFuZCBtb3VzZSBoYW5kbGVyIG1ldGhvZHMsIGxvZ2dpbmcgdGhlIGV2ZW50IG5hbWUsIGFuZCBrZXlcbiAgICAvLyBwcmVzc2VkIG9yIG1vdXNlIHBvc2l0aW9uLiB3ZSBjYW4gZXh0cmFjdCB0aGUgbG9nIGZyb20gdGhlIGNvbnNvbGUsIGFuZFxuICAgIC8vIHVzZSBpdCB0byBtYWtlIGludGVncmF0aW9uIHRlc3RzIHRoYXQgYXJlIGFic3RyYWN0ZWQgZnJvbSB0aGUgYnJvd3Nlci5cbiAgICAvLyAoc2VlIHNyYy9fX3Rlc3RzX18vSW50ZWdyYXRpb24tdGVzdC5qcylcbiAgICAvL1xuICAgIHZhciBtYWtlSGFuZGxlciA9IChuYW1lLCBnZXREYXRhKSA9PlxuICAgICAgZSA9PiB7XG4gICAgICAgIHZhciBkYXRhID0gZ2V0RGF0YShlKTtcblxuICAgICAgICB2YXIgcHJldkV2ZW50ID0gdGhpcy5ldmVudExvZy5zbGljZSgtMSlbMF07XG4gICAgICAgIGlmIChwcmV2RXZlbnQgJiYgcHJldkV2ZW50LmhhbmRsZXJOYW1lID09PSBuYW1lKSB7XG4gICAgICAgICAgdGhpcy5ldmVudExvZy5wb3AoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmV2ZW50TG9nLnB1c2gobmV3IExvZ2dlZFVJRXZlbnQobmFtZSwgZGF0YSkpO1xuXG4gICAgICAgICh0aGlzOiBhbnkpW25hbWVdKGRhdGEpO1xuXG4gICAgICAgIHZhciBzdGF0ZU5hbWUgPSB0aGlzLnN0YXRlLmNvbnN0cnVjdG9yLm5hbWU7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlTG9nLnNsaWNlKC0xKVswXSAhPT0gc3RhdGVOYW1lKSB7XG4gICAgICAgICAgdGhpcy5zdGF0ZUxvZy5wdXNoKHN0YXRlTmFtZSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgIHZhciBnZXRLZXkgPSBlID0+IGUud2hpY2g7XG4gICAgdmFyIGdldE1vdXNlUG9pbnQgPSBlID0+IHRoaXMucmVuZGVyZXIuaW52ZXJzZVRyYW5zZm9ybShlKTtcblxuICAgIHZhciBkb2M6IGFueSA9IGRvY3VtZW50O1xuICAgIGRvYy5vbmtleXVwID0gbWFrZUhhbmRsZXIoJ29uS2V5VXAnLCBnZXRLZXkpO1xuICAgIGRvYy5vbmtleWRvd24gPSBtYWtlSGFuZGxlcignb25LZXlEb3duJywgZ2V0S2V5KTtcbiAgICBkb2Mub25rZXlwcmVzcyA9IG1ha2VIYW5kbGVyKCdvbktleVByZXNzJywgZ2V0S2V5KTtcbiAgICBkb2Mub25tb3VzZW1vdmUgPSBtYWtlSGFuZGxlcignb25Nb3VzZU1vdmUnLCBnZXRNb3VzZVBvaW50KTtcbiAgICBkb2Mub25tb3VzZWRvd24gPSBtYWtlSGFuZGxlcignb25Nb3VzZURvd24nLCBnZXRNb3VzZVBvaW50KTtcbiAgICBkb2Mub25tb3VzZXVwID0gbWFrZUhhbmRsZXIoJ29uTW91c2VVcCcsIGdldE1vdXNlUG9pbnQpO1xuICB9XG5cbiAgYW5pbWF0ZSgpOiB2b2lkIHtcbiAgICB2YXIgbW91c2VJbmZvOmFueSA9IHtcbiAgICAgIG1vdXNlUG9pbnQ6IHRoaXMubW91c2VQb2ludFxuICAgIH07XG5cbiAgICB2YXIge2hvdmVyU2VnbWVudElEcywgaG92ZXJQb2ludElEfSA9IHRoaXM7XG5cbiAgICBpZiAoaG92ZXJTZWdtZW50SURzKSB7XG4gICAgICBtb3VzZUluZm8ucDBpZCA9IGhvdmVyU2VnbWVudElEc1swXTtcbiAgICAgIG1vdXNlSW5mby5wMWlkID0gaG92ZXJTZWdtZW50SURzWzFdO1xuICAgIH0gZWxzZSBpZiAoaG92ZXJQb2ludElEKSB7XG4gICAgICBtb3VzZUluZm8ucDBpZCA9IGhvdmVyUG9pbnRJRDtcbiAgICB9XG5cbiAgICB0aGlzLnN0YXRlLmRyYXcodGhpcy5yZW5kZXJlciwgbW91c2VJbmZvKTtcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMuYW5pbWF0ZS5iaW5kKHRoaXMpKTtcbiAgfVxuXG4gIG9uTW91c2VEb3duKG1vdXNlUG9pbnQ6IFBvaW50KTogdm9pZCB7XG4gICAgdGhpcy5kcmFnZ2luZyA9IHRydWU7XG5cbiAgICB2YXIgbmV3U3RhdGUgPSBudWxsO1xuXG4gICAgaWYgKHRoaXMuaG92ZXJTZWdtZW50SURzKSB7XG4gICAgICBuZXdTdGF0ZSA9IHRoaXMuc3RhdGUub25TZWdtZW50RG93bihcbiAgICAgICAgdGhpcy5ob3ZlclNlZ21lbnRJRHNbMF0sXG4gICAgICAgIHRoaXMuaG92ZXJTZWdtZW50SURzWzFdXG4gICAgICApO1xuICAgIH0gZWxzZSBpZiAodGhpcy5ob3ZlclJvdGFyeSkge1xuICAgICAgbmV3U3RhdGUgPSB0aGlzLnN0YXRlLm9uUm90YXJ5RG93bih0aGlzLmhvdmVyUG9pbnRJRCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmhvdmVyR3JvdW5kKSB7XG4gICAgICBuZXdTdGF0ZSA9IHRoaXMuc3RhdGUub25Hcm91bmREb3duKHRoaXMuaG92ZXJQb2ludElEKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuaG92ZXJQb2ludCkge1xuICAgICAgbmV3U3RhdGUgPSB0aGlzLnN0YXRlLm9uUG9pbnREb3duKHRoaXMuaG92ZXJQb2ludElEKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmV3U3RhdGUgPSB0aGlzLnN0YXRlLm9uQ2FudmFzRG93bihtb3VzZVBvaW50KTtcbiAgICAgIGlmICghbmV3U3RhdGUpIHtcbiAgICAgICAgbmV3U3RhdGUgPSB0aGlzLnN0YXRlLm9uTW91c2VEb3duKG1vdXNlUG9pbnQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuc3RhdGUgPSBuZXdTdGF0ZSA/IG5ld1N0YXRlIDogdGhpcy5zdGF0ZTtcbiAgICB0aGlzLnNldEhvdmVycyhtb3VzZVBvaW50KTtcbiAgfVxuXG4gIG9uTW91c2VVcChtb3VzZVBvaW50OiBQb2ludCk6IHZvaWQge1xuICAgIHRoaXMuZHJhZ2dpbmcgPSBmYWxzZTtcblxuICAgIHZhciBuZXdTdGF0ZSA9IHRoaXMuc3RhdGUub25Nb3VzZVVwKG1vdXNlUG9pbnQpO1xuXG4gICAgaWYgKCFuZXdTdGF0ZSkge1xuICAgICAgaWYgKHRoaXMuaG92ZXJTZWdtZW50SURzKSB7XG4gICAgICAgIG5ld1N0YXRlID0gdGhpcy5zdGF0ZS5vblNlZ21lbnRVcChcbiAgICAgICAgICB0aGlzLmhvdmVyU2VnbWVudElEc1swXSxcbiAgICAgICAgICB0aGlzLmhvdmVyU2VnbWVudElEc1sxXVxuICAgICAgICApO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLmhvdmVyUG9pbnRJRCkge1xuICAgICAgICBuZXdTdGF0ZSA9IHRoaXMuc3RhdGUub25BbnlQb2ludFVwKHRoaXMuaG92ZXJQb2ludElEKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5ld1N0YXRlID0gdGhpcy5zdGF0ZS5vbkNhbnZhc1VwKG1vdXNlUG9pbnQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuc3RhdGUgPSBuZXdTdGF0ZSA/IG5ld1N0YXRlIDogdGhpcy5zdGF0ZTtcbiAgICB0aGlzLnNldEhvdmVycyhtb3VzZVBvaW50KTtcbiAgfVxuXG4gIG9uTW91c2VNb3ZlKG1vdXNlUG9pbnQ6IFBvaW50KTogdm9pZCB7XG4gICAgaWYgKHRoaXMuZHJhZ2dpbmcpIHtcbiAgICAgIHZhciBuZXdTdGF0ZSA9IHRoaXMuc3RhdGUub25Nb3VzZURyYWcobW91c2VQb2ludCk7XG4gICAgICB0aGlzLnN0YXRlID0gbmV3U3RhdGUgPyBuZXdTdGF0ZSA6IHRoaXMuc3RhdGU7XG4gICAgfVxuXG4gICAgdGhpcy5zZXRIb3ZlcnMobW91c2VQb2ludCk7XG4gICAgdGhpcy5tb3VzZVBvaW50ID0gbW91c2VQb2ludDtcbiAgfVxuXG4gIG9uS2V5VXAod2hpY2g6IG51bWJlcik6IHZvaWQge1xuICAgIHZhciBuZXdTdGF0ZSA9IHRoaXMuc3RhdGUub25LZXlVcCh3aGljaCk7XG4gICAgdGhpcy5zdGF0ZSA9IG5ld1N0YXRlID8gbmV3U3RhdGUgOiB0aGlzLnN0YXRlO1xuICAgIHRoaXMubW91c2VQb2ludCAmJiB0aGlzLnNldEhvdmVycyh0aGlzLm1vdXNlUG9pbnQpO1xuICB9XG5cbiAgb25LZXlEb3duKHdoaWNoOiBudW1iZXIpOiB2b2lkIHtcbiAgICB2YXIgbmV3U3RhdGUgPSB0aGlzLnN0YXRlLm9uS2V5RG93bih3aGljaCk7XG4gICAgdGhpcy5zdGF0ZSA9IG5ld1N0YXRlID8gbmV3U3RhdGUgOiB0aGlzLnN0YXRlO1xuICAgIHRoaXMubW91c2VQb2ludCAmJiB0aGlzLnNldEhvdmVycyh0aGlzLm1vdXNlUG9pbnQpO1xuICB9XG5cbiAgb25LZXlQcmVzcyh3aGljaDogbnVtYmVyKTogdm9pZCB7XG4gICAgdmFyIG5ld1N0YXRlID0gdGhpcy5zdGF0ZS5vbktleVByZXNzKHdoaWNoKTtcbiAgICB0aGlzLnN0YXRlID0gbmV3U3RhdGUgPyBuZXdTdGF0ZSA6IHRoaXMuc3RhdGU7XG4gICAgdGhpcy5tb3VzZVBvaW50ICYmIHRoaXMuc2V0SG92ZXJzKHRoaXMubW91c2VQb2ludCk7XG4gIH1cblxuICBzZXRIb3ZlcnMoY3VycmVudFBvaW50OiBQb2ludCk6IHZvaWQge1xuICAgIHRoaXMuaG92ZXJTZWdtZW50SURzID0gbnVsbDtcbiAgICB0aGlzLmhvdmVyUG9pbnRJRCA9ICcnO1xuICAgIHRoaXMuaG92ZXJQb2ludCA9IGZhbHNlO1xuICAgIHRoaXMuaG92ZXJHcm91bmQgPSBmYWxzZTtcbiAgICB0aGlzLmhvdmVyUm90YXJ5ID0gZmFsc2U7XG5cbiAgICB2YXIge2Nsb3Nlc3RQb2ludEluZm8sIGNsb3Nlc3RTZWdtZW50SW5mb30gPVxuICAgICAgdGhpcy5zdGF0ZS5saW5rYWdlLmdldENsb3Nlc3RUaGluZ3MoY3VycmVudFBvaW50KTtcblxuICAgIGlmIChjbG9zZXN0UG9pbnRJbmZvLnRoaW5nKSB7XG4gICAgICB0aGlzLmhvdmVyUG9pbnRJRCA9IGNsb3Nlc3RQb2ludEluZm8udGhpbmcuaWQ7XG5cbiAgICAgIGlmICh0aGlzLnN0YXRlLmxpbmthZ2Uuc3BlYy5yb3Rhcmllc1t0aGlzLmhvdmVyUG9pbnRJRF0pIHtcbiAgICAgICAgdGhpcy5ob3ZlclJvdGFyeSA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdGUubGlua2FnZS5zcGVjLmdyb3VuZFBvaW50c1t0aGlzLmhvdmVyUG9pbnRJRF0pIHtcbiAgICAgICAgdGhpcy5ob3Zlckdyb3VuZCA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdGUubGlua2FnZS5zcGVjLnBvaW50c1t0aGlzLmhvdmVyUG9pbnRJRF0pIHtcbiAgICAgICAgdGhpcy5ob3ZlclBvaW50ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGNsb3Nlc3RTZWdtZW50SW5mby50aGluZykge1xuICAgICAgdGhpcy5ob3ZlclNlZ21lbnRJRHMgPSBbXG4gICAgICAgIGNsb3Nlc3RTZWdtZW50SW5mby50aGluZ1swXS5pZCxcbiAgICAgICAgY2xvc2VzdFNlZ21lbnRJbmZvLnRoaW5nWzFdLmlkXG4gICAgICBdO1xuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFVJO1xuIiwiLypcbiAqIFRoaXMgZmlsZSBjb250YWlucyBhbGwgdGhlIFVJIHN0YXRlIHRyYW5zaXRpb25zIGFuZCBiZWhhdmlvcnMuIFVuZm9ydHVuYXRlbHksXG4gKiBzaW5jZSBzdGF0ZSB0cmFuc2l0aW9ucyBhcmUgaW5oZXJlbnRseSBjaXJjdWxhciwgdGhpcyBmaWxlIGNhbm5vdCBlYXNpbHkgYmVcbiAqIGJyb2tlbiB1cCBpbnRvIHNlcGFyYXRlIGZpbGVzIGJlY2F1c2UgdGhlIENvbW1vbkpTIHJlcXVpcmUgc3lzdGVtIGhhcyB6ZXJvXG4gKiB0b2xlcmFuY2UgZm9yIGNpcmN1bGFyIHJlZmVyZW5jZXMuIFRvIHNvbHZlIHRoaXMsIHdlJ2QgbmVlZCB0byBhZGQgb3VyIG93blxuICogcmVxdWlyZSBvciByZWdpc3RyYXIgc3lzdGVtIG9uIHRvcCBvZiBDb21tb25KUy4gSSdsbCB0YWNrbGUgdGhhdCB3aGVuIHRoaXNcbiAqIGZpbGUgcmVhY2hlcyAxMDAwIGxpbmVzIG9yIHNvLlxuICovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBMaW5rYWdlID0gcmVxdWlyZSgnLi4vTGlua2FnZScpO1xudmFyIExpbmthZ2VSZW5kZXJlciA9IHJlcXVpcmUoJy4uL2dyYXBoaWNzL0xpbmthZ2VSZW5kZXJlcicpO1xudmFyIExpbmthZ2VPcHRPYmogPSByZXF1aXJlKCcuLi9vcHRpbWl6ZS9MaW5rYWdlT3B0T2JqJyk7XG52YXIgS0VZUyA9IHJlcXVpcmUoJy4vS0VZUycpO1xuXG52YXIgbWl4aW5Qb2ludFZhbGlkYXRpb24gPSByZXF1aXJlKCcuL21peGluUG9pbnRWYWxpZGF0aW9uJyk7XG52YXIgb3B0aW1pemVTdGVwID0gcmVxdWlyZSgnLi4vb3B0aW1pemUvb3B0aW1pemVTdGVwJyk7XG5cbnZhciBNQVhfVFJBQ0VfUE9JTlRTID0gMTAwO1xuXG50eXBlIFBvaW50ID0ge3g6IG51bWJlcjsgeTogbnVtYmVyfTtcbnR5cGUgU3RhdGVTcGVjID0ge1xuICBwMGlkPzogc3RyaW5nO1xuICBwMWlkPzogc3RyaW5nO1xuICBwb2ludEE/OiBQb2ludDtcbiAgcG9pbnRCPzogUG9pbnQ7XG59O1xuXG50eXBlIE1vdXNlSW5mbyA9IHtcbiAgbW91c2VQb2ludDogUG9pbnQ7XG4gIHAwaWQ/OiBzdHJpbmc7XG4gIHAxaWQ/OiBzdHJpbmc7XG59O1xuXG52YXIgUFJFVklFV19PUFRJT05TID0ge1xuICBsaW5lQ29sb3I6ICdwaW5rJyxcbiAgcG9pbnRDb2xvcjogJ3JlZCcsXG4gIGRyYXdQb2ludHM6IHRydWUsXG59O1xuXG52YXIgVFJBQ0VfT1BUSU9OUyA9IHtcbiAgbGluZUNvbG9yOiAncGluaycsXG4gIHBvaW50Q29sb3I6ICdyZWQnLFxuICBkcmF3UG9pbnRzOiBmYWxzZSxcbn07XG5cbnZhciBPUFRJTUlaRV9QQVRIX09QVElPTlMgPSB7XG4gIGxpbmVDb2xvcjogJ2hvdFBpbmsnLFxuICBwb2ludENvbG9yOiAnbWFnZW50YScsXG4gIGRyYXdQb2ludHM6IGZhbHNlLFxufTtcblxuY2xhc3MgQmFzZVN0YXRlIHtcbiAgc3RhdGljIGdldEluaXRpYWxVbnBhdXNlZFN0YXRlKGxpbmthZ2U6IExpbmthZ2UpIHtcbiAgICByZXR1cm4gbmV3IFVucGF1c2VkU3RhdGUobGlua2FnZSk7XG4gIH1cblxuICBzdGF0aWMgZ2V0SW5pdGlhbFBhdXNlZFN0YXRlKGxpbmthZ2U6IExpbmthZ2UpIHtcbiAgICByZXR1cm4gbmV3IFN0YXRlMChsaW5rYWdlKTtcbiAgfVxuXG4gIGxpbmthZ2U6IExpbmthZ2U7XG4gIHAwaWQ6ID9zdHJpbmc7XG4gIHAxaWQ6ID9zdHJpbmc7XG4gIHBvaW50QTogP1BvaW50O1xuICBwb2ludEI6ID9Qb2ludDtcblxuICBjb25zdHJ1Y3RvcihsaW5rYWdlOiBMaW5rYWdlLCBzcGVjPzogP1N0YXRlU3BlYykge1xuICAgIC8vY29uc29sZS5sb2codGhpcy5jb25zdHJ1Y3Rvcik7XG4gICAgdGhpcy5saW5rYWdlID0gbGlua2FnZTtcblxuICAgIGlmIChzcGVjKSB7XG4gICAgICB0aGlzLnAwaWQgPSBzcGVjLnAwaWQ7XG4gICAgICB0aGlzLnAxaWQgPSBzcGVjLnAxaWQ7XG4gICAgICB0aGlzLnBvaW50QSA9IHNwZWMucG9pbnRBO1xuICAgICAgdGhpcy5wb2ludEIgPSBzcGVjLnBvaW50QjtcbiAgICB9XG4gIH1cblxuICBkcmF3KHJlbmRlcmVyOiBMaW5rYWdlUmVuZGVyZXIsIG1vdXNlSW5mbzogTW91c2VJbmZvKTogdm9pZCB7XG4gICAgcmVuZGVyZXIuZHJhd0xpbmthZ2Uoe1xuICAgICAgcG9zaXRpb25zOiB0aGlzLmxpbmthZ2UucG9zaXRpb25zLFxuICAgICAgcG9pbnRzOiB0aGlzLmxpbmthZ2Uuc3BlYy5wb2ludHMsXG4gICAgfSk7XG4gIH1cblxuICAvLyBCYXNpYyBoYW5kbGVyc1xuICBvbk1vdXNlRHJhZyhtb3VzZVBvaW50OiBQb2ludCk6ID9CYXNlU3RhdGUge31cbiAgb25Nb3VzZURvd24oKTogP0Jhc2VTdGF0ZSB7fVxuICBvbk1vdXNlVXAobW91c2VQb2ludDogUG9pbnQpOiA/QmFzZVN0YXRlIHt9XG4gIG9uS2V5UHJlc3Moa2V5OiBudW1iZXIpOiA/QmFzZVN0YXRlIHt9XG4gIG9uS2V5RG93bihrZXk6IG51bWJlcik6ID9CYXNlU3RhdGUge31cbiAgb25LZXlVcChrZXk6IG51bWJlcik6ID9CYXNlU3RhdGUge31cblxuICAvLyBVSSBlbGVtZW50LXNwZWNpZmljIGhhbmxkZXJzIChjb252ZW5pZW5jZSlcbiAgb25BbnlQb2ludFVwKHAwaWQ6IHN0cmluZyk6ID9CYXNlU3RhdGUge31cbiAgb25DYW52YXNEb3duKHBvaW50QTogUG9pbnQpOiA/QmFzZVN0YXRlIHt9XG4gIG9uQ2FudmFzVXAocG9pbnRBOiBQb2ludCk6ID9CYXNlU3RhdGUge31cbiAgb25Hcm91bmREb3duKHAwaWQ6IHN0cmluZyk6ID9CYXNlU3RhdGUge31cbiAgb25Qb2ludERvd24ocDBpZDogc3RyaW5nKTogP0Jhc2VTdGF0ZSB7fVxuICBvblJvdGFyeURvd24ocDBpZDogc3RyaW5nKTogP0Jhc2VTdGF0ZSB7fVxuICBvblNlZ21lbnREb3duKHAwaWQ6IHN0cmluZywgcDFpZDogc3RyaW5nKTogP0Jhc2VTdGF0ZSB7fVxuICBvblNlZ21lbnRVcChwMGlkOiBzdHJpbmcsIHAxaWQ6IHN0cmluZyk6ID9CYXNlU3RhdGUge31cbn1cblxuY2xhc3MgVW5wYXVzZWRTdGF0ZSBleHRlbmRzIEJhc2VTdGF0ZSB7ICAvLyBpbml0aWFsIHVucGF1c2VkXG4gIGRyYXcocmVuZGVyZXI6IExpbmthZ2VSZW5kZXJlciwgbW91c2VJbmZvOiBNb3VzZUluZm8pOiB2b2lkIHtcbiAgICB0aGlzLmxpbmthZ2UudHJ5Um90YXRpbmdMaW5rYWdlSW5wdXQoKTtcbiAgICBzdXBlci5kcmF3KHJlbmRlcmVyLCBtb3VzZUluZm8pO1xuICB9XG5cbiAgb25LZXlVcChrZXk6IG51bWJlcik6ID9CYXNlU3RhdGUge1xuICAgIHN3aXRjaCAoa2V5KSB7XG4gICAgICBjYXNlIEtFWVMuU1BBQ0U6XG4gICAgICAgIHJldHVybiBuZXcgU3RhdGUwKHRoaXMubGlua2FnZSk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH1cblxuICBvbktleVByZXNzKGtleTogbnVtYmVyKTogP0Jhc2VTdGF0ZSB7XG4gICAgc3dpdGNoIChrZXkpIHtcbiAgICAgIGNhc2UgS0VZUy5TOlxuICAgICAgY2FzZSBLRVlTLnM6XG4gICAgICAgIHRoaXMubGlua2FnZS5zY2FsZVNwZWVkKC45KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICBjYXNlIEtFWVMuVzpcbiAgICAgIGNhc2UgS0VZUy53OlxuICAgICAgICB0aGlzLmxpbmthZ2Uuc2NhbGVTcGVlZCgxLjEpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIGNhc2UgS0VZUy5UOlxuICAgICAgY2FzZSBLRVlTLnQ6XG4gICAgICAgIHRoaXMubGlua2FnZS5yZXZlcnNlUm90YXJ5KCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9XG59XG5cbmNsYXNzIFN0YXRlMTAgZXh0ZW5kcyBVbnBhdXNlZFN0YXRlIHsgLy8gcm90YXJ5IHNlbGVjdGVkIG1vdmluZ1xuICBkcmF3KHJlbmRlcmVyOiBMaW5rYWdlUmVuZGVyZXIsIG1vdXNlSW5mbzogTW91c2VJbmZvKTogdm9pZCB7XG4gICAgc3VwZXIuZHJhdyhyZW5kZXJlciwgbW91c2VJbmZvKTtcblxuICAgIHZhciBwMWlkID0gdGhpcy5saW5rYWdlLnNwZWMucm90YXJpZXNbdGhpcy5wMGlkXTtcbiAgICB2YXIgcDJpZCA9IHRoaXMubGlua2FnZS5zcGVjLmV4dGVuZGVyc1twMWlkXS5yZWY7XG4gICAgcmVuZGVyZXIuZHJhd0xpbmVzKFxuICAgICAgW1xuICAgICAgICB0aGlzLmxpbmthZ2UuZ2V0UG9pbnQocDFpZCksXG4gICAgICAgIHRoaXMubGlua2FnZS5nZXRQb2ludCh0aGlzLnAwaWQpLFxuICAgICAgICB0aGlzLmxpbmthZ2UuZ2V0UG9pbnQocDJpZCksXG4gICAgICBdLFxuICAgICAgUFJFVklFV19PUFRJT05TXG4gICAgKTtcbiAgfVxuXG4gIG9uS2V5UHJlc3Moa2V5OiBudW1iZXIpOiA/QmFzZVN0YXRlIHtcbiAgICBzd2l0Y2ggKGtleSkge1xuICAgICAgY2FzZSBLRVlTLlM6XG4gICAgICBjYXNlIEtFWVMuczpcbiAgICAgICAgdGhpcy5saW5rYWdlLmNoYW5nZVNwZWVkKC0xLCB0aGlzLnAwaWQpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIGNhc2UgS0VZUy5XOlxuICAgICAgY2FzZSBLRVlTLnc6XG4gICAgICAgIHRoaXMubGlua2FnZS5jaGFuZ2VTcGVlZCgxLCB0aGlzLnAwaWQpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIGNhc2UgS0VZUy5UOlxuICAgICAgY2FzZSBLRVlTLnQ6XG4gICAgICAgIHRoaXMubGlua2FnZS5yZXZlcnNlUm90YXJ5KHRoaXMucDBpZCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9XG59XG5cbmNsYXNzIFN0YXRlMTIgZXh0ZW5kcyBVbnBhdXNlZFN0YXRlIHsgLy8gdHJhY2UgcG9pbnRcbiAgdHJhY2VQb2ludHM6IEFycmF5PFBvaW50PjtcblxuICBjb25zdHJ1Y3RvcihsaW5rYWdlOiBMaW5rYWdlLCBzcGVjOiBTdGF0ZVNwZWMpIHtcbiAgICBzdXBlcihsaW5rYWdlLCBzcGVjKTtcbiAgICB0aGlzLnRyYWNlUG9pbnRzID0gW107XG4gIH1cblxuICBkcmF3KHJlbmRlcmVyOiBMaW5rYWdlUmVuZGVyZXIsIG1vdXNlSW5mbzogTW91c2VJbmZvKTogdm9pZCB7XG4gICAgc3VwZXIuZHJhdyhyZW5kZXJlciwgbW91c2VJbmZvKTtcblxuICAgIC8vIHJlY29yZCB0aGUgY3VycmVudCBwb3NpdGlvblxuICAgIHZhciBjdXJQb2ludCA9IHRoaXMubGlua2FnZS5wb3NpdGlvbnNbdGhpcy5wMGlkXTtcbiAgICB0aGlzLnRyYWNlUG9pbnRzLnB1c2goe1xuICAgICAgeDogY3VyUG9pbnQueCxcbiAgICAgIHk6IGN1clBvaW50LnksXG4gICAgfSk7XG4gICAgaWYgKHRoaXMudHJhY2VQb2ludHMubGVuZ3RoID4gTUFYX1RSQUNFX1BPSU5UUykge1xuICAgICAgdGhpcy50cmFjZVBvaW50cy5zaGlmdCgpO1xuICAgIH1cblxuICAgIHJlbmRlcmVyLmRyYXdMaW5lcyh0aGlzLnRyYWNlUG9pbnRzLCBUUkFDRV9PUFRJT05TKTtcbiAgICByZW5kZXJlci5kcmF3UG9pbnQoY3VyUG9pbnQsIFBSRVZJRVdfT1BUSU9OUyk7XG4gIH1cbn1cblxuY2xhc3MgUGF1c2VkU3RhdGUgZXh0ZW5kcyBCYXNlU3RhdGUge1xuICBkcmF3KHJlbmRlcmVyOiBMaW5rYWdlUmVuZGVyZXIsIG1vdXNlSW5mbzogTW91c2VJbmZvKTogdm9pZCB7XG4gICAgdmFyIHtwMGlkLCBwMWlkfSA9IG1vdXNlSW5mbztcbiAgICBzdXBlci5kcmF3KHJlbmRlcmVyLCBtb3VzZUluZm8pO1xuXG4gICAgaWYgKHAwaWQgJiYgcDFpZCkge1xuICAgICAgcmVuZGVyZXIuZHJhd0xpbmVzKFxuICAgICAgICBbXG4gICAgICAgICAgdGhpcy5saW5rYWdlLnBvc2l0aW9uc1twMGlkXSxcbiAgICAgICAgICB0aGlzLmxpbmthZ2UucG9zaXRpb25zW3AxaWRdLFxuICAgICAgICBdLFxuICAgICAgICBQUkVWSUVXX09QVElPTlNcbiAgICAgICk7XG4gICAgfSBlbHNlIGlmIChwMGlkKSB7XG4gICAgICByZW5kZXJlci5kcmF3UG9pbnQodGhpcy5saW5rYWdlLnBvc2l0aW9uc1twMGlkXSwgUFJFVklFV19PUFRJT05TKTtcbiAgICB9XG4gIH1cblxuICBvbktleVVwKGtleTogbnVtYmVyKTogP0Jhc2VTdGF0ZSB7XG4gICAgc3dpdGNoIChrZXkpIHtcbiAgICAgIGNhc2UgS0VZUy5TUEFDRTpcbiAgICAgICAgcmV0dXJuIG5ldyBVbnBhdXNlZFN0YXRlKHRoaXMubGlua2FnZSk7XG4gICAgICBjYXNlIEtFWVMuRVNDOlxuICAgICAgICByZXR1cm4gbmV3IFN0YXRlMCh0aGlzLmxpbmthZ2UpO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9XG59XG5cbmNsYXNzIFN0YXRlMCBleHRlbmRzIFBhdXNlZFN0YXRlIHsgLy8gaW5pdGlhbCBwYXVzZWRcbiAgb25Hcm91bmREb3duKHAwaWQ6IHN0cmluZyk6ID9CYXNlU3RhdGUge1xuICAgIHJldHVybiBuZXcgU3RhdGUzKHRoaXMubGlua2FnZSwge3AwaWR9KTtcbiAgfVxuXG4gIG9uUm90YXJ5RG93bihwMGlkOiBzdHJpbmcpOiA/QmFzZVN0YXRlIHtcbiAgICByZXR1cm4gbmV3IFN0YXRlNyh0aGlzLmxpbmthZ2UsIHtwMGlkfSk7XG4gIH1cblxuICBvblBvaW50RG93bihwMGlkOiBzdHJpbmcpOiA/QmFzZVN0YXRlIHtcbiAgICByZXR1cm4gbmV3IFN0YXRlMTQodGhpcy5saW5rYWdlLCB7cDBpZH0pO1xuICB9XG5cbiAgb25TZWdtZW50RG93bihwMGlkOiBzdHJpbmcsIHAxaWQ6IHN0cmluZyk6ID9CYXNlU3RhdGUge1xuICAgIHJldHVybiBuZXcgU3RhdGU5KHRoaXMubGlua2FnZSwge3AwaWQsIHAxaWR9KTtcbiAgfVxuXG4gIG9uQ2FudmFzRG93bihwb2ludEE6IFBvaW50KTogP0Jhc2VTdGF0ZSB7XG4gICAgcmV0dXJuIG5ldyBTdGF0ZTEodGhpcy5saW5rYWdlLCB7cG9pbnRBfSk7XG4gIH1cblxuICBvbktleURvd24oa2V5OiBudW1iZXIpOiA/QmFzZVN0YXRlIHtcbiAgICBzd2l0Y2ggKGtleSkge1xuICAgICAgY2FzZSBLRVlTLlI6XG4gICAgICBjYXNlIEtFWVMucjpcbiAgICAgICAgcmV0dXJuIG5ldyBTdGF0ZTExKHRoaXMubGlua2FnZSk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH1cbn1cblxuY2xhc3MgT3B0aW1pemVTdGF0ZSBleHRlbmRzIFBhdXNlZFN0YXRlIHtcbiAgX19kcmF3blBvaW50czogQXJyYXk8UG9pbnQ+O1xuICBfX3BvaW50UGF0aDogQXJyYXk8UG9pbnQ+O1xuXG4gIG9uS2V5VXAoa2V5OiBudW1iZXIpOiA/QmFzZVN0YXRlIHtcbiAgICBzd2l0Y2ggKGtleSkge1xuICAgICAgY2FzZSBLRVlTLlNQQUNFOlxuICAgICAgICByZXR1cm4gbmV3IFN0YXRlMTIodGhpcy5saW5rYWdlLCB7cDBpZDogdGhpcy5wMGlkfSk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gc3VwZXIub25LZXlVcChrZXkpO1xuICAgIH1cbiAgfVxuXG4gIGRyYXcocmVuZGVyZXI6IExpbmthZ2VSZW5kZXJlciwgbW91c2VJbmZvOiBNb3VzZUluZm8pOiB2b2lkIHtcbiAgICBzdXBlci5kcmF3KHJlbmRlcmVyLCBtb3VzZUluZm8pO1xuICAgIHJlbmRlcmVyLmRyYXdMaW5lcyh0aGlzLl9fZHJhd25Qb2ludHMsIE9QVElNSVpFX1BBVEhfT1BUSU9OUyk7XG4gICAgcmVuZGVyZXIuZHJhd0xpbmVzKHRoaXMuX19wb2ludFBhdGgsIFRSQUNFX09QVElPTlMpO1xuICB9XG59XG5cbmNsYXNzIFN0YXRlMTUgZXh0ZW5kcyBPcHRpbWl6ZVN0YXRlIHsgLy8gZHJhdyBvcHRpbWl6ZSBwYXRoXG4gIGNvbnN0cnVjdG9yKGxpbmthZ2U6IExpbmthZ2UsIHNwZWM6IFN0YXRlU3BlYykge1xuICAgIHN1cGVyKGxpbmthZ2UsIHNwZWMpO1xuICAgIHRoaXMuX19kcmF3blBvaW50cyA9IFtdO1xuICAgIHRoaXMuX19wb2ludFBhdGggPSB0aGlzLmxpbmthZ2UuZ2V0UGF0aCh0aGlzLnAwaWQpO1xuICB9XG5cbiAgb25Nb3VzZURyYWcobW91c2VQb2ludDogUG9pbnQpOiA/QmFzZVN0YXRlIHtcbiAgICB0aGlzLl9fZHJhd25Qb2ludHMucHVzaChtb3VzZVBvaW50KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIG9uTW91c2VVcChtb3VzZVBvaW50OiBQb2ludCk6ID9CYXNlU3RhdGUge1xuICAgIHJldHVybiBuZXcgU3RhdGUxNih0aGlzLmxpbmthZ2UsIHtwMGlkOiB0aGlzLnAwaWR9LCB0aGlzLl9fZHJhd25Qb2ludHMpO1xuICB9XG5cbiAgZHJhdyhyZW5kZXJlcjogTGlua2FnZVJlbmRlcmVyLCBtb3VzZUluZm86IE1vdXNlSW5mbyk6IHZvaWQge1xuICAgIHZhciB7bW91c2VQb2ludH0gPSBtb3VzZUluZm87XG4gICAgc3VwZXIuZHJhdyhyZW5kZXJlciwgbW91c2VJbmZvKTtcblxuICAgIHJlbmRlcmVyLmRyYXdQb2ludCh0aGlzLmxpbmthZ2UuZ2V0UG9pbnQodGhpcy5wMGlkKSwgUFJFVklFV19PUFRJT05TKTtcbiAgICByZW5kZXJlci5kcmF3UG9pbnQobW91c2VQb2ludCwgT1BUSU1JWkVfUEFUSF9PUFRJT05TKTtcbiAgfVxufVxuXG5jbGFzcyBTdGF0ZTE2IGV4dGVuZHMgT3B0aW1pemVTdGF0ZSB7IC8vIGFjdHVhbGx5IG9wdGltaXplXG4gIF9zdG9wT3B0aW1pemluZzogYm9vbGVhbjtcblxuICBjb25zdHJ1Y3RvcihsaW5rYWdlOiBMaW5rYWdlLCBzcGVjOiBTdGF0ZVNwZWMsIGRyYXduUG9pbnRzOiBBcnJheTxQb2ludD4pIHtcbiAgICBzdXBlcihsaW5rYWdlLCBzcGVjKTtcbiAgICB0aGlzLl9fcG9pbnRQYXRoID0gdGhpcy5saW5rYWdlLmdldFBhdGgodGhpcy5wMGlkKTtcbiAgICB0aGlzLl9fZHJhd25Qb2ludHMgPSBkcmF3blBvaW50cztcbiAgICB0aGlzLl9zdG9wT3B0aW1pemluZyA9IGZhbHNlO1xuICAgIHRoaXMuX3N0YXJ0T3B0aW1pemF0aW9uKCk7XG4gIH1cblxuICBvbktleVVwKGtleTogbnVtYmVyKTogP0Jhc2VTdGF0ZSB7XG4gICAgdGhpcy5fc3RvcE9wdGltaXppbmcgPSB0cnVlO1xuICAgIHJldHVybiBzdXBlci5vbktleVVwKGtleSk7XG4gIH1cblxuICBfc3RhcnRPcHRpbWl6YXRpb24oKSB7XG4gICAgdmFyIG9wdE9iaiA9IG5ldyBMaW5rYWdlT3B0T2JqKHtcbiAgICAgIHBhdGg6IHRoaXMuX19kcmF3blBvaW50cyxcbiAgICAgIGxpbmthZ2VTcGVjOiB0aGlzLmxpbmthZ2Uuc3BlYyxcbiAgICAgIGlkOiB0aGlzLnAwaWQsXG4gICAgfSk7XG5cbiAgICB2YXIgcGF1c2VUaW1lID0gMDtcblxuICAgIHZhciBpdGVyYXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKCF0aGlzLl9zdG9wT3B0aW1pemluZykge1xuICAgICAgICBzZXRUaW1lb3V0KGl0ZXJhdGUsIHBhdXNlVGltZSk7XG4gICAgICAgIG9wdE9iaiA9IG9wdGltaXplU3RlcChvcHRPYmopO1xuICAgICAgICB0aGlzLmxpbmthZ2UgPSBvcHRPYmoubGlua2FnZTtcbiAgICAgICAgdGhpcy5fX3BvaW50UGF0aCA9IHRoaXMubGlua2FnZS5nZXRQYXRoKHRoaXMucDBpZCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGl0ZXJhdGUgPSBpdGVyYXRlLmJpbmQodGhpcyk7XG5cbiAgICBzZXRUaW1lb3V0KGl0ZXJhdGUsIHBhdXNlVGltZSk7XG4gIH1cblxuICBkcmF3KHJlbmRlcmVyOiBMaW5rYWdlUmVuZGVyZXIsIG1vdXNlSW5mbzogTW91c2VJbmZvKTogdm9pZCB7XG4gICAgc3VwZXIuZHJhdyhyZW5kZXJlciwgbW91c2VJbmZvKTtcblxuICAgIHJlbmRlcmVyLmRyYXdQb2ludCh0aGlzLmxpbmthZ2UuZ2V0UG9pbnQodGhpcy5wMGlkKSwgUFJFVklFV19PUFRJT05TKTtcbiAgfVxufVxuXG5jbGFzcyBTdGF0ZTE0IGV4dGVuZHMgUGF1c2VkU3RhdGUgeyAvLyBwb2ludCBkb3duXG4gIGRyYWdnZWQ6ID9ib29sZWFuO1xuXG4gIG9uTW91c2VVcChtb3VzZVBvaW50OiBQb2ludCk6ID9CYXNlU3RhdGUge1xuICAgIHJldHVybiB0aGlzLmRyYWdnZWQgP1xuICAgICAgbmV3IFN0YXRlMCh0aGlzLmxpbmthZ2UpIDpcbiAgICAgIG5ldyBTdGF0ZTQodGhpcy5saW5rYWdlLCB7cDBpZDogdGhpcy5wMGlkfSk7XG4gIH1cblxuICBvbk1vdXNlRHJhZyhtb3VzZVBvaW50OiBQb2ludCk6ID9CYXNlU3RhdGUge1xuICAgIHRoaXMuZHJhZ2dlZCA9IHRydWU7XG4gICAgdGhpcy5saW5rYWdlLm1vdmVOb3RHcm91bmRQb2ludChtb3VzZVBvaW50LCB0aGlzLnAwaWQpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZHJhdyhyZW5kZXJlcjogTGlua2FnZVJlbmRlcmVyLCBtb3VzZUluZm86IE1vdXNlSW5mbyk6IHZvaWQge1xuICAgIHN1cGVyLmRyYXcocmVuZGVyZXIsIG1vdXNlSW5mbyk7XG4gICAgcmVuZGVyZXIuZHJhd1BvaW50KHRoaXMubGlua2FnZS5nZXRQb2ludCh0aGlzLnAwaWQpLCBQUkVWSUVXX09QVElPTlMpO1xuICB9XG59XG5cbmNsYXNzIFN0YXRlMTEgZXh0ZW5kcyBQYXVzZWRTdGF0ZSB7IC8vIGFkZGluZyByb3RhcnlcbiAgb25LZXlVcChrZXk6IG51bWJlcik6ID9CYXNlU3RhdGUge1xuICAgIHN3aXRjaCAoa2V5KSB7XG4gICAgICBjYXNlIEtFWVMuUjpcbiAgICAgIGNhc2UgS0VZUy5yOlxuICAgICAgICByZXR1cm4gbmV3IFN0YXRlMCh0aGlzLmxpbmthZ2UpO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHN1cGVyLm9uS2V5VXAoa2V5KTtcbiAgICB9XG4gIH1cblxuICBvbk1vdXNlVXAobW91c2VQb2ludDogUG9pbnQpOiA/QmFzZVN0YXRlIHtcbiAgICB0aGlzLmxpbmthZ2UuYWRkUm90YXJ5SW5wdXQobW91c2VQb2ludCk7XG4gICAgdGhpcy5saW5rYWdlLmNhbGN1bGF0ZVBvc2l0aW9ucygpO1xuICAgIHJldHVybiBuZXcgU3RhdGUwKHRoaXMubGlua2FnZSk7XG4gIH1cblxuICBkcmF3KHJlbmRlcmVyOiBMaW5rYWdlUmVuZGVyZXIsIG1vdXNlSW5mbzogTW91c2VJbmZvKTogdm9pZCB7XG4gICAgdmFyIHttb3VzZVBvaW50fSA9IG1vdXNlSW5mbztcbiAgICBzdXBlci5kcmF3KHJlbmRlcmVyLCBtb3VzZUluZm8pO1xuXG4gICAgcmVuZGVyZXIuZHJhd0xpbmVzKFxuICAgICAgW1xuICAgICAgICB7eDogbW91c2VQb2ludC54ICsgMywgeTogbW91c2VQb2ludC55ICsgNH0sXG4gICAgICAgIG1vdXNlUG9pbnQsXG4gICAgICAgIHt4OiBtb3VzZVBvaW50LnggKyAxLCB5OiBtb3VzZVBvaW50Lnl9LFxuICAgICAgXSxcbiAgICAgIFBSRVZJRVdfT1BUSU9OU1xuICAgICk7XG4gIH1cbn1cblxuY2xhc3MgU3RhdGUxIGV4dGVuZHMgUGF1c2VkU3RhdGUgeyAvLyBjYW52YXMxXG4gIGNvbnN0cnVjdG9yKGxpbmthZ2U6IExpbmthZ2UsIHNwZWM6IFN0YXRlU3BlYykge1xuICAgIHN1cGVyKGxpbmthZ2UsIHNwZWMpO1xuXG4gICAgbWl4aW5Qb2ludFZhbGlkYXRpb24oXG4gICAgICBbdGhpcy5wb2ludEFdLFxuICAgICAgWydvbkNhbnZhc1VwJywgJ29uQW55UG9pbnRVcCddLFxuICAgICAgdGhpc1xuICAgICk7XG4gIH1cblxuICBvbkNhbnZhc1VwKHBvaW50QjogUG9pbnQpOiA/QmFzZVN0YXRlIHtcbiAgICByZXR1cm4gbmV3IFN0YXRlMih0aGlzLmxpbmthZ2UsIHtwb2ludEE6IHRoaXMucG9pbnRBLCBwb2ludEJ9KTtcbiAgfVxuXG4gIG9uQW55UG9pbnRVcChwMGlkOiBzdHJpbmcpOiA/QmFzZVN0YXRlIHtcbiAgICByZXR1cm4gbmV3IFN0YXRlMTModGhpcy5saW5rYWdlLCB7cG9pbnRBOiB0aGlzLnBvaW50QSwgcDBpZH0pO1xuICB9XG5cbiAgZHJhdyhyZW5kZXJlcjogTGlua2FnZVJlbmRlcmVyLCBtb3VzZUluZm86IE1vdXNlSW5mbyk6IHZvaWQge1xuICAgIHZhciB7bW91c2VQb2ludH0gPSBtb3VzZUluZm87XG4gICAgc3VwZXIuZHJhdyhyZW5kZXJlciwgbW91c2VJbmZvKTtcbiAgICByZW5kZXJlci5kcmF3TGluZXMoW3RoaXMucG9pbnRBLCBtb3VzZVBvaW50XSwgUFJFVklFV19PUFRJT05TKTtcbiAgfVxufVxuXG5jbGFzcyBTdGF0ZTEzIGV4dGVuZHMgUGF1c2VkU3RhdGUgeyAvLyBjYW52YXMgdGhlbiBwb2ludFxuICBjb25zdHJ1Y3RvcihsaW5rYWdlOiBMaW5rYWdlLCBzcGVjOiBTdGF0ZVNwZWMpIHtcbiAgICBzdXBlcihsaW5rYWdlLCBzcGVjKTtcblxuICAgIG1peGluUG9pbnRWYWxpZGF0aW9uKFxuICAgICAgW3RoaXMucG9pbnRBLCB0aGlzLmxpbmthZ2UuZ2V0UG9pbnQodGhpcy5wMGlkKV0sXG4gICAgICBbJ29uQ2FudmFzVXAnXSxcbiAgICAgIHRoaXNcbiAgICApO1xuICB9XG5cbiAgb25DYW52YXNVcChwb2ludEI6IFBvaW50KTogP0Jhc2VTdGF0ZSB7XG4gICAgdGhpcy5saW5rYWdlLmFkZEdyb3VuZFNlZ21lbnQodGhpcy5wb2ludEEsIHBvaW50QiwgdGhpcy5wMGlkKTtcbiAgICB0aGlzLmxpbmthZ2UuY2FsY3VsYXRlUG9zaXRpb25zKCk7XG4gICAgcmV0dXJuIG5ldyBTdGF0ZTAodGhpcy5saW5rYWdlKTtcbiAgfVxuXG4gIGRyYXcocmVuZGVyZXI6IExpbmthZ2VSZW5kZXJlciwgbW91c2VJbmZvOiBNb3VzZUluZm8pOiB2b2lkIHtcbiAgICB2YXIge21vdXNlUG9pbnR9ID0gbW91c2VJbmZvO1xuICAgIHN1cGVyLmRyYXcocmVuZGVyZXIsIG1vdXNlSW5mbyk7XG4gICAgcmVuZGVyZXIuZHJhd0xpbmVzKFxuICAgICAgW1xuICAgICAgICB0aGlzLnBvaW50QSxcbiAgICAgICAgbW91c2VQb2ludCxcbiAgICAgICAgdGhpcy5saW5rYWdlLmdldFBvaW50KHRoaXMucDBpZCksXG4gICAgICBdLFxuICAgICAgUFJFVklFV19PUFRJT05TXG4gICAgKTtcbiAgfVxufVxuXG5jbGFzcyBTdGF0ZTIgZXh0ZW5kcyBQYXVzZWRTdGF0ZSB7IC8vIGNhbnZhczEgKyBjYW52YXMyXG4gIGNvbnN0cnVjdG9yKGxpbmthZ2U6IExpbmthZ2UsIHNwZWM6IFN0YXRlU3BlYykge1xuICAgIHN1cGVyKGxpbmthZ2UsIHNwZWMpO1xuXG4gICAgbWl4aW5Qb2ludFZhbGlkYXRpb24oXG4gICAgICBbdGhpcy5wb2ludEJdLFxuICAgICAgWydvbkFueVBvaW50VXAnXSxcbiAgICAgIHRoaXNcbiAgICApO1xuICB9XG5cbiAgb25BbnlQb2ludFVwKHAwaWQ6IHN0cmluZyk6ID9CYXNlU3RhdGUge1xuICAgIHRoaXMubGlua2FnZS5hZGRHcm91bmRTZWdtZW50KHRoaXMucG9pbnRBLCB0aGlzLnBvaW50QiwgcDBpZCk7XG4gICAgdGhpcy5saW5rYWdlLmNhbGN1bGF0ZVBvc2l0aW9ucygpO1xuICAgIHJldHVybiBuZXcgU3RhdGUwKHRoaXMubGlua2FnZSk7XG4gIH1cblxuICBkcmF3KHJlbmRlcmVyOiBMaW5rYWdlUmVuZGVyZXIsIG1vdXNlSW5mbzogTW91c2VJbmZvKTogdm9pZCB7XG4gICAgdmFyIHttb3VzZVBvaW50fSA9IG1vdXNlSW5mbztcbiAgICBzdXBlci5kcmF3KHJlbmRlcmVyLCBtb3VzZUluZm8pO1xuICAgIHJlbmRlcmVyLmRyYXdMaW5lcyhbdGhpcy5wb2ludEEsIHRoaXMucG9pbnRCXSwgUFJFVklFV19PUFRJT05TKTtcbiAgICByZW5kZXJlci5kcmF3TGluZXMoW3RoaXMucG9pbnRCLCBtb3VzZVBvaW50XSwgUFJFVklFV19PUFRJT05TKTtcbiAgfVxufVxuXG5jbGFzcyBTdGF0ZTMgZXh0ZW5kcyBQYXVzZWRTdGF0ZSB7IC8vIGdyb3VuZCBkb3duXG4gIGRyYWdnZWQ6ID9ib29sZWFuO1xuXG4gIG9uTW91c2VVcChtb3VzZVBvaW50OiBQb2ludCk6ID9CYXNlU3RhdGUge1xuICAgIHJldHVybiB0aGlzLmRyYWdnZWQgP1xuICAgICAgbmV3IFN0YXRlMCh0aGlzLmxpbmthZ2UpIDpcbiAgICAgIG5ldyBTdGF0ZTQodGhpcy5saW5rYWdlLCB7cDBpZDogdGhpcy5wMGlkfSk7XG4gIH1cblxuICBvbk1vdXNlRHJhZyhtb3VzZVBvaW50OiBQb2ludCk6ID9CYXNlU3RhdGUge1xuICAgIHRoaXMuZHJhZ2dlZCA9IHRydWU7XG4gICAgdGhpcy5saW5rYWdlLnRyeU1vdmluZ0dyb3VuZFBvaW50cyhbe3BvaW50OiBtb3VzZVBvaW50LCBpZDp0aGlzLnAwaWR9XSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBkcmF3KHJlbmRlcmVyOiBMaW5rYWdlUmVuZGVyZXIsIG1vdXNlSW5mbzogTW91c2VJbmZvKTogdm9pZCB7XG4gICAgc3VwZXIuZHJhdyhyZW5kZXJlciwgbW91c2VJbmZvKTtcbiAgICByZW5kZXJlci5kcmF3UG9pbnQodGhpcy5saW5rYWdlLmdldFBvaW50KHRoaXMucDBpZCksIFBSRVZJRVdfT1BUSU9OUyk7XG4gIH1cbn1cblxuY2xhc3MgU3RhdGU0IGV4dGVuZHMgUGF1c2VkU3RhdGUgeyAvLyBwb2ludDFcbiAgY29uc3RydWN0b3IobGlua2FnZTogTGlua2FnZSwgc3BlYzogU3RhdGVTcGVjKSB7XG4gICAgc3VwZXIobGlua2FnZSwgc3BlYyk7XG5cbiAgICBtaXhpblBvaW50VmFsaWRhdGlvbihcbiAgICAgIFt0aGlzLmxpbmthZ2UuZ2V0UG9pbnQodGhpcy5wMGlkKV0sXG4gICAgICBbJ29uQW55UG9pbnRVcCcsICdvbkNhbnZhc1VwJ10sXG4gICAgICB0aGlzXG4gICAgKTtcbiAgfVxuXG4gIG9uQW55UG9pbnRVcChwMWlkOiBzdHJpbmcpOiA/QmFzZVN0YXRlIHtcbiAgICByZXR1cm4gbmV3IFN0YXRlNSh0aGlzLmxpbmthZ2UsIHtwMGlkOiB0aGlzLnAwaWQsIHAxaWR9KVxuICB9XG5cbiAgb25DYW52YXNVcChwb2ludEE6IFBvaW50KTogP0Jhc2VTdGF0ZSB7XG4gICAgcmV0dXJuIG5ldyBTdGF0ZTYodGhpcy5saW5rYWdlLCB7cDBpZDogdGhpcy5wMGlkLCBwb2ludEF9KVxuICB9XG5cbiAgb25LZXlVcChrZXk6IG51bWJlcik6ID9CYXNlU3RhdGUge1xuICAgIHN3aXRjaCAoa2V5KSB7XG4gICAgICBjYXNlIEtFWVMuRDpcbiAgICAgIGNhc2UgS0VZUy5kOlxuICAgICAgICBpZiAodGhpcy5saW5rYWdlLnRyeVJlbW92aW5nUG9pbnQodGhpcy5wMGlkKSkge1xuICAgICAgICAgIHJldHVybiBuZXcgU3RhdGUwKHRoaXMubGlua2FnZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgIGNhc2UgS0VZUy5vOlxuICAgICAgY2FzZSBLRVlTLk86XG4gICAgICAgIGlmICh0aGlzLmxpbmthZ2UuZ2V0UGF0aCh0aGlzLnAwaWQpKSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBTdGF0ZTE1KHRoaXMubGlua2FnZSwge3AwaWQ6IHRoaXMucDBpZH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICBjYXNlIEtFWVMuU1BBQ0U6XG4gICAgICAgIHJldHVybiBuZXcgU3RhdGUxMih0aGlzLmxpbmthZ2UsIHtwMGlkOiB0aGlzLnAwaWR9KTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBzdXBlci5vbktleVVwKGtleSk7XG4gICAgfVxuICB9XG5cbiAgZHJhdyhyZW5kZXJlcjogTGlua2FnZVJlbmRlcmVyLCBtb3VzZUluZm86IE1vdXNlSW5mbyk6IHZvaWQge1xuICAgIHZhciB7bW91c2VQb2ludH0gPSBtb3VzZUluZm87XG4gICAgc3VwZXIuZHJhdyhyZW5kZXJlciwgbW91c2VJbmZvKTtcbiAgICByZW5kZXJlci5kcmF3TGluZXMoXG4gICAgICBbXG4gICAgICAgIHRoaXMubGlua2FnZS5nZXRQb2ludCh0aGlzLnAwaWQpLFxuICAgICAgICBtb3VzZVBvaW50LFxuICAgICAgXSxcbiAgICAgIFBSRVZJRVdfT1BUSU9OU1xuICAgICk7XG4gIH1cbn1cblxuY2xhc3MgU3RhdGU1IGV4dGVuZHMgUGF1c2VkU3RhdGUgeyAvLyBwb2ludDJcbiAgY29uc3RydWN0b3IobGlua2FnZTogTGlua2FnZSwgc3BlYzogU3RhdGVTcGVjKSB7XG4gICAgc3VwZXIobGlua2FnZSwgc3BlYyk7XG5cbiAgICBtaXhpblBvaW50VmFsaWRhdGlvbihcbiAgICAgIFt0aGlzLmxpbmthZ2UuZ2V0UG9pbnQodGhpcy5wMGlkKSwgdGhpcy5saW5rYWdlLmdldFBvaW50KHRoaXMucDFpZCldLFxuICAgICAgWydvbkNhbnZhc1VwJ10sXG4gICAgICB0aGlzXG4gICAgKTtcbiAgfVxuXG4gIG9uQ2FudmFzVXAocG9pbnRBOiBQb2ludCk6ID9CYXNlU3RhdGUge1xuICAgIHRoaXMubGlua2FnZS5hZGRUcmlhbmdsZSh0aGlzLnAwaWQsIHRoaXMucDFpZCwgcG9pbnRBKTtcbiAgICB0aGlzLmxpbmthZ2UuY2FsY3VsYXRlUG9zaXRpb25zKCk7XG4gICAgcmV0dXJuIG5ldyBTdGF0ZTAodGhpcy5saW5rYWdlKTtcbiAgfVxuXG4gIGRyYXcocmVuZGVyZXI6IExpbmthZ2VSZW5kZXJlciwgbW91c2VJbmZvOiBNb3VzZUluZm8pOiB2b2lkIHtcbiAgICB2YXIge21vdXNlUG9pbnR9ID0gbW91c2VJbmZvO1xuICAgIHN1cGVyLmRyYXcocmVuZGVyZXIsIG1vdXNlSW5mbyk7XG4gICAgcmVuZGVyZXIuZHJhd0xpbmVzKFxuICAgICAgW1xuICAgICAgICB0aGlzLmxpbmthZ2UuZ2V0UG9pbnQodGhpcy5wMGlkKSxcbiAgICAgICAgbW91c2VQb2ludCxcbiAgICAgICAgdGhpcy5saW5rYWdlLmdldFBvaW50KHRoaXMucDFpZCksXG4gICAgICBdLFxuICAgICAgUFJFVklFV19PUFRJT05TXG4gICAgKTtcbiAgfVxufVxuXG5jbGFzcyBTdGF0ZTYgZXh0ZW5kcyBQYXVzZWRTdGF0ZSB7IC8vIHBvaW50MSArIGNhbnZhczFcbiAgY29uc3RydWN0b3IobGlua2FnZTogTGlua2FnZSwgc3BlYzogU3RhdGVTcGVjKSB7XG4gICAgc3VwZXIobGlua2FnZSwgc3BlYyk7XG5cbiAgICBtaXhpblBvaW50VmFsaWRhdGlvbihcbiAgICAgIFt0aGlzLnBvaW50QSwgdGhpcy5saW5rYWdlLmdldFBvaW50KHRoaXMucDBpZCldLFxuICAgICAgWydvbkNhbnZhc1VwJywgJ29uQW55UG9pbnRVcCddLFxuICAgICAgdGhpc1xuICAgICk7XG4gIH1cblxuICBvbkNhbnZhc1VwKHBvaW50QjogUG9pbnQpOiA/QmFzZVN0YXRlIHtcbiAgICB0aGlzLmxpbmthZ2UuYWRkR3JvdW5kU2VnbWVudChwb2ludEIsIHRoaXMucG9pbnRBLCB0aGlzLnAwaWQpO1xuICAgIHRoaXMubGlua2FnZS5jYWxjdWxhdGVQb3NpdGlvbnMoKTtcbiAgICByZXR1cm4gbmV3IFN0YXRlMCh0aGlzLmxpbmthZ2UpO1xuICB9XG5cbiAgb25BbnlQb2ludFVwKHAxaWQ6IHN0cmluZyk6ID9CYXNlU3RhdGUge1xuICAgIHRoaXMubGlua2FnZS5hZGRUcmlhbmdsZSh0aGlzLnAwaWQsIHAxaWQsIHRoaXMucG9pbnRBKTtcbiAgICB0aGlzLmxpbmthZ2UuY2FsY3VsYXRlUG9zaXRpb25zKCk7XG4gICAgcmV0dXJuIG5ldyBTdGF0ZTAodGhpcy5saW5rYWdlKTtcbiAgfVxuXG4gIGRyYXcocmVuZGVyZXI6IExpbmthZ2VSZW5kZXJlciwgbW91c2VJbmZvOiBNb3VzZUluZm8pOiB2b2lkIHtcbiAgICB2YXIge21vdXNlUG9pbnR9ID0gbW91c2VJbmZvO1xuICAgIHN1cGVyLmRyYXcocmVuZGVyZXIsIG1vdXNlSW5mbyk7XG4gICAgcmVuZGVyZXIuZHJhd0xpbmVzKFxuICAgICAgW1xuICAgICAgICB0aGlzLmxpbmthZ2UuZ2V0UG9pbnQodGhpcy5wMGlkKSxcbiAgICAgICAgdGhpcy5wb2ludEEsXG4gICAgICAgIG1vdXNlUG9pbnQsXG4gICAgICBdLFxuICAgICAgUFJFVklFV19PUFRJT05TXG4gICAgKTtcbiAgfVxufVxuXG5jbGFzcyBTdGF0ZTcgZXh0ZW5kcyBQYXVzZWRTdGF0ZSB7IC8vIHJvdGFyeSBkb3duXG4gIGRyYWdnZWQ6ID9ib29sZWFuO1xuXG4gIG9uTW91c2VVcChtb3VzZVBvaW50OiBQb2ludCk6ID9CYXNlU3RhdGUge1xuICAgIHJldHVybiB0aGlzLmRyYWdnZWQgP1xuICAgICAgbmV3IFN0YXRlMCh0aGlzLmxpbmthZ2UpIDpcbiAgICAgIG5ldyBTdGF0ZTgodGhpcy5saW5rYWdlLCB7cDBpZDogdGhpcy5wMGlkfSk7XG4gIH1cblxuICBvbk1vdXNlRHJhZyhtb3VzZVBvaW50OiBQb2ludCk6ID9CYXNlU3RhdGUge1xuICAgIHRoaXMuZHJhZ2dlZCA9IHRydWU7XG5cbiAgICB2YXIge3JvdGFyaWVzLCBleHRlbmRlcnMsIGdyb3VuZFBvaW50c30gPSB0aGlzLmxpbmthZ2Uuc3BlYztcblxuICAgIHZhciB7eDogcHJldlgsIHk6IHByZXZZfSA9IGdyb3VuZFBvaW50c1t0aGlzLnAwaWRdO1xuICAgIHZhciByZWZJRCA9IGV4dGVuZGVyc1tyb3Rhcmllc1t0aGlzLnAwaWRdXS5yZWY7XG4gICAgdmFyIHJlZkN1clBvaW50ID0gZ3JvdW5kUG9pbnRzW3JlZklEXTtcbiAgICB2YXIgcmVmTmV4dFBvaW50ID0ge1xuICAgICAgeDogcmVmQ3VyUG9pbnQueCArIG1vdXNlUG9pbnQueCAtIHByZXZYLFxuICAgICAgeTogcmVmQ3VyUG9pbnQueSArIG1vdXNlUG9pbnQueSAtIHByZXZZLFxuICAgIH07XG5cbiAgICB0aGlzLmxpbmthZ2UudHJ5TW92aW5nR3JvdW5kUG9pbnRzKFtcbiAgICAgIHtwb2ludDogbW91c2VQb2ludCwgaWQ6IHRoaXMucDBpZH0sXG4gICAgICB7cG9pbnQ6IHJlZk5leHRQb2ludCwgaWQ6IHJlZklEfSxcbiAgICBdKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZHJhdyhyZW5kZXJlcjogTGlua2FnZVJlbmRlcmVyLCBtb3VzZUluZm86IE1vdXNlSW5mbyk6IHZvaWQge1xuICAgIHN1cGVyLmRyYXcocmVuZGVyZXIsIG1vdXNlSW5mbyk7XG4gICAgdmFyIHAxaWQgPSB0aGlzLmxpbmthZ2Uuc3BlYy5yb3Rhcmllc1t0aGlzLnAwaWRdO1xuICAgIHZhciBwMmlkID0gdGhpcy5saW5rYWdlLnNwZWMuZXh0ZW5kZXJzW3AxaWRdLnJlZjtcbiAgICByZW5kZXJlci5kcmF3TGluZXMoXG4gICAgICBbXG4gICAgICAgIHRoaXMubGlua2FnZS5nZXRQb2ludChwMWlkKSxcbiAgICAgICAgdGhpcy5saW5rYWdlLmdldFBvaW50KHRoaXMucDBpZCksXG4gICAgICAgIHRoaXMubGlua2FnZS5nZXRQb2ludChwMmlkKSxcbiAgICAgIF0sXG4gICAgICBQUkVWSUVXX09QVElPTlNcbiAgICApO1xuICB9XG59XG5cbmNsYXNzIFN0YXRlOCBleHRlbmRzIFN0YXRlMCB7IC8vIHJvdGFyeSBzZWxlY3RlZFxuICBvbktleVVwKGtleTogbnVtYmVyKTogP0Jhc2VTdGF0ZSB7XG4gICAgc3dpdGNoIChrZXkpIHtcbiAgICAgIGNhc2UgS0VZUy5TUEFDRTpcbiAgICAgICAgcmV0dXJuIG5ldyBTdGF0ZTEwKHRoaXMubGlua2FnZSwge3AwaWQ6IHRoaXMucDBpZH0pO1xuICAgICAgY2FzZSBLRVlTLmQ6XG4gICAgICBjYXNlIEtFWVMuRDpcbiAgICAgICAgaWYgKHRoaXMubGlua2FnZS50cnlSZW1vdmluZ1BvaW50KHRoaXMucDBpZCkpIHtcbiAgICAgICAgICByZXR1cm4gbmV3IFN0YXRlMCh0aGlzLmxpbmthZ2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gc3VwZXIub25LZXlVcChrZXkpO1xuICAgIH1cbiAgfVxuXG4gIGRyYXcocmVuZGVyZXI6IExpbmthZ2VSZW5kZXJlciwgbW91c2VJbmZvOiBNb3VzZUluZm8pOiB2b2lkIHtcbiAgICBzdXBlci5kcmF3KHJlbmRlcmVyLCBtb3VzZUluZm8pO1xuICAgIHZhciBwMWlkID0gdGhpcy5saW5rYWdlLnNwZWMucm90YXJpZXNbdGhpcy5wMGlkXTtcbiAgICB2YXIgcDJpZCA9IHRoaXMubGlua2FnZS5zcGVjLmV4dGVuZGVyc1twMWlkXS5yZWY7XG4gICAgcmVuZGVyZXIuZHJhd0xpbmVzKFxuICAgICAgW1xuICAgICAgICB0aGlzLmxpbmthZ2UuZ2V0UG9pbnQocDFpZCksXG4gICAgICAgIHRoaXMubGlua2FnZS5nZXRQb2ludCh0aGlzLnAwaWQpLFxuICAgICAgICB0aGlzLmxpbmthZ2UuZ2V0UG9pbnQocDJpZCksXG4gICAgICBdLFxuICAgICAgUFJFVklFV19PUFRJT05TXG4gICAgKTtcbiAgfVxufVxuXG5jbGFzcyBTdGF0ZTkgZXh0ZW5kcyBQYXVzZWRTdGF0ZSB7IC8vIHNlZ21lbnQgc2VsZWN0ZWRcbiAgY29uc3RydWN0b3IobGlua2FnZTogTGlua2FnZSwgc3BlYzogU3RhdGVTcGVjKSB7XG4gICAgc3VwZXIobGlua2FnZSwgc3BlYyk7XG5cbiAgICBtaXhpblBvaW50VmFsaWRhdGlvbihcbiAgICAgIFt0aGlzLmxpbmthZ2UuZ2V0UG9pbnQodGhpcy5wMGlkKSwgdGhpcy5saW5rYWdlLmdldFBvaW50KHRoaXMucDFpZCldLFxuICAgICAgWydvbkNhbnZhc1VwJ10sXG4gICAgICB0aGlzXG4gICAgKTtcbiAgfVxuXG4gIG9uQ2FudmFzVXAocG9pbnRBOiBQb2ludCk6ID9CYXNlU3RhdGUge1xuICAgIHRoaXMubGlua2FnZS5hZGRUcmlhbmdsZSh0aGlzLnAwaWQsIHRoaXMucDFpZCwgcG9pbnRBKTtcbiAgICB0aGlzLmxpbmthZ2UuY2FsY3VsYXRlUG9zaXRpb25zKCk7XG4gICAgcmV0dXJuIG5ldyBTdGF0ZTAodGhpcy5saW5rYWdlKTtcbiAgfVxuXG4gIG9uS2V5UHJlc3Moa2V5OiBudW1iZXIpOiA/QmFzZVN0YXRlIHtcbiAgICBzd2l0Y2ggKGtleSkge1xuICAgICAgY2FzZSBLRVlTLlM6XG4gICAgICBjYXNlIEtFWVMuczpcbiAgICAgICAgdGhpcy5saW5rYWdlLnRyeUNoYW5naW5nQmFyTGVuZ3RoKC0xLCB0aGlzLnAwaWQsIHRoaXMucDFpZCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgY2FzZSBLRVlTLlc6XG4gICAgICBjYXNlIEtFWVMudzpcbiAgICAgICAgdGhpcy5saW5rYWdlLnRyeUNoYW5naW5nQmFyTGVuZ3RoKDEsIHRoaXMucDBpZCwgdGhpcy5wMWlkKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gc3VwZXIub25LZXlQcmVzcyhrZXkpO1xuICAgIH1cbiAgfVxuXG4gIGRyYXcocmVuZGVyZXI6IExpbmthZ2VSZW5kZXJlciwgbW91c2VJbmZvOiBNb3VzZUluZm8pOiB2b2lkIHtcbiAgICB2YXIge21vdXNlUG9pbnR9ID0gbW91c2VJbmZvO1xuICAgIHN1cGVyLmRyYXcocmVuZGVyZXIsIG1vdXNlSW5mbyk7XG4gICAgcmVuZGVyZXIuZHJhd0xpbmVzKFxuICAgICAgW1xuICAgICAgICBtb3VzZVBvaW50LFxuICAgICAgICB0aGlzLmxpbmthZ2UuZ2V0UG9pbnQodGhpcy5wMGlkKSxcbiAgICAgICAgdGhpcy5saW5rYWdlLmdldFBvaW50KHRoaXMucDFpZCksXG4gICAgICAgIG1vdXNlUG9pbnQsXG4gICAgICBdLFxuICAgICAgUFJFVklFV19PUFRJT05TXG4gICAgKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEJhc2VTdGF0ZTtcbiIsIi8qIEBmbG93ICovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBldWNsaWQgPSByZXF1aXJlKCcuLi9tYXRoL0dlb21ldHJ5VXRpbHMnKS5ldWNsaWQ7XG5cbnZhciBNSU5fU0VHTUVOVF9MRU5HVEggPSAwLjU7XG5cbnR5cGUgUG9pbnQgPSB7XG4gIHg6IG51bWJlcjtcbiAgeTogbnVtYmVyO1xufTtcblxuZnVuY3Rpb24gbWl4aW5Qb2ludFZhbGlkYXRpb24oXG4gIHBvaW50czogQXJyYXk8UG9pbnQ+LFxuICBmdW5jdE5hbWVzOiBBcnJheTxzdHJpbmc+LFxuICB0aGF0OiBhbnlcbikge1xuICB2YXIgaXNQb2ludFZhbGlkID0gZnVuY3Rpb24ocG9pbnQpIHtcbiAgICByZXR1cm4gcG9pbnRzLnJlZHVjZSgoYWNjdW0sIHAyKSA9PiB7XG4gICAgICByZXR1cm4gYWNjdW0gJiYgZXVjbGlkKHBvaW50LCBwMikgPj0gTUlOX1NFR01FTlRfTEVOR1RIO1xuICAgIH0sIHRydWUpO1xuICB9O1xuXG4gIHZhciB2YWxpZGF0ZUZ1bmN0cyA9IHtcbiAgICBvbk1vdXNlRHJhZyhwb2ludDogUG9pbnQpOiBib29sZWFuIHtcbiAgICAgIHJldHVybiBpc1BvaW50VmFsaWQocG9pbnQpO1xuICAgIH0sXG5cbiAgICBvbk1vdXNlVXAocG9pbnQ6IFBvaW50KTogYm9vbGVhbiB7XG4gICAgICByZXR1cm4gaXNQb2ludFZhbGlkKHBvaW50KTtcbiAgICB9LFxuXG4gICAgb25Hcm91bmREb3duKHAwaWQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgICAgcmV0dXJuIGlzUG9pbnRWYWxpZCh0aGlzLmxpbmthZ2UuZ2V0UG9pbnQocDBpZCkpO1xuICAgIH0sXG5cbiAgICBvblJvdGFyeURvd24ocDBpZDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICByZXR1cm4gaXNQb2ludFZhbGlkKHRoaXMubGlua2FnZS5nZXRQb2ludChwMGlkKSk7XG4gICAgfSxcblxuICAgIG9uQW55UG9pbnRVcChwMGlkOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgIHJldHVybiBpc1BvaW50VmFsaWQodGhpcy5saW5rYWdlLmdldFBvaW50KHAwaWQpKTtcbiAgICB9LFxuXG4gICAgb25Qb2ludFVwKHAwaWQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgICAgcmV0dXJuIGlzUG9pbnRWYWxpZCh0aGlzLmxpbmthZ2UuZ2V0UG9pbnQocDBpZCkpO1xuICAgIH0sXG5cbiAgICBvbkNhbnZhc1VwKHBvaW50QTogUG9pbnQpOiBib29sZWFuIHtcbiAgICAgIHJldHVybiBpc1BvaW50VmFsaWQocG9pbnRBKTtcbiAgICB9LFxuICB9O1xuXG4gIC8vIHJlcGxhY2UgZWFjaCBwcm92aWRlZCBtZXRob2QgKGNhbGwgaXQgRikgd2l0aCBuZXcgbWV0aG9kIChjYWxsIGl0IEcpIHRoYXRcbiAgLy8gd3JhcHMgRi4gRyBleGVjdXRlcyB0aGUgdmFsaWRhdGlvbiBmdW5jdGlvbiBmaXJzdCwgYW5kIGlmIHRoZSB2YWxpZGF0aW9uXG4gIC8vIGZ1bmN0aW9uIHJldHVybnMgdHJ1ZSwgRyByZXR1cm5zIHRoZSByZXN1bHQgb2YgY2FsbGluZyBGLiBvdGhlcndpc2UsIGl0XG4gIC8vIHJldHVybnMgdGhlIGNvbnRleHQgb2YgdGhlIG1ldGhvZCAocmVzdWx0aW5nIGluIGEgbm8tb3AgZm9yIHN0YXRlXG4gIC8vIHRyYW5zaXRpb25zKVxuICBmdW5jdE5hbWVzLmZvckVhY2goZnVuY3ROYW1lID0+IHtcbiAgICB2YXIgdmFsaWRhdGVGdW5jdCA9IHZhbGlkYXRlRnVuY3RzW2Z1bmN0TmFtZV07XG4gICAgdmFyIG9yaWdpbmFsRnVuY3QgPSB0aGF0W2Z1bmN0TmFtZV07XG5cbiAgICB0aGF0W2Z1bmN0TmFtZV0gPSBmdW5jdGlvbiguLi5hcmdzKSB7XG4gICAgICAvLyB1c2UgYHRoaXNgIGluc3RlYWQgb2YgYHRoYXRgIGZvciB0aGUgY29udGV4dCBzbyB0aGF0IHRoZSBuZXcgbWV0aG9kXG4gICAgICAvLyBjYW4gYmUgdXNlZCBpbiB3aGF0ZXZlciBjb250ZXh0IGl0J3MgbmVlZCAoZXNwZWNpYWxseSB1c2VmdWwgZm9yXG4gICAgICAvLyBpbmhlcml0YW5jZSlcbiAgICAgIHJldHVybiB2YWxpZGF0ZUZ1bmN0LmFwcGx5KHRoaXMsIGFyZ3MpID9cbiAgICAgICAgb3JpZ2luYWxGdW5jdC5hcHBseSh0aGlzLCBhcmdzKSA6XG4gICAgICAgIHRoaXM7XG4gICAgfTtcbiAgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gbWl4aW5Qb2ludFZhbGlkYXRpb247XG4iXX0=
