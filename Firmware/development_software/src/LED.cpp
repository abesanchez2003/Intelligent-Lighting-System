#include <stdio.h>
#include "driver/ledc.h"
#include "esp_err.h"

class LED {
    private:
        ledc_timer_t LEDC_TIMER; // defines which timer to use 
        ledc_mode_t LEDC_MODE; // defines PWM speedmode beyween LOW and High speeds modes
        int LEDC_OUTPUT_IO; // Specifies GPIO pins 
        ledc_channel_t  LEDC_CHANNEL; 
        ledc_timer_bit_t LEDC_DUTY_RES;
        int LEDC_DUTY; 
        int LEDC_FREQUENCY;
    public:
        LED(ledc_timer_t LEDC_TIMER, ledc_mode_t LEDC_MODE, int LEDC_OUTPUT_IO, ledc_channel_t LEDC_CHANNEL ):
        LEDC_TIMER(LEDC_TIMER),
        LEDC_MODE(LEDC_MODE),
        LEDC_OUTPUT_IO(LEDC_OUTPUT_IO),
        LEDC_CHANNEL(LEDC_CHANNEL)
        {}

        void setBrightness(){
            
        }

};