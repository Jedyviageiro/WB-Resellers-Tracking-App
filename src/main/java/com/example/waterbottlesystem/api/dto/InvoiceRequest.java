package com.example.waterbottlesystem.api.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class InvoiceRequest {
    private String customerName;
    private String customerEmail;
    private BigDecimal amount;
    private String description;
} 