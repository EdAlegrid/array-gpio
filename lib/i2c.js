/*!
 * array-gpio/i2c.js
 *
 * Copyright(c) 2017 Ed Alegrid
 * MIT Licensed
 */

'use strict';

const rpi = require('./rpi.js');

// 0 - SDA0 (GPIO 00/pin 27) and SCL0 (GPIO 01/pin 28) (disabled)
// 1 - BSC1_BASE, using SDA1 (GPIO 02/pin 03) and SCL1 (GPIO 03/pin 05) (default)

class I2C {

#init = 0;

#start(ps){
	this.#init = 1;
	if(ps === undefined){
	        rpi.i2c_start(1);
	}
	else if(ps === 0 || ps === 1){
  		rpi.i2c_start(ps);
	}
	else{
		throw new Error('Invalid i2c pin select ' + ps);
	}    
}

constructor(ps){
	if(ps == undefined){
        	// start manually using begin
		this.#init = 0;
	}
	else{
	  	this.#init = 1;
		this.#start(ps)
	}
}

begin(){
	this.#init = 1;
	rpi.i2c_start(1);
}

setBaudRate(baud) {
	if(this.#init){ 
		rpi.i2c_set_baud_rate(baud);
		let Baud = baud/1000;
		console.log('I2C data rate: ' + Baud + ' kHz');
	}
}

setTransferSpeed(baud) {
	if(this.#init){
  		rpi.i2c_set_baud_rate(baud);
  		let Baud = baud/1000;
		console.log('I2C data rate: ' + Baud + ' kHz');
	}
}

setClockFreq(div) {
	if(this.#init){
	  	let freq = Math.round(250000000/div);
	  	let Freq = Math.round(freq/1000);
	  	console.log('I2C data rate: ' + Freq + ' kHz (div ' + div +')');
	  	rpi.i2c_set_clock_divider(div);
	}
}

/* returns 1 if successful, otherwise returns 0*/
setSlaveAddress(value){
	if(this.#init){
  		return rpi.i2c_set_slave_address(value);
	}
}

/* returns 1 if successful, otherwise returns 0*/
selectSlave(value){
	if(this.#init){
		return rpi.i2c_set_slave_address(value);
	}
}

/* read data bytes from periphetal registers using node buffer objects */
read(buf, len){
	if(this.#init){
		rpi.i2c_read(buf, len);
	}
}

/* write data bytes to periphetal registers using node buffer objects */
write(buf, len){
	if(this.#init){
		rpi.i2c_write(buf, len);
	}
}

end(){
	if(this.#init){	
  		rpi.i2c_stop();
		this.#init = 0; 
	}
}

stop(){
	if(this.#init){	
  		rpi.i2c_stop();
		this.#init = 0; 
	}
}

} 

module.exports = I2C;
