#include "inputs.h"

void InputManager:: init(){
    adc1_config_width(ADC_WIDTH_BIT_12); 
    // Configure the ADC1 channel (ADC1_CHANNEL_6 - pin 34), and setting attenuation (ADC_ATTEN_DB_11)
    brightnessknob = ADC1_CHANNEL_4;
    cct_knob = ADC1_CHANNEL_5;
    light_sensor = ADC1_CHANNEL_3;
    adc1_config_channel_atten(brightnessknob, ADC_ATTEN_DB_11);
    adc1_config_channel_atten(light_sensor,ADC_ATTEN_DB_11);
    adc1_config_channel_atten(cct_knob, ADC_ATTEN_DB_11);
    gpio_config_t onoff_conf = {
        .pin_bit_mask = (1ULL << OnOff),
        .mode = GPIO_MODE_INPUT,
        .pull_up_en = GPIO_PULLUP_DISABLE,  // already externally pulled up via R4
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .intr_type = GPIO_INTR_DISABLE
    };
    gpio_config(&onoff_conf);
}
InputSample InputManager:: read(){
    InputSample s;
    s.onoff_level     = (gpio_get_level(OnOff) == 0);
    s.mode_level      = (gpio_get_level(MODE_SELECT) == 0);
    s.motion_level    = (gpio_get_level(MOTION_SENSOR) == 1);
    s.brightness_raw  = adc1_get_raw(brightnessknob);
    s.cct_raw         = adc1_get_raw(cct_knob);
    s.ambient_raw     = adc1_get_raw(light_sensor);
    return s;


}