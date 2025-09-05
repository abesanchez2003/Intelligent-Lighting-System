#include "wifi_client.h"
#include "nvs_flash.h"
#include "esp_system.h"

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