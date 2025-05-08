package com.example.waterbottlesystem.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.waterbottlesystem.model.Stock;
import com.example.waterbottlesystem.model.User;
import com.example.waterbottlesystem.service.StockService;
import com.example.waterbottlesystem.service.UserService;

@RestController
@RequestMapping("/api/stocks")
@CrossOrigin(origins = "http://localhost:4200")
public class StockController {
    
    private final StockService stockService;
    private final UserService userService;

    public StockController(StockService stockService, UserService userService) {
        this.stockService = stockService;
        this.userService = userService;
    }

    @PostMapping
    public Stock addStock(@RequestBody Stock stock) {
        return stockService.addStock(stock);
    }

    @GetMapping("/reseller")
    public List<Stock> getStockByReseller(@RequestBody User reseller) {
        return stockService.getStockByReseller(reseller);
    }

    @GetMapping("/reseller/{resellerId}")
    public Optional<Stock> getStockByResellerId(@PathVariable Long resellerId) {
        Optional<User> userOpt = userService.findById(resellerId);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("Reseller not found");
        }
        return stockService.findStockByReseller(userOpt.get());
    }

    @GetMapping
    public List<Stock> getAllStock() {
        return stockService.getAllStock();
    }

    @DeleteMapping("/{id}")
    public void deleteStock(@PathVariable Long id) {
        stockService.deleteStock(id);
    }
}