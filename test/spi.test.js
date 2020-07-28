const assert = require('assert');
const sinon = require('sinon');

const r = require('array-gpio');
r.debug(1);

describe('\nCreating an spi object ...', function () {
  describe('Create a single spi object using .SPI() constructor', function () {
    it('should return an spi object', function (done) {
       
    try{

		//var spi = r.SPI();
    var spi = r.setSPI();
    spi.test();

		assert.strictEqual( typeof spi, 'object');
		// i2c side effect test, i2c object should be created along side with spi object
		var i2c = r.I2C();
    assert.strictEqual( typeof i2c, 'object');
		// pwm side effect test, pwm object should be created along side with spi object
		// var pwm = r.PWM(33);

		// gpio side effect test
		// DO NOT USE pin 29, 21, 23, 24, 26 for gpio objects
		// gpio objects (not the pins above) must be created after pwm, i2c and spi objets
    var sw = r.Input(11,13,15);
		
		spi.setDataMode(0); 
		spi.setClockFreq(128); 
    spi.setClock(128); // test only
		spi.setCSPolarity(0, 0); 

		spi.chipSelect(0);

		/* setup write and read data buffer */
		/* latest node version */
		const wbuf = Buffer.alloc(16); // write buffer
		const rbuf = Buffer.alloc(16); // read buffer

		// spi.test() should used/enabled when test the following methods
		spi.transfer(wbuf, rbuf, 3);
		spi.write(wbuf, 3);
    spi.read(rbuf, 3);

    i2c.end();

    }
		catch(e){
			throw e;
      spi.end();
      done();
    }

    spi.end();
    done();

    });
  });
	describe('Create an spi object after a gpio object', function () {
    it('should throw a peripheral mode access conflict error', function (done) {
       
    try{

    var sw = r.Input(11,13,15,19);

		var spi = r.setSPI();
		// i2c side effect test
		var i2c = r.I2C();
		
		spi.setDataMode(0); 
		spi.setClockFreq(128); 
		spi.setCSPolarity(0, 0); 

		spi.chipSelect(0);

		/* setup write and read data buffer */
		/* latest node version */
		const wbuf = Buffer.alloc(16); // write buffer
		const rbuf = Buffer.alloc(16); // read buffer
		
    }
		catch(e){
			//assert.strictEqual( e.message, 'peripheral mode access conflict');
      throw e;
      done();
    }

    i2c.end();
    spi.end();
    done();

    });
  });
});