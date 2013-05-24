/**
 * Tests
 */
var expect = require('expect.js');
var sinon = require('sinon');
var Timesafe = require('../');

describe('Timesafe', function(){

  //
  //
  describe('.set(slotName, key, value, options)', function(){

    //
    //
    it('Should add an object to the cache', function(){
      var memCache = new Timesafe();
      memCache.set('a_slot', 'a_key', { a: 'value'});
      var value = memCache.get('a_slot', 'a_key');

      expect(value).to.be.an('object');
      expect(value).to.have.property('a', 'value');
    });

    //
    //
    it('Should create a slot if it did not exist yet', function(){
      var memCache = new Timesafe();
      memCache.set('a_slot', 'a_key', { a: 'value'});
      var slot = memCache.getSlot('a_slot');

      expect(slot).to.be.an('object');
      expect(slot).to.have.property('size', 1);
    });

    //
    //
    it('Should call a callback if provided, when the added object times out', function(done){
      var memCache = new Timesafe({
        cycleAccuracy: 0.001
      });
      memCache.set('a_slot', 'a_key', { a: 'value'}, { 
        ttl: 0.01,
        onRemove: function(slot, key, value){
          expect(slot).to.be.an('object');
          expect(slot).to.have.property('size', 0);  
          expect(key).to.be.a('string');
          expect(value).to.be.an('object');
          expect(value).to.have.property('a', 'value');

          done();
        }
      });
    });

    //
    //
    it('Should not remove items without a ttl on manage cycle', function(done){
      var memCache = new Timesafe({
        cycleAccuracy: 0.001,
        cycleTime: 0.01
      });

      var callback = sinon.spy(function(slot, key, value){});

      memCache.set('a_slot', 'a_key', { a: 'value'}, { 
        onRemove: callback
      });

      // After the manage cycle ran, the remove callback should not have been called
      setTimeout(function(){
        expect(callback.callCount).to.be(0);
        done();
      }, 20);
    });

    //
    // 
    it('Should overwrite an existing key/value pair, reusing its options');

    //
    //
    it('Should handle unfrequent lifetimes for items', function(done){
      var memCache = new Timesafe({
        cycleAccuracy: 0.001
      });

      var callback = sinon.spy(function(slot, key, value){
        expect(slot).to.be.an('object');
        expect(key).to.be.a('string');
        expect(value).to.be.an('object');
        
        if(callback.callCount == 3){
          done();
        }
      });

      memCache.set('a_slot', 'a_key', { a: 'value'}, { 
        ttl: 0.01,
        onRemove: callback
      });

      memCache.set('b_slot', 'b_key', { a: 'value'}, { 
        ttl: 0.03,
        onRemove: callback
      });

      memCache.set('a_slot', 'c_key', { a: 'value'}, { 
        ttl: 0.05,
        onRemove: callback
      });
    });

  });

  //
  //
  describe('.touch(slotName, key)', function(){
    //
    //
    it('Should reset the key/value pair timeout');
  });

  //
  //
  describe('#get', function(){
    //
    //
    it('Should get an element from a slot', function(){
      var memCache = new Timesafe();
      memCache.set('a_slot', 'a_key', { a: 'value'});
      var value = memCache.get('a_slot', 'a_key');

      expect(value).to.be.an('object');
      expect(value).to.have.property('a', 'value');
    });

    //
    //
    it('Should get an element from a slot with callback', function(done){
      var memCache = new Timesafe();
      memCache.set('a_slot', 'a_key', { a: 'value'});
      memCache.get('a_slot', 'a_key', function(value){
        expect(value).to.be.an('object');
        expect(value).to.have.property('a', 'value');
        done();
      });
    });

    //
    //
    it('Should return null if the element does not exist', function(){
      var memCache = new Timesafe();
      var value = memCache.get('a_slot', 'a_key');

      expect(value).to.be(null);
    });
  });

  //
  //
  describe('#remove', function(){
    //
    //
    it('Should remove a key/value pair from a slot', function(){
      var memCache = new Timesafe();
      memCache.set('a_slot', 'a_key', { a: 'value'});
      var value = memCache.get('a_slot', 'a_key');

      expect(value).to.be.an('object');
      expect(value).to.have.property('a', 'value');

      memCache.remove('a_slot', 'a_key');

      value = memCache.get('a_slot', 'a_key');

      // Removed?
      expect(value).to.not.be.ok();
    });

    //
    //
    it('Should call the removal callback if given', function(done){
      var memCache = new Timesafe();
      memCache.set('a_slot', 'a_key', { a: 'value'}, { 
        onRemove: function(slot, key, value){
          expect(slot).to.be.an('object');
          expect(slot).to.have.property('size', 0);  
          expect(key).to.be.a('string');
          expect(value).to.be.an('object');
          expect(value).to.have.property('a', 'value');

          done();
        }
      });
      memCache.remove('a_slot', 'a_key');
    });

  });

  //
  //
  describe('#slots', function(){
    //
    //
    it('Should return a list of slots, registered in the cache instance', function(){
      var memCache = new Timesafe();
      memCache.getSlot('one');
      memCache.getSlot('two');

      expect(memCache.slots).to.be.an('object');
      expect(memCache.slots).to.have.property('length', 2);
    });

  });

  //
  //
  describe('#getSlot()', function(){
    //
    //
    it('Should create a slot if not yet existent', function(){
      var memCache = new Timesafe();
      memCache.getSlot('one');

      expect(memCache.slots).to.be.an('object');
      expect(memCache.slots).to.have.property('length', 1);
    });

  });

  //
  //
  describe('#removeSlot()', function(){
    //
    //
    it('Should remove a slot with all its items removed separately (invoking removal callbacks)');

  });
});

describe('Timesafe Slot', function(){
  //
  //
  describe('#set', function(){
    //
    //
    it('Should expose a working set method');
  });

  //
  //
  describe('#get', function(){
  
    //
    //
    it('Should expose a working get method');
  });

  //
  //
  describe('#remove', function(){
  
    //
    //
    it('Should expose a working remove method');

  });

  //
  //
  describe('#touch(key)', function(){
  
    //
    //
    it('Should expose a working touch method');

  });

});
