package com.example.waterbottlesystem.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.waterbottlesystem.model.OrderRequest;
import com.example.waterbottlesystem.model.OrderStatus;
import com.example.waterbottlesystem.model.User;
import com.example.waterbottlesystem.service.OrderService;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "http://localhost:4200")
public class OrderController {
    
    private final OrderService orderService;
    private final JwtUtil jwtUtil;

    public OrderController(OrderService orderService, JwtUtil jwtUtil) {
        this.orderService = orderService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping
    public ResponseEntity<?> placeOrder(@RequestBody OrderRequest order) {
        try {
            OrderRequest placedOrder = orderService.placeOrder(order);
            return ResponseEntity.ok(placedOrder);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/client")
    public ResponseEntity<List<OrderRequest>> getOrdersByClient(@RequestParam(required = false) Long clientId) {
        try {
            if (clientId != null) {
                return ResponseEntity.ok(orderService.getOrdersByClient(clientId));
            }
            return ResponseEntity.ok(orderService.getOrdersByAuthenticatedClient());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/reseller")
    public List<OrderRequest> getOrdersByReseller(@RequestBody User reseller) {
        return orderService.getOrdersByReseller(reseller);
    }

    @GetMapping("/reseller/pending")
    public List<OrderRequest> getPendingOrdersByReseller(@RequestBody User reseller) {
        return orderService.getPendingOrdersByReseller(reseller);
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveOrder(
            @PathVariable Long id,
            @RequestParam String pickupCode,
            @RequestParam String pickupDate // format: "2025-05-06T15:00:00"
    ) {
        try {
            orderService.approveOrder(id, pickupCode, LocalDateTime.parse(pickupDate));
            return ResponseEntity.ok(orderService.getOrderById(id).get());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/deny")
    public ResponseEntity<?> denyOrder(@PathVariable Long id) {
        try {
            Optional<OrderRequest> orderOpt = orderService.getOrderById(id);
            if (orderOpt.isPresent()) {
                OrderRequest order = orderOpt.get();
                orderService.updateOrderStatus(order, OrderStatus.DENIED, null, null);
                return ResponseEntity.ok(order);
            } else {
                return ResponseEntity.badRequest().body("Order not found");
            }
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}