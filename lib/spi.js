/*!
 * array-gpio/spi.js
 * Copyright(c) 2017 Ed Alegrid
 * MIT Licensed
 */

'use strict';

const rpi = require('./rpi.js');

/* 
 * spi class
 */

var test = false;

class SPI {

constructor (){
	this.begin();
}

/* returns 1 if successful, otherwise returns 0*/
begin(){
  	return rpi.spiBegin();
}

test(){
	test = true;
}

setDataMode (mode) {
  	rpi.spiSetDataMode(mode);
}

/* 250MHz on RPi1 and RPi2, and 400MHz on RPi3 */
setClockFreq(div) {
  	var clock1 = 250000000;
  	var clock3 = 400000000;

	var boardRev = rpi.spiGetBoardRev();
	if( boardRev === 8322){
		var freq = Math.round(clock3/div);
	}else{
		var freq = Math.round(clock1/div);
	}

  	var Freq = freq/1000;

  	console.log('SPI clock freq: ' + Freq + ' kHz (div ' + div +')');

  	rpi.spiSetClockDivider(div);
}

/* 250MHz on RPi1 and RPi2, and 400MHz on RPi3 */
setClock(div) {
  	var clock1 = 250000000;
  	var clock3 = 400000000;

  	var boardRev = rpi.spiGetBoardRev(); 
  	if( boardRev === 8322){
   		var freq = Math.round(clock3/div);
  	}else{
    		var freq = Math.round(clock1/div);
  	}

  	var Freq = freq/1000;

  	console.log('SPI clock freq: ' + Freq + ' kHz (div ' + div +')');

  	rpi.spiSetClockDivider(div);
}

setCSPolarity(cs, active){
  	rpi.spiSetCSPolarity(cs, active);
}

chipSelect(cs){
  	rpi.spiChipSelect(cs);
}

/* transfer data bytes to/from periphetal registers using node buffer objects */
transfer (wbuf, rbuf, len){
  	if(test){
		return;
  	}
  	rpi.spiTransfer(wbuf, rbuf, len);
}

/* transfer data bytes to periphetal registers using node buffer objects */
write(wbuf, len){
	if(test){
		return;
  	}
  	rpi.spiWrite(wbuf, len);
}

/* transfer data bytes from periphetal registers using node buffer objects */
read(rbuf, len){
	if(test){
		return;
  	}
  	rpi.spiRead(rbuf, len);
}

end(){
  	rpi.spiEnd();
}

} // end of SPI class

module.exports = SPI;
