package com.example.waterbottlesystem.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.waterbottlesystem.model.Stock;
import com.example.waterbottlesystem.model.User;

public interface StockRepository extends JpaRepository<Stock, Long> {
     List<Stock> findByReseller(User reseller);
}
