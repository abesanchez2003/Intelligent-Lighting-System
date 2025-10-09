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
    ambient.reg = 0x04;
    return ESP_OK;

}
esp_err_t InputManager:: read_ambient(){
    ambient.ret = i2c_master_transmit_receive(ambient.veml_dev, &ambient.reg, 1, ambient.data, 2, -1);
    if(ambient.ret != ESP_OK){
        printf("Error: Failed to read ambient light");

    }
    ambient.lux = (ambient.data[0]) | (ambient.data[1] << 8);
    ambient.lux *= 0.0442;
    return ambient.ret;

}

// esp_err_t InputManager:: veml7700_write_config(i2c_port_t port) {
//     uint8_t config[2];
//     config[0] = 0x00;   // LSB of config
//     config[1] = 0x00;   // MSB of configth
//     return i2c_write_reg(port, VEML7700_ADDR, 0x00, config, 2, pdMS_TO_TICKS(100));
// }




void InputManager:: init(){
    adc1_config_width(ADC_WIDTH_BIT_12); 
    // Configure the ADC1 channel (ADC1_CHANNEL_6 - pin 34), and setting attenuation (ADC_ATTEN_DB_11)
    brightnessknob = ADC1_CHANNEL_4;
    cct_knob = ADC1_CHANNEL_5;
    light_sensor = ADC1_CHANNEL_3;
    adc1_config_channel_atten(brightnessknob, ADC_ATTEN_DB_11);
    adc1_config_channel_atten(light_sensor,ADC_ATTEN_DB_11);
    adc1_config_channel_atten(cct_knob, ADC_ATTEN_DB_11);
    gpio_config_t onoff_conf = {
        .pin_bit_mask = (1ULL << OnOff),
        .mode = GPIO_MODE_INPUT,
        .pull_up_en = GPIO_PULLUP_DISABLE,  // already externally pulled up via R4
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .intr_type = GPIO_INTR_DISABLE
    };
    gpio_config(&onoff_conf);
    ci2c_master_init();
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