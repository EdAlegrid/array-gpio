/* Using MCP9808 ambient temperatute sensor */

const r = require('array-gpio');

let i2c = r.startI2C(); // using SDA1 and SCL1 pins (pin 3 & 5)
//let i2c = r.startI2C(1); // using SDA1 and SCL1 pins (pin 3 & 5)
//let i2c = r.startI2C(0); // using SDA0 and SCL0 pins (pin 27 & 28)

/* set data transfer speed to 100 kHz */
i2c.setTransferSpeed(200000);
 
/* MCP9808 device address */
let slave = 0x18;

/* access MCP9808 device */
i2c.selectSlave(slave);

/* setup write and read data buffer */
const wbuf = Buffer.alloc(16); // write buffer
const rbuf = Buffer.alloc(16); // read buffer

/* Based on MCP9808 datasheet, compute the temperature */
function computeTemp(){
	let Temp;
  	let UpperByte = rbuf[0], LowerByte = rbuf[1];

 	UpperByte = UpperByte & 0x1F; // Clear flag bits

  	// Temp < 0°C
  	if ((UpperByte & 0x10) == 0x10){
		UpperByte = UpperByte & 0x0F; // Clear SIGN
		Temp = 256 - ((UpperByte * 16) + (LowerByte / 16));
  	}
	// Temp > 0°C
  	else { 
		Temp = ((UpperByte * 16) + (LowerByte / 16));
  	}
  	return Temp;
}

function precisionRound(number, precision) {
  	var factor = Math.pow(10, precision);
  	return Math.round(number * factor) / factor;
}

/* get temperature reading */
var getTemp = exports.getTemp = function () {

  	/* access the internal 16-bit configuration register within MCP9808 */
  	wbuf[0] = 0x01; // address of configuration register
  	wbuf[1] = 0x02; // register upper byte, THYST set with +1.5 C
  	wbuf[2] = 0x00; // register lower byte (power up defaults)
  	i2c.write(wbuf, 3);

  	/* access the internal 16-bit ambient temp register within MCP9808 */
  	wbuf[0] = 0x05; // address of ambient temperature register
  	i2c.write(wbuf, 1);

  	/* read content of ambient temp register */
  	i2c.read(rbuf, 2); 

  	/* function call to compute temperature */
  	var T = computeTemp();
  	//var t = precisionRound(T, 2);
  	var t = T.toFixed(2);
  
  	return t;
}

console.log('temp using i2c', getTemp());

i2c.end();
//console.log('i2c closed');

