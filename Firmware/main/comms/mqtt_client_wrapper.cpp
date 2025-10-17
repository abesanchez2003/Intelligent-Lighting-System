#include "mqtt_client_wrapper.h"

void mqtt_client:: mqtt_event_handler(void *handler_args, esp_event_base_t base, int32_t event_id, void *event_data)
{
    static const char* TAG = "MQTT_EVENT_HANDLER";

    ESP_LOGD(TAG, "Event dispatched from event loop base=%s, event_id=%" PRIi32 "", base, event_id);
    auto* self  = static_cast<mqtt_client*>(handler_args);
    auto* event = static_cast<esp_mqtt_event_handle_t>(event_data); 
    auto  client = event->client;
    int msg_id;
    const char*  topic = "lighting/room1/camera/humandetection";
    switch ((esp_mqtt_event_id_t)event_id) {
    case MQTT_EVENT_CONNECTED:
        ESP_LOGI(TAG, "MQTT_EVENT_CONNECTED");
        esp_mqtt_client_subscribe_single(client,topic, 0);
        topic = "lighting/room1/control/brightness";
        esp_mqtt_client_subscribe_single(client,topic, 0);
        topic = "lighting/room1/control/temperature";
        esp_mqtt_client_subscribe_single(client,topic, 0);
        topic = "lighting/room1/control/mode";
        esp_mqtt_client_subscribe_single(client,topic, 0);
        topic = "lighting/room1/control/ML_Target_Lux";
        esp_mqtt_client_subscribe_single(client,topic, 0);
        break;

    case MQTT_EVENT_DISCONNECTED:
        ESP_LOGI(TAG, "MQTT_EVENT_DISCONNECTED");
        break;
    case MQTT_EVENT_SUBSCRIBED:
        ESP_LOGI(TAG, "MQTT_EVENT_SUBSCRIBED, msg_id=%d, return code=0x%02x ", event->msg_id, (uint8_t)*event->data);
        break;
    case MQTT_EVENT_UNSUBSCRIBED:
        ESP_LOGI(TAG, "MQTT_EVENT_UNSUBSCRIBED, msg_id=%d", event->msg_id);
        break;
    case MQTT_EVENT_PUBLISHED:
        ESP_LOGI(TAG, "MQTT_EVENT_PUBLISHED, msg_id=%d", event->msg_id);
        break;
    case MQTT_EVENT_DATA:
        ESP_LOGI(TAG, "MQTT_EVENT_DATA");
        //handle_ctrl_q(event);
        printf("TOPIC=%.*s\r\n", event->topic_len, event->topic);
        printf("DATA=%.*s\r\n", event->data_len, event->data);
        self -> handle_ctrl_q(event);
        
        
        
        break;
    case MQTT_EVENT_ERROR:
        ESP_LOGI(TAG, "MQTT_EVENT_ERROR");
        if (event->error_handle->error_type == MQTT_ERROR_TYPE_TCP_TRANSPORT) {
            ESP_LOGI(TAG, "Last errno string (%s)", strerror(event->error_handle->esp_transport_sock_errno));
        }
        break;
    default:
        ESP_LOGI(TAG, "Other event id:%d", event->event_id);
        break;
    }
}


void mqtt_client:: mqtt_publish_task(void) {
    //QueueHandle_t queue = (QueueHandle_t) pvParameters;
    topic_container msg;
    const char *topic = NULL;

    while (1) {
        if (xQueueReceive(queues_.pub_q, &msg, portMAX_DELAY)) {
            // pick topic string based on enum
            switch (msg.type) {
                case BRIGHTNESS_FETCH:   topic = "lighting/room1/fetch/brightness"; break;
                case TEMPERATURE_FETCH:  topic = "lighting/room1/fetch/temperature"; break;
                case AMBIENT_FETCH:      topic = "lighting/room1/fetch/ambient"; break;
                case MODE_FETCH:         topic = "lighting/room1/fetch/mode"; break;
                case MOTION_FETCH:       topic = "lighting/room1/fetch/motion" ;break;
                default: topic = "lighting/room1/fetch/unknown"; break;
            }

            char payload[32];
            snprintf(payload, sizeof(payload), "%.2f", msg.value);

            int msg_id = esp_mqtt_client_publish(client_,topic,payload,0, 0,msg.retain);
            if (msg_id >= 0) {
                ESP_LOGI("MQTT", "Published %s = %s", topic, payload);
            } else {
                ESP_LOGE("MQTT", "Publish failed for %s", topic);
            }
        }
    }
}


void mqtt_client:: mqtt_start(const std:: string& broker_url, Queues queues )
{
    queues_ = queues; // store queue so publish task can see it
    esp_mqtt_client_config_t mqtt_cfg = {};
     mqtt_cfg.broker.address.uri = broker_url.c_str();          // was: uri
    mqtt_cfg.credentials.client_id = "esp32-abe";               // was: client_id
    mqtt_cfg.credentials.username  = "hivemq.client.1759460841503"; // was: username
    mqtt_cfg.credentials.authentication.password = "J1t.#cu9V0UYDkrR,d&3"; // was: password
    mqtt_cfg.session.keepalive = 60;                            // was: keepalive
    mqtt_cfg.broker.verification.crt_bundle_attach = esp_crt_bundle_attach; // was: crt_bundle_attach
    esp_mqtt_client_handle_t client = esp_mqtt_client_init(&mqtt_cfg);
    client_ = client;
    /* The last argument may be used to pass data to the event handler, in this example mqtt_event_handler */
    esp_mqtt_client_register_event(client_, MQTT_EVENT_ANY, &mqtt_client:: mqtt_event_handler, this);
    esp_mqtt_client_start(client_);
    xTaskCreate(&mqtt_client::publish_task_entry,"mqtt_pub", 4096,this, 6, nullptr);

}

control_topic_type mqtt_client:: map_topic(const char* topic, int topic_len) {
    char buf[128];
    int len = (topic_len < sizeof(buf) - 1) ? topic_len : sizeof(buf) - 1;
    memcpy(buf, topic, len);
    buf[len] = '\0';

    if(std:: strcmp (buf,"lighting/room1/camera/humandetection") == 0){
        return control_topic_type:: OCCUPANCY_STATE;
    }
    else if(strcmp(buf,"lighting/room1/control/brightness") == 0){
        return control_topic_type:: BRIGHTNESS_CONTROL;
    }
    else if(strcmp(buf,"lighting/room1/control/temperature") == 0){
        return control_topic_type:: TEMPERATURE_CONTROL;
    }
    else if(strcmp(buf,"lighting/room1/control/mode") == 0){
        return control_topic_type:: MODE_CONTROL;
    }
    else {
        return control_topic_type:: TARGET_LUX_CONTROL;

    }

}
void mqtt_client:: handle_ctrl_q(esp_mqtt_event_handle_t event){
    const char* topic = event -> topic;
    int topic_len = event -> topic_len;
    control_topic_structure top_cont;
    top_cont.topic = map_topic(topic, topic_len);
  switch (top_cont.topic) {
    case control_topic_type::BRIGHTNESS_CONTROL:
    case control_topic_type::TEMPERATURE_CONTROL:
    case control_topic_type::OCCUPANCY_STATE:
        // parse payload as integer, assign to top_cont.value.int_val
        top_cont.value.int_val = parse_int(event -> data, event -> data_len);
        printf("Parsed Int");
        break;

    case control_topic_type::MODE_CONTROL:
        // parse payload as boolean, assign to top_cont.value.bool_val
        top_cont.value.bool_val = parse_int(event -> data, event -> data_len);
        break;

    case control_topic_type::TARGET_LUX_CONTROL:
        // parse payload as double/float, assign to top_cont.value.double_val
        top_cont.value.double_val = parse_double(event -> data, event -> data_len);
        break;

    default:
        // unknown topic 
        printf("handle_ctrl_q: Unknown topic");
        break;
    }
    xQueueSend(queues_.ctrl_q, &top_cont, portMAX_DELAY);



}
int mqtt_client:: parse_int(char* data, int data_len) {
    char buf[256];
    int data_int;
    if (data_len >= sizeof(buf)){
        printf("data length longer than allocated buffer");
        return -1;
    }
    memcpy(buf, data, data_len);
    buf[data_len] = '\0';
    data_int = atoi(buf);
    return data_int;

 }
 double mqtt_client:: parse_double(char* data, int data_len){
    char buf[256];
    double data_double;
    if(data_len >= sizeof(buf)){
        printf("data length longer than allocatd buffer");
        return -1.0;
    }
    memcpy(buf,data, data_len);
    buf[data_len] = '\0';
    data_double = atof(buf);
    return data_double;

 }