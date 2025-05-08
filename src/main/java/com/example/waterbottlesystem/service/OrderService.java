package com.example.waterbottlesystem.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.example.waterbottlesystem.controller.JwtUtil;
import com.example.waterbottlesystem.model.OrderRequest;
import com.example.waterbottlesystem.model.OrderStatus;
import com.example.waterbottlesystem.model.Stock;
import com.example.waterbottlesystem.model.User;
import com.example.waterbottlesystem.repository.OrderRequestRepository;

import jakarta.mail.internet.MimeMessage;

@Service
public class OrderService {
    
    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);
    
    private final OrderRequestRepository orderRepository;
    private final StockService stockService;
    private final UserService userService;
    private final JwtUtil jwtUtil;

    @Autowired
    private JavaMailSender mailSender;

    public OrderService(OrderRequestRepository orderRepository, StockService stockService, UserService userService, JwtUtil jwtUtil) {
        this.orderRepository = orderRepository;
        this.stockService = stockService;
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    public OrderRequest placeOrder(OrderRequest order) {
        Optional<Stock> stockOpt = stockService.findStockByReseller(order.getReseller());
        if (stockOpt.isEmpty() || stockOpt.get().getQuantity() < order.getQuantity()) {
            throw new RuntimeException("Insufficient stock or no stock available");
        }
        return orderRepository.save(order);
    }

    public List<OrderRequest> getOrdersByClient(Long clientId) {
        return orderRepository.findByClientId(clientId);
    }

    public List<OrderRequest> getOrdersByReseller(User reseller) {
        return orderRepository.findByReseller(reseller);
    }

    public List<OrderRequest> getPendingOrdersByReseller(User reseller) {
        return orderRepository.findByResellerAndStatus(reseller, OrderStatus.PENDING);
    }

    public Optional<OrderRequest> getOrderById(Long id) {
        return orderRepository.findById(id);
    }

    public void updateOrderStatus(OrderRequest order, OrderStatus status, String pickupCode, LocalDateTime pickupDate) {
        order.setStatus(status);
        order.setPickupCode(pickupCode);
        order.setPickupDate(pickupDate);
        orderRepository.save(order);
    }

    public void approveOrder(Long orderId, String pickupCode, LocalDateTime pickupDate) {
        OrderRequest order = orderRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found"));
        
        Optional<Stock> stockOpt = stockService.findStockByReseller(order.getReseller());
        if (stockOpt.isEmpty() || stockOpt.get().getQuantity() < order.getQuantity()) {
            throw new RuntimeException("Insufficient stock to approve order");
        }

        Stock stock = stockOpt.get();
        stock.setQuantity(stock.getQuantity() - order.getQuantity());
        stockService.updateStock(stock);

        order.setStatus(OrderStatus.APPROVED);
        order.setPickupCode(pickupCode);
        order.setPickupDate(pickupDate);
        orderRepository.save(order);

        sendPickupConfirmationEmail(order);
    }

    public List<OrderRequest> getOrdersByAuthenticatedClient() {
        String email = jwtUtil.extractUsername(jwtUtil.getCurrentToken());
        User client = userService.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Client not found"));
        return getOrdersByClient(client.getId());
    }

    public void sendPickupConfirmationEmail(OrderRequest orderRequest) {
        User client = orderRequest.getClient();
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            String subject = "Water Bottle Order Approved";
            String html = "<h2>Your Order Has Been Approved!</h2>" +
                          "<p>Dear " + client.getName() + ",</p>" +
                          "<p>Your order has been approved by the reseller.</p>" +
                          "<p><strong>Pickup Date:</strong> " + 
                              formatDateTime(orderRequest.getPickupDate()) + "</p>" +
                          "<p><strong>Pickup Code:</strong> " + 
                              orderRequest.getPickupCode() + "</p>" +
                          "<p>Please use this code to collect your water bottles.</p>" +
                          "<p>Thank you for using Water Bottle System.</p>";

            helper.setTo(client.getEmail());
            helper.setSubject(subject);
            helper.setText(html, true);

            mailSender.send(message);
        } catch (Exception e) {
            logger.error("Failed to send pickup confirmation email", e);
        }
    }

    private String formatDateTime(LocalDateTime dateTime) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        return dateTime != null ? dateTime.format(formatter) : "N/A";
    }
}