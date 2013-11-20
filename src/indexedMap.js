var IndexedMap = module.exports = function(){
	// This creates a dictionary that provides its own keys
	// It also contains an array of keys for quick enumeration
	// This does of course slow removal, so this structure should
	// be used for arrays where you want to enumerate a lot and 
	// also want references that do not go out of date when 
	// you remove an item (which is hopefully rarely).
	var exports = {};
	var nextKey = 1;

	var prototype = {
		add: function(item) {
			var key = (nextKey++).toString(); 
			this[key] = item;
			this.keys.push(key);
			return key; 
		},
		remove: function(key) {
			if(key != "keys" && this.hasOwnProperty(key)) {
				delete this.key;
				for(var i = 0, l = this.keys.length; i++) {
					if(this.keys[i] == key) {
						this.keys.splice(key,1);
					}
				}
			}
		}
	};

	var create = exports.create = function() {
		var map = Object.create(prototype);
		map.keys = [];
		return map;
	};

	return exports;
}();