#include "LightingController.h"

// Getter implementations
bool Light_Controller::isSystemOn() const {
    return system_on;
}

Mode Light_Controller::getMode() const {
    return SYSTEM_MODE;
}
void Light_Controller::cycleMode() {
    SYSTEM_MODE = static_cast<Mode>(
        (static_cast<int>(system_mode) + 1) % static_cast<int>(Mode::COUNT)
    );
}

// Update implementation (policy logic goes here)
void Light_Controller::step(const InputSample& s, unsigned long now) {
    // TODO: implement ON/OFF toggle, mode switching, motion timeout
    bool curOnoff = s.onoff_level;
    if(prev_onoff == -1)prev_onoff = curOnoff;
    if(curOnoff == 0 && prev_onoff == 1){
        system_on = !system_on;
    }
    prev_onoff = curOnoff;
    if(s.mode_level){
        cycleMode();
    }
    if (SYSTEM_MODE == Mode::AUTO) {
        if (s.motion_level) {
            system_on = true;
            last_motion_time = now;
            if(motion_type == MotionType:: NOT_HUMAN) system_on = false;
        } else if (system_on && (now - last_motion_time > timeout_ms)) {
            system_on = false;
        }
    
        if(user_override){
            system_on = true;
        }
    }
}
