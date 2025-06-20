/*!
 * array-gpio/spi.js
 *
 * Copyright(c) 2017 Ed Alegrid
 * MIT Licensed
 */

'use strict';

const rpi = require('./rpi.js');

class SPI {

#init = 0;

#start(){
    this.#init = 1;
  	rpi.spi_start();
}

constructor(s){
    if(s === 1){
        this.#init = 1;
		this.#start();
    }
	else{
   		this.#init = 0;
    }	
}

begin(){
    this.#init = 1;
  	rpi.spi_start();
}

setDataMode (mode) {
    if(this.#init){
  		rpi.spi_set_data_mode(mode);
    }
}

setClockFreq(div) {
    if(this.#init){
  		rpi.spi_set_clock_freq(div);
	}
}

setCSPolarity(cs, active){
    if(this.#init){
  		rpi.spi_set_cs_polarity(cs, active);
	}
}

chipSelect(cs){
	if(this.#init){
  		rpi.spi_chip_select(cs);
	}
}

/* transfer data bytes to/from periphetal registers using node buffer objects */
dataTransfer (wbuf, rbuf, len){
    if(this.#init){
  		rpi.spi_data_transfer(wbuf, rbuf, len);
    }
}

/* transfer data bytes to periphetal registers using node buffer objects */
write(wbuf, len){
	if(this.#init){
  		rpi.spi_write(wbuf, len);
	}
}

/* transfer data bytes from periphetal registers using node buffer objects */
read(rbuf, len){
	if(this.#init){
  		rpi.spi_read(rbuf, len);
	}
}

end(){
	if(this.#init){
  		rpi.spi_end();
		this.#init = 0;	
	}
}

}

module.exports = SPI;
