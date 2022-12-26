/*!
 * array-gpio/i2c.js
 *
 * Copyright(c) 2017 Ed Alegrid
 * MIT Licensed
 */

'use strict';

const rpi = require('./rpi.js');

var test = false;

/*
 * i2c class
 */
class I2C {

/*constructor (){
  	this.begin();
}*/
	
constructor (pinSet){
	if(!pinSet){
		this.startI2C(1);
	}
	else{
  		this.startI2C(pinSet);
	}
}

begin(){
  	return rpi.i2cBegin();
}
	
startI2C(pinSet){
  	return rpi.i2cInit(pinSet);
}

test(){
	test = true;
}

setBaudRate(baud) {
	if(test){
		return;
	}
	rpi.i2cSetBaudRate(baud);
	var Baud = baud/1000;
	console.log('I2C data rate: ' + Baud + ' kHz');
}

setTransferSpeed(baud) {
	if(test){
		return;
  	}
  	rpi.i2cSetBaudRate(baud);
  	var Baud = baud/1000;
	console.log('I2C data rate: ' + Baud + ' kHz');
}

setClockFreq(div) {
  	var freq = Math.round(250000000/div);
  	var Freq = Math.round(freq/1000);

  	console.log('I2C data rate: ' + Freq + ' kHz (div ' + div +')');
  	if(test){
		return;
  	}
  	rpi.i2cSetClockDivider(div);
}

/* returns 1 if successful, otherwise returns 0*/
setSlaveAddress(value){
  	if(test){
		return;
  	}
  	return rpi.i2cSetSlaveAddress(value);
}

/* returns 1 if successful, otherwise returns 0*/
selectSlave(value){
	if(test){
		return;
	}
	return rpi.i2cSetSlaveAddress(value);
}

/* read data bytes from periphetal registers using node buffer objects */
read(buf, len){
	if(test){
		return;
	}
	rpi.i2cRead(buf, len);
}

/* write data bytes to periphetal registers using node buffer objects */
write(buf, len){
	if(test){
		return;
	}
	rpi.i2cWrite(buf, len);
}

end(){
  	rpi.i2cEnd();
}

} // end of I2C class

module.exports = I2C;

