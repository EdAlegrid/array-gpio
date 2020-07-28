/*!
 * array-gpio/i2c.js
 * Copyright(c) 2017 Ed Alegrid
 * MIT Licensed
 */

'use strict';

const rpi = require('./rpi.js');

/*
 * i2c class
 */

var test  = false;

class I2C {

constructor (){
  this.pin = arguments[0];
  this.status = this.begin();
}

/* returns 1 if successful, otherwise returns 0*/
begin(){
  return rpi.i2cBegin();
}

test(){
  test = true;
}

setBaudRate(baud) {
  rpi.i2cSetBaudRate(baud);
  var Baud = baud/1000;
  console.log('I2C data rate: ' + Baud + ' kHz');
}

setTransferSpeed(baud) {
  rpi.i2cSetBaudRate(baud);
  var Baud = baud/1000;
	console.log('I2C data rate: ' + Baud + ' kHz');
}

setClockFreq(div) {
  var freq = Math.round(250000000/div);
  var Freq = Math.round(freq/1000);

  console.log('I2C data rate: ' + Freq + ' kHz (div ' + div +')');

  rpi.i2cSetClockDivider(div);
}

setSlaveAddress(value){
  rpi.i2cSetSlaveAddress(value);
}

selectSlave(value){
  rpi.i2cSetSlaveAddress(value);
}

/* read data bytes from periphetal registers using node buffer objects */
read(buf, len){
  rpi.i2cRead(buf, len);
}

/* write data bytes to periphetal registers using node buffer objects */
write(buf, len){
  rpi.i2cWrite(buf, len);
}

end(){
  rpi.i2cEnd();
}

} // end of I2C class

module.exports = I2C;