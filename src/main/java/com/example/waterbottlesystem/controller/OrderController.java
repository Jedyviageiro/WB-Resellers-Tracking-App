package com.example.waterbottlesystem.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.waterbottlesystem.model.OrderRequest;
import com.example.waterbottlesystem.model.OrderStatus;
import com.example.waterbottlesystem.model.User;
import com.example.waterbottlesystem.model.Role;
import com.example.waterbottlesystem.service.OrderService;
import com.example.waterbottlesystem.service.UserService;
import com.example.waterbottlesystem.controller.JwtUtil;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "http://localhost:4200")
public class OrderController {
    
    private static final Logger logger = LoggerFactory.getLogger(OrderController.class);
    
    private final OrderService orderService;
    private final JwtUtil jwtUtil;
    private final UserService userService;

    public OrderController(OrderService orderService, JwtUtil jwtUtil, UserService userService) {
        this.orderService = orderService;
        this.jwtUtil = jwtUtil;
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<?> placeOrder(@RequestBody OrderRequest order) {
        try {
            OrderRequest placedOrder = orderService.placeOrder(order);
            return ResponseEntity.ok(placedOrder);
        } catch (RuntimeException e) {
            logger.error("Place order error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/client")
    public ResponseEntity<?> getOrdersByClient(@RequestParam(required = false) Long clientId) {
        try {
            if (clientId != null) {
                logger.debug("Fetching orders for clientId: {}", clientId);
                return ResponseEntity.ok(orderService.getOrdersByClient(clientId));
            }
            logger.debug("Fetching orders for authenticated client");
            return ResponseEntity.ok(orderService.getOrdersByAuthenticatedClient());
        } catch (RuntimeException e) {
            logger.error("Get orders error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error fetching orders: " + e.getMessage());
        }
    }

    @GetMapping("/reseller")
    public ResponseEntity<?> getOrdersByReseller(@RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                logger.warn("Missing or invalid Authorization header");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Missing or invalid Authorization header");
            }
            String token = authHeader.substring(7);
            String email = jwtUtil.extractUsername(token);
            if (!jwtUtil.validateToken(token)) {
                logger.warn("Invalid or expired token for email: {}", email);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired token");
            }
            Optional<User> resellerOpt = userService.findByEmail(email);
            if (resellerOpt.isEmpty() || !resellerOpt.get().getRole().equals(Role.RESELLER)) {
                logger.warn("User is not a reseller: {}", email);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("User is not a reseller");
            }
            logger.debug("Fetching orders for reseller: {}", email);
            List<OrderRequest> orders = orderService.getOrdersByReseller(resellerOpt.get());
            List<OrderRequest> response = orders.stream().map(order -> {
               
                return order;
            }).collect(Collectors.toList());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            logger.error("Get reseller orders error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error fetching orders: " + e.getMessage());
        }
    }

    @GetMapping("/reseller/pending")
    public ResponseEntity<List<OrderRequest>> getPendingOrdersByReseller(@RequestBody User reseller) {
        try {
            logger.debug("Fetching pending orders for reseller: {}", reseller.getEmail());
            return ResponseEntity.ok(orderService.getPendingOrdersByReseller(reseller));
        } catch (RuntimeException e) {
            logger.error("Get pending reseller orders error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveOrder(
            @PathVariable Long id,
            @RequestParam String pickupCode,
            @RequestParam String pickupDate
    ) {
        try {
            logger.debug("Approving order: {}, pickupCode: {}, pickupDate: {}", id, pickupCode, pickupDate);
            orderService.approveOrder(id, pickupCode, LocalDateTime.parse(pickupDate));
            return ResponseEntity.ok(orderService.getOrderById(id).get());
        } catch (RuntimeException e) {
            logger.error("Approve order error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/deny")
    public ResponseEntity<?> denyOrder(@PathVariable Long id) {
        try {
            logger.debug("Denying order: {}", id);
            Optional<OrderRequest> orderOpt = orderService.getOrderById(id);
            if (orderOpt.isPresent()) {
                OrderRequest order = orderOpt.get();
                orderService.updateOrderStatus(order, OrderStatus.DENIED, null, null);
                return ResponseEntity.ok(order);
            } else {
                return ResponseEntity.badRequest().body("Order not found");
            }
        } catch (RuntimeException e) {
            logger.error("Deny order error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable Long id, @RequestParam String email) {
        try {
            logger.debug("Cancelling order: {} for email: {}", id, email);
            Optional<User> userOpt = userService.findByEmail(email);
            if (userOpt.isEmpty()) {
                logger.warn("User not found for email: {}", email);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("User not found");
            }
            if (userOpt.get().getRole() != Role.CLIENT) {
                logger.warn("User is not a client: {}", email);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Forbidden: Client access required");
            }
            Optional<OrderRequest> orderOpt = orderService.getOrderById(id);
            if (orderOpt.isEmpty()) {
                logger.warn("Order not found: {}", id);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Order not found");
            }
            if (orderOpt.get().getClient().getId() != userOpt.get().getId()) {
                logger.warn("Order {} does not belong to user {}", id, email);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Order does not belong to this client");
            }
            if (orderOpt.get().getStatus() != OrderStatus.PENDING) {
                logger.warn("Order {} is not pending: {}", id, orderOpt.get().getStatus());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Order is not cancellable");
            }
            orderService.cancelOrder(id);
            return ResponseEntity.ok(orderOpt.get());
        } catch (Exception e) {
            logger.error("Cancel order error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error cancelling order: " + e.getMessage());
        }
    }
}