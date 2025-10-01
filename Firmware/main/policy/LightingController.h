#pragma once
#include "inputs.h"
enum MotionType{
    UNKNOWN,
    HUMAN,
    NOT_HUMAN
};

enum Mode {
    AUTO,
    MANUAL
};


class Light_Controller {
private:
    Mode SYSTEM_MODE = Mode::MANUAL;
    bool system_on = true;
    unsigned long last_motion_time = 0;
    //Mode PREV_SYSTEM_MODE;
    int prev_onoff = -1;
    int prev_mode = -1;
    bool user_override = false;
    MotionType motion_type = MotionType:: UNKNOWN;
    uint32_t timeout_ms = 30000;


public:
    void step(const InputSample& s,unsigned long now);
    bool isSystemOn() const;
    Mode getMode() const;
    void cycleMode();

    
                                                                  


};
