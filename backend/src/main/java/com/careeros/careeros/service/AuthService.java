package com.careeros.careeros.service;

import com.careeros.careeros.config.JwtService;
import com.careeros.careeros.dto.AuthRequest;
import com.careeros.careeros.dto.AuthResponse;
import com.careeros.careeros.dto.RegisterRequest;
import com.careeros.careeros.model.Role;
import com.careeros.careeros.model.User;
import com.careeros.careeros.repository.UserRepository;
import java.util.List;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtService jwtService, AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("User already exists with this email");
        }

        User user = new User(
                request.getName(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                request.getPhone(),
                request.getCollege(),
                request.getDegree(),
                request.getBranch(),
                request.getGraduationYear(),
                request.getTargetRole(),
                request.getSkills(),
                Role.STUDENT
        );

        User saved = userRepository.save(user);
        String token = jwtService.generateToken(saved);

        return new AuthResponse(token, saved.getName(), saved.getEmail(), saved.getRole().name());
    }

    public AuthResponse login(AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, user.getName(), user.getEmail(), user.getRole().name());
    }

    public User getCurrentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public List<String> getTopSkills(String email) {
        User user = getCurrentUser(email);
        if (user.getSkills() == null || user.getSkills().isBlank()) {
            return List.of("Java", "Spring Boot", "SQL", "Problem Solving");
        }
        return List.of(user.getSkills().split(","));
    }
}
