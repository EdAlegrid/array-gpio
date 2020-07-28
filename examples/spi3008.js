/* Using MCP3008 10-bit A/D Converter Chip 
 * 
 * VDD and Vref are connected to Raspberry Pi 3.3 V
 * Channel 0 (pin 1) will be used for analog input voltage using single-ended mode 
 * Since Vref is set to 3.3 V, max. analog input voltage
 * should not be greater than 3.3 V
 * 
 * Read the MCP3008 datasheet on how to configure the chip for more details 
 */

'use strict';

const r = require('array-gpio');

var spi = r.setSPI();
spi.setDataMode(0); 
spi.setClockFreq(128); 
spi.setCSPolarity(0, 0); 

spi.chipSelect(0);

/* setup write and read data buffer */
const wbuf = Buffer.alloc(16); // write buffer
const rbuf = Buffer.alloc(16); // read buffer

/* get voltage reading */
var getVoltage = exports.getVoltage = function(){
	/* configure the chip to use CH0 in single-ended mode */
	wbuf[0] = 0x01; // start bit
	wbuf[1] = 0x80; // using channel 0, single ended
	wbuf[2] = 0x00; // don't care cycle
	spi.write(wbuf, 3);
		
	/* start data transfer, 3 of bytes will be sent to slave and 3 bytes to read from slave */
	//spi.transfer(wbuf, rbuf, 3);

	spi.read(rbuf, 3);
	/* read A/D conversion result */
	/* the 1st byte received through rbuf[0] will be discarded as per datasheet */ 
	var data1 = rbuf[1] << 8;  //2nd byte, using only 2 bits data
	var data2 = rbuf[2];	   //3rd byte, 8 bits data
	var value = data1 + data2; // combine both data to create a 10-bit digital output code 

	/* compute the output voltage */ 
	var vout = (value * 3.3)/1024;
	var v = vout.toFixed(2);

	return v;
}

console.log('voltage using spi', getVoltage());

//spi.end();
//console.log('spi closed');
