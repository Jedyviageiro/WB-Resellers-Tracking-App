package com.example.waterbottlesystem.api.client;

import com.example.waterbottlesystem.api.config.InvoiceApiConfig;
import com.example.waterbottlesystem.api.dto.InvoiceRequest;
import com.example.waterbottlesystem.api.dto.InvoiceResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InvoiceApiClientImpl implements InvoiceApiClient {
    private final WebClient webClient;
    private final InvoiceApiConfig config;

    @Override
    public List<InvoiceResponse> getInvoices() {
        return webClient.get()
                .uri(config.getBaseUrl() + "/invoices")
                .header("X-API-Key", config.getApiKey())
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<InvoiceResponse>>() {})
                .block();
    }

    @Override
    public InvoiceResponse getInvoiceById(Long id) {
        return webClient.get()
                .uri(config.getBaseUrl() + "/invoices/" + id)
                .header("X-API-Key", config.getApiKey())
                .retrieve()
                .bodyToMono(InvoiceResponse.class)
                .block();
    }

    @Override
    public InvoiceResponse createInvoice(InvoiceRequest request) {
        return webClient.post()
                .uri(config.getBaseUrl() + "/invoices")
                .header("X-API-Key", config.getApiKey())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(InvoiceResponse.class)
                .block();
    }

    @Override
    public InvoiceResponse updateInvoiceStatus(Long id, String status) {
        return webClient.patch()
                .uri(config.getBaseUrl() + "/invoices/" + id + "/status")
                .header("X-API-Key", config.getApiKey())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(status)
                .retrieve()
                .bodyToMono(InvoiceResponse.class)
                .block();
    }

    @Override
    public void deleteInvoice(Long id) {
        webClient.delete()
                .uri(config.getBaseUrl() + "/invoices/" + id)
                .header("X-API-Key", config.getApiKey())
                .retrieve()
                .toBodilessEntity()
                .block();
    }
} 