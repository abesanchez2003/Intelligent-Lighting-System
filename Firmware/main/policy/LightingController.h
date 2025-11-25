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
struct InputSample;

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
    unsigned long last_motion_ms = 0;   // 0 = never seen motion
    

public:
    Light_Controller(LED* warm, LED* cold) : warm_(warm), cold_(cold) {};
    LED* warm_;
    LED* cold_;
    volatile bool motion_irq_flag = false;
    volatile bool mode_irq_flag = false;
    volatile bool onoff_irq_flag = false;
    bool motion_event_latch = false;
    void step(InputSample& s,unsigned long now);
    bool isSystemOn() const;
    Mode getMode() const;
    void cycleMode();
    void set_motion_type(MotionType type);
    void printStatus();
    void setOnOff(bool mode);
    bool consume_motion_event();


    
                                                                  


};
