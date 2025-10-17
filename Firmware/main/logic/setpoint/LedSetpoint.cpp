#include "LedSetpoint.h"
#include "config.h"
double calc_system_temperature(LED warm, LED cold){
    // this function takes in warm and cold channel LED object and calculates the lighting system temperature
    
    double warm_bright_perc = (warm.getBrightness() / 8191.0) * 100.0;
    double cold_bright_perc = (cold.getBrightness() / 8191.0) * 100.0;
    double  cct = ( warm_bright_perc * 2700.0) + (cold_bright_perc * 6500);
    return cct;
}
LedSetpoint handleManual(int brightnessknob, int cct_knob, int& prev_system_brightness_knob_voltage) {
    int cct_knob_voltage = cct_knob;
    double cold_ratio = cct_knob_voltage / 4095.0;
    double warm_ratio = 1.0 - cold_ratio;

    int system_brightness_knob_voltage = brightnessknob;
    if (prev_system_brightness_knob_voltage == -1) prev_system_brightness_knob_voltage = system_brightness_knob_voltage;
    

    double brightness_scale = system_brightness_knob_voltage / 4095.0; // 0.0 to 1.0
    double prev_brightness_scale = prev_system_brightness_knob_voltage / 4095.0;
    double brightness_scale_change = brightness_scale - prev_brightness_scale;

    int warm_brightness = static_cast<int>(brightness_scale * warm_ratio * 8191);
    int cold_brightness = static_cast<int>(brightness_scale * cold_ratio * 8191);

    // if (cold.getState() && warm.getState()) {
    //     // Each channel independently goes up to full 8191
    //     warm.setBrightness(static_cast<int>(brightness_scale * warm_ratio * 8191));
    //     cold.setBrightness(static_cast<int>(brightness_scale * cold_ratio * 8191));
    // }

    prev_system_brightness_knob_voltage = system_brightness_knob_voltage;
    return {true,static_cast<int> (brightness_scale * 8191), warm_ratio,cold_ratio};

    // printf("warm brightness: %d\tcold brightness: %d\n", warm.getBrightness(), cold.getBrightness());
    // printf("Brightness knob raw ADC: %d\n", system_brightness_knob_voltage);
}

LedSetpoint handleAuto(double lux, bool lights_on, LedSetpoint cur, AutoConfig cfg = {}){
    static int SYSTEM_BRIGHTNESS = 4096;
    double lux_difference = cfg.target_lux - lux;

    // if (cold.getBrightness() == 0 && warm.getBrightness() == 0) {
    //     cold.setState(false);
    //     warm.setState(false);
    // }

    // if (motion_level && !cold.getState() && !warm.getState()) {
    //     printf("Motion Detected");
    //     cold.setState(true);
    //     warm.setState(true);
    // }
    //int w = (int)lroundf(sp.brightness * sp.warm_ratio);
    //int c = sp.brightness - w;
    int base_brightness = cur.brightness;
    int adjusted_brightness = base_brightness + static_cast<int>(lux_difference * cfg.kp);
    if(adjusted_brightness > cfg.max_brightness) adjusted_brightness = cfg.max_brightness;
    if(adjusted_brightness < cfg.min_brightness) adjusted_brightness = cfg.min_brightness;
    base_brightness = adjusted_brightness;

    // cold.setBrightness(base_brightness * preset_cold_ratio);
    // warm.setBrightness(base_brightness * preset_warm_ratio);

    // printf("warm brightness: %d\tcold brightness: %d\n", warm.getBrightness(), cold.getBrightness());
    // printf("light sensor raw ADC: %d\n", light_sensor);

    //printf("Light sensor voltage: %.2f V\n", light_sensor_voltage);
    //printf("System Brightness: %d", SYSTEM_BRIGHTNESS);
    if(!lights_on) return {false,0,cfg.warm_ratio,cfg.cold_ratio};
    return {lights_on, adjusted_brightness, cfg.warm_ratio, cfg.cold_ratio};
}
 bool nearlySameSetpoint(const LedSetpoint& a, const LedSetpoint& b) {
    if (a.on != b.on) return false;

    const int   BRI_TOL = 32;     // counts (0..8191)
    const float RAT_TOL = 0.01f;  // 1%

    if (std::abs(a.brightness - b.brightness) > BRI_TOL) return false;

    // Normalize (avoid double-comparing warm & cold)
    auto norm = [](float r){ return clamp_val(r, 0.0f, 1.0f); };
    float aw = norm(a.warm_ratio),  bw = norm(b.warm_ratio);

    return std::fabs(aw - bw) <= RAT_TOL;
}