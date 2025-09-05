#include "ApplySetpoint.h"


void applySetpoint(const LedSetpoint& sp, LED& warm, LED& cold){
    if(!sp.on){
        warm.setState(false);
        cold.setState(false);
        return;
    }
    warm.setState(true);
    cold.setState(true);
    warm.setBrightness(static_cast<int>(sp.brightness * sp.warm_ratio));
    cold.setBrightness(static_cast<int>(sp.brightness * sp.cold_ratio));
}