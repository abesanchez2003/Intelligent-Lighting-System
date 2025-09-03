#include "modes.h"
void handleManual(LED& warm, LED& cold, adc1_channel_t brightnessknob, adc1_channel_t cct_knob, int& prev_system_brightness_knob_voltage) {
    int cct_knob_voltage = adc1_get_raw(cct_knob);
    double cold_ratio = cct_knob_voltage / 4095.0;
    double warm_ratio = 1.0 - cold_ratio;

    int system_brightness_knob_voltage = adc1_get_raw(brightnessknob);
    if (prev_system_brightness_knob_voltage == -1) {
        prev_system_brightness_knob_voltage = system_brightness_knob_voltage;
    }

    double brightness_scale = system_brightness_knob_voltage / 4095.0; // 0.0 to 1.0
    double prev_brightness_scale = prev_system_brightness_knob_voltage / 4095.0;
    double brightness_scale_change = brightness_scale - prev_brightness_scale;

    if (cold.getState() && warm.getState()) {
        // Each channel independently goes up to full 8191
        warm.setBrightness(static_cast<int>(brightness_scale * warm_ratio * 8191));
        cold.setBrightness(static_cast<int>(brightness_scale * cold_ratio * 8191));
    }

    prev_system_brightness_knob_voltage = system_brightness_knob_voltage;

    printf("warm brightness: %d\tcold brightness: %d\n", warm.getBrightness(), cold.getBrightness());
    printf("Brightness knob raw ADC: %d\n", system_brightness_knob_voltage);
}

void handleSemi(LED& warm, LED& cold, adc1_channel_t cct_knob,  adc1_channel_t light_sensor){
    int cct_knob_voltage = adc1_get_raw(cct_knob);
    double cct = calc_system_temperature(warm, cold); 
    double cold_ratio = cct_knob_voltage / 4095.0;
    double warm_ratio = 1.0 - cold_ratio;
    int cct_knob_brightness = (cct_knob_voltage * 8191) / 4095;

    double light_sensor_voltage = (adc1_get_raw(light_sensor) * 3.3) / 4095;
    double light_current = (3.3 - light_sensor_voltage) / 10000.0;
    double lux = light_current / 0.000002;
    double lux_difference = TARGET_LUX - lux;
    //int total_brightness = warm.getBrightness() + cold.getBrightness();
    static int base_brightness = 2048;
    int adjusted_brightness = base_brightness + static_cast<int>(lux_difference * 1);
    if(adjusted_brightness > 8191) adjusted_brightness = 8191;
    if(adjusted_brightness < 0) adjusted_brightness = 0;
    base_brightness = adjusted_brightness;


    // if (abs(lux_difference) > 2) {
    //     total_brightness += static_cast<int>(lux_difference);
    // }
    cold.setBrightness(adjusted_brightness * cold_ratio);
    warm.setBrightness(adjusted_brightness * warm_ratio);

    printf("warm brightness: %d\tcold brightness: %d\n", warm.getBrightness(), cold.getBrightness());
    printf("light sensor raw ADC: %d\n", adc1_get_raw(light_sensor));
    //printf("System Brightness: %d", SYSTEM_BRIGHTNESS);

}
void handleAuto(LED& warm, LED& cold,  adc1_channel_t light_sensor){
    double preset_cold_ratio = 0.5;
    double preset_warm_ratio = 0.5 ;
    static int SYSTEM_BRIGHTNESS = 4096;
    double light_sensor_voltage = (adc1_get_raw(light_sensor) * 3.3) / 4095;
    double light_current = (3.3 - light_sensor_voltage) / 10000.0;
    double lux = light_current / 0.000002;
    double lux_difference = TARGET_LUX - lux;

    if (cold.getBrightness() == 0 && warm.getBrightness() == 0) {
        cold.setState(false);
        warm.setState(false);
    }

    if (gpio_get_level(MOTION_SENSOR) == 1 && !cold.getState() && !warm.getState()) {
        printf("Motion Detected");
        cold.setState(true);
        warm.setState(true);
    }

    static int base_brightness = 2048;
    int adjusted_brightness = base_brightness + static_cast<int>(lux_difference * 1);
    if(adjusted_brightness > 8191) adjusted_brightness = 8191;
    if(adjusted_brightness < 0) adjusted_brightness = 0;
    base_brightness = adjusted_brightness;

    cold.setBrightness(base_brightness * preset_cold_ratio);
    warm.setBrightness(base_brightness * preset_warm_ratio);

    printf("warm brightness: %d\tcold brightness: %d\n", warm.getBrightness(), cold.getBrightness());
    printf("light sensor raw ADC: %d\n", adc1_get_raw(light_sensor));

    printf("Light sensor voltage: %.2f V\n", light_sensor_voltage);
    //printf("System Brightness: %d", SYSTEM_BRIGHTNESS);




}