let Input = require('./input');

let GameLoop = module.exports = (function() {
	let exports = {};

	let State = {
		Paused: 0,
		Running: 1,
		RequestPause: 2
	};

	let state = State.Paused;

	let maxFrameTimeMs = null;
	let loopDelegate = null;

	let lastTime = 0;

	exports.init = (parameters) => {
		if (parameters.maxFrameTimeMs && typeof(parameters.maxFrameTimeMs) === 'number') {
			// Optional max frame time to keep physics calculations sane
			maxFrameTimeMs = parameters.maxFrameTimeMs;
		}

		if (parameters.loop && typeof(parameters.loop) === 'function') {
			loopDelegate = parameters.loop;
		} else {
			console.error("You must provide GameLoop.init with a loop parameter of type function");
		}

		if (loopDelegate) {
			window.addEventListener('blur', onWindowBlur);
			window.addEventListener('focus', onWindowFocus);	
		}
	};

	exports.start = () => {
		switch (state) {
			case State.Paused:
				state = State.Running;
				window.requestAnimationFrame(loop);
				break;
			case State.RequestPause:
				state = State.Running;
				break;
		}
	};

	exports.stop = () => {
		if (state != State.Paused) {
			state = State.RequestPause;
		}
	};
	
	let onWindowBlur = (event) => {
		exports.stop();
	}; 
	let onWindowFocus = (event) => {
		exports.start();
	};

	let loop = () => {
		if (state == State.RequestPause) {
			state = State.Paused;
			return;
		}

		let elapsed = Date.now() - lastTime;
		lastTime += elapsed;

		if (elapsed == 0) {
			console.warn("elapsed time of 0, skipping frame");
			requestAnimationFrame(loop);
			return;
		}

		if (maxFrameTimeMs && elapsed > maxFrameTimeMs) {
			elapsed = maxFrameTimeMs;
			// Arguably could run multiple logic updates,
			// however that would require tracking window focus 
			// and ensuring update length < maxFrameTime
		}

		elapsed /= 1000; // Convert elapsed to seconds

		loopDelegate(elapsed);

		Input.handleFrameFinished();
		window.requestAnimationFrame(loop);
	};

	return exports;
})();