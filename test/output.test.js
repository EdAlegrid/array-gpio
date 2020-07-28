const assert = require('assert');
const sinon = require('sinon');

const r = require('array-gpio');
r.debug(1);

let pin1 = 11;
let pin2 = 13;
let pin3 = 15;
let pin4 = 19;
let pin5 = 33;
let pin6 = 35;

describe('\nCreating an output object ...', function () {
  describe('Create a single output object using .setOutput() method', function () {
    it('should return an output object', function (done) {
     
      let output = r.setOutput(pin5);

      assert.strictEqual( typeof output, 'object');
      assert.strictEqual( output.pin, pin5);
      assert.strictEqual( typeof output.on, 'function');

      done();

    });
  });
  describe('Create a single output object using .out() method', function () {
    it('should return an output object', function (done) {
     
      let output = r.out(pin6);
 
      assert.strictEqual( typeof output, 'object');
      assert.strictEqual( output.pin, pin6);
      assert.strictEqual( typeof output.on, 'function');

      output.write(1);
      output.write(0);

      output.close();

      done();

    });
  });
  describe('Create a single output object w/ .open() and .close() method', function () {
    it('should return an output object', function (done) {
     
      let output = r.out(pin6);
 
      assert.strictEqual( typeof output, 'object');
    
      // close the object
      output.close();

      // open again the object 
      output.open();  

      // turn it on and off 
      output.write(1, (state) => assert.strictEqual(1, state));
      output.write(0, (state) => assert.strictEqual(0, state));

      output.close();

      done();

    });
  });
  describe('Create an output object w/ invalid pin (45)', function () {
    it('should throw an error', function (done) {
       
		  try{
				let output = r.setOutput(45);
        assert.strictEqual( typeof output, 'object');
		  }
		  catch(e){
				console.log(e.message);
				assert.strictEqual(e.message, 'invalid pin');
		    done();
		  }

			throw 'invalid test';

    });
  });
  describe('Create an output object w/ invalid pin (1)', function () {
    it('should throw an error', function (done) {
       
		  try{
				let output = r.setOutput(1);
		  }
		  catch(e){
				console.log(e.message);
				assert.strictEqual(e.message, 'invalid pin');
		    done();
		  }

			throw 'invalid test';

    });
  });
  describe('Create an output object w/ invalid pin -1', function () {
    it('should throw an error', function (done) {
       
		  try{
				let output = r.setOutput(-1);
		  }
		  catch(e){
				console.log(e.message);
				assert.strictEqual(e.message, 'invalid pin');
		    done();
		  }

		throw 'invalid test';

    });
  });
  describe('Create an output object w/o any arguments', function () {
    it('should throw an error', function (done) {
       
		  try{
				let output = r.out();
		  }
		  catch(e){
				console.log(e.message);
				assert.strictEqual(e.message, 'invalid pin');
		    done();
		  }

			throw 'invalid test';

    });
  });
	describe('Create an output object using a string argument - "33" ', function () {
    it('should throw an error', function (done) {
       
		  try{
				let output = r.setOutput('11');
		  }
		  catch(e){
				console.log(e.message);
				assert.strictEqual(e.message, 'invalid pin');
		    done();
		  }

			throw 'invalid test';

    });
  });
	describe('Create an output object w/ invalid argument - function', function () {
    it('should throw an error', function (done) {
      
		  let callback = function(){} 
		  try{
				let output = r.Output(callback);
		  }
		  catch(e){
				console.log(e.message);
				assert.strictEqual(e.message, 'invalid pin');
		    done();
		  }

			throw 'invalid test';

    });
  });

  describe('*Creating a single output object using .out() method', function () {
    it('should return an output object', function (done) {
     
      try{
		    let output = r.out(pin5);
        
		    assert.strictEqual( typeof output, 'object');
		    assert.strictEqual( output.pin, pin5);
		    assert.strictEqual( typeof output.on, 'function');
        output.write(0, (s) => assert.strictEqual(0, s));
        assert.strictEqual(output.isOn, false);
        assert.strictEqual(output.isOff, true);

        output.delayOn(0, (state) => { assert.strictEqual( state, true) });
        output.delayOff(3, (state) => { assert.strictEqual( state, false) }); 

        output.close();

		    done();
		  }
		  catch(e){
				throw e;
		  }

    });
  });
  /*
   * array object - using object argument
   */
  describe('Create an output array object w/ a single pin array argument - setOutput({pin:[pin1]}) ', function () {
    it('should return an array object', function (done) {
     
		  let output = null;
		  try{
				output = r.setOutput({pin:[35]});
		  }
		  catch(e){
		    throw 'invalid test'; 
		  }

		  assert.strictEqual( typeof output, 'object');
			assert.strictEqual( Array.isArray(output), true);
      assert.strictEqual( output[0].pin, 35);
      assert.strictEqual( output[0].state, false);
			assert.strictEqual( output[0].isOn, false);
      assert.strictEqual( output[0].isOff, true);
			done();

    });
  });
  describe('Create an output array object w/ an empty object argument - {}', function () {
    it('should throw an error', function (done) {
       
		  try{
				let output = r.out({});
		  }
		  catch(e){
				assert.strictEqual(e.message, 'invalid pin');
		    done();
		  }

			throw 'invalid test';

    });
  });
	describe('Create an output array object w/ empty pin property {pin:[]}', function () {
    it('should throw an error', function (done) {
       
		  try{
				let output = r.setOutput({pin:[]});
		  }
		  catch(e){
				console.log(e.message);
				assert.strictEqual(e.message, 'invalid pin');
		    done();
		  }

			throw 'invalid test';

    });
  });
  describe('Create an array output object using .setOutput({pin:[pin1, pin2]}) method', function () {
    it('should return an an array object w/ zero based indexing', function (done) {

    try{  
	  	let output = r.setOutput({pin:[pin5, pin6]});

      assert.strictEqual( Array.isArray(output), true);
      assert.strictEqual( output[0].pin, pin5);
      assert.strictEqual( output[1].pin, pin6);
      assert.strictEqual( typeof output[0].on, 'function');
      assert.strictEqual( typeof output[1].off, 'function');

      assert.strictEqual( output[0].isOn, false );
			assert.strictEqual( output[1].isOff, true );
 
      output[0].close();
			output[1].close();
      done();
    }
	  catch(e){
			throw e;
	  }

    });
  });
  describe('Create an array output object using .setOutput({pin:[pin1, pin2], index:"pin"}) method', function () {
    it('should return an an array object w/ pin as index', function (done) {

		try{
	  	let output = r.setOutput({pin:[pin5, pin6], index:'pin'});

      assert.strictEqual( Array.isArray(output), true);
      assert.strictEqual( output[pin5].pin, pin5);
      assert.strictEqual( output[pin6].pin, pin6);
      assert.strictEqual( output[pin5].state, false);
      assert.strictEqual( output[pin6].state, false);

      assert.strictEqual( typeof output[pin5].on, 'function');
      assert.strictEqual( typeof output[pin6].off, 'function');
 			output[pin5].close();
			output[pin6].close();

      done();
    }
	  catch(e){
			throw e;
	  }

    });
  });
  describe('Create an array output object using .setOutput(pin1, pin2 ...) method', function () {
    it('should return an an array object', function (done) {

    try{
	  	let output = r.setOutput(pin5, pin6);

      assert.strictEqual( Array.isArray(output), true);
      assert.strictEqual( output[0].pin, pin5);
      assert.strictEqual( output[1].pin, pin6);
			assert.strictEqual( output[0].state, false);
      assert.strictEqual( output[1].state, false);
      assert.strictEqual( typeof output[0].on, 'function');
      assert.strictEqual( typeof output[1].off, 'function');
 
      done();
    }
	  catch(e){
			throw e;
	  }

    });
  });
  describe('Create an array output object using .setOutput(pin1, pin2, ..., {index:"pin"}) method', function () {
    it('should return an an array object', function (done) {

    try{
	  	let output = r.setOutput(pin5, pin6, {index:'pin'});

      assert.strictEqual( Array.isArray(output), true);
      assert.strictEqual( output[pin5].pin, pin5);
      assert.strictEqual( output[pin6].pin, pin6);
      assert.strictEqual( output[pin5].state, false);
      assert.strictEqual( output[pin6].state, false);

      assert.strictEqual( typeof output[pin5].on, 'function');
      assert.strictEqual( typeof output[pin6].off, 'function');
 
      done();
    }
    catch(e){
			throw e;
    }

    });
  });
  describe('Using .read() and write() method properties', function () {
    it('should return an an array object', function (done) {

	  	let output = r.setOutput(pin6);

      assert.strictEqual( typeof output , 'object');

      if(output.read() === 0){
        output.write(1, function(){}); 
      }
			if(output.read() === 1){
         output.write(0, function(){}); 
      }

      if(output.read() === 0){
        output.write(true, function(){}); 
      }
			if(output.read() === 1){
         output.write(false, function(){}); 
      }
  
      done();

    });
  });
  describe('Using .read() and write() method properties from array object', function () {
    it('should return an an array object', function (done) {

	  	let output = r.setOutput({pin:[pin5, pin6]});

      assert.strictEqual( Array.isArray(output), true);

      if(output[0].read() === 0){
        output[0].write(1); 
      }
			if(output[1].read() === 1){
        output[1].write(0);
      }

      if(output[1].read() === 0){
        output[1].write(true); 
      }

			if(output[0].read() === 1){
        output[0].write(false);
      }

      done();

    });
  });
  describe('Using .read() and write() method properties w/ callback from array object', function () {
    it('should return an an array object', function (done) {

	  	let output = r.setOutput({pin:[pin5, pin6]});

      assert.strictEqual( Array.isArray(output), true);
      output[0].on();
      output[1].on();

			output[0].read((state) => {
        if(state){

           assert.strictEqual( state, 1);

					 output[0].write(0, (state) => {

             assert.strictEqual( state, 0);
           }); 

           output[1].write(false, (state) => {
             assert.strictEqual( state, 0);
             
      			 output[0].close();
      			 output[1].close();

             done();
           }); 
        }

        output[0].close();
      	output[1].close();

        done(); 

       }); 
    });
  });
  describe('Using .read() and write() method properties w/ callback from array object', function () {
    it('should return an an array object', function (done) {

	  	let output = r.setOutput({pin:[pin5, pin6]});

      assert.strictEqual( Array.isArray(output), true);
      output[0].off();

			output[0].read((state) => {
        if(!state){

           assert.strictEqual( state, 0);

					 output[0].write(1, (state) => {
             assert.strictEqual( state, 1); 
           }); 

           output[1].write(true, (state) => {
             assert.strictEqual( state, 1);
             
             output[0].off();
      			 output[1].off();

      			 output[0].close();
      			 output[1].close();

             done();
           }); 
        }

       }); 
    });
  });
  describe('Using .read() and write() w/ invalid arguments', function () {
    it('should return an an array object', function (done) {

	  	let output = r.setOutput({pin:[pin5, pin6]});

      assert.strictEqual( Array.isArray(output), true);

      try{
        output[0].read('cb');
      }
      catch(e){
         assert.strictEqual( e.message, 'invalid callback argument');
      }

      try{
        output[0].write();
      }
      catch(e){
         assert.strictEqual( e.message, 'missing control bit argument');
      }

      try{
        output[0].write('1');
      }
      catch(e){
         assert.strictEqual( e.message, 'invalid control bit argument');
      }

      try{
        output[0].write('0', 'cb' );
      }
      catch(e){
         assert.strictEqual( e.message, 'invalid argument');
         done();
      }

    });
  });
  describe('Using .On() and .Off() getter properties from array object', function () {
    it('should return an an array object', function (done) {

	  	let output = r.setOutput({pin:[pin5, pin6]});

      assert.strictEqual( Array.isArray(output), true);

      if(output[0].isOff){
        output[0].on(); 
      }
			if(output[1].isOn){
        output[1].off(); 
      }
      done();

    });
  });
  describe('Using .delayOn(t) and .delayOff(t) methods from array output object', function () {
    it('should return an an array object', function (done) {

		try{
	  	let output = r.out({pin:[pin5, pin6], index:'pin'});

      assert.strictEqual(Array.isArray(output), true);

      output[pin5].on();
			output[pin6].on(); 
      output[pin5].off();
			output[pin6].off(); 

      if(output[pin5].isOff){
        output[pin5].delayOn(50); 
      }
			else if(output[pin5].isOn){
        output[pin5].delayOff(50); 
      }
      done();
    }
    catch(e){
			throw e;
    }

    });
  });
	describe('Using .on(cb) and .off(cb) methods w/ callback', function () {
    it('should return an output state of true or false', function (done) {
        
      let output = r.out(40);
      
      output.on();
      output.off(); 

      assert.strictEqual( typeof output, 'object');
       

      output.on(function(state) {

				assert.strictEqual(state, true);

				output.off(function(state) {
					assert.strictEqual(state, false);
       		assert.strictEqual(output.state, false);
      	});

      });

      output.on(10, function (state) {

				assert.strictEqual(state, true );

        // using 1 ms time delay
        output.off(0, function (state) {

					assert.strictEqual(state, false );
       		assert.strictEqual(output.state, false);

        	done();
        });
      });

    });
  });
	describe('Using .on(t, cb) and .off(t, cb) methods with delay time and callback', function () {
    it('output should return an output state of false or OFF state', function (done) {
     
      let output = r.out(pin6);

      assert.strictEqual( typeof output, 'object');

      output.on(10);
      output.off(15);
      
			output.on(25, function (state) {
			 assert.strictEqual(state, true);
      });

      output.off(50, function(state) {
			 assert.strictEqual(state, false);
       done();
      });

    });
  });

  describe('Using .on[0].(t, cb) and .off[0].(t, cb) method with array object', function () {
    it('output should return a true or false state', function (done) {
     
      let output = r.out(36, 37);

      output[0].on(23);
      output[1].on(23);

      output[0].off(24);
      output[1].off(24);

      output[0].on(25, function (state) {
			 	assert.strictEqual(state, true);

        output[0].off(25, function(state) {
			 	 assert.strictEqual(state, false);
      	});
      });

      output[1].on(25, function (state) {
			 	assert.strictEqual(state, true);

       	output[1].off(25, function(state) {
			 		assert.strictEqual(state, false);
       		done();
      	});
			});

    });
  });
  describe('Using .on() and .on() with invalid argument', function () {
    it('should throw an invalid argument error', function (done) {
     
    let output = r.out(pin5, pin6);

    try{
			output[0].on('100');
    }
    catch(e){
      assert.strictEqual(e.message,'invalid argument');
    }

    try{
			output[0].on(25, 'cb');
    }
    catch(e){
      assert.strictEqual(e.message,'invalid callback argument');
    }

    try{
			output[1].off('100');
    }
    catch(e){
      assert.strictEqual(e.message,'invalid argument');
    }

    try{
			output[1].off(25, 'cb');
    }
    catch(e){
      assert.strictEqual(e.message,'invalid callback argument');
      done(); 
    }

    throw 'invalid test';

    });
  });
	  describe('using delayOn() w/ invalid argument t and valid cb', function () {
    it('should throw an error', function (done) {
     
      let output = r.out(pin5, pin6);

      try{
        output[1].delayOn('100', function() {});
      }
      catch(e){
				assert.strictEqual( e.message, 'invalid delay argument');
      }

			try{
        output[1].delayOn('100', {});
      }
      catch(e){
				assert.strictEqual( e.message, 'invalid arguments');
				done();
      }

      throw 'invalid test';
    });
  });
  describe('using delayOff() w/ invalid argument t and valid cb', function () {
    it('should start the delayOff() function', function (done) {
     
      let output = r.out(pin5, pin6);

      try{
        output[1].delayOff('100', function(){});
      }
      catch(e){
        assert.strictEqual( e.message, 'invalid delay argument');
      }

      try{
        output[1].delayOff('100', {});
      }
      catch(e){
        assert.strictEqual( e.message, 'invalid arguments');
        done();
      }

			throw 'invalid test';
      
    });
  });
  describe('create a pulse using .pulse(t) method with t as pulse duration', function () {
    it('Should create a pulse with a duration of t', function (done) {
     
      let output = r.out(pin5, pin6);

      output[0].pulse(50, function (state) { assert.strictEqual(false, state) });

      output[0].close();

      done();

    });
  });
  describe('create a pulse w/ invalid t argument', function () {
    it('should throw an error', function (done) {
     
      let output = r.out(pin5, pin6);

      try{
        output[0].pulse('50',(err, state) => assert.strictEqual(false, state));
      }
      catch(e){
        assert.strictEqual( e.message, 'invalid pulse width time duration');
				done();
      }
      throw 'invalid test';
    });
  });
  describe('create a pulse w/ invalid callback argument', function () {
    it('should throw an error', function (done) {
     
      let output = r.out(pin5, pin6);

      try{
        output[0].pulse(50, {});
      }
      catch(e){
        assert.strictEqual( e.message, 'invalid callback argument');
				done();
      }
      throw 'invalid test';
    });
  });
  describe('create a pulse(t) w/o callback', function () {
    it('should start the pulse', function (done) {
     
      let output = r.out(pin5, pin6);

      try{
        output[1].pulse(25);
      }
      catch(e){
        throw 'invalid test';
      }

      setTimeout(function(){
				assert.strictEqual( output[1].isOn, false );
      }, 30);
      done();
    });
  });
  describe('create a pulse(t) w/ invalid t and w/o callback', function () {
    it('should throw an error', function (done) {
     
      let output = r.out(pin5, pin6);

      try{
        output[1].pulse('500');
      }
      catch(e){
				assert.strictEqual( e.message, 'invalid pulse width time duration');
				done();
      }
      throw 'invalid test';
    });
  });
  describe('create a pulse(t) w/ missing t', function () {
    it('should throw an error', function (done) {
     
      let output = r.out(pin5, pin6);

      try{
        output[1].pulse();
      }
      catch(e){
				assert.strictEqual( e.message, 'invalid pulse width time duration');
				done();
      }
      throw 'invalid test';
    });
  });
  describe('create a pulse(t, cb) w/ invalid arguments t and cb', function () {
    it('should throw an error', function (done) {
     
      let output = r.out(pin6);

      try{
        output.pulse('25', {});
      }
      catch(e){
				assert.strictEqual( e.message, 'invalid arguments');
				done();
      }
      throw 'invalid test';
    });
  });

});