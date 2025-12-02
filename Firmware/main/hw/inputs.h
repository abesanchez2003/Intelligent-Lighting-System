#pragma once
#include "freertos/FreeRTOS.h"
#include "driver/gpio.h"
#include "driver/adc.h"
#include "esp_adc_cal.h" 
#include "config.h"
//#include "driver/i2c.h"
#include "sdkconfig.h"
#include "driver/i2c_master.h"
#include "driver/rtc_io.h"
class Light_Controller;
struct InputSample{
    bool onoff_level;
    bool mode_level;
    bool motion_level = 0;
    int brightness_raw;
    int cct_raw;
    float ambient_raw;
};
struct VEML7700{
     static const i2c_port_num_t i2c_port = 0;
     static const uint8_t i2c_glitch_ignore_cnt = 7;
     static const uint32_t VEML7700_scl_speed_hz = 400000;
     uint8_t reg;
     uint8_t data[2];
     float lux;
     esp_err_t ret;
     i2c_master_bus_handle_t i2c_bus = nullptr;
     i2c_master_dev_handle_t veml_dev = nullptr;

};


class InputManager {
private:
 adc1_channel_t brightnessknob;
 adc1_channel_t cct_knob;
 adc1_channel_t light_sensor;
 VEML7700 ambient;




esp_err_t ci2c_master_init(void);
esp_err_t veml7700_write_config(void);
esp_err_t read_ambient();


public:
    void init();
    InputSample read();
    void printInputSample(InputSample sample);
    void motion_interrupt_init(Light_Controller* ctrl);
    void mode_interrupt_init(Light_Controller* ctrl);
    void onoff_interrupt_init(Light_Controller* ctrl);

};
