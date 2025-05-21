package com.example.waterbottlesystem.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.waterbottlesystem.dto.LoginRequest;
import com.example.waterbottlesystem.model.Role;
import com.example.waterbottlesystem.model.User;
import com.example.waterbottlesystem.service.UserService;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

     @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody User user) {
        try {
            if (user.getRole() == null) {
                user.setRole(Role.CLIENT);
            }
            String response = userService.registerUser(user);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("Email already in use")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email already in use");
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Registration failed");
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<User> userOpt = userService.findByEmail(request.getEmail());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body("Invalid email or password");
        }
        User user = userOpt.get();
        if (!user.getPassword().equals(request.getPassword())) {
            return ResponseEntity.status(401).body("Invalid email or password");
        }
        if (!user.isEnabled()) {
            return ResponseEntity.status(403).body("Please confirm your email first");
        }
        String token = jwtUtil.generateToken(user.getEmail());
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("role", user.getRole().name());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/confirm")
    public ResponseEntity<String> confirmEmail(@RequestParam("token") String token) {
        Optional<User> userOpt = userService.confirmUser(token);
        if (userOpt.isPresent()) {
            return ResponseEntity.ok("Account confirmed. You can now log in.");
        } else {
            return ResponseEntity.badRequest().body("Invalid or expired token.");
        }
    }

      @GetMapping("/profile")
       public ResponseEntity<?> getUserProfile(HttpServletRequest request) {
           try {
               String authHeader = request.getHeader("Authorization");
               if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                   return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Missing or invalid Authorization header");
               }
               String token = authHeader.substring(7);
               String email = jwtUtil.extractUsername(token);
               if (!jwtUtil.validateToken(token)) {
                   return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired token");
               }
               Optional<User> userOpt = userService.findByEmail(email);
               if (userOpt.isEmpty()) {
                   return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
               }
               User user = userOpt.get();
               Map<String, Object> response = new HashMap<>();
               response.put("id", user.getId());
               response.put("name", user.getName());
               response.put("email", user.getEmail());
               response.put("role", user.getRole().name());
               response.put("phone", user.getPhoneNumber());
               response.put("city", user.getCity());
               return ResponseEntity.ok(response);
           } catch (Exception e) {
               return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error fetching profile: " + e.getMessage());
           }
       }
}