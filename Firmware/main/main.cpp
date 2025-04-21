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
#define MODE_SELECT GPIO_NUM_17
#define MOTION_SENSOR GPIO_NUM_13
#define OnOff GPIO_NUM_8
#define TARGET_LUX

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

double calc_system_temperature(LED warm, LED cold){

    // this function takes in warm and cold channel LED object and calculates the lighting system temperature
    double warm_bright_perc = (warm.getBrightness() / 8191.0) * 100.0;
    double cold_bright_perc = (cold.getBrightness() / 8191.0) * 100.0;
    double  cct = ( warm_bright_perc * 2700.0) + (cold_bright_perc * 6500);

    return cct;


}
void handleManual(LED& warm, LED& cold, adc1_channel_t brightnessknob,  adc1_channel_t cct_knob, int& prev_system_brightness_knob_voltage){
    int cct_knob_voltage = adc1_get_raw(cct_knob);
    double cct = calc_system_temperature(warm, cold); 
    double cold_ratio = cct_knob_voltage / 4095.0;
    double warm_ratio = 1.0 - cold_ratio;
    int cct_knob_brightness = (cct_knob_voltage * 8191) / 4095;

    int system_brightness_knob_voltage = adc1_get_raw(brightnessknob);
    if (prev_system_brightness_knob_voltage == -1) {
        prev_system_brightness_knob_voltage = system_brightness_knob_voltage;
    }

    int prev_system_brightness = (prev_system_brightness_knob_voltage * 8191) / 4095;
    int system_brightness = (system_brightness_knob_voltage * 8191) / 4095;
    int system_brightness_change = system_brightness - prev_system_brightness;

    if (abs(system_brightness_change) > 2 && cold.getState() && warm.getState()) {
        warm.setBrightness(system_brightness * warm_ratio);
        cold.setBrightness(system_brightness * cold_ratio);
    }

    prev_system_brightness_knob_voltage = system_brightness_knob_voltage;
    printf("warm brightness: %d\tcold brightness: %d\n", warm.getBrightness(), cold.getBrightness());
    printf("Brightness knob raw ADC: %d\n", system_brightness_knob_voltage);
}
void handleSemi(LED& warm, LED& cold, adc1_channel_t cct_knob,  adc1_channel_t light_sensor){
    int cct_knob_voltage = adc1_get_raw(cct_knob);
    double cct = calc_system_temperature(warm, cold); 
    double cold_ratio = cct_knob_voltage / 4095.0;
    double warm_ratio = 1.0 - cold_ratio;
    int cct_knob_brightness = (cct_knob_voltage * 8191) / 4095;

    double light_sensor_voltage = (adc1_get_raw(light_sensor) * 3.3) / 4095;
    double light_current = (3.3 - light_sensor_voltage) / 10000.0;
    double lux = light_current / 0.000002;
    double lux_difference = TARGET_LUX - lux;

    if (abs(lux_difference) > 2) {
        int brightness = (cold.getBrightness() / cold_ratio) + static_cast<int>(lux_difference);
        cold.setBrightness(brightness * cold_ratio);
        warm.setBrightness(brightness * warm_ratio);
    }

    printf("warm brightness: %d\tcold brightness: %d\n", warm.getBrightness(), cold.getBrightness());
    printf("light sensor raw ADC: %d\n", adc1_get_raw(light_sensor));

}
void handleAuto(LED& warm, LED& cold,  adc1_channel_t light_sensor){
    double preset_cold_ratio = 0.5;
    double preset_warm_ratio = 0.5;

    double light_sensor_voltage = (adc1_get_raw(light_sensor) * 3.3) / 4095;
    double light_current = (3.3 - light_sensor_voltage) / 10000.0;
    double lux = light_current / 0.000002;
    double lux_difference = TARGET_LUX - lux;

    if (cold.getBrightness() == 0 && warm.getBrightness() == 0) {
        cold.setState(false);
        warm.setState(false);
    }

    if (gpio_get_level(MOTION_SENSOR) == 1 && !cold.getState() && !warm.getState()) {
        printf("Motion Detected");
        cold.setState(true);
        warm.setState(true);
    }

    if (abs(lux_difference) > 2 && cold.getState() && warm.getState()) {
        int brightness = (cold.getBrightness() / preset_cold_ratio) + static_cast<int>(lux_difference);
        cold.setBrightness(brightness * preset_cold_ratio);
        warm.setBrightness(brightness * preset_warm_ratio);
    }

    printf("warm brightness: %d\tcold brightness: %d\n", warm.getBrightness(), cold.getBrightness());
    printf("light sensor raw ADC: %d\n", adc1_get_raw(light_sensor));


}

extern "C" void app_main(void) {
    int SYSTEM_STATUS;

    //SYSTEM STATUS is 1 for MANUAL OPERATION
    // SYSTEM STATUS is 2 for SEMI-AUTOMATIC OPERATION
    // SYSTEM STATUS is 3 for AUTOMATIC OPERATION
    double cct;

    // Configure ADC1 capture width
    // 12 bit decimal value from 0 to 4095
    adc1_config_width(ADC_WIDTH_BIT_12); 
    // Configure the ADC1 channel (ADC1_CHANNEL_6 - pin 34), and setting attenuation (ADC_ATTEN_DB_11)
    adc1_channel_t brightnessknob = ADC1_CHANNEL_4;
    adc1_channel_t cct_knob = ADC1_CHANNEL_5;
    adc1_channel_t light_sensor = ADC1_CHANNEL_3;
    adc1_config_channel_atten(brightnessknob, ADC_ATTEN_DB_11);


    LED warm(1,LEDC_CHANNEL_0);
    LED cold(2,LEDC_CHANNEL_2);
    static int prev_system_brightness_knob_voltage = -1;
    int ambient_light;
    SYSTEM_STATUS = 0;
    bool System_ON = true;


    while (true) 
    {
        vTaskDelay(100 / portTICK_PERIOD_MS);
    
        // ON/OFF toggle
        static int prev_onoff = 1;
        int curr_onoff = gpio_get_level(OnOff);
        if (curr_onoff == 0 && prev_onoff == 1) {
            System_ON = !System_ON;
            printf("System is now: %s\n", System_ON ? "ON" : "OFF");
            if (!System_ON) {
                warm.setState(false);
                cold.setState(false);
            }
            else
            {
                warm.setState(true);
                cold.setState(false);
            }
        }
        prev_onoff = curr_onoff;

    
        // Cycle system mode
        if (gpio_get_level(MODE_SELECT) == 0) {
            SYSTEM_STATUS = (SYSTEM_STATUS + 1) % 3;
            printf("System Mode changed\n");
        }
    
        if (System_ON) {
            switch (SYSTEM_STATUS) {
                // MANUAL MODE
                case 0: handleManual(warm, cold, brightnessknob, cct_knob,prev_system_brightness_knob_voltage); break;
                
                // SEMI-AUTOMATIC
                case 1: handleSemi(warm, cold, cct_knob,light_sensor); break;

                // FULL AUTO
                case 2: handleAuto(warm, cold, light_sensor); break;
                
            }
        }
    
        vTaskDelay(100 / portTICK_PERIOD_MS);
    }
}
    