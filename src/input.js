var Input = module.exports = function() {
	var exports = {};

	var pointerLocked = false;
	var mouseState = [], currentlyPressedKeys = [];	// probably shouldn't use arrays lots of empty space
	var downMouse = [], upMouse = [];
	var downKeys = [], upKeys = []; // Keys pressed or released this frame
	var canvas;
	var init = exports.init = function(targetCanvas) {
			canvas = targetCanvas;
			canvas.addEventListener("mousemove", handleMouseMove);
			canvas.addEventListener("mousedown", handleMouseDown, true);
			canvas.addEventListener("mouseup", handleMouseUp);

			document.addEventListener('pointerlockchange', (event) => {
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
		canvas.requestPointerLock();
	};

	exports.releasePointerLock = function() {
		document.exitPointerLock();
	};

	var MouseDelta = exports.MouseDelta = [0, 0];
	var MousePosition = exports.MousePosition = [0, 0];

	// TODO: Add signalEndFrame and store keyDown [] and keyUp[] array for
	// querying as well, although the option of just subscribing to the events
	// in game code is also there but need to use DescriptionToKeyCode

	var keyPressed = function(key) {
		if (!isNaN(key) && !key.length) {
			return currentlyPressedKeys[key];
		}
		else if (key) {
			var map = DescriptionToKeyCode[key];
			return (map) ? !!currentlyPressedKeys[map] : false;
		}
		else {
			return false;
		}
	};

	var keyUp = exports.keyUp = function(key) {
		if (!isNaN(key) && !key.length) {
			return upKeys[key];
		}
		else if (key) {
			var map = DescriptionToKeyCode[key];
			return (map) ? !!upKeys[map] : false;
		}
		else {
			return false;
		}
	};

	var keyDown = exports.keyDown = function(key, thisFrame) {
		if (!thisFrame) {
			return keyPressed(key);
		} else {
			if (!isNaN(key) && !key.length) {
				return downKeys[key];
			}
			else if (key) {
				var map = DescriptionToKeyCode[key];
				return (map) ? !!downKeys[map] : false;
			}
			else {
				return false;
			}
		}
	};

	var mousePressed = function(button) {
		if (!isNaN(button) && !button.length) {
			return mouseState[button];
		}
		else if (button) {
			var map = DescriptionToMouseButton[button];
			return (!isNaN(map)) ? mouseState[map] : false;
		}
		else {
			return false;
		}
	}

	var mouseUp = exports.mouseUp = function(button) {
		if (!isNaN(button) && !button.length) {
			return upMouse[button];
		}
		else if (button) {
			var map = DescriptionToMouseButton[button];
			return (!isNaN(map)) ? upMouse[map] : false;
		}
		else {
			return false;
		}
	};

	var mouseDown = exports.mouseDown = function(button, thisFrame) {
		if (!thisFrame) {
			return mousePressed(button);
		} else {
			if (!isNaN(button) && !button.length) {
				return downMouse[button];
			}
			else if (button) {
				var map = DescriptionToMouseButton[button];
				return (!isNaN(map)) ? downMouse[map] : false;
			}
			else {
				return false;
			}
		}
	};

	exports.handleFrameFinished = function() {
		MouseDelta[0] = 0;
		MouseDelta[1] = 0;
		downKeys.length = 0;
		upKeys.length = 0;
		downMouse.length = 0;
		upMouse.length = 0;
	};

	var handleKeyDown = function(event) {
		// keyDown event can get called multiple times after a short delay
		if (!currentlyPressedKeys[event.keyCode]) {
			downKeys[event.keyCode] = true;
		}
		currentlyPressedKeys[event.keyCode] = true;
	};

	var handleKeyUp = function(event) {
		currentlyPressedKeys[event.keyCode] = false;
		upKeys[event.keyCode] = true;
	};

	var handleBlur = function(event) {
		downMouse.length = 0;
		mouseState.length = 0;
		upMouse.length = 0;

		downKeys.length = 0;
		currentlyPressedKeys.length = 0;
		upKeys.length = 0;	// Q: Should we be copying currently pressed Keys as they've kinda been released?
	};

	var handleMouseMove = function(event) {
		MousePosition[0] = event.pageX;
		MousePosition[1] = event.pageY;
		MouseDelta[0] += event.movementX;
		MouseDelta[1] += event.movementY;
	};

	var handleMouseDown = function(event) {
		if (!mouseState[event.button]) {
			downMouse[event.button] = true;
		}
		mouseState[event.button] = true;
		return false;
	};

	var handleMouseUp = function(event) {
		mouseState[event.button] = false;
		upMouse[event.button] = true;
	};

	exports.getMouseViewportX = function() {
		return MousePosition[0] / canvas.clientWidth;
	};

	exports.getMouseViewportY = function() {
		return MousePosition[1] / canvas.clientHeight;
	};

	// TODO: Add Numpad Keys
	// TODO: Deal with shift in map (probably going to need to move to a function from JSON object for this)
	var DescriptionToKeyCode = exports.DescriptionToKeyCode = {
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

	var KeyCodeToDescription = exports.KeyCodeToDescription = {
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

	var MouseButtonToDescription = exports.MouseButtonToDescription = {
		0: "LeftMouseButton",
		1: "MiddleMouseButton",
		2: "RightMouseButton"
	};

	var DescriptionToMouseButton = exports.DescriptionToMouseButton = {
		"LeftMouseButton": 0,
		"MiddleMouseButton": 1,
		"RightMouseButton": 2
	};

	return exports;
}();
