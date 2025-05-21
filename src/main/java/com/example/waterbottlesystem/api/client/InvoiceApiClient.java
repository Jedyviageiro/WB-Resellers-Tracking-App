package com.example.waterbottlesystem.api.client;

import com.example.waterbottlesystem.api.dto.InvoiceRequest;
import com.example.waterbottlesystem.api.dto.InvoiceResponse;
import java.util.List;

public interface InvoiceApiClient {
    List<InvoiceResponse> getInvoices();
    InvoiceResponse getInvoiceById(Long id);
    InvoiceResponse createInvoice(InvoiceRequest request);
    InvoiceResponse updateInvoiceStatus(Long id, String status);
    void deleteInvoice(Long id);
} 