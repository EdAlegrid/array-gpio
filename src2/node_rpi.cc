/*
 * Copyright (c) 2017 Ed Alegrid <ealegrid@gmail.com>
 */

#include <nan.h>
#include <unistd.h>
#include <errno.h>
#include "rpi.h"

#define LIBNAME node_bcm
#define BCM_EVENT_LOW	0x1
#define BCM_EVENT_HIGH	0x2

using namespace Nan;

/*
 *  rpi initialization
 */
NAN_METHOD(rpi_init)
{
	if((info.Length() != 1) || (!info[0]->IsNumber())){
	  return ThrowTypeError("Incorrect arguments");
  }

  uint8_t arg = info[0]->IntegerValue(Nan::GetCurrentContext()).ToChecked();
  rpi_init(arg);
}

/*
 *  rpi closing 
 */
NAN_METHOD(rpi_close)
{
	uint8_t rval;

	rval = rpi_close();
  info.GetReturnValue().Set(rval);
}

/*
 *  time delays 
 */
NAN_METHOD(nswait)
{
	if((info.Length() != 1) || (!info[0]->IsNumber())){
	  return ThrowTypeError("Incorrect arguments");
  }

  uint64_t arg = info[0]->IntegerValue(Nan::GetCurrentContext()).ToChecked();
	nswait(arg);
}

NAN_METHOD(uswait)
{
	if((info.Length() != 1) || (!info[0]->IsNumber())){
	  return ThrowTypeError("Incorrect arguments");
  }

  uint32_t arg = info[0]->IntegerValue(Nan::GetCurrentContext()).ToChecked();
	uswait(arg);
}

NAN_METHOD(mswait)
{
	if((info.Length() != 1) || (!info[0]->IsNumber())){
	  return ThrowTypeError("Incorrect arguments");
  }

	uint32_t arg = info[0]->IntegerValue(Nan::GetCurrentContext()).ToChecked();
  mswait(arg);
}

/*
 *  GPIO
 */
NAN_METHOD(gpio_config) 
{
	if((info.Length() != 2) || (!info[0]->IsNumber()) || (!info[1]->IsNumber())){
	  return ThrowTypeError("Incorrect arguments");
  }

  uint8_t arg1 = info[0]->IntegerValue(Nan::GetCurrentContext()).ToChecked();
  uint8_t arg2 = info[1]->IntegerValue(Nan::GetCurrentContext()).ToChecked();

  gpio_config(arg1, arg2);
}

NAN_METHOD(gpio_input) 
{
	if((info.Length() != 1) || (!info[0]->IsNumber())){
	  return ThrowTypeError("Incorrect arguments");
  }

  uint8_t arg = info[0]->IntegerValue(Nan::GetCurrentContext()).ToChecked();
  gpio_input(arg);
}

NAN_METHOD(gpio_output) 
{
	if((info.Length() != 1) || (!info[0]->IsNumber())){
	  return ThrowTypeError("Incorrect arguments");
  }

	uint8_t arg = info[0]->IntegerValue(Nan::GetCurrentContext()).ToChecked();
  gpio_output(arg);
}

NAN_METHOD(gpio_read) 
{
	uint8_t rval;

	if((info.Length() != 1) || (!info[0]->IsNumber())){
	  return ThrowTypeError("Incorrect arguments");
  }

	uint8_t arg = info[0]->IntegerValue(Nan::GetCurrentContext()).ToChecked();

  rval = gpio_read(arg);
	info.GetReturnValue().Set(rval);
}

NAN_METHOD(gpio_write) 
{
	uint8_t rval;

	if((info.Length() != 2) || (!info[0]->IsNumber()) || (!info[1]->IsNumber())){
	  return ThrowTypeError("Incorrect arguments");
  }

  uint8_t arg1 = info[0]->IntegerValue(Nan::GetCurrentContext()).ToChecked();
  uint8_t arg2 = info[1]->IntegerValue(Nan::GetCurrentContext()).ToChecked();

  rval = gpio_write(arg1, arg2);

	info.GetReturnValue().Set(rval);
}

NAN_METHOD(gpio_enable_pud)
{
	if((info.Length() != 2) || (!info[0]->IsNumber()) || (!info[1]->IsNumber())){
	  return ThrowTypeError("Incorrect arguments");
  }

	uint8_t arg1 = info[0]->IntegerValue(Nan::GetCurrentContext()).ToChecked();
  uint8_t arg2 = info[1]->IntegerValue(Nan::GetCurrentContext()).ToChecked();

  gpio_enable_pud(arg1, arg2);
}

/*
 *  PWM
 */
NAN_METHOD(pwm_set_pin)
{
	if((info.Length() != 1) || (!info[0]->IsNumber())){
	  return ThrowTypeError("Incorrect arguments");
  }

	uint8_t arg = info[0]->IntegerValue(Nan::GetCurrentContext()).ToChecked();

	pwm_set_pin(arg);
}

NAN_METHOD(pwm_reset_pin)
{
	if((info.Length() != 1) || (!info[0]->IsNumber())){
	  return ThrowTypeError("Incorrect arguments");
  }

	uint8_t arg = info[0]->IntegerValue(Nan::GetCurrentContext()).ToChecked();

	pwm_reset_pin(arg);
}

NAN_METHOD(pwm_reset_all_pins)
{
	pwm_reset_all_pins();
}

NAN_METHOD(pwm_set_clock_freq)
{
	uint8_t rval;

	if((info.Length() != 1) || (!info[0]->IsNumber())){
	  return ThrowTypeError("Incorrect arguments");
  }

  uint32_t arg = info[0]->IntegerValue(Nan::GetCurrentContext()).ToChecked();

	rval = pwm_set_clock_freq(arg);
	info.GetReturnValue().Set(rval);
}

NAN_METHOD(pwm_clk_status)
{
	uint8_t rval;
	rval = pwm_clk_status();
	info.GetReturnValue().Set(rval);
}

NAN_METHOD(pwm_enable)
{
	if((info.Length() != 2) || (!info[0]->IsNumber()) || (!info[1]->IsNumber())){
	  return ThrowTypeError("Incorrect arguments");
  }

	uint8_t arg1 = info[0]->IntegerValue(Nan::GetCurrentContext()).ToChecked();
  uint8_t arg2 = info[1]->IntegerValue(Nan::GetCurrentContext()).ToChecked();

	pwm_enable(arg1, arg2);
}

NAN_METHOD(pwm_set_mode)
{
	if((info.Length() != 2) || (!info[0]->IsNumber()) || (!info[1]->IsNumber())){
	  return ThrowTypeError("Incorrect arguments");
  }

	uint8_t arg1 = info[0]->IntegerValue(Nan::GetCurrentContext()).ToChecked();
  uint8_t arg2 = info[1]->IntegerValue(Nan::GetCurrentContext()).ToChecked();

	pwm_set_mode(arg1, arg2);
}

NAN_METHOD(pwm_set_pola)
{
	if((info.Length() != 2) || (!info[0]->IsNumber()) || (!info[1]->IsNumber())){
	  return ThrowTypeError("Incorrect arguments");
  }

	uint8_t arg1 = info[0]->IntegerValue(Nan::GetCurrentContext()).ToChecked();
  uint8_t arg2 = info[1]->IntegerValue(Nan::GetCurrentContext()).ToChecked();

  pwm_set_pola(arg1, arg2);
}

NAN_METHOD(pwm_set_data)
{
	if((info.Length() != 2) || (!info[0]->IsNumber()) || (!info[1]->IsNumber())){
	  return ThrowTypeError("Incorrect arguments");
  }

  uint8_t arg1 = info[0]->IntegerValue(Nan::GetCurrentContext()).ToChecked();
  uint32_t arg2 = info[1]->IntegerValue(Nan::GetCurrentContext()).ToChecked();

	pwm_set_data(arg1, arg2);
}

NAN_METHOD(pwm_set_range)
{
	if((info.Length() != 2) || (!info[0]->IsNumber()) || (!info[1]->IsNumber())){
	  return ThrowTypeError("Incorrect arguments");
  }

	uint8_t arg1 = info[0]->IntegerValue(Nan::GetCurrentContext()).ToChecked();
  uint32_t arg2 = info[1]->IntegerValue(Nan::GetCurrentContext()).ToChecked();

  pwm_set_range(arg1, arg2);
}


/*
 *  i2c
 */
NAN_METHOD(i2c_start)
{
	uint8_t rval;
	rval = i2c_start();
	info.GetReturnValue().Set(rval);
}

NAN_METHOD(i2c_stop)
{
	i2c_stop();
}

NAN_METHOD(i2c_select_slave)
{
	if((info.Length() != 1) || (!info[0]->IsNumber())){
	  return ThrowTypeError("Incorrect arguments");
  }

	uint8_t arg = info[0]->IntegerValue(Nan::GetCurrentContext()).ToChecked();
        
  i2c_select_slave(arg);
}

NAN_METHOD(i2c_set_clock_freq)
{
	if((info.Length() != 1) || (!info[0]->IsNumber())){
	  return ThrowTypeError("Incorrect arguments");
  }
	uint16_t arg = info[0]->IntegerValue(Nan::GetCurrentContext()).ToChecked();

	i2c_set_clock_freq(arg);
}

NAN_METHOD(i2c_data_transfer_speed)
{
	if((info.Length() != 1) || (!info[0]->IsNumber())){
	  return ThrowTypeError("Incorrect arguments");
  }

	uint32_t arg = info[0]->IntegerValue(Nan::GetCurrentContext()).ToChecked();

	i2c_data_transfer_speed(arg);
}

NAN_METHOD(i2c_write)
{
  uint8_t rval;

	if((info.Length() != 2) || (!info[0]->IsObject()) || (!info[1]->IsNumber())){
	  return ThrowTypeError("Incorrect arguments");
  }

	v8::Local<v8::Object> wbuf =  info[0]->ToObject(Nan::GetCurrentContext()).FromMaybe(v8::Local<v8::Object>());
	uint8_t arg = info[1]->IntegerValue(Nan::GetCurrentContext()).ToChecked();

  rval = i2c_write(node::Buffer::Data(wbuf), arg);
	info.GetReturnValue().Set(rval);
}

NAN_METHOD(i2c_read)
{
  uint8_t rval;

	if((info.Length() != 2) || (!info[0]->IsObject()) || (!info[1]->IsNumber())){
	  return ThrowTypeError("Incorrect arguments");
  }
	
  v8::Local<v8::Object> rbuf =  info[0]->ToObject(Nan::GetCurrentContext()).FromMaybe(v8::Local<v8::Object>());
	uint8_t arg = info[1]->IntegerValue(Nan::GetCurrentContext()).ToChecked();

	rval = i2c_read(node::Buffer::Data(rbuf), arg);
	info.GetReturnValue().Set(rval);

}

NAN_METHOD(i2c_byte_read)
{
	uint8_t rval;

	rval = i2c_byte_read();
	info.GetReturnValue().Set(rval);
}

/*
 *  SPI
 */
NAN_METHOD(spi_start)
{
	uint8_t rval;
	rval = spi_start();
	info.GetReturnValue().Set(rval);
}

NAN_METHOD(spi_stop)
{
	spi_stop();
}

NAN_METHOD(spi_set_clock_freq)
{
	if((info.Length() != 1) || (!info[0]->IsNumber())){
	  return ThrowTypeError("Incorrect arguments");
  }

	uint16_t arg = info[0]->IntegerValue(Nan::GetCurrentContext()).ToChecked();

	spi_set_clock_freq(arg);
}

NAN_METHOD(spi_set_data_mode)
{
	if((info.Length() != 1) || (!info[0]->IsNumber())){
	  return ThrowTypeError("Incorrect arguments");
  }

	uint8_t arg = info[0]->IntegerValue(Nan::GetCurrentContext()).ToChecked();

	spi_set_data_mode(arg);
}

NAN_METHOD(spi_set_chip_select_polarity)
{
	if((info.Length() != 2) || (!info[0]->IsNumber()) || (!info[1]->IsNumber())){
	  return ThrowTypeError("Incorrect arguments");
  }

	uint8_t arg1 = info[0]->IntegerValue(Nan::GetCurrentContext()).ToChecked();
        uint8_t arg2 = info[1]->IntegerValue(Nan::GetCurrentContext()).ToChecked();

	spi_set_chip_select_polarity(arg1, arg2);
}

NAN_METHOD(spi_chip_select)
{
	if((info.Length() != 1) || (!info[0]->IsNumber())){
	  return ThrowTypeError("Incorrect arguments");
  }

	uint8_t arg = info[0]->IntegerValue(Nan::GetCurrentContext()).ToChecked();

	spi_chip_select(arg);
}

NAN_METHOD(spi_data_transfer)
{
	if((info.Length() != 3) || (!info[0]->IsObject()) || (!info[1]->IsObject()) || (!info[2]->IsNumber())){
	  return ThrowTypeError("Incorrect arguments");
  }

	v8::Local<v8::Object> wbuf =  info[0]->ToObject(Nan::GetCurrentContext()).FromMaybe(v8::Local<v8::Object>());
	v8::Local<v8::Object> rbuf =  info[1]->ToObject(Nan::GetCurrentContext()).FromMaybe(v8::Local<v8::Object>());
	uint8_t arg = info[2]->IntegerValue(Nan::GetCurrentContext()).ToChecked();

	spi_data_transfer(node::Buffer::Data(wbuf), node::Buffer::Data(rbuf), arg);
}

NAN_METHOD(spi_write)
{
 	if((info.Length() != 2) || (!info[0]->IsObject()) || (!info[1]->IsNumber())){
	  return ThrowTypeError("Incorrect arguments");
  }

	v8::Local<v8::Object> wbuf =  info[0]->ToObject(Nan::GetCurrentContext()).FromMaybe(v8::Local<v8::Object>());
	uint8_t arg = info[1]->IntegerValue(Nan::GetCurrentContext()).ToChecked();

	spi_write(node::Buffer::Data(wbuf), arg);
}

NAN_METHOD(spi_read)
{
	if((info.Length() != 2) || (!info[0]->IsObject()) || (!info[1]->IsNumber())){
	  return ThrowTypeError("Incorrect arguments");
  }

	v8::Local<v8::Object> rbuf =  info[0]->ToObject(Nan::GetCurrentContext()).FromMaybe(v8::Local<v8::Object>());
	uint8_t arg = info[1]->IntegerValue(Nan::GetCurrentContext()).ToChecked();

	spi_read(node::Buffer::Data(rbuf), arg);
}

NAN_MODULE_INIT(setup)
{
	NAN_EXPORT(target, rpi_init);
	NAN_EXPORT(target, rpi_close);
	NAN_EXPORT(target, nswait);
	NAN_EXPORT(target, uswait);
	NAN_EXPORT(target, mswait);

  /* gpio */
	NAN_EXPORT(target, gpio_config);
	NAN_EXPORT(target, gpio_input);
	NAN_EXPORT(target, gpio_output);
  NAN_EXPORT(target, gpio_read);
	NAN_EXPORT(target, gpio_write);
	NAN_EXPORT(target, gpio_enable_pud);

	/* pwm */
  NAN_EXPORT(target, pwm_set_pin);
	NAN_EXPORT(target, pwm_reset_pin);
	NAN_EXPORT(target, pwm_reset_all_pins);
	NAN_EXPORT(target, pwm_set_clock_freq);
	NAN_EXPORT(target, pwm_clk_status);
  NAN_EXPORT(target, pwm_enable);
	NAN_EXPORT(target, pwm_set_mode);
	NAN_EXPORT(target, pwm_set_pola);
	NAN_EXPORT(target, pwm_set_data);
	NAN_EXPORT(target, pwm_set_range);

  /* i2c */
  NAN_EXPORT(target, i2c_start);
	NAN_EXPORT(target, i2c_stop);
	NAN_EXPORT(target, i2c_select_slave);
	NAN_EXPORT(target, i2c_set_clock_freq);
	NAN_EXPORT(target, i2c_data_transfer_speed);
	NAN_EXPORT(target, i2c_write);
  NAN_EXPORT(target, i2c_read);
	NAN_EXPORT(target, i2c_byte_read);

	/* spi */
	NAN_EXPORT(target, spi_start);
	NAN_EXPORT(target, spi_stop);
  NAN_EXPORT(target, spi_set_clock_freq);
	NAN_EXPORT(target, spi_set_data_mode);
  NAN_EXPORT(target, spi_set_chip_select_polarity);
	NAN_EXPORT(target, spi_chip_select);
  NAN_EXPORT(target, spi_data_transfer);
	NAN_EXPORT(target, spi_write);
	NAN_EXPORT(target, spi_read);
}

NODE_MODULE(LIBNAME, setup)

