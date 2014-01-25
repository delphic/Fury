var Input = module.exports = function() {
	var exports = {};
	var mouseState = [], currentlyPressedKeys = [];
	var init = exports.init = function(canvas) {
			canvas.addEventListener("mousemove", handleMouseMove);
			canvas.addEventListener("mousedown", handleMouseDown, true);
			canvas.addEventListener("mouseup", handleMouseUp);
			document.addEventListener("keyup", handleKeyUp);
			document.addEventListener("keydown", handleKeyDown);
	};

	var MousePosition = exports.MousePosition = [0, 0];

	var keyDown = exports.keyDown = function(key) {
		if (!isNaN(key) && !key.length) {
			return currentlyPressedKeys[key];
		}
		else if (key) {
			var map = DescriptionToKeyCode[key];
			return (map) ? currentlyPressedKeys[map] : false;
		}
		else {
			return false;
		}
	};

	var mouseDown = exports.mouseDown = function(button) {
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
	};

	var handleKeyDown = function(event) {
		currentlyPressedKeys[event.keyCode] = true;
	};

	var handleKeyUp = function(event) {
		currentlyPressedKeys[event.keyCode] = false;
	};

	var handleMouseMove = function(event) {
		MousePosition[0] = event.pageX;
		MousePosition[1] = event.pageY;
	};

	var handleMouseDown = function(event) {
		mouseState[event.button] = true; 
		return false;
	};

	var handleMouseUp = function(event) {
		mouseState[event.button] = false;
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