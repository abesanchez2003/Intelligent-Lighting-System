#include "LED.h"
#include <stdio.h>
#include "esp_err.h"

    
LED:: LED(int LEDC_OUTPUT_IO, ledc_channel_t LEDC_CHANNEL, bool isOn, ledc_timer_t LEDC_TIMER, ledc_mode_t LEDC_MODE,  
    ledc_timer_bit_t LEDC_DUTY_RES, int LEDC_DUTY , int LEDC_FREQUENCY):
    LEDC_TIMER(LEDC_TIMER),
    LEDC_MODE(LEDC_MODE),
    LEDC_OUTPUT_IO(LEDC_OUTPUT_IO),
    LEDC_CHANNEL(LEDC_CHANNEL),
    LEDC_DUTY_RES(LEDC_DUTY_RES),
    LEDC_DUTY(LEDC_DUTY),
    LEDC_FREQUENCY(LEDC_FREQUENCY),
    isOn(isOn)

{
    if (isOn == false)
    {
        this->LEDC_DUTY = 0;
    }
    ledc_timer_config_t ledc_timer = {};
    ledc_timer.speed_mode = this -> LEDC_MODE;
    ledc_timer.duty_resolution = this -> LEDC_DUTY_RES;
    ledc_timer.timer_num = this -> LEDC_TIMER;
    ledc_timer.freq_hz = this -> LEDC_FREQUENCY;
    ledc_timer.clk_cfg = LEDC_AUTO_CLK;
    ESP_ERROR_CHECK(ledc_timer_config(&ledc_timer));

    ledc_channel_config_t ledc_channel = {};
    ledc_channel.gpio_num = this -> LEDC_OUTPUT_IO;
    ledc_channel.speed_mode = this -> LEDC_MODE;
    ledc_channel.channel =  this -> LEDC_CHANNEL;
    ledc_channel.intr_type = LEDC_INTR_DISABLE;
    ledc_channel.timer_sel = this -> LEDC_TIMER;
    ledc_channel.duty = this -> LEDC_DUTY;
    ledc_channel.hpoint = 0;
    ledc_channel.flags.output_invert = 0;
    ESP_ERROR_CHECK(ledc_channel_config(&ledc_channel));

}
int LED:: getBrightness(){
    return this -> LEDC_DUTY;
}
int LED:: getFreq(){
    return this -> LEDC_FREQUENCY;
}

void LED:: setBrightness(int duty){
    if (duty < 0) duty = 0;
    if (duty > 8191) duty = 8191;
    this -> LEDC_DUTY = duty;
    ESP_ERROR_CHECK(ledc_set_duty( this -> LEDC_MODE, this -> LEDC_CHANNEL,this-> LEDC_DUTY));
    ESP_ERROR_CHECK(ledc_update_duty(this -> LEDC_MODE,this -> LEDC_CHANNEL));
}
int LED:: getState(){
    return this -> isOn;
}
void LED:: setState(bool state){
    this ->isOn = state;
    if (this -> isOn == true){
        this -> LEDC_DUTY = 4096;
    }
    else {
        this -> LEDC_DUTY  = 0;
    }
    setBrightness(this -> LEDC_DUTY);
}

