const assert = require('assert');
const sinon = require('sinon');

const r = require('array-gpio');
r.debug(1);

describe('\nCreating an i2c object ...', function () {
  describe('Create a single i2c object using .I2C() constructor', function () {
    it('should return an i2c object', function (done) {
       
    try{
  
		var i2c = r.setI2C(15);

    i2c.test(); 

    console.log('i2c', i2c);
    assert.strictEqual( typeof i2c, 'object');

		// spi side effect test, an spi object should be created along side with i2c
		var spi = r.SPI();
    spi.setClockFreq(128); 
		assert.strictEqual( typeof spi, 'object');

    i2c.begin();

    i2c.setClockFreq(200000);
    i2c.setBaudRate(200000);

		// create gpio objects after i2c, spi and pwm objects
		// DO NOT USE pin 3 and 5 while i2c is in operation
		var sw = r.Input(11,13,15,19);

		/* set data transfer speed to 100 kHz */
		i2c.setTransferSpeed(200000);
		 
		/* MCP9808 device address */
		let addr = 0x18;

		/* access MCP9808 device */
		i2c.selectSlave(addr);

    i2c.setSlaveAddress(addr);

		/* setup write and read data buffer */
		const wbuf = Buffer.alloc(16); // write buffer
		const rbuf = Buffer.alloc(16); // read buffer

    // i2c.test() should used/enabled when test the following methods
		/* i2c write */
		i2c.write(wbuf, 1);

  	/* i2c read */
  	i2c.read(rbuf, 2); 

    }
		catch(e){
			throw e;
    }

    spi.end();
    i2c.end();
    done();

    });
  });
  describe('Create an i2c object after a gpio object has been created', function () {
    it('should throw a peripheral mode access conflict error', function (done) {
       
    try{
    // creating a gpio object
    var sw = r.Input(11,13,15,19);

		var i2c = r.setI2C();

		// spi side effect test
		var spi = r.SPI();
		spi.setClockFreq(128);
 
		// pwm side effect test
		// var pwm = r.PWM(35);

		/* set data transfer speed to 100 kHz */
		i2c.setTransferSpeed(200000);
		 
		/* MCP9808 device address */
		let slave = 0x18;

		/* access MCP9808 device */
		i2c.selectSlave(slave);
    i2c.setSlaveAddress(slave);

		/* setup write and read data buffer */
		const wbuf = Buffer.alloc(16); // write buffer
		const rbuf = Buffer.alloc(16); // read buffer
    
    //pwm.stop();
    //pwm.close();

    }
		catch(e){
			assert.strictEqual( e.message, 'peripheral mode access conflict');
      done();
    }

    spi.end();
    i2c.end();
    done();

    });
  });
});