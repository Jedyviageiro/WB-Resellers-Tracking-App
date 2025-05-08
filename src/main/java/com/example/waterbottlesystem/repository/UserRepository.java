package com.example.waterbottlesystem.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.waterbottlesystem.model.Role;
import com.example.waterbottlesystem.model.User;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    List<User> findByRoleAndCity(Role role, String city);

    Optional<User> findByConfirmationToken(String token);

    
}
