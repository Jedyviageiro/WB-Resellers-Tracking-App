package com.example.waterbottlesystem.repository;

import java.util.List;
import java.util.Map;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.waterbottlesystem.model.OrderRequest;
import com.example.waterbottlesystem.model.OrderStatus;
import com.example.waterbottlesystem.model.User;

public interface OrderRequestRepository extends JpaRepository<OrderRequest, Long> {
    
    List<OrderRequest> findByClient(User client);
    List<OrderRequest> findByReseller(User reseller);
    List<OrderRequest> findByResellerAndStatus(User reseller, OrderStatus status);
    List<OrderRequest> findByClientId(Long clientId);

    @Query("SELECT o.reseller.id AS resellerId, MAX(o.createdAt) AS latestOrderRequestDate, COUNT(o) AS orderRequestCount " +
           "FROM OrderRequest o WHERE o.reseller IN :resellers GROUP BY o.reseller.id")
    List<Map<String, Object>> findOrderRequestStatsByResellers(@Param("resellers") List<User> resellers);

    @Query("SELECT COUNT(o) FROM OrderRequest o WHERE o.client.id = :clientId")
long countByClientId(@Param("clientId") User clientId);
}