module.exports = (function(){
	let exports = {};

	let parentIndex = i =>  Math.floor(i / 2);
	let leftChildIndex = i => 2 * i;
	let rightChildIndex = i => 2 * i + 1;

	exports.create = () => {
		let heap = {};

		let items = [];
		let priorities = [];
		let count = 0;

		let swap = (i, j) => {
			let item = items[i];
			items[i] = items[j];
			items[j] = item;
			let priority = priorities[i];
			priorities[i] = priorities[j];
			priorities[j] = priority;
		};

		let minChildIndex = (i) => {
			let result = 0;
			if (rightChildIndex(i) >= count) {
				result = leftChildIndex(i);
			} else {
				if (priorities[leftChildIndex(i)] < priorities[rightChildIndex(i)]) {
					result = leftChildIndex(i);
				} else {
					result = rightChildIndex(i);
				}
			}
			return result;
		};

		let selectIndex = (item, priority) => {
			for (let i = 0; i < count; i++) {
				if (items[i] == item && priorities[i] == priority) {
					return i;
				}
			}
			console.error("Unable to find node with priority " + priority + " and item " + item);
			return -1;
		};

		let deleteAtIndex = (index) => {
			if (index < 0 && index >= count) {
				console.error("Can not delete index " + index + " for heap count " + count);
				return;
			}

			if (count == 1) {
				count--;
				return;
			}

			count--;
			let i = index;
			items[index] = items[count];
			priorities[index] = priorities[count];
			let priority = priorities[index];
			while (leftChildIndex(i) < count || rightChildIndex(i) < count) {
				let minChildIdx = minChildIndex(i);
				if (priority <= priorities[minChildIdx]) {
					break;
				}
				swap(i, minChildIdx);
				i = minChildIdx;
			}
		};

		heap.insert = (item, priority) => {
			let i = count;
			items[i] = item;
			priorities[i] = priority;
			count++;
			while (i > 0 && priorities[parentIndex(i)] > priorities[i]) {
				swap(i, parentIndex(i));
				i = parentIndex(i);
			}
		};
		heap.extractMin = () => {
			let min = null;
			if (count > 0) {
				min = items[0];
				deleteAtIndex(0);
			}
			return min;
		};
		heap.delete = (item, priority) => {
			let idx = selectIndex(item, priority);
			if (idx >= 0) {
				deleteAtIndex(idx);
			}
		};
		heap.clear = () => {
			count = 0;
			items.length = 0;
			priorities.length = 0;
		};
		heap.count = () => count;

		return heap;
	};

	return exports;
})();