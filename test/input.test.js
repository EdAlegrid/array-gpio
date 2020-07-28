const assert = require('assert');
const sinon = require('sinon');

before(() => {
  sinon.stub(console, 'log'); 
  sinon.stub(console, 'info'); 
  sinon.stub(console, 'warn');
  sinon.stub(console, 'error'); 
});

const r = require('array-gpio');
r.debug(1);

let pin1 = 11;
let pin2 = 13;
let pin3 = 15;
let pin4 = 19;
let pin5 = 33;
let pin6 = 35;

describe('\nCreating an input object ...', function () {
  describe('Create an input object w/ invalid pin 45', function () {
    it('should throw an error', function (done) {
       
    try{
	  	let input = r.setInput(45);
    }
    catch(e){
			console.log(e.message);
			assert.strictEqual(e.message, 'invalid pin');
      done();
    }

		throw e;
    done();

    });
  });
  describe('Create an input object w/ invalid pin 1', function () {
    it('should throw an error', function (done) {
       
    try{
	  	let input = r.setInput(1);
    }
    catch(e){
			console.log(e.message);
			assert.strictEqual(e.message, 'invalid pin');
      done();
    }

		throw e;
    done();

    });
  });
  describe('Create an input object w/ valid pin 13', function () {
    it('should not throw an error', function (done) {
    
    let input = null;

    try{
	  	input = r.setInput(13);
    }
    catch(e){
			console.log(e.message);
			assert.strictEqual(e.message, 'invalid pin');
      done();
    }

    if(input.isOn){
      throw 'invalid test';
    }

		input.close();
    done();

    });
  });
  describe('Create an input object w/o any argument', function () {
    it('should throw an error', function (done) {
       
    try{
	  	let input = r.setInput();
    }
    catch(e){
			console.log(e.message);
			assert.strictEqual(e.message, 'invalid pin');
      done();
    }

		throw e;
    done();

    });
  });
	describe('Create an input object w/ a string 1st argument', function () {
    it('should throw an error', function (done) {
       
    try{
	  	let input = r.setInput('11');
    }
    catch(e){
			console.log(e.message);
			assert.strictEqual(e.message, 'invalid pin');
      done();
    }

		throw e;
    done();

    });
  });
	describe('Create an input object w/ function or callback as 1st argument', function () {
    it('should throw an error', function (done) {
      
    let callback = function(){} 

    try{
	  	let input = r.setInput(callback);
    }
    catch(e){
			console.log(e.message);
			assert.strictEqual(e.message, 'invalid pin');
      done();
    }

		throw 'invalid test';

    });
  });
  describe('Create an input array object w/ empty object argument', function () {
    it('should throw an error', function (done) {
       
    try{
	  	let input = r.setInput({});
    }
    catch(e){
			console.log(e.message);
			assert.strictEqual(e.message, 'invalid pin');
      done();
    }

		throw 'invalid test';

    });
  });
	describe('Create an input array object w/ empty pin array', function () {
    it('should throw an error', function (done) {
       
    try{
	  	let input = r.setInput({pin:[]});
    }
    catch(e){
			console.log(e.message);
			assert.strictEqual(e.message, 'invalid pin');
      done();
    }

		throw 'invalid test';

    });
  });
  describe('Create an input array object w/ 1 pin:[pin1] element', function () {
    it('should return an array object', function (done) {
     
    let input = null;  
    try{
	  	input = r.setInput({pin:[13]});
    }
    catch(e){
			throw 'invalid test';
    }
    assert.strictEqual( typeof input, 'object');
		assert.strictEqual( Array.isArray(input), true);
		
    done();

    });
  });

  describe('Create an input array object w/ 1 argument .setInput(pin1)', function () {
    it('should return an array object', function (done) {
     
    let input = null;  
    try{
	  	input = r.setInput(13);
    }
    catch(e){
			throw 'invalid test';
    }

    assert.strictEqual( typeof input, 'object');

		done();

    });
  });

  describe('Create a single input object using .in() method', function () {
    it('should return an input object', function (done) {
       
	  	let input = r.in(pin1);

			input.open();

      assert.strictEqual( typeof input, 'object');
      assert.strictEqual( input.pin, 11);
      input.close();
 
      done();

    });
  });
  describe('Create multiple input objects using .setInput() method', function () {
    it('should return multiple input objects corresponding with the input pins', function (done) {
 
      let sw1 = r.setInput(pin1);

      let sw2 = r.setInput(pin2);

      assert.strictEqual( typeof sw1, 'object');
      assert.strictEqual( typeof sw2, 'object');
      assert.strictEqual( sw1.pin, pin1);
      assert.strictEqual( sw2.pin, pin2);
 
      sw1.close();
      sw2.close();

      done();

    });
  });
  describe('Create multiple input objects using .in() method', function () {
    it('should return multiple input objects corresponding with the input pins', function (done) {
 
      let sw1 = r.in(pin1);
      let sw2 = r.in(pin2);

      assert.strictEqual( typeof sw1, 'object');
      assert.strictEqual( typeof sw2, 'object');

      assert.strictEqual( sw1.pin, pin1);
      assert.strictEqual( sw2.pin, pin2);
 
      sw1.close();
      sw2.close();

      done();

    });
  });
  describe('Create an array input object using .setInput(pin1, pin2 ...) method', function () {
    it('should return an an array object', function (done) {

	  	let input = r.setInput(pin1, pin2, {index:'pin'});

      assert.strictEqual( Array.isArray(input), true);
      assert.strictEqual( input[pin1].pin, pin1);
      assert.strictEqual( input[pin2].pin, pin2);

      input[pin1].close();
      input[pin2].close();
 
      done();

    });
  });
  describe('Create an array input object using .in(pin1, pin2 ...) method', function () {
    it('should return an an array object', function (done) {
       
      let input = r.in(pin1, pin2);

      assert.strictEqual( Array.isArray(input), true);
      assert.strictEqual( input[0].pin, pin1);
      assert.strictEqual( input[1].pin, pin2);

      input[0].close();
      input[1].close();
 
      done();

    });
  });
  describe('Set internal resistor using .setR(0) & .setR(1)', function () {
    it('should return an input state of true', function (done) {
       
 		// choose a pin that is unused - not connected to a switch or led  
    let sw1 = r.in(16);
	
    sw1.setR(1);
    r.mswait(200);

    sw1.setR(0); 
		r.mswait(200);
    
    sw1.setR();
		r.mswait(200);

    let s = sw1.read();

		if(s === 1){
			s = true;
		}
		else{
			s = false;
		}

		assert.strictEqual(s, sw1.isOn);

    done();

    });
  });
	describe('watch an input using .watch("re", cb) method', function () {
    it('should return an input state of true', function (done) {

      let sw = r.in(pin1); 

			sw.watch('re', function(state){
        assert.strictEqual(sw.isOn, true);
        assert.strictEqual(state, true);
 				done();
			});

      if(!sw.isOn){
				assert.strictEqual(sw.state, false);
        assert.strictEqual(sw.isOff, true);
      }   
      
      sw.unwatch();
     	done();

    });
  });
  describe('watch an input using .watch("fe", cb) method', function () {
    it('should return an input state of true', function (done) {
       
      let sw = r.in(pin1); 

			sw.watch('fe', function(state){
        assert.strictEqual(sw.isOn, false);
        assert.strictEqual(state, false);
				sw.unwatch();
 				done();
			});

      if(!sw.isOn){
				assert.strictEqual(sw.state, false);
        assert.strictEqual(sw.isOff, true);
      }   
      
      sw.unwatch();
     	done();

    });
  });
  describe('watch an input using .watch(1, cb) method', function () {
    it('should return an input state of true', function (done) {
       
      let sw = r.in(pin1); 

			sw.watch(1, function(state){
        assert.strictEqual(sw.isOn, true);
        assert.strictEqual(state, true);

			});

      setTimeout(function(){
        sw.unwatch();
        sw.close();
     	  done();
      }, 200); 


    });
  });
  describe('watch an input using .watch(cb) method', function () {
    it('should return an input state of true', function (done) {

      let sw = r.in(pin1); 

			sw.watch(function(state){
        assert.strictEqual(sw.isOn, true);
        assert.strictEqual(state, true);
				sw.unwatch();
 				done();
			});

      if(!sw.isOn){
				assert.strictEqual(sw.state, false);
        assert.strictEqual(sw.isOff, true);
      }   
      
      sw.unwatch();
     	done();

    });
  });
	describe('watch an input using .watch(cb) method w/o callback parameters', function () {
    it('should return an input state of true', function (done) {
       
      let sw = r.in(pin1); 

			sw.watch(function(){
        assert.strictEqual(sw.isOn, true);
        assert.strictEqual(state, true);
				sw.unwatch();
 				done();
			});

      if(!sw.isOn){
				assert.strictEqual(sw.state, false);
        assert.strictEqual(sw.isOff, true);
      }   
      
      sw.unwatch();
     	done();

    });
  });
	describe('watch an input using .watchInput(cb) method w/ argument', function () {
    it('should return an input state of true', function (done) {

      let sw1 = r.in(pin1); 
      let sw2 = r.in(pin2);

      r.watchInput((state, pin) => {
				 if(sw1.isOn){
						assert.strictEqual(state, true);
				 }
				 if(sw2.isOn){
						assert.strictEqual(state, true);
				 }
			}, 10);

      if(!sw1.isOn){
				assert.strictEqual(sw1.state, false);
        assert.strictEqual(sw1.isOff, true);
      }  
      if(!sw2.isOn){
				assert.strictEqual(sw2.state, false);
        assert.strictEqual(sw2.isOff, true);
      }

      r.unwatchInput();

      sw1.close();
      sw2.close();

     	done();

    });
  });
  describe('using .read() with missing callback', function () {
    it('should throw an error', function (done) {

      let sw1 = r.in(pin1); 

      try{ 
      	sw1.read('on');
      }
      catch(e){
        assert.strictEqual(e.message, 'invalid callback argument');
				done();
      }

    });
  });
  describe('using .watch() with missing callback', function () {
    it('should throw an error', function (done) {

      let sw1 = r.in(pin2); 

      try{ 
      	sw1.watch(0);
      }
      catch(e){
        assert.strictEqual(e.message, 'invalid callback argument');
				done();
      }

    });
  });
  describe('using .watch() with invalid edge argument (object)', function () {
    it('should throw an error', function (done) {

      let sw1 = r.in(pin2); 
      let cb = function(state){};

      try{ 
      	sw1.watch({}, cb);
      }
      catch(e){
				assert.strictEqual(e.message, 'invalid edge argument');
				done();
      }

    });
  });
  describe('using .watch() with invalid callback argument', function () {
    it('should throw an error', function (done) {

      let sw1 = r.in(pin2); 

      try{ 
      	sw1.watch(1, {});
        
      }
      catch(e){
        assert.strictEqual(e.message, 'invalid callback argument');
				done();
      }
      throw 'invalid callback';
    });
  });
  describe('using .watch(0, cb) w/ callback', function () {
    it('should start watching the pin', function (done) {

      let sw1 = r.in(pin3); 

      let cb = function(state){};

     	sw1.watch(0, cb);

      setTimeout(function(){
        sw1.watch(0, cb);
        sw1.unwatch();
      	done();
      },200);
    });
  });
  describe('using .watch(1, cb) w/ callback', function () {
    it('should start watching the pin', function (done) {

      let sw1 = r.in(pin4); 

      let cb = function(state){};
     	sw1.watch(1, cb);

      setTimeout(function(){
        sw1.watch(1, cb);
        sw1.unwatch();
      	done();
      },200);
    });
  });
  describe('using .watch(cb, i) with custom watch interval', function () {
    it('should start watching an input', function (done) {
 
      let sw1 = r.in(pin2); 

      let cb = function(){
         sw1.unwatch(); 
      }
 
      try{ 
      	sw1.watch(cb, 100);
      }
      catch(e){
				done();
      }

      setTimeout(() => {
      	sw1.unwatch(); 
      	done();
      }, 100);

    });
  });
  describe('using .unwatch()', function () {
    it('should start watching an input', function (done) {

      let sw1 = r.in(pin2); 
 
      try{ 
      	sw1.unwatch();
      }
      catch(e){
				throw e;
      }
      
      done();
    });
  });
  describe('using .read() w/ callback and parameters', function () {
    it('should start watching an input', function (done) {

      let sw1 = r.in(pin3); 
  
    	sw1.read(function(state){
        if(state === 0){
          assert.strictEqual(state, 0);
					sw1.close();
        	done();
        } 
      });

    });
  });

});

