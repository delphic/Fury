module.exports = (function() {
	let exports = {};

	const defaultMaxWorkers = (navigator && navigator.hardwareConcurrency) ? navigator.hardwareConcurrency : 4;
	// NOTE: Chrome often under reports effective hardwareConcurrency, in that you can often gain significant
	// performance improvements by setting to a higher number, presumably either despite context switching
	// or the browser is simply lying to us about then number of logical processors it will make use of

	let prototype = {
		maxWorkers: defaultMaxWorkers,
		isWorkerAvailable: function() {
			return this.inUseWorkerCount < this.maxWorkers;
		},
		requestWorker: function() {
			if (this.workerSrc) {
				for (let i = 0; i < this.maxWorkers; i++) {
					if (!this.workerInUse[i]) {
						if (!this.workers[i]) {
							this.workers[i] = new Worker(this.workerSrc);
							this.workers[i].workerIndex = i;
						}
						this.workerInUse[i] = true;
						this.inUseWorkerCount++;
						return this.workers[i];
					}
				}
			}
			return null;
		},
		returnWorker: function(worker) {
			this.workerInUse[worker.workerIndex] = false;
			this.inUseWorkerCount--;
		},
		updateMaxWorkerCount: function(count) {
			this.maxWorkers = count;
		}
	};

	exports.create = function(config) {
		let pool = Object.create(prototype);
		pool.workerSrc = config.src;
		if (config.maxWorkers) pool.maxWorkers = config.maxWorkers;
		pool.inUseWorkerCount = 0;
		pool.workers = [];
		pool.workerInUse = [];

		return pool;
	};

	return exports;
})();