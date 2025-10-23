#pragma once
#include "inputs.h"
#include "cstdio"
#include "LED.h"
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
    bool user_override = true;
    MotionType motion_type = MotionType:: UNKNOWN;
    uint32_t timeout_ms = 30000;
    

public:
    Light_Controller(LED* warm, LED* cold) : warm_(warm), cold_(warm) {};
    LED* warm_;
    LED* cold_;
    void step(const InputSample& s,unsigned long now);
    bool isSystemOn() const;
    Mode getMode() const;
    void cycleMode();
    void set_motion_type(MotionType type);
    void printStatus();
    void setOnOff(bool mode);


    
                                                                  


};
