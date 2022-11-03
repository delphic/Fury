const Input = require('./input');

module.exports = (function() {
	let gameTime = 0; // Time in seconds that the game loop thinks it's run (i.e. accounting for clamps, pauses / focus loss)
	let exports = {
		get time() { return gameTime; },
	};

	let State = {
		Paused: 0,
		Running: 1,
		RequestPause: 2
	};

	let state = State.Paused;
	let stopCount = 0;

	let maxFrameTimeMs = null;
	let loopDelegate = null;

	let lastTime = 0;

	exports.timeScale = 1;

	exports.init = function({ loop, maxFrameTimeMs: maxMs }) {
		if (maxMs && typeof(maxMs) === 'number') {
			// Optional max frame time to keep physics calculations sane
			maxFrameTimeMs = maxMs;
		}

		if (loop && typeof(loop) === 'function') {
			loopDelegate = loop;
		} else {
			console.error("You must provide GameLoop.init with a loop parameter of type function");
		}

		if (loopDelegate) {
			window.addEventListener('blur', onWindowBlur);
			window.addEventListener('focus', onWindowFocus);	
		}
	};

	exports.start = function() {
		stopCount = Math.max(0, stopCount - 1);
		if (stopCount == 0) {
			switch (state) {
				case State.Paused:
					state = State.Running;
					lastTime = Date.now();
					Input.handleFrameFinished(); // clear any input that happened since pause
					window.requestAnimationFrame(loop);
					break;
				case State.RequestPause:
					state = State.Running;
					break;
			}
		}
	};

	exports.stop = function() {
		stopCount += 1;
		if (state != State.Paused) {
			state = State.RequestPause;
		}
	};

	exports.isRunning = function() {
		return state === State.Running;
	};
	
	let onWindowBlur = function() {
		exports.stop();
	}; 
	let onWindowFocus = function() {
		exports.start();
	};

	let loop = function() {
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

		elapsed *= exports.timeScale;
		if (maxFrameTimeMs && elapsed > maxFrameTimeMs) {
			elapsed = maxFrameTimeMs;
			// Arguably could run multiple logic updates,
			// however that would require tracking window focus 
			// and ensuring update length < maxFrameTime
		}

		elapsed /= 1000; // Convert elapsed to seconds
		gameTime += elapsed;

		try {
			loopDelegate(elapsed);
		} catch (error) {
			console.error(error);
		}
		
		Input.handleFrameFinished();
		window.requestAnimationFrame(loop);
	};

	return exports;
})();