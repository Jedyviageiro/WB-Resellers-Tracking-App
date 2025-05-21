package com.example.waterbottlesystem.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import lombok.Data;

@Configuration
@ConfigurationProperties(prefix = "invoice.api")
@Data
public class InvoiceApiConfig {
    private String baseUrl;
    private String apiKey;
} 