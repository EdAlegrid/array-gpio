const assert = require('assert');
const sinon = require('sinon');

describe('\nCreating an i2c object ...', function () {
	describe('Create an i2c object after gpio object creation', function () {
		it('should throw an i2c peripheral access conflict error', function (done) {

      /* test of peripheral object creation precedence
       * i2c and spi should take precedence before pwm and gpio
       * pwm before gpio
       *
       * In this test, we created a gpio object before i2c
       * This will throw a peripheral access conflict error
       *
       */  
      
      const r = require('array-gpio');
			r.debug(1);

      var gpio = null; 

			try{

        // create an input object
			  gpio = r.Input(13);

        // create an i2c object
				var i2c = r.setI2C();
        i2c.begin();   
       
	     
				// create an spi object
				//var spi = r.SPI();
        //spi.begin()
		 
				// create a pwm object
				var pwm = r.PWM(35);
	  
				// no objects will be created
			}
			catch(e){
        gpio.close();
        assert.strictEqual(typeof i2c, 'undefined'); // i2c is not created
        assert.strictEqual(typeof spi, 'undefined'); // spi is not created
        assert.strictEqual(typeof pwm, 'undefined'); // pwm is not created
				assert.strictEqual( e.message, 'i2c peripheral access conflict');
			  done();
			}

    });
  });
  describe('Create a single i2c object along w/ spi and pwm before gpio object creation ...', function () {
    it('should create and return an i2c object', function (done) {

    const r = require('array-gpio');
		r.debug(1);

	  try{
	
			var i2c = r.setI2C();
	    i2c.begin(); 

			// enable test simulation when no actual i2c device is connected
      // starting i2c w/o actual i2c device will cause peripheral access conflict
      // with other gpio tests
      i2c.test(true) 

	    // i2c object created
			assert.strictEqual(typeof i2c, 'object');

			// spi object should be created along side with i2c
			var spi = r.SPI();
	    spi.begin(); 

	    // spi object created 
	  	assert.strictEqual(typeof spi, 'object');

	    var pwm = r.PWM(33);
			assert.strictEqual(typeof pwm, 'object');

			// create gpio objects after i2c, spi and pwm objects
			// DO NOT USE pin 3 and 5 during test while i2c is in operation
	    // it should create a gpio input/output objects
			var input = r.Input(11,13,15,19);
	    assert.strictEqual(typeof input, 'object');
	    assert.strictEqual(Array.isArray(input), true); 

			var output = r.Output(33,35,36,37);
      assert.strictEqual(typeof output, 'object');
	    assert.strictEqual(Array.isArray(output), true); 

      // test i2c operation methods 
  		// start i2 operation only after 2c, spi and pwm objects are created
			i2c.setClockFreq(200000);
			i2c.setBaudRate(200000);

			// set data transfer speed to 100 kHz
			i2c.setTransferSpeed(200000);
			 
			// i2c device address
			let addr = 0x18;

			// access i2c device
			i2c.selectSlave(addr);
      
      // same w/ i2c.selectSlave 
			let stat = i2c.setSlaveAddress(addr); 
  		//check if there is no actual i2c device connected
      assert.strictEqual(typeof stat, 'undefined');

			// setup write and read data buffer
			const wbuf = Buffer.alloc(16); // write buffer
			const rbuf = Buffer.alloc(16); // read buffer
   
			// stat should be undefined
      if(!stat){
				i2c.write(wbuf, 1);
				i2c.read(rbuf, 2); 
      }
	 
			}
			catch(e){
				throw e;
			}

			pwm.stop();
			pwm.close(); // closing pwm might affect some pins still in use from other tests
			spi.end();
			i2c.end();
		
			done();

    });
  });
});