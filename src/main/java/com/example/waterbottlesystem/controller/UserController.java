package com.example.waterbottlesystem.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
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
import com.example.waterbottlesystem.model.User;
import com.example.waterbottlesystem.service.UserService;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:4200")
public class UserController {
    
    private final UserService userService;
    private final JwtUtil jwtUtil;

    @Autowired
    public UserController(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    public Optional<User> getUserById(@PathVariable Long id) {
        return userService.findById(id);
    }

    @GetMapping("/resellers/{city}")
    public List<User> getResellersByCity(@PathVariable String city) {
        return userService.getResellersInCity(city);
    }

    @PostMapping
    public User saveUser(@RequestBody User user) {
        return userService.save(user);
    }

    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
    }

    @GetMapping("/reseller/profile")
    public ResponseEntity<?> getResellerProfile(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = extractToken(authHeader);
            String email = jwtUtil.extractUsername(token);
            
            User currentUser = userService.findByEmail(email).orElse(null);
            if (currentUser == null) {
                return ResponseEntity.status(404).body("User not found");
            }

            if (currentUser.getRole() != Role.RESELLER) {
                return ResponseEntity.status(403).body("Only resellers can access this endpoint");
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", currentUser.getId());
            response.put("name", currentUser.getName());
            response.put("email", currentUser.getEmail());
            response.put("address", currentUser.getAddress());
            response.put("phone", currentUser.getPhoneNumber());
            response.put("city", currentUser.getCity());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Unauthorized: " + e.getMessage());
        }
    }

    @PutMapping("/reseller/profile")
    public ResponseEntity<?> updateResellerProfile(
            @RequestBody Map<String, String> updates,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = extractToken(authHeader);
            String email = jwtUtil.extractUsername(token);
            
            User currentUser = userService.findByEmail(email).orElse(null);
            if (currentUser == null) {
                return ResponseEntity.status(404).body("User not found");
            }

            if (currentUser.getRole() != Role.RESELLER) {
                return ResponseEntity.status(403).body("Only resellers can update their profile");
            }

            if (updates.containsKey("name")) {
                currentUser.setName(updates.get("name"));
            }
            if (updates.containsKey("phone")) {
                currentUser.setPhoneNumber(updates.get("phone"));
            }
            if (updates.containsKey("address")) {
                String newAddress = updates.get("address");
                if (newAddress == null || newAddress.trim().isEmpty()) {
                    return ResponseEntity.badRequest().body("Address is required for resellers");
                }
                currentUser.setAddress(newAddress);
            }
            if (updates.containsKey("city")) {
                currentUser.setCity(updates.get("city"));
            }

            User updatedUser = userService.updateUser(currentUser);
            return ResponseEntity.ok("Profile updated successfully");
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Unauthorized: " + e.getMessage());
        }
    }

    @GetMapping("/client/profile")
    public ResponseEntity<?> getClientProfile(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = extractToken(authHeader);
            String email = jwtUtil.extractUsername(token);
            
            User currentUser = userService.findByEmail(email).orElse(null);
            if (currentUser == null) {
                return ResponseEntity.status(404).body("User not found");
            }

            if (currentUser.getRole() != Role.CLIENT) {
                return ResponseEntity.status(403).body("Only clients can access this endpoint");
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", currentUser.getId());
            response.put("name", currentUser.getName());
            response.put("email", currentUser.getEmail());
            response.put("phone", currentUser.getPhoneNumber());
            response.put("city", currentUser.getCity());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Unauthorized: " + e.getMessage());
        }
    }

    @PutMapping("/client/profile")
    public ResponseEntity<?> updateClientProfile(
            @RequestBody Map<String, String> updates,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = extractToken(authHeader);
            String email = jwtUtil.extractUsername(token);
            
            User currentUser = userService.findByEmail(email).orElse(null);
            if (currentUser == null) {
                return ResponseEntity.status(404).body("User not found");
            }

            if (currentUser.getRole() != Role.CLIENT) {
                return ResponseEntity.status(403).body("Only clients can update their profile");
            }

            if (updates.containsKey("name")) {
                currentUser.setName(updates.get("name"));
            }
            if (updates.containsKey("phone")) {
                currentUser.setPhoneNumber(updates.get("phone"));
            }
            if (updates.containsKey("city")) {
                currentUser.setCity(updates.get("city"));
            }

            User updatedUser = userService.updateUser(currentUser);
            return ResponseEntity.ok("Profile updated successfully");
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Unauthorized: " + e.getMessage());
        }
    }

    private String extractToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Invalid authorization header");
        }
        return authHeader.substring(7);
    }
    
}