 //gpio_num_t outputVolt = GPIO_NUM_26; // so this will be outputting 3.3V or high volt that will connect to one of the pot terminals
    //gpio_num_t pot_input = GPIO_NUM_36; // this will be the actual voltage divider terminal and will be read in to correspond with loights
    //gpio_config_t outputvoltconfig{};
    //gpio_config_t pot_config {};

    //outputvoltconfig.pin_bit_mask = (1ULL << outputVolt);
    //outputvoltconfig.mode = GPIO_MODE_OUTPUT; // setting gpio to high
   //gpio_config(&outputvoltconfig);
    
//     pot_config.pin_bit_mask = (1ULL << pot_input); //configuring voltage divider by the pot
//     pot_config.mode = GPIO_MODE_INPUT;
//     gpio_config(&pot_config);

//     adc_continuous_handle_cfg_t handle_config {}; // setting paramaters for adc vaue storage
//     handle_config.max_store_buf_size = 512;
//     handle_config.conv_frame_size = 64;

//    adc_continuous_handle_t adc_handle;
//    ESP_ERROR_CHECK(adc_continuous_new_handle(&handle_config, &adc_handle));
//    adc_continuous_config_t adc_config {};

//    adc_digi_pattern_config_t adc_arr [1];
//    adc_arr[0].atten = ADC_ATTEN_DB_11;
//    adc_arr[0].channel = ADC_CHANNEL_0;
//    adc_arr[0].unit = ADC_UNIT_1;
//    adc_arr[0].bit_width = ADC_BITWIDTH_12;
//    adc_config.sample_freq_hz = 5000;
//    adc_config.pattern_num = 1;
//    adc_config.conv_mode = ADC_CONV_SINGLE_UNIT_1;
//    adc_config.format = ADC_DIGI_OUTPUT_FORMAT_TYPE1;
//    adc_config.adc_pattern = adc_arr;

//    ESP_ERROR_CHECK(adc_continuous_config(adc_handle, &adc_config));
//    ESP_ERROR_CHECK(adc_continuous_start(adc_handle));
//    uint8_t adc_data[64];
//    uint32_t read_len = 0;
//    static const char* TAG = "MAIN";


//     while(true){
//         if(adc_continuous_read(adc_handle,adc_data,sizeof(adc_data),&read_len,1000) == ESP_OK){
//             //int raw_value = adc_data[0] | (adc_data[1] << 8);
//             int raw_value = adc1_get_raw(ADC1_CHANNEL_0);
//             int brightness = (raw_value * 8191) / 4095;
//             //printf("ADC Raw: %d | PWM: %d\n", raw_value, brightness);
//             Blue.setBrightness(brightness);
//         }
//         vTaskDelay(pdMS_TO_TICKS(10));
     
//     }