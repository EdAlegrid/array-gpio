const assert = require('assert');
const sinon = require('sinon');

// this test is practically the same w/ i2c object creation precedence test
describe('\nCreating an spi object ...', function () {
  /*describe('Create an spi object after gpio object creation', function () {
    it('should throw an spi peripheral access conflict error', function (done) {

			// test of peripheral object creation precedence
      // i2c and spi should take precedence before pwm and gpio
      // pwm before gpio
      //
      // In this test, we created a gpio object before i2c
      // This will throw a peripheral access conflict error
      //
      
      const r = require('array-gpio');
			r.debug(1);

      var gpio = null; 

			try{

        // create an input object
			  gpio = r.Input(13);
	     
				// create an spi object
				var spi = r.SPI();
        spi.begin()

				// create an i2c object
				var i2c = r.setI2C();
        i2c.begin(); 
		 
				// create a pwm object
				var pwm = r.PWM(35);
	  
				// no objects will be created
			}
			catch(e){
        gpio.close();
        assert.strictEqual(typeof i2c, 'undefined'); // i2c is not created
        assert.strictEqual(typeof spi, 'undefined'); // spi is not created
        assert.strictEqual(typeof pwm, 'undefined'); // pwm is not created
				assert.strictEqual( e.message, 'spi peripheral access conflict');
			  done();
			}
    });
  });*/
  describe('Create a single spi object along w/ i2c and pwm before gpio object creation', function (){
    it('should return an spi object', function (done) {

		const r = require('array-gpio');
    r.debug(1); 

		try{
     
			var spi = r.SPI();
			// or var spi = r.setSPI();
			spi.test(true);
	    spi.begin(); 

			assert.strictEqual( typeof spi, 'object');

			// i2c object should be created along side with spi object
			var i2c = r.I2C();
	    i2c.begin();
 			assert.strictEqual( typeof i2c, 'object');

			// pwm object should be created along side with spi object
			var pwm = r.PWM(35);
      assert.strictEqual( typeof pwm, 'object');

			// create gpio objects after i2c, spi and pwm objects
			// DO NOT USE pins [19, 21, 23, 24, 26, 35, 36, 38, 40] for gpio objects during test
			// above pins is being used by spi operation
     	var input = r.input(15, 19);
      assert.strictEqual(typeof input, 'object');
	    assert.strictEqual(Array.isArray(input), true); 
      
      var output = r.Output(33, 37);
      assert.strictEqual(typeof output, 'object');
	    assert.strictEqual(Array.isArray(output), true); 
			
			spi.setDataMode(0); 
			spi.setClockFreq(128); 
			spi.setClock(128); // test only
			spi.setCSPolarity(0, 0); 

			spi.chipSelect(0);

			const wbuf = Buffer.alloc(16); // write buffer
			const rbuf = Buffer.alloc(16); // read buffer

			// spi.test() should bet set to test the following methods
			spi.transfer(wbuf, rbuf, 3);
			spi.write(wbuf, 3);
			spi.read(rbuf, 3);

	  }
		catch(e){
			throw e;
	  }

	  spi.end();
    i2c.end();
    pwm.stop();
		pwm.close(); // closing pwm might affect some pins still in use from other tests
	  done();

    });
  });
});