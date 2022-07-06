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
	describe('Create a single input object using .setInput() method', function () {
    		it('should return an input object', function (done) {
     			let input = r.setInput(pin1);

      			assert.strictEqual( typeof input, 'object');
		      	assert.strictEqual( input.pin, pin1);
		      	//assert.strictEqual( input.state, false);
		      	//assert.strictEqual( input.isOff, true);
		      	assert.strictEqual( typeof input.setR, 'function');
			assert.strictEqual( typeof input.watch, 'function');
		      	assert.strictEqual( typeof input.read, 'function');
		      	assert.strictEqual( typeof input.unwatch, 'function');
		      	done();
    		});
  	});
  	describe('Create an input object w/ invalid pin 45', function () {
    		it('should throw an error', function (done) {
       		    try{
		      let input = r.setInput(45);
		    }
		    catch(e){
		      console.log(e.message);
		      assert.strictEqual(e.ReferenceError, undefined);
		      assert.strictEqual(e.message, 'invalid pin');
		      done();
		    }
		    throw 'unexpected error';
    		});
  	});
  	describe('Create an input object w/ invalid pin 1', function () {
    		it('should throw an error', function (done) {
       			try{
		      		let input = r.setInput(1);
		    	}
		    	catch(e){
		      		console.log(e.message);
		      		assert.strictEqual(e.ReferenceError, undefined);
		      		assert.strictEqual(e.message, 'invalid pin');
		      		done();
		    	}
		    	throw 'unexpected error';
    		});
  	});
  	/*describe('Create an input object w/ valid pin 13', function () {
    		it('should not throw an error', function (done) {
       			let input = null;

    			try{
     				input = r.setInput(13);
    			}
    			catch(e){
      				throw e; //'unexpected error';
    			}

    			if(input.isOn){
      				throw 'unexpected error';
    			}

    			input.close();
    			done();

    		});
  	});*/
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
    			throw 'unexpected error';
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
			throw 'unexpected error';
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
			throw 'unexpected error';
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
			throw 'unexpected error';
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
    			throw 'unexpected error';
    		});
  	});
	describe('Create an input array object w/ 1 pin:[pin1] element', function () {
    		it('should return an array object', function (done) {
      			let input = null;  
    			try{
      				input = r.setInput({pin:[13]});
    			}
    			catch(e){
      				throw 'unexpected error';
    			}
			assert.strictEqual( typeof input, 'object');
			assert.strictEqual( Array.isArray(input), true);
			assert.strictEqual( typeof input[0], 'object');

			//input[0] = {_index: 0, pin: 13, setR: [Function: intR] }
			assert.strictEqual( input[0].pin, 13);
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
				throw 'unexpected error';
			}

    			assert.strictEqual( typeof input, 'object');
			assert.strictEqual( typeof input.pin, 'number');
			assert.strictEqual( input.pin, 13);
			done();
    		});
  	});

  	describe('Create a single input object using .in() method', function () {
    		it('should return an input object', function (done) {
      			let input = null; 
      			try{
        			input = r.in(pin1);
        			input.open();
      			}
      			catch(e){
        			throw 'unexpected error';
	      		} 

			assert.strictEqual( typeof input, 'object');
			assert.strictEqual( input.pin, 11);
			input.close();

			done();
    		});
  	});
	describe('Create multiple input objects using .setInput() method', function () {
		it('should return multiple input objects corresponding with the input pins', function (done) {
			let sw1, sw2;
			try{
				sw1 = r.setInput(pin1);
				sw2 = r.setInput(pin2);
			}
			catch(e){
				throw 'unexpected error';
			} 

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
			let sw1, sw2;
			try{ 
				sw1 = r.in(pin1);
				sw2 = r.in(pin2);
			}	
			catch(e){
				throw 'unexpected error';
			} 

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
			let input = null;
			try{
				input = r.setInput(pin1, pin2, {index:'pin'});
			}
			catch(e){
				throw 'unexpected error';
			}

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
			let input = null; 
			try{
				input = r.in(pin1, pin2);
			}
			catch(e){
				throw 'unexpected error';
			}	
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
				assert.strictEqual(sw.state, true);
				assert.strictEqual(sw.isOn, true);
				sw.unwatch();
				sw.close(); 
				done();    
			});

			// force pin to turn on creating a rising edge
			sw.setR(1); 
			r.mswait(200);

		});
	});
	describe('watch an input using .watch(1, cb) method', function () {
		it('should return an input state of true', function (done) {

			let sw = r.in(pin1); 

			sw.watch(1, function(state){
				assert.strictEqual(sw.isOn, true);
				assert.strictEqual(state, true);
				sw.unwatch();
				sw.close();
				done();
			});

			sw.setR(1); 
			r.mswait(200);
		});
	});
	describe('watch an input using .watch(cb) method w/ state parameters on callback', function () {
		it('should return an input state of true', function (done) {
			let sw = r.in(pin1); 

			sw.watch(function(state){
				if(state === true){
						  assert.strictEqual(sw.isOn, true);
					    assert.strictEqual(state, true);
						  sw.unwatch();
					    sw.close();
					    done();
				}
			});

			sw.setR(1); 
			r.mswait(500);

			if(sw.isOff){
				throw 'unexpected error';
			}
		});
	});
	describe('watch an input using .watch(cb) method w/o callback parameters', function () {
		it('should return an input state of true', function (done) {
			let sw = r.in(31); 
			sw.setR();
			r.mswait(200);

			sw.watch(function(){
				assert.strictEqual(sw.isOn, true);
				sw.unwatch();
				sw.close(); 
				done();
			});

			sw.setR(1); 
			r.mswait(500);

			if(sw.isOff){
				throw 'unexpected error';
			}   
		});
	});
	describe('watch an input using .watchInput(cb) method w/ argument', function () {
		it('should return an input state of true', function (done) {
			let sw1 = r.in(pin3); 
			let sw2 = r.in(pin4);

			sw1.setR();
			sw2.setR();
			r.mswait(200);

			let count = 0; 

			r.watchInput((state) => {
				if(count === 0){
					 if(sw1.isOn){
						assert.strictEqual(state, true);
						sw1.close(); 
					 }
					 if(sw2.isOn){
						assert.strictEqual(state, true);
						// immediately stop watching all pins  
						r.unwatchInput();
						done();
					 }
					count++;
				}
			}, 10);
			sw1.setR(1);
			sw2.setR(1);
			r.mswait(500);

			if(sw1.isOff){
				throw 'unexpected error';
			}  
			if(sw2.isOff){
				throw 'unexpected error';
			}
		});
	});
	describe('using .read() w/o callback', function () {
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
	describe('using .watch() w/o callback', function () {
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

			let edge = {};
			let cb = function(state){};

			try{ 
				sw1.watch(edge, cb);
			}
			catch(e){
				assert.strictEqual(e.message, 'invalid edge argument');
				done();
			}
			throw 'unexpected error';
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
			throw 'unexpected error';
		});
	});
	describe('using .watch(0, cb) w/ callback', function () {
		it('should start watching the pin', function (done) {
			let sw1 = r.in(pin3); 

			let cb = function(state){};

			try{ 
			  	sw1.watch(0, cb);
			}
			catch(e){
				throw 'unexpected error';   
			}   

			setTimeout(function(){
				sw1.unwatch();
				done();
			}, 200);
		});
	});
	describe('using .watch(1, cb) w/ callback', function () {
		it('should start watching the pin', function (done) {

			let sw1 = r.in(pin4); 

			let cb = function(state){};

			try{ 
			  	sw1.watch(1, cb);
			}
			catch(e){
				throw 'unexpected error';   
			}  

			setTimeout(function(){
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
				throw 'unexpected error';
			}

			setTimeout(() => {
				sw1.unwatch(); 
				done();
			}, 100);
		});
	});
	describe('using .unwatch()', function () {
		it('should immediately unwatch() an input pin', function (done) {

			let sw1 = r.in(pin2); 

			let cb = function(state){};

			// start watching pin
			try{ 
			  	sw1.watch(1, cb);
			}
			catch(e){
				throw 'unexpected error';   
			}   

			// stop watching pin
			try{ 
				sw1.unwatch();
			}
			catch(e){
				throw 'unexpected error';
			}

			setTimeout(() => {
				sw1.close(); 
				done();
			}, 100);
		});
	});
	describe('using .read() w/ callback and state as parameter', function () {
		it('should start watching an input', function (done) {
			let sw1 = r.in(pin3); 

			// state = 1|0, not true|false
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

