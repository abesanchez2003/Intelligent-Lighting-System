#ifndef LED_H
#define LED_H

#include "driver/ledc.h" 

class LED{
    private:
    ledc_timer_t LEDC_TIMER; // defines which timer to use 
    ledc_mode_t LEDC_MODE; // defines PWM speedmode beyween LOW and High speeds modes
    int LEDC_OUTPUT_IO; // Specifies GPIO pins 
    ledc_channel_t  LEDC_CHANNEL; 
    ledc_timer_bit_t LEDC_DUTY_RES; // timer resolution
    int LEDC_DUTY; // duty cycle for pwm
    int LEDC_FREQUENCY;
    bool isOn;

    public:
        LED(int LEDC_OUTPUT_IO, ledc_channel_t LEDC_CHANNEL, bool isOn = true, ledc_timer_t LEDC_TIMER = LEDC_TIMER_0, 
            ledc_mode_t LEDC_MODE = LEDC_LOW_SPEED_MODE, 
            ledc_timer_bit_t LEDC_DUTY_RES = LEDC_TIMER_13_BIT, 
            int LEDC_DUTY = 0, int LEDC_FREQUENCY  = 5000 );
        int getBrightness();
        int getFreq();
        void setBrightness(int duty);
        int getState();
        void setState(bool state);
};

#endif