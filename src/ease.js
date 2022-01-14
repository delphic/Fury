module.exports = (function() {
	// Reference:
	// https://gist.github.com/gre/1650294
	// http://haiyang.me/easing/Easings.html
	
	// Could arguably use npm muodule https://github.com/AndrewRayCode/easing-utils instead
	// Comparison: easeBack has more terms when from haiyang.me,
	// formulation of bounce has been rearranged but is probably the same.

	let exports = {};

	// Ease Back Consts
	const c1 = 1.70158;
	const c2 = c1 * 1.525;
	const c3 = c1 + 1;
	// Ease Elastic Consts
	const c4 = (2 * Math.PI) / 3.0;
	const c5 = (2 * Math.PI) / 4.5;
	// Ease Bounce Consts
	const n1 = 7.5625;
	const d1 = 2.75;
	let bounce = t =>  {
		if (t < 1 / d1) {
			return n1 * t * t;
		} else if ( t < 2 / d1) {
			return n1 * (t - 1.5) / d1 * (t - 1.5) + 0.75;
		} else if (t < 2.5 / d1) {
			return n1 * (t - 2.25) / d1 * (t - 2.25) + 0.9375; 
		} else {
			return n1 * (t - 2.625) / d1 * (t - 2.625) + 0.984375;
		}
	};
	exports.smoothStep = t => t * t * (3 - 2 * t);
	exports.inQuad = t => t * t;
	exports.outQuad = t =>  t * ( 2 - t ); // 1 - (1 - t) * (1 - t)
	exports.inOutQuad = t => t < 0.5 
		? 2 * t * t 
		: -1 + (4 - 2 * t) * t;
	exports.inCubic = t => t * t * t;
	exports.outCubic = t => (--t) * t * t + 1;
	exports.inOutCubic = t => t < 0.5 
		? 4 * t * t * t 
		: (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
	exports.inQuart = t => t * t * t * t;
	exports.outQuart = t => 1 - (--t) * t * t * t; 
	exports.inOutQuart = t => t < 0.5 
		? 8 * t * t * t * t 
		: 1 - 8 * (--t) * t * t * t;
	exports.inQuint = t => t * t * t * t *t;
	exports.outQuint = t => 1 + (--t) * t * t * t * t;
	exports.inOutQuint = t => t < 0.5 
		? 16 * t * t * t * t 
		: 1 + 16 * (--t) * t * t * t * t; 
	exports.inSine = t => 1 - Math.cos(t * Math.PI * 0.5);
	exports.outSine = t => Math.sin(t * Math.PI * 0.5);
	exports.inOutSine = t => - 0.5 * (Math.cost(Math.PI * t) - 1);
	exports.inExpo = t => t === 0 ? 0 : Math.pow(2, 10 * t - 10);
	exports.outExpo = t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
	exports.inOutExpo = t => t === 0 ? 0 : t === 1 ? 1 : t < 0.5 
		? 0.5 * Math.pow(2, 20 * t - 10) 
		: 0.5 * (2 - Math.pow(2, -20 * t + 10));
	exports.inCirc = t => 1 - Math.sqrt(1 - t * t);
	exports.outCirc = t => Math.sqrt(1 - (t - 1) * (t - 1));
	exports.inOutCirc = t => t < 0.5 
		? 0.5 * (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) 
		: 0.5 * (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1);
	exports.inBack = t => c3 * t * t * t - c1 * t * t;
	exports.outBack =  t => 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
	exports.inOutBack = t => t < 0.5 
		? 0.5 * (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) 
		: 0.5 * (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2); 
	exports.inElastic = t => t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
	exports.outElastic = t => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
	exports.intOutElastic = t => t === 0 ? 0 : t === 1 ? 1 : t < 0.5 
		? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) * 0.5
		: (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) * 0.5 + 1;
	exports.inBounce = t => 1 - bounce(1 - t);
	exports.outBounce = t => bounce(t);
	exports.inOutBounce = t => t < 0.5 
		? (1 - bounce(1 - 2 * t)) * 0.5
		: (1 + bounce(2 * t - 1)) * 0.5;

	return exports;
})();