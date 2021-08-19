var IndexedMap = module.exports = function(){
	// This creates a dictionary that provides its own keys
	// It also contains an array of keys for quick enumeration
	// This does of course slow removal, so this structure should
	// be used for arrays where you want to enumerate a lot and 
	// also want references that do not go out of date when 
	// you remove an item (which is hopefully rarely).

	// Please note, again for purposes of speed and ease of use 
	// this structure adds the key of the item to the id property on items added
	// this eases checking for duplicates and if you have the only reference
	// you can still remove it from the list or check if it is in the list. 
	var exports = {};
	var nextKey = 1;
	// Not entirely sure why we're reusing keys across all indexed maps 
	// but I don't think it does any harm :shrug:

	var prototype = {
		add: function(item) {
			if (!item.id || !this[item.id]) {
				var key = (nextKey++).toString();
				item.id = key;
				this[key] = item;
				this.keys.push(key);
			}
			return item.id;
		},
		remove: function(key) {
			if(key != "keys" && this.hasOwnProperty(key)) {
				this[key].id = null;
				if(delete this[key]) {
					for(var i = 0, l = this.keys.length; i < l; i++) {
						if(this.keys[i] == key) {
							this.keys.splice(i,1);
						}
					}
					return true;
				}
			}
			return false;
		},
		clear: function() {
			for(var i = 0, l = this.keys.length; i < l; i++) {
				delete this[this.keys[i]];
			}
			this.keys.length = 0;
		}
	};

	var create = exports.create = function() {
		// TODO: Option to specify property name to use for id, defaulting to "id"
		var map = Object.create(prototype);
		map.keys = [];
		return map;
	};

	return exports;
}();