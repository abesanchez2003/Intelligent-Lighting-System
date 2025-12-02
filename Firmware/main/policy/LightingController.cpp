#include "LightingController.h"
#include "Timeutils.h"
// Getter implementations
bool Light_Controller::isSystemOn() const {
    return system_on;
}

Mode Light_Controller::getMode() const {
    return SYSTEM_MODE;
}
void Light_Controller::cycleMode() {
    this->SYSTEM_MODE = (this->SYSTEM_MODE == Mode::MANUAL) ? Mode::AUTO : Mode::MANUAL;
}
void Light_Controller:: set_motion_type(MotionType type) {
    this -> motion_type = type;
}
void Light_Controller:: setOnOff(bool mode){
    if(mode == true){
        system_on = true;
    }
    else{
        system_on = false;
    }
}

// Update implementation (policy logic goes here)
void Light_Controller::step(InputSample& s, unsigned long now) {
    // TODO: implement ON/OFF toggle, mode switching, motion timeout
     if (mode_irq_flag) {
        mode_irq_flag = false;
        cycleMode();
    }

    if (onoff_irq_flag) {
        onoff_irq_flag = false;
        setOnOff(!isSystemOn());
    }
    if (SYSTEM_MODE == Mode::AUTO) {
        //system_on = false;
        if(user_override){
            system_on = true;
            return;
        }
        if (motion_irq_flag) {
            s.motion_level = true;
            motion_irq_flag = false;
            system_on = true;
            last_motion_ms  = now; 
            motion_event_latch = true;
        }
        else {
            s.motion_level = false;
        }
        if (system_on && last_motion_ms != 0 && (now - last_motion_ms) >= 30000UL) {
            system_on = false;             
        }
    }
}
void Light_Controller::printStatus() {
    const char* mode_str =
        (SYSTEM_MODE == Mode::AUTO) ? "AUTO" : "MANUAL";
    const char* motion_str =
        (motion_type == MotionType::HUMAN) ? "HUMAN" :
        (motion_type == MotionType::NOT_HUMAN) ? "NOT_HUMAN" : "UNKNOWN";

    // Compute elapsed time since last motion (handles wrap-around)
    uint32_t now_ms      = millis();
    uint32_t elapsed_ms  = 0;
    if (last_motion_ms != 0) {
        elapsed_ms = now_ms - last_motion_ms;  // safe with uint32_t
    }

    printf("\n========== Light Controller Status ==========\n");
    printf("  System On            : %s\n", system_on ? "TRUE" : "FALSE");
    printf("  Mode                 : %s\n", mode_str);
    printf("  Motion Type          : %s\n", motion_str);
    printf("  Last Motion Time (ms): %lu\n",
           static_cast<unsigned long>(last_motion_ms));
    printf("  Timer Elapsed (ms)   : %lu\n",
           static_cast<unsigned long>(elapsed_ms));
    printf("  User Override        : %s\n", user_override ? "TRUE" : "FALSE");
    printf("  Prev OnOff Level     : %d\n", prev_onoff);
    printf("  Prev Mode Level      : %d\n", prev_mode);
    printf("=============================================\n\n");
}

bool Light_Controller::consume_motion_event()
{
    bool was_set = motion_event_latch;
    if (was_set) {
        motion_event_latch = false;
    }
    return was_set;
}