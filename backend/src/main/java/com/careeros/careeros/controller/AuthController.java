package com.careeros.careeros.controller;

import com.careeros.careeros.dto.AuthRequest;
import com.careeros.careeros.dto.AuthResponse;
import com.careeros.careeros.dto.RegisterRequest;
import com.careeros.careeros.model.User;
import com.careeros.careeros.service.AuthService;
import com.careeros.careeros.service.AwsS3Service;
import com.careeros.careeros.service.AwsSesService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final AwsSesService awsSesService;
    private final AwsS3Service awsS3Service;

    public AuthController(AuthService authService, AwsSesService awsSesService, AwsS3Service awsS3Service) {
        this.authService = authService;
        this.awsSesService = awsSesService;
        this.awsS3Service = awsS3Service;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            SecurityContextHolder.clearContext();
        }
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @PostMapping("/send-email")
    public ResponseEntity<Map<String, Object>> sendEmail(@RequestBody Map<String, String> payload) {
        String to = payload.getOrDefault("to", "");
        String subject = payload.getOrDefault("subject", "Welcome to Code2Career");
        String body = payload.getOrDefault("body", "Welcome!");

        boolean sent = awsSesService.sendTextEmail(to, subject, body);
        return ResponseEntity.ok(Map.of("sent", sent, "to", to));
    }

    @PostMapping("/upload-resume")
    public ResponseEntity<Map<String, Object>> uploadResume(@RequestBody Map<String, String> payload) {
        String key = payload.getOrDefault("key", "resumes/resume.pdf");
        String base64Content = payload.getOrDefault("content", "");
        String contentType = payload.getOrDefault("contentType", "application/pdf");

        if (base64Content == null || base64Content.isBlank()) {
            return ResponseEntity.ok(Map.of("uploaded", false, "key", key));
        }

        byte[] bytes = java.util.Base64.getDecoder().decode(base64Content);
        boolean uploaded = awsS3Service.uploadFile(key, bytes, contentType);
        return ResponseEntity.ok(Map.of("uploaded", uploaded, "key", key));
    }

    @GetMapping("/me")
    public ResponseEntity<User> me() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(authService.getCurrentUser(auth.getName()));
    }
}
