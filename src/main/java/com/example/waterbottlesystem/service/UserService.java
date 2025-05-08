package com.example.waterbottlesystem.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.example.waterbottlesystem.model.Role;
import com.example.waterbottlesystem.model.User;
import com.example.waterbottlesystem.repository.OrderRequestRepository;
import com.example.waterbottlesystem.repository.UserRepository;

import jakarta.mail.internet.MimeMessage;

@Service
public class UserService {
    
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    
    private final UserRepository userRepository;
    private final OrderRequestRepository orderRequestRepository;

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Autowired
    public UserService(UserRepository userRepository, OrderRequestRepository orderRequestRepository) {
        this.userRepository = userRepository;
        this.orderRequestRepository = orderRequestRepository;
    }

    public String registerUser(User user) {
        // Check if the email is already in use
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("Email already in use");
        }
    
        // Set default role if not provided
        if (user.getRole() == null) {
            user.setRole(Role.CLIENT); // Default to CLIENT role
        }
    
        // Validate address for resellers
        if (user.getRole() == Role.RESELLER && (user.getAddress() == null || user.getAddress().trim().isEmpty())) {
            throw new IllegalArgumentException("Address is required for resellers");
        }
        // Clients can have null address
    
        // Don't hash the password; store as is (NOT recommended for production)
        user.setPassword(user.getPassword());  // Storing plain text password
        user.setEnabled(false); // Set the account as not enabled
        user.setConfirmationToken(UUID.randomUUID().toString()); // Generate confirmation token
    
        // Save the user to the repository
        userRepository.save(user);
    
        // Send confirmation email
        sendConfirmationEmail(user);
    
        return "Registration successful. Please confirm your email.";
    }
    
    public Optional<User> confirmUser(String token) {
        Optional<User> userOpt = userRepository.findByConfirmationToken(token);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setEnabled(true);
            user.setConfirmationToken(null);
            userRepository.save(user);
            return Optional.of(user);
        }
        return Optional.empty();
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public List<User> getResellersInCity(String city) {
        List<User> resellers = userRepository.findByRoleAndCity(Role.RESELLER, city);
        if (!resellers.isEmpty()) {
            List<Map<String, Object>> orderStats = orderRequestRepository.findOrderRequestStatsByResellers(resellers);
            for (User reseller : resellers) {
                Optional<Map<String, Object>> stats = orderStats.stream()
                    .filter(stat -> stat.get("resellerId").equals(reseller.getId()))
                    .findFirst();
                stats.ifPresent(stat -> {
                    reseller.setLatestOrderRequestDate(stat.get("latestOrderRequestDate"));
                    reseller.setOrderRequestCount(((Number) stat.get("orderRequestCount")).longValue());
                });
            }
        }
        return resellers;
    }

    public User save(User user) {
        return userRepository.save(user);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    public User updateUser(User user) {
        if (user.getRole() == Role.RESELLER && (user.getAddress() == null || user.getAddress().trim().isEmpty())) {
            throw new IllegalArgumentException("Address is required for resellers");
        }
        return userRepository.save(user);
    }

    public void sendConfirmationEmail(User user) {
        try {
            logger.info("Sending confirmation email to {}", user.getEmail());
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String subject = "Verify Your Water Bottle System Account";
            String confirmationUrl = frontendUrl + "/confirm?token=" + user.getConfirmationToken();
            String htmlBody = "<h1>Welcome to Water Bottle System!</h1>" +
                              "<p>Dear " + user.getName() + ",</p>" +
                              "<p>Thank you for signing up. Please verify your email address to activate your account:</p>" +
                              "<p><a href=\"" + confirmationUrl + "\" style=\"background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;\">Verify Email</a></p>" +
                              "<p>If the button doesn't work, copy and paste this link into your browser:<br>" + confirmationUrl + "</p>" +
                              "<p>This is an automated message. Please do not reply to this email.</p>" +
                              "<p>If you did not create this account, please ignore this email.</p>" +
                              "<p>Best regards,<br>Water Bottle System Team</p>";
            String plainTextBody = "Dear " + user.getName() + ",\n\n" +
                                   "Thank you for signing up with Water Bottle System!\n\n" +
                                   "To activate your account, please visit:\n" + confirmationUrl + "\n\n" +
                                   "This is an automated message. Please do not reply to this email.\n\n" +
                                   "If you did not create this account, please ignore this email.\n\n" +
                                   "Best regards,\nWater Bottle System Team";

            helper.setFrom("Water Bottle System No-Reply <jedydev@gmail.com>");
            helper.setTo(user.getEmail());
            helper.setSubject(subject);
            helper.setText(plainTextBody, htmlBody);

            mailSender.send(message);
            logger.info("Confirmation email sent successfully to {}", user.getEmail());
        } catch (Exception e) {
            logger.error("Failed to send confirmation email to {}", user.getEmail(), e);
            throw new RuntimeException("Failed to send confirmation email", e);
        }
    }
}