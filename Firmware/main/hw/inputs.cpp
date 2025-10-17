#include "inputs.h"
esp_err_t InputManager::ci2c_master_init(void)
{
    i2c_master_bus_config_t  bus_config = {};
    bus_config.i2c_port          = ambient.i2c_port;
    bus_config.sda_io_num        = SDA_PIN;
    bus_config.scl_io_num        = SCL_PIN;
    bus_config.clk_source        = I2C_CLK_SRC_DEFAULT;
    bus_config.glitch_ignore_cnt = ambient.i2c_glitch_ignore_cnt;
    bus_config.flags.enable_internal_pullup = false;

    ambient.ret = i2c_new_master_bus(&bus_config,&ambient.i2c_bus);
    if(ambient.ret != ESP_OK){
        printf("Error with I2C");
        abort();
    }

    i2c_device_config_t dev_config = {
        .dev_addr_length = I2C_ADDR_BIT_LEN_7,
        .device_address = VEML7700_ADDR,
        .scl_speed_hz = ambient.VEML7700_scl_speed_hz,

    };
    ambient.ret = i2c_master_bus_add_device(ambient.i2c_bus, &dev_config, &ambient.veml_dev);
    if(ambient.ret != ESP_OK){
        printf("I2C device failed");
        abort();
    }
    ESP_ERROR_CHECK(veml7700_write_config());
    vTaskDelay(pdMS_TO_TICKS(120));

    ambient.reg = 0x04;
    return ESP_OK;

}
esp_err_t InputManager:: read_ambient(){
    ambient.ret = i2c_master_transmit_receive(ambient.veml_dev, &ambient.reg, 1, ambient.data, 2, -1);
    if(ambient.ret != ESP_OK){
        printf("Error: Failed to read ambient light");

    }
    uint16_t raw = (ambient.data[0]) | (ambient.data[1] << 8);
    ambient.lux =(float)raw *  0.0672f;
    return ambient.ret;

}

esp_err_t InputManager::veml7700_write_config(void) {
    uint16_t conf = 0x0000; // SD=0, IT=100ms, gain=1x, etc.
    uint8_t buf[3] = {
        0x00,                   // register address
        (uint8_t)(conf & 0xFF), // LSB
        (uint8_t)(conf >> 8)    // MSB
    };
    return i2c_master_transmit(ambient.veml_dev, buf, sizeof(buf), pdMS_TO_TICKS(100));
}





void InputManager:: init(){
    adc1_config_width(ADC_WIDTH_BIT_12); 
    // Configure the ADC1 channel (ADC1_CHANNEL_6 - pin 34), and setting attenuation (ADC_ATTEN_DB_11)
    brightnessknob = ADC1_CHANNEL_4;
    cct_knob = ADC1_CHANNEL_5;
    light_sensor = ADC1_CHANNEL_3;
    adc1_config_channel_atten(brightnessknob, ADC_ATTEN_DB_11);
    adc1_config_channel_atten(light_sensor,ADC_ATTEN_DB_11);
    adc1_config_channel_atten(cct_knob, ADC_ATTEN_DB_11);
    // printf(" setting up gpio 8 raw=%d\n", gpio_get_level(OnOff));
    // esp_rom_gpio_pad_select_gpio(OnOff);   // route pad to GPIO matrix
    // printf("pad select: raw=%d\n", gpio_get_level(OnOff));
    // rtc_gpio_deinit(OnOff);                // remove any RTC function
    // printf("rtc_deinit: raw=%d\n", gpio_get_level(OnOff));
    // rtc_gpio_hold_dis(OnOff);              // clear any deep-sleep hold
    // printf("rtc_hold dis:  raw=%d\n", gpio_get_level(OnOff));
    // gpio_reset_pin(OnOff);
    // printf("gpio reset raw=%d\n", gpio_get_level(OnOff));
    // gpio_set_direction(OnOff, GPIO_MODE_INPUT);
    // printf("set direction raw=%d\n", gpio_get_level(OnOff));
    // gpio_set_pull_mode(OnOff, GPIO_PULLUP_ONLY);  // fine even with external pull-up
    // printf(" setting pull mode raw=%d\n", gpio_get_level(OnOff));
    //gpio_reset_pin(OnOff);
    gpio_config_t onoff_conf = {
        .pin_bit_mask = (1ULL << OnOff),
        .mode = GPIO_MODE_INPUT,
        .pull_up_en = GPIO_PULLUP_DISABLE,  // already externally pulled up via R4
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .intr_type = GPIO_INTR_DISABLE
    };
    ESP_ERROR_CHECK(gpio_config(&onoff_conf));
    //printf("gpioconfig :   raw=%d\n", gpio_get_level(OnOff));
    ci2c_master_init();
    //printf(" i2c init called raw=%d\n", gpio_get_level(OnOff));
}
InputSample InputManager:: read(){
    InputSample s;
    s.onoff_level     = (gpio_get_level(OnOff) == 0);
    s.mode_level      = (gpio_get_level(MODE_SELECT) == 0);
    s.motion_level    = (gpio_get_level(MOTION_SENSOR) == 1);
    s.brightness_raw  = adc1_get_raw(brightnessknob);
    s.cct_raw         = adc1_get_raw(cct_knob);
    esp_err_t ret = read_ambient();
    s.ambient_raw     = ambient.lux;
    return s;


}
void InputManager:: printInputSample(InputSample sample){
    printf("---- Input Sample ----\n");
    printf("Ambient Raw:    %f\n", sample.ambient_raw);                                                                                                                                                                                                                                                                                                                  
    printf("Brightness Raw: %d\n", sample.brightness_raw);
    printf("CCT Raw:        %d\n", sample.cct_raw);
    printf("Mode Level:     %s\n", sample.mode_level ? "true" : "false");
    printf("Motion Level:   %s\n", sample.motion_level ? "true" : "false");
    printf("On/Off Level:   %s\n", sample.onoff_level ? "true" : "false");
    printf("-----------------------\n");
}