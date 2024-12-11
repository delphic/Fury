module.exports = (function(){
	// Seedable Random

	// Hasing function (to generate good seed) and generators taken from
	// https://github.com/bryc/code/blob/master/jshash/PRNGs.md
	function xmur3(str) {
		for(var i = 0, h = 1779033703 ^ str.length; i < str.length; i++) {
			h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
			h = h << 13 | h >>> 19;
		} return function() {
			h = Math.imul(h ^ (h >>> 16), 2246822507);
			h = Math.imul(h ^ (h >>> 13), 3266489909);
			return (h ^= h >>> 16) >>> 0;
		}
	}
	
	// 128-bit state - fast
	function sfc32(a, b, c, d) {
		return function() {
			a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; 
			let t = (a + b) | 0;
			a = b ^ b >>> 9;
			b = c + (c << 3) | 0;
			c = (c << 21 | c >>> 11);
			d = d + 1 | 0;
			t = t + d | 0;
			c = c + t | 0;
			return (t >>> 0) / 4294967296;
		}
	}

	// 32-bit state - faster
	function mulberry32(a) {
		return function() {
			let t = a += 0x6D2B79F5;
			t = Math.imul(t ^ t >>> 15, t | 1);
			t ^= t + Math.imul(t ^ t >>> 7, t | 61);
			return ((t ^ t >>> 14) >>> 0) / 4294967296;
		}
	}

	let seed = null;
	let rand = Math.random;

	exports.generateSeed = function(length) {
		// Generates random seed string from easy to copy chars
		let r = rand;
		rand = Math.random;
		if (length === undefined) {
			length = 8;
		}
		let seedChars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
		let seedStr = "";
		for (let i = 0; i < length; i++) {
			seedStr += seedChars[exports.integer(0, seedChars.length)];
		}
		rand = r;
		return seedStr;
	};

	exports.setSeed = function(seed, use128) {
		seed = xmur3("" + seed);
		if (use128) {
			rand = sfc32(seed(), seed(), seed(), seed());
		} else {
			rand = mulberry32(seed());
		}
	};

	exports.value = function() {
		return rand();
	};

	exports.range = function(min, max) {
		return min + rand() * (max - min);
	};

	exports.integer = function(min, max) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(min +  rand() * (max - min));
	};

	exports.roll = function(min, max) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(min + rand() * (max - min + 1));
	};

	exports.pointInCircle = (out, radius = 1) => {
		let r = radius * Math.sqrt(rand());
		let theta = rand() * 2 * Math.PI;
		out[0] = r * Math.cos(theta);
		out[1] = r * Math.sin(theta);
	};

	exports.pointOnCircle = (out, radius = 1) => {
		let theta = rand() * 2 * Math.PI;
		out[0] = radius * Math.cos(theta);
		out[1] = radius * Math.sin(theta);
	};

	return exports;
})();