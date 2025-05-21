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
import com.example.waterbottlesystem.service.OrderService;
import com.example.waterbottlesystem.service.UserService;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:4200")
public class UserController {
    
    private final UserService userService;
    private final JwtUtil jwtUtil;

    @Autowired
    private OrderService orderService;
    
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
            response.put("surname", currentUser.getSurname());
            response.put("email", currentUser.getEmail());
            response.put("phone", currentUser.getPhoneNumber());
            response.put("address", currentUser.getAddress());
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
            if (updates.containsKey("surname")) {
                currentUser.setSurname(updates.get("surname"));
            }
            if (updates.containsKey("email")) {
                String newEmail = updates.get("email");
                if (newEmail == null || !newEmail.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+")) {
                    return ResponseEntity.badRequest().body("Invalid email format");
                }
                if (!newEmail.equals(currentUser.getEmail()) && userService.findByEmail(newEmail).isPresent()) {
                    return ResponseEntity.badRequest().body("Email already in use");
                }
                currentUser.setEmail(newEmail);
            }
            if (updates.containsKey("phone")) {
                String phone = updates.get("phone");
                if (phone != null && !phone.matches("\\+?\\d{10,15}")) {
                    return ResponseEntity.badRequest().body("Invalid phone number format");
                }
                currentUser.setPhoneNumber(phone);
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
            
            // Return updated profile as JSON
            Map<String, Object> response = new HashMap<>();
            response.put("id", updatedUser.getId());
            response.put("name", updatedUser.getName());
            response.put("surname", updatedUser.getSurname());
            response.put("email", updatedUser.getEmail());
            response.put("phone", updatedUser.getPhoneNumber());
            response.put("address", updatedUser.getAddress());
            response.put("city", updatedUser.getCity());
            
            return ResponseEntity.ok(response);
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
            if (updates.containsKey("surname")) {
                currentUser.setSurname(updates.get("surname"));
            }
            if (updates.containsKey("phone")) {
                currentUser.setPhoneNumber(updates.get("phone"));
            }
            if (updates.containsKey("city")) {
                currentUser.setCity(updates.get("city"));
            }
            if (updates.containsKey("address")) {
                currentUser.setAddress(updates.get("address"));
            }

            User updatedUser = userService.updateUser(currentUser);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Unauthorized: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(
            @PathVariable Long id,
            @RequestBody User updates) {
        try {
            System.out.println("Received update request for user ID: " + id);
            System.out.println("Update data: " + updates);

            Optional<User> userToUpdate = userService.findById(id);
            if (userToUpdate.isEmpty()) {
                System.out.println("User not found with ID: " + id);
                return ResponseEntity.status(404).body("User to update not found");
            }

            User user = userToUpdate.get();
            System.out.println("Found user to update: " + user.getEmail());
            
            // Only update fields that are not null
            if (updates.getName() != null) {
                user.setName(updates.getName());
            }
            if (updates.getSurname() != null) {
                user.setSurname(updates.getSurname());
            }
            if (updates.getEmail() != null) {
                // Check if email is already in use by another user
                Optional<User> existingUser = userService.findByEmail(updates.getEmail());
                if (existingUser.isPresent() && !existingUser.get().getId().equals(user.getId())) {
                    return ResponseEntity.badRequest().body("Email already in use");
                }
                user.setEmail(updates.getEmail());
            }
            if (updates.getPhoneNumber() != null) {
                user.setPhoneNumber(updates.getPhoneNumber());
            }
            if (updates.getAddress() != null) {
                user.setAddress(updates.getAddress());
            }
            if (updates.getCity() != null) {
                user.setCity(updates.getCity());
            }
            // Update enabled status
            user.setEnabled(updates.isEnabled());

            User updatedUser = userService.updateUser(user);
            System.out.println("User updated successfully: " + updatedUser.getEmail());
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            System.out.println("Error updating user: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error updating user: " + e.getMessage());
        }
    }

    private String extractToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Invalid authorization header");
        }
        return authHeader.substring(7);
    }
}