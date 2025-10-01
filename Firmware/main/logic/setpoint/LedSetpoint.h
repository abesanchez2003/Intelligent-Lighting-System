#pragma once
#include "LED.h"
#include "esp_adc_cal.h"
//#include "esp_adc/adc_continuous.h" 
#include "driver/adc.h"
#include <cmath>
struct LedSetpoint{
    bool on;
    int brightness;
    double warm_ratio;
    double cold_ratio;
};
struct AutoConfig {
    double warm_ratio = 0.5;
    double cold_ratio = 0.5;
    double kp = 1.0;
    int min_brightness = 0;
    int max_brightness = 8191;
};


LedSetpoint handleManual(int brightnessknob, int cct_knob, int& prev_system_brightness_knob_voltage);
LedSetpoint handleAuto(int light_sensor, bool motion_level, AutoConfig cfg);
double calc_system_temperature(LED warm, LED cold);
bool isEqual(LedSetpoint old, LedSetpoint current);