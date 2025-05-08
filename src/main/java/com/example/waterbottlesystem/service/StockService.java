package com.example.waterbottlesystem.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.example.waterbottlesystem.model.Stock;
import com.example.waterbottlesystem.model.User;
import com.example.waterbottlesystem.repository.StockRepository;

@Service
public class StockService {
    
    private final StockRepository stockRepository;

    public StockService(StockRepository stockRepository) {
        this.stockRepository = stockRepository;
    }

    public Stock addStock(Stock stock) {
        return stockRepository.save(stock);
    }

    public List<Stock> getStockByReseller(User reseller) {
        return stockRepository.findByReseller(reseller);
    }

    public Optional<Stock> findStockByReseller(User reseller) {
        return stockRepository.findByReseller(reseller).stream().findFirst();
    }

    public List<Stock> getAllStock() {
        return stockRepository.findAll();
    }

    public void deleteStock(Long id) {
        stockRepository.deleteById(id);
    }

    public Stock updateStock(Stock stock) {
        return stockRepository.save(stock);
    }
}