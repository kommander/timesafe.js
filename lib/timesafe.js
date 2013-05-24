/**
 * Stashmap
 * Cache objects as key/values wihtin namespaces in memory and let them have a lifetime
 * For simple and fast caching and retrieving.
 */ 
var Stashmap = require('stashmap');
var conflate = require('conflate');

var Timesafe = module.exports = function(options){
  var defaultOptions = {
    // Seconds
    cycleTime: 1800,
    // Seconds, the lower the more accuracte
    cycleAccuracy: 1
  };

  this.options = conflate({}, defaultOptions, options || {});

  // Fix times
  this.options.cycleTime *= 1000;
  this.options.cycleAccuracy *= 1000;

  // Keep items with a ttl
  this._ttlItems = [];
  
  this._slots = new Stashmap();

  // When was the last management cycle?
  this._boundCycle = this._cycle.bind(this);
  this._cycleTimeoutRef = null;
  this._scheduleCycle(Date.now(), this.options.cycleTime);
};

/**
 * A manage cycle
 */
Timesafe.prototype._cycle = function() {
  var now = Date.now();
  var ttlCycleTime = null;
  
  // Sort global items
  this._ttlItems.sort(function(a, b){
    if(a.deathtime < b.deathtime) return -1;
    if(a.deathtime > b.deathtime) return 1;
    return 0;
  });

  // global items
  var length = this._ttlItems.length;
  
  for(var i = 0; i < length; i++){
    var item = this._ttlItems.shift();
    
    if(item){
      if(item.removed !== true){
        ttlCycleTime = item.deathtime - now;
        if(item.deathtime > now && ttlCycleTime > this.options.cycleAccuracy){
          this._ttlItems.unshift(item);
          break;
        } 
        item.slot._remove(item);
      }

      continue;
    }
    break;
  }

  // Set next cycle
  if(ttlCycleTime > 0 && ttlCycleTime < this.options.cycleTime){
    this._scheduleCycle(now, ttlCycleTime);
  } else {
    this._scheduleCycle(now, this.options.cycleTime);
  }
};

/**
 * Schedule next cycle
 */
Timesafe.prototype._scheduleCycle = function(now, time) {
  clearTimeout(this._cycleTimeoutRef);
  this._nextCycle = now + time;
  this._cycleTimeoutRef = setTimeout(this._boundCycle, time);
};

/**
 * Set a key/value pair with options in a certain slot
 */
Timesafe.prototype.set = function(slotName, key, value, options) {
  return this.getSlot(slotName).set(key, value, options);
};

/**
 * Retrieve a value for a key from a slot
 * Optionally allows for "callback style" get
 */
Timesafe.prototype.get = function(slotName, key, cb) {
  return this.getSlot(slotName).get(key, cb);
};

/**
 * Remove a key/value pair from a slot
 */
Timesafe.prototype.remove = function(slotName, key) {
  return this.getSlot(slotName).remove(key);
};

/**
 * Get a list of slots in this cache
 */
Timesafe.prototype.__defineGetter__('slots', function() {
  return this._slots.keys.slice();
});

/**
 * Get a slot object
 */
Timesafe.prototype.getSlot = function(slotName) {
  slotName = Timesafe._makeString(slotName);

  var slot = this._slots.get(slotName);

  if(!slot){
    slot = new Slot({
      name: slotName,
      cache: this
    });
    this._slots.add(slotName, slot);
  }

  return slot;
};

/**
 * Make sure a given value is a string
 */
Timesafe._makeString = function(value){
  if(typeof value !== 'string'){
    value = value.toString();
  }
  return value.trim();
};

/**
 * A Slot
 */
var Slot = Timesafe.Slot = function(options){
  this.name = options.name;
  this.cache = options.cache;

  this._items = new Stashmap();
};

/**
 * Set a key/value pair with options
 */
Slot.prototype.set = function(key, value, options) {
  key = Timesafe._makeString(key);

  options = options || {};

  var item = this._items.get(key);

  // Create a new item if not existent
  if(!item){
    item = {
      slot: this
    };
    this._items.add(key, item);
  }

  // Set the item
  item.value = value;
  item.key = key;

  if(options.ttl){
    item.setAt = Date.now();
    item.ttl = options.ttl * 1000;
    item.deathtime = item.setAt + item.ttl;
    
    this.cache._ttlItems.push(item);

    // Check if items dies before next cycle
    if(item.deathtime < this.cache._nextCycle){
      this.cache._scheduleCycle(item.setAt, item.ttl);
    }
  }

  if(typeof options.onRemove === 'function'){
    item.onRemove = options.onRemove;
  }
};

/**
 * Retrieve a value for a key from a slot
 * Optionally allows for "callback style" get
 */
Slot.prototype.get = function(key, cb) {
  key = Timesafe._makeString(key);

  var item = this._items.get(key);

  if(item){
    cb && cb(item.value);
    return item.value;
  }
  cb && cb(null);
  return null;
};

/**
 * Remove a key/value pair from a slot
 */
Slot.prototype.remove = function(key) {
  key = Timesafe._makeString(key);

  var item = this._items.get(key);

  if(item){
    this._remove(item);

    // Mark as removed to discover in management cycle times array
    item.removed = true;
  }

  return item;
};

Slot.prototype._remove = function(item) {
  if(item.onRemove){
    // Call async
    process.nextTick(item.onRemove.bind(this.cache, this, item.key, item.value));
  }

  this._items.remove(item.key);
};

/**
 * Get the number of items in this slot
 */
Slot.prototype.__defineGetter__('size', function() {
  return this._items.length;
});


