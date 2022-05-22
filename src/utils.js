// Utils
module.exports = (function(){
	let exports = {};

	exports.arrayCombine = (out, array) => {
		for (let i = 0, l = array.length; i < l; i++) {
			out.push(array[i]);
		}
	};

	exports.createScaledImage = function(config) {
		let canvas = document.createElement("canvas");
		canvas.style = "display: none";
		canvas.width = config.image.width * config.scale;
		canvas.height = config.image.height * config.scale;

		let ctx = canvas.getContext("2d");
		ctx.imageSmoothingEnabled = !!config.imageSmoothingEnabled;
		ctx.drawImage(config.image, 0, 0, canvas.width, canvas.height);

		return canvas;
	};

	return exports
})();