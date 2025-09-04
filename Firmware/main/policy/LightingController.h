#include "inputs.h"
enum Mode {
    AUTO,
    MANUAL
};

class Light_Controller {
private:
    Mode SYSTEM_MODE;
    bool system_on = true;
    unsigned long last_motion_time = 0;
    Mode PREV_SYSTEM_MODE;
    bool prev_onoff = false;;
    bool user_override = false;

public:
    void update(const InputSample& s,unsigned long now);
    
                                                                  


};
