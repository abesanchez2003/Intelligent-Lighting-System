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

double calc_system_temperature(LED warm, LED cold){

    // this function takes in warm and cold channel LED object and calculates the lighting system temperature
    double warm_bright_perc = (warm.getBrightness() / 8191.0) * 100.0;
    double cold_bright_perc = (cold.getBrightness() / 8191.0) * 100.0;
    double  cct = ( warm_bright_perc * 2700.0) + (cold_bright_perc * 6500);

    return cct;


}

extern "C" void app_main(void) {
    int SYSTEM_STATUS;

    //SYSTEM STATUS is 1 for MANUAL OPERATION
    // SYSTEM STATUS is 2 for SEMI-AUTOMATIC OPERATION
    // SYSTEM STATUS is 3 for AUTOMATIC OPERATION
    
    //LED Green(0,LEDC_CHANNEL_0);
    //LED Blue(23,LEDC_CHANNEL_1);
    // LED Y(23,LEDC_CHANNEL_2);
    // LED RED(6,LEDC_CHANNEL_3);
    // while (true) {
    //     Green.setBrightness(8191);
    //     Blue.setBrightness(8191);
    //     Y.setBrightness(8191);
    //     RED.setBrightness(8191);
    // }
   
    int bright_knob_voltage;
    int warmth_knob_voltage;

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
    int TARGET_LUX;



    while (true) 
    {
        // warm.setBrightness(8191);
        // cold.setBrightness(8191);
        vTaskDelay(100 / portTICK_PERIOD_MS);
        // Take an ADC1 reading on a single channel (ADC1_CHANNEL_6 pin 34)
        // 11dB attenuation (ADC_ATTEN_DB_11) gives full-scale voltage 0 - 3.9V
        // 4053 ~ 3.86V
        SYSTEM_STATUS = 1;

        if(gpio_get_level(MODE_SELECT) == 0){
            SYSTEM_STATUS = (SYSTEM_STATUS + 1) % 3; // chnag system status bounding it with mod 3

        }

        switch(SYSTEM_STATUS){
            case 1 :{   // MANUAL MODE 

            // temperature adjustment knob
            int cct_knob_voltage = adc1_get_raw(cct_knob);
            
            cct = calc_system_temperature(warm,cold); 
            

            int cct_knob_brightness = (cct_knob_voltage * 8191) / 4095;
            cold.setBrightness(cct_knob_brightness);
            warm.setBrightness(8191 - cold.getBrightness());

            //brightness adjustmentknob
            
            int system_brightness_knob_voltage = adc1_get_raw(brightnessknob);

            if(prev_system_brightness_knob_voltage == -1){ // first iteration check to avoid large jump and set to baseline brightness
                prev_system_brightness_knob_voltage = system_brightness_knob_voltage;
            }

            int prev_system_brightness = (prev_system_brightness_knob_voltage * 8191) / 4095;
            int system_brightness = (system_brightness_knob_voltage * 8191) / 4095;

            int system_brightness_change = system_brightness - prev_system_brightness;
            if(abs(system_brightness_change) > 5){
                // warm.setBrightness(warm.getBrightness() + system_brightness_change);
                // cold.setBrightness(cold.getBrightness() + system_brightness_change);
                warm.setBrightness(system_brightness);
                cold.setBrightness(system_brightness);
                
            }
            prev_system_brightness_knob_voltage = system_brightness_knob_voltage;
            printf("warm brightness: %d\tcold brightness: %d\n", warm.getBrightness(), cold.getBrightness());
            printf("Brightness knob raw ADC: %d\n", system_brightness_knob_voltage);
            break;
        }
        case 2: { // SEMI_AUTOMATIC
            // temperature adjustment knob
            // int cct_knob_voltage = adc1_get_raw(cct_knob);
            
            // double warm_bright_perc = (warm.getBrightness() / 8191.0) * 100.0;
            // double cold_bright_perc = (cold.getBrightness() / 8191.0) * 100.0;
            // cct = ( warm_bright_perc * 2700.0) + (cold_bright_perc * 6500);
            // int cct_knob_brightness = (cct_knob_voltage * 8191) / 4095;
            // cold.setBrightness(cct_knob_brightness);
            // warm.setBrightness(8191 - cold.getBrightness());

            // // automatic system brightness 
            // int light_sensor_voltage = adc1_get_raw(light_sensor);



        }




        }
    
        vTaskDelay(100 / portTICK_PERIOD_MS);

    }
}