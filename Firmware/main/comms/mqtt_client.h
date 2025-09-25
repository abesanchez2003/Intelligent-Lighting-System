#pragma once
#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include <stdlib.h>
#include <inttypes.h>
#include <cstdio>
#include "esp_system.h"
#include "nvs_flash.h"
#include "esp_event.h"
#include "esp_netif.h"
#include "protocol_examples_common.h"
#include <string>
#include "esp_log.h"
#include "mqtt_client.h"
#include "LedSetpoint.h"
#include "inputs.h"
#include "task_mqtt.h"
class mqtt_client {
private:
    esp_mqtt_client_handle_t client;
    esp_mqtt_client_config_t mqtt_cfg;
    esp_mqtt_event_handle_t event;
public:
    static void mqtt_event_handler(void *handler_args, esp_event_base_t base, int32_t event_id, void *event_data);
    static void mqtt_start(mqtt_client self, std:: string broker_url);
    void mqtt_publish_task(void *pvParameters);
    
    
};