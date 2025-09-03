#include "LED.h"
#include "esp_adc_cal.h"
#include "esp_adc/adc_continuous.h" 
#include "driver/adc.h"



void handleManual(LED& warm, LED& cold, adc1_channel_t brightnessknob, adc1_channel_t cct_knob, int& prev_system_brightness_knob_voltage);
void handleSemi(LED& warm, LED& cold, adc1_channel_t cct_knob,  adc1_channel_t light_sensor);
void handleAuto(LED& warm, LED& cold,  adc1_channel_t light_sensor);