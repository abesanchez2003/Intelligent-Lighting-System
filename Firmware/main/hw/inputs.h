#pragma once
#include "driver/gpio.h"
#include "driver/adc.h"
#include "esp_adc_cal.h" 
#include "config.h"
struct InputSample{
    bool onoff_level;
    bool mode_level;
    bool motion_level;

    int brightness_raw;
    int cct_raw;
    int ambient_raw;
};


class InputManager {
private:
 adc1_channel_t brightnessknob;
 adc1_channel_t cct_knob;
 adc1_channel_t light_sensor;



public:
    void init();
    InputSample read();


};
