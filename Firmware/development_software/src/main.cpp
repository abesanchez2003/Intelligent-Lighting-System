#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/gpio.h"
#include <vector>
#include <driver/ledc.h>
#include <esp_err.h>
#include <esp_log.h>
#include <esp_wifi.h>
#include <string>
#include <cstring>
#include <nvs_flash.h>
#include "LED.h"
#include "esp_adc_cal.h"
#include "esp_adc/adc_continuous.h" 
#include "driver/adc.h"


#define LED_PIN GPIO_NUM_2  // ESP32 onboard LED
#define POT_RES GPIO_NUM_35
void delay()
{
    for (int i = 0; i < 1000000000; i++)
    {

    }
}
int connect_wifi(std:: string ssid, std:: string pwd){
    //this function will be responsible for establishing wifi connectivity
    // args(ssid, pwd) takes ssid or wifi network name and network password , 
    static const char* TAG = "connect_wifi";
    if(ssid.length() != 0 && pwd.length() != 0){

        ESP_LOGD(TAG, "Attempting Wifi connection");

        
        wifi_init_config_t init_configuration = WIFI_INIT_CONFIG_DEFAULT();
        
         // setting default wifi initialization configuration
        esp_err_t wifi_init = esp_wifi_init(&init_configuration); // calling wifi initilization and logging success or error
        if (wifi_init == ESP_OK){
            ESP_LOGD(TAG, "Wifi Initilized!");
        }
        else
        {
            ESP_LOGD(TAG, "WiFi Init Status: %s", esp_err_to_name(wifi_init));
            return -1;

        }

        wifi_config_t wifi_credents = {};
        strcpy((char*)wifi_credents.sta.ssid, ssid.c_str());
        strcpy((char*)wifi_credents.sta.password, pwd.c_str());
        ESP_LOGD(TAG,"WiFi SSID %s", wifi_credents.sta.ssid);
        ESP_LOGD(TAG, "WiFi Password %s",wifi_credents.sta.password);

        esp_err_t setCredentials = esp_wifi_set_config(WIFI_IF_STA, &wifi_credents); // setting wifi credentials

        if(setCredentials == ESP_OK){
            ESP_LOGD(TAG, "Credentials Set Successfully");
        }
        else
        {
            ESP_LOGD(TAG, "Credential Setting Status: %s", esp_err_to_name(setCredentials));
        }
        esp_err_t start_wifi = esp_wifi_start(); //starting wifi
        if(start_wifi == ESP_OK){
            ESP_LOGD(TAG, "Wifi Started successfully");

        }
        else
        {
            ESP_LOGD(TAG, "WiFi Start Status: %s", esp_err_to_name(start_wifi));
        } 
        esp_wifi_set_mode(WIFI_MODE_STA);

        esp_err_t wifi_connect = esp_wifi_connect(); // attmepting wifi connection 
        if(wifi_connect == ESP_OK){
            ESP_LOGD(TAG, "Wifi Connected Successfully");
        }
        else
        {
            ESP_LOGD(TAG, "Wifi Connect Status: %s", esp_err_to_name(wifi_connect));
        }
        return 0;

    }
    else
    {
        return -1;
    }
}

void testWifi(){
    volatile uint32_t *output = (volatile uint32_t *)(0x3FF44000 + 0x04);
    volatile uint32_t *enableoutput = (volatile uint32_t *)(0x3FF44000 + 0x20);
    std:: string ssid, pwd;
    ssid = "fivegigas";
    pwd = "twosimps";
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        nvs_flash_erase();  // ⚠️ If NVS is corrupted, erase and re-init
        nvs_flash_init();
    }

    int wifi = connect_wifi(ssid, pwd);
    while(wifi == 0){
        *enableoutput = 1;
        *output = 1 << 0;

    } 
}

extern "C" void app_main(void) {
    //int duty; 
    // ledc_test();
    // ESP_ERROR_CHECK(ledc_set_duty(LEDC_MODE, LEDC_CHANNEL, LEDC_DUTY));

    // ESP_ERROR_CHECK(ledc_update_duty(LEDC_MODE, LEDC_CHANNEL));
    // while(true){
    //     for(int i = 1; i < 5; i++){
    //         duty = 8192.0 / i ;
    //         ledc_set_duty(LEDC_MODE, LEDC_CHANNEL, duty);
    //         ledc_update_duty(LEDC_MODE, LEDC_CHANNEL);
    //         vTaskDelay(5000 / portTICK_PERIOD_MS);
    //     } 
    //     for(int i = 1; i < 5; i++){
    //         uint32_t freq = i * 10;
    //         ledc_set_freq(LEDC_MODE, LEDC_TIMER, freq);
    //         vTaskDelay(5000 / portTICK_PERIOD_MS);
    //     }
    //     vTaskDelay(5000 / portTICK_PERIOD_MS);
    // }

    
    //LED Green(0,LEDC_CHANNEL_0);
    LED Blue(23,LEDC_CHANNEL_1);
    // LED Y(23,LEDC_CHANNEL_2);
    // LED RED(6,LEDC_CHANNEL_3);
    // while (true) {
    //     Green.setBrightness(8191);
    //     Blue.setBrightness(8191);
    //     Y.setBrightness(8191);
    //     RED.setBrightness(8191);
    // }
    //gpio_num_t outputVolt = GPIO_NUM_26; // so this will be outputting 3.3V or high volt that will connect to one of the pot terminals
    gpio_num_t pot_input = GPIO_NUM_36; // this will be the actual voltage divider terminal and will be read in to correspond with loights
    //gpio_config_t outputvoltconfig{};
    gpio_config_t pot_config {};

    //outputvoltconfig.pin_bit_mask = (1ULL << outputVolt);
    //outputvoltconfig.mode = GPIO_MODE_OUTPUT; // setting gpio to high
   //gpio_config(&outputvoltconfig);
    
    pot_config.pin_bit_mask = (1ULL << pot_input); //configuring voltage divider by the pot
    pot_config.mode = GPIO_MODE_INPUT;
    gpio_config(&pot_config);

    adc_continuous_handle_cfg_t handle_config {}; // setting paramaters for adc vaue storage
    handle_config.max_store_buf_size = 512;
    handle_config.conv_frame_size = 64;

   adc_continuous_handle_t adc_handle;
   ESP_ERROR_CHECK(adc_continuous_new_handle(&handle_config, &adc_handle));
   adc_continuous_config_t adc_config {};

   adc_digi_pattern_config_t adc_arr [1];
   adc_arr[0].atten = ADC_ATTEN_DB_11;
   adc_arr[0].channel = ADC_CHANNEL_0;
   //adc_arr[0].bit_width = ADC_BITWIDTH_12;
   adc_config.sample_freq_hz = 1000;
   adc_config.pattern_num = 1;
   adc_config.conv_mode = ADC_CONV_SINGLE_UNIT_1;
   adc_config.format = ADC_DIGI_OUTPUT_FORMAT_TYPE1;
   adc_config.adc_pattern = adc_arr;

   ESP_ERROR_CHECK(adc_continuous_config(adc_handle, &adc_config));
   ESP_ERROR_CHECK(adc_continuous_start(adc_handle));
   uint8_t adc_data[64];
   uint32_t read_len = 0;
   static const char* TAG = "MAIN";


    while(true){
        //if(adc_continuous_read(adc_handle,adc_data,sizeof(adc_data),&read_len,1000) == ESP_OK){
            //int raw_value = adc_data[0] | (adc_data[1] << 8);
            int raw_value = adc1_get_raw(ADC1_CHANNEL_0);
            int brightness = (raw_value * 8191) / 4095;
            //printf("ADC Raw: %d | PWM: %d\n", raw_value, brightness);
            Blue.setBrightness(brightness);
        //}
        vTaskDelay(pdMS_TO_TICKS(10));
     
    }

    
}