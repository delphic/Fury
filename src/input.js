const Maths = require('./maths');

module.exports = (function() {
	let exports = {};

	let pointerLocked = false;
	let mouseState = [], currentlyPressedKeys = [];	// probably shouldn't use arrays lots of empty space
	let downMouse = [], upMouse = [];
	let downMouseTimes = [], upMouseTimes = [];
	let downKeys = [], upKeys = []; // Keys pressed or released this frame
	let downKeyTimes = [], upKeyTimes = []; // Time key was last pressed or released
	let canvas;

	let defaultTime = Date.now(); // Just return start of program rather than start of epoch if keys never pressed

	exports.init = function(targetCanvas) {
			canvas = targetCanvas;
			canvas.addEventListener("mousemove", handleMouseMove);
			canvas.addEventListener("mousedown", handleMouseDown, true);
			canvas.addEventListener("mouseup", handleMouseUp);
			canvas.addEventListener("wheel", handleMouseWheel);

			document.addEventListener('pointerlockchange', () => {
				pointerLocked = !!(document.pointerLockElement || document.mozPointerLockElement); // polyfill
			});
			canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock; // polyfill

			window.addEventListener("keyup", handleKeyUp);
			window.addEventListener("keydown", handleKeyDown);
			window.addEventListener("blur", handleBlur);
	};

	exports.isPointerLocked = function() {
		return pointerLocked;
	};

	exports.requestPointerLock = function() {
		return canvas.requestPointerLock();
	};

	exports.releasePointerLock = function() {
		document.exitPointerLock();
	};

	let MouseDelta = exports.MouseDelta = [0, 0];
	let MousePosition = exports.MousePosition = [0, 0];
	let MouseWheel = exports.MouseWheel = [0, 0, 0];

	let keyPressed = function(key) {
		if (!isNaN(key) && !key.length) {
			return currentlyPressedKeys[key];
		}
		else if (key) {
			let map = DescriptionToKeyCode[key];
			return (map) ? !!currentlyPressedKeys[map] : false;
		}
		else {
			return false;
		}
	};

	exports.keyUp = function(key) {
		if (!isNaN(key) && !key.length) {
			return upKeys[key];
		}
		else if (key) {
			let map = DescriptionToKeyCode[key];
			return (map) ? !!upKeys[map] : false;
		}
		else {
			return false;
		}
	};

	exports.keyDown = function(key, thisFrame) {
		if (!thisFrame) {
			return keyPressed(key);
		} else {
			if (!isNaN(key) && !key.length) {
				return downKeys[key];
			}
			else if (key) {
				let map = DescriptionToKeyCode[key];
				return (map) ? !!downKeys[map] : false;
			}
			else {
				return false;
			}
		}
	};

	let keyDownTime = exports.keyDownTime = function(key) {
		if (!isNaN(key) && !key.length) {
			return downKeyTimes[key];
		} else if (key) {
			let map = DescriptionToKeyCode[key];
			return map ? downKeyTimes[map] : defaultTime;
		} else {
			return defaultTime;
		}
	}

	exports.keyUpTime = function(key) {
		if (!isNaN(key) && !key.length) {
			return upKeyTimes[key];
		} else if (key) {
			let map = DescriptionToKeyCode[key];
			return map ? upKeyTimes[map] : defaultTime;
		} else {
			return defaultTime;
		}
	}

	exports.getAxis = function(plusKey, minusKey) {
		let result = 0;
		if (keyPressed(plusKey)) {
			result += 1;
		} 
		if (keyPressed(minusKey)) {
			result -= 1;
		}
		return result;
	};

	let mousePressed = function(button) {
		if (!isNaN(button) && !button.length) {
			return mouseState[button];
		} else if (button) {
			let map = DescriptionToMouseButton[button];
			return (!isNaN(map)) ? mouseState[map] : false;
		} else {
			return false;
		}
	}

	exports.mouseUp = function(button) {
		if (!isNaN(button) && !button.length) {
			return upMouse[button];
		} else if (button) {
			let map = DescriptionToMouseButton[button];
			return (!isNaN(map)) ? upMouse[map] : false;
		} else {
			return false;
		}
	};

	exports.mouseDown = function(button, thisFrame) {
		if (!thisFrame) {
			return mousePressed(button);
		} else {
			if (!isNaN(button) && !button.length) {
				return downMouse[button];
			} else if (button) {
				let map = DescriptionToMouseButton[button];
				return (!isNaN(map)) ? downMouse[map] : false;
			} else {
				return false;
			}
		}
	};

	exports.handleFrameFinished = function() {
		MouseDelta[0] = MouseDelta[1] = 0;
		MouseWheel[0] = MouseWheel[1] = MouseWheel[2] = 0;
		downKeys.length = 0;
		upKeys.length = 0;
		downMouse.length = 0;
		upMouse.length = 0;
	};

	let handleKeyDown = function(event) {
		// keyDown event can get called multiple times after a short delay
		if (!currentlyPressedKeys[event.keyCode]) {
			downKeys[event.keyCode] = true;
			downKeyTimes[event.keyCode] = Date.now();
		}
		currentlyPressedKeys[event.keyCode] = true;
	};

	let handleKeyUp = function(event) {
		currentlyPressedKeys[event.keyCode] = false;
		upKeyTimes[event.keyCode] = Date.now();
		upKeys[event.keyCode] = true;
	};

	let handleBlur = function() {
		downMouse.length = 0;
		mouseState.length = 0;
		upMouse.length = 0;

		downKeys.length = 0;
		currentlyPressedKeys.length = 0;
		upKeys.length = 0;	// Q: Should we be copying currently pressed Keys as they've kinda been released?
	};

	let handleMouseMove = function(event) {
		MousePosition[0] = event.pageX;
		MousePosition[1] = event.pageY;
		MouseDelta[0] += event.movementX;
		MouseDelta[1] += event.movementY;
	};

	let handleMouseDown = function(event) {
		if (!mouseState[event.button]) {
			downMouse[event.button] = true;
			downMouseTimes[event.button] = Date.now();
		}
		mouseState[event.button] = true;
		return false;
	};

	let handleMouseUp = function(event) {
		mouseState[event.button] = false;
		upMouseTimes[event.button] = Date.now();
		upMouse[event.button] = true;
	};

	let handleMouseWheel = function(event) {
		MouseWheel[0] += event.deltaX;
		MouseWheel[1] += event.deltaY;
		MouseWheel[2] += event.deltaZ;
		// Note event.deltaMode determines if values are pixels, lines or pages, assumed pixels here
	};

	exports.getMouseViewportX = function() {
		return MousePosition[0] / canvas.clientWidth;
	};

	exports.getMouseViewportY = function() {
		return MousePosition[1] / canvas.clientHeight;
	};

	// TODO: Add Numpad Keys
	// TODO: Deal with shift in map (probably going to need to move to a function from JSON object for this)
	let DescriptionToKeyCode = exports.DescriptionToKeyCode = {
		"a": 65,
		"b": 66,
		"c": 67,
		"d": 68,
		"e": 69,
		"f": 70,
		"g": 71,
		"h": 72,
		"i": 73,
		"j": 74,
		"k": 75,
		"l": 76,
		"m": 77,
		"n": 78,
		"o": 79,
		"p": 80,
		"q": 81,
		"r": 82,
		"s": 83,
		"t": 84,
		"u": 85,
		"v": 86,
		"w": 87,
		"x": 88,
		"y": 89,
		"z": 90,
		"Backspace": 8,
		"Tab": 9,
		"Enter": 13,
		"Shift": 16,
		"Ctrl": 17,
		"Alt": 18,
		"PauseBreak": 19,
		"Caps": 20,
		"Esc": 27,
		"Space": 32,
		"PageUp": 33,
		"PageDown": 34,
		"End": 35,
		"Home": 36,
		"Left": 37,
		"Up": 38,
		"Right": 39,
		"Down": 40,
		"Insert": 45,
		"Delete": 46,
		"0": 48,
		"1": 49,
		"2": 50,
		"3": 51,
		"4": 52,
		"5": 53,
		"6": 54,
		"7": 55,
		"8": 56,
		"9": 57,
		";": 59,
		"=": 61,
		"-": 189,
		",": 188,
		".": 190,
		"/": 191,
		"|": 220,
		"[": 219,
		"]": 221,
		"`": 223,
		"'": 192,
		"#": 222
	};

	exports.KeyCodeToDescription = {
		65: "a",
		66: "b",
		67: "c",
		68: "d",
		69: "e",
		70: "f",
		71: "g",
		72: "h",
		73: "i",
		74: "j",
		75: "k",
		76: "l",
		77: "m",
		78: "n",
		79: "o",
		80: "p",
		81: "q",
		82: "r",
		83: "s",
		84: "t",
		85: "u",
		86: "v",
		87: "w",
		88: "x",
		89: "y",
		90: "z",
		8: "Backspace",
		9: "Tab",
		13: "Enter",
		16: "Shift",
		17: "Ctrl",
		18: "Alt",
		19: "PauseBreak",
		20: "Caps",
		27: "Esc",
		32: "Space",
		33: "PageUp",
		34: "PageDown",
		35: "End",
		36: "Home",
		37: "Left",
		38: "Up",
		39: "Right",
		40: "Down",
		45: "Insert",
		46: "Delete",
		48: "0",
		49: "1",
		50: "2",
		51: "3",
		52: "4",
		53: "5",
		54: "6",
		55: "7",
		56: "8",
		57: "9",
		59: ";",
		61: "=",
		189: "-",
		188: ",",
		190: ".",
		191: "/",
		220: "|",
		219: "[",
		221: "]",
		223: "`",
		192: "'",
		222: "#"
	};

	exports.MouseButtonToDescription = {
		0: "LeftMouseButton",
		1: "MiddleMouseButton",
		2: "RightMouseButton"
	};

	let DescriptionToMouseButton = exports.DescriptionToMouseButton = {
		"LeftMouseButton": 0,
		"MiddleMouseButton": 1,
		"RightMouseButton": 2
	};

	return exports;
})();