/**
 * pwm.test.js
 *
 * 2017 Ed Alegrid <ealegrid@gmail.com>
 */

const assert = require('assert');
const sinon = require('sinon');

const r = require('array-gpio');
r.debug(1);

describe('\nCreating a pwm object ...', function () {
	describe('Create a pwm object using .setPWM(pin) along w/ i2c, spi and gpio objects', function () {
		it('should return a pwm object', function (done) {
			try{
				var pwm = r.setPWM(33);
				assert.strictEqual( typeof pwm, 'object');

				var spi = r.SPI();
				assert.strictEqual( typeof spi, 'object');

				var i2c = r.I2C();
				assert.strictEqual( typeof i2c, 'object');

				// create an input object
				var sw = r.in(15, 19);
				assert.strictEqual( typeof sw, 'object');

				// create an output object
				var led = r.out(36, 37);
				assert.strictEqual( typeof led, 'object');

				// test only
				pwm.enable();
				pwm.start();

				// set clock frequency using a div value of 1920
				pwm.setClockFreq(1920); // sets clock freq to 10kHz or 0.1 ms time resolution for T and pw 

				// set period (T) of the pulse
				pwm.setRange(1000); // 1000 x 0.1 ms = 100 ms (actual period T)

				pwm.pulse();
				pwm.setData(100);
				pwm.stop();

			}
			catch(e){
				done();
			}

			sw.close();
			spi.end();
			i2c.end(); 
			pwm.close();
			done();
		});
	});
	describe('Create a pwm object using .PWM(pin, freq, T, pw) method', function () {
		it('should return a pwm object', function (done) {

		try{
			var spi = r.SPI();
			assert.strictEqual( typeof spi, 'object');
			var i2c = r.I2C();
			assert.strictEqual( typeof i2c, 'object');

			// test another pwm pin
			var pin  = 35;    /* channel 2, alt-function 0 */
			var freq = 10;    /* 10 kHz provides 0.1 ms time resolution */
			var T    = 200;   /* 200 x 0.1 ms = 20 ms */
			var pw   = 10;    /* 10  x 0.1 ms = 1.0 ms, home position */

			// start PWM and initialize with above details
			var pwm1 = r.PWM(pin, freq, T, pw);
			assert.strictEqual( typeof pwm1, 'object');

			var sw = r.setInput(19);
			assert.strictEqual( typeof sw, 'object');

			// test only
			pwm1.enable();
			pwm1.start();

			pwm1.pulse(10);
			pwm1.stopPulse();
		}
		catch(e){
			done();
		}

		sw.close();
		spi.end();
		i2c.end(); 
		pwm1.close();
		done();
		});
	});
});
