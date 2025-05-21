package com.example.waterbottlesystem.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.waterbottlesystem.model.Role;
import com.example.waterbottlesystem.model.Stock;
import com.example.waterbottlesystem.model.User;
import com.example.waterbottlesystem.service.StockService;
import com.example.waterbottlesystem.service.UserService;

@RestController
@RequestMapping("/api/stocks")
@CrossOrigin(origins = "http://localhost:4200")
public class StockController {
    
    private static final Logger logger = LoggerFactory.getLogger(StockController.class);
    
    private final StockService stockService;
    private final UserService userService;
    private final JwtUtil jwtUtil;

    public StockController(StockService stockService, UserService userService, JwtUtil jwtUtil) {
        this.stockService = stockService;
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    private String extractToken(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        throw new IllegalArgumentException("Invalid Authorization header");
    }

    @PostMapping
    public ResponseEntity<?> addStock(
            @RequestBody Map<String, Object> body) {
        try {
            System.out.println("Adding stock with data: " + body);
            
            Long resellerId = Long.valueOf(body.get("resellerId").toString());
            User reseller = userService.findById(resellerId).orElse(null);
            if (reseller == null) {
                return ResponseEntity.status(404).body("Reseller not found");
            }

            Stock stock = new Stock();
            stock.setReseller(reseller);
            stock.setQuantity(Integer.parseInt(body.get("quantity").toString()));
            stock.setPrice(new BigDecimal(body.get("price").toString()));
            stock.setDate(LocalDate.now());
            
            System.out.println("Saving stock: " + stock);
            Stock savedStock = stockService.addStock(stock);
            System.out.println("Stock saved successfully: " + savedStock);
            
            return ResponseEntity.ok(savedStock);
        } catch (Exception e) {
            System.out.println("Error adding stock: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error adding stock: " + e.getMessage());
        }
    }

    @GetMapping("/reseller")
    public List<Stock> getStockByReseller(@RequestBody User reseller) {
        return stockService.getStockByReseller(reseller);
    }

    @GetMapping("/reseller/{resellerId}")
    public ResponseEntity<?> getStockByResellerId(@PathVariable Long resellerId) {
        try {
            System.out.println("Getting stock for reseller ID: " + resellerId);
            Optional<User> userOpt = userService.findById(resellerId);
            if (userOpt.isEmpty()) {
                System.out.println("Reseller not found with ID: " + resellerId);
                return ResponseEntity.status(404).body("Reseller not found");
            }

            Optional<Stock> stockOpt = stockService.findStockByReseller(userOpt.get());
            if (stockOpt.isEmpty()) {
                System.out.println("No stock found for reseller ID: " + resellerId);
                // Return empty stock instead of 404
                Stock emptyStock = new Stock();
                emptyStock.setId(0L);
                emptyStock.setReseller(userOpt.get());
                emptyStock.setQuantity(0);
                emptyStock.setDate(LocalDate.now());
                emptyStock.setPrice(BigDecimal.ZERO);
                return ResponseEntity.ok(emptyStock);
            }

            System.out.println("Found stock for reseller ID: " + resellerId);
            return ResponseEntity.ok(stockOpt.get());
        } catch (Exception e) {
            System.out.println("Error getting stock: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error getting stock: " + e.getMessage());
        }
    }

    @GetMapping
    public List<Stock> getAllStock() {
        return stockService.getAllStock();
    }

    @DeleteMapping("/{id}")
    public void deleteStock(@PathVariable Long id) {
        stockService.deleteStock(id);
    }

    @GetMapping("/stock")
    public ResponseEntity<?> getResellerStock(@RequestHeader("Authorization") String authHeader) {
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

            Optional<User> userOpt = userService.findByEmail(email);
            if (userOpt.isEmpty() || !userOpt.get().getRole().equals(Role.RESELLER)) {
                logger.warn("User is not a reseller: {}", email);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("User is not a reseller");
            }

            Optional<Stock> stockOpt = stockService.findStockByReseller(userOpt.get());
            if (stockOpt.isEmpty()) {
                logger.info("No stock found for reseller: {}", email);
                
                Stock emptyStock = new Stock();
                emptyStock.setId(0L);
                emptyStock.setReseller(userOpt.get());
                emptyStock.setQuantity(0);
                emptyStock.setDate(LocalDate.now());
                emptyStock.setPrice(BigDecimal.ZERO);

                return ResponseEntity.ok(emptyStock);
            }

            return ResponseEntity.ok(stockOpt.get());
        } catch (Exception e) {
            logger.error("Get stock error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error fetching stock: " + e.getMessage());
        }
    }

    @PutMapping("/stock")
    public ResponseEntity<?> updateStock(
            @RequestBody Map<String, Object> body) {
        try {
            System.out.println("Updating stock with data: " + body);
            
            Long stockId = Long.valueOf(body.get("id").toString());
            Long resellerId = Long.valueOf(body.get("resellerId").toString());
            User reseller = userService.findById(resellerId).orElse(null);
            if (reseller == null) {
                return ResponseEntity.status(404).body("Reseller not found");
            }

            Optional<Stock> stockOpt = stockService.findStockByReseller(reseller);
            if (stockOpt.isEmpty() || !stockOpt.get().getId().equals(stockId)) {
                return ResponseEntity.status(404).body("Stock not found");
            }

            Stock stock = stockOpt.get();
            int newQuantity = Integer.parseInt(body.get("quantity").toString());
            if (newQuantity < 0) {
                return ResponseEntity.status(400).body("Quantity cannot be negative");
            }
            stock.setQuantity(newQuantity);
            if (body.containsKey("price")) {
                stock.setPrice(new BigDecimal(body.get("price").toString()));
            }
            
            System.out.println("Updating stock: " + stock);
            stockService.updateStock(stock);
            System.out.println("Stock updated successfully");
            
            return ResponseEntity.ok(stock);
        } catch (Exception e) {
            System.out.println("Error updating stock: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error updating stock: " + e.getMessage());
        }
    }
}