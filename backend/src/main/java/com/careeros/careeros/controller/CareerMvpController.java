package com.careeros.careeros.controller;

import com.careeros.careeros.dto.WhatsAppConfigRequest;
import com.careeros.careeros.service.CareerMvpService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/student")
public class CareerMvpController {

    private final CareerMvpService service;

    public CareerMvpController(CareerMvpService service) {
        this.service = service;
    }

    @GetMapping("/progress/summary")
    public Map<String, Object> progressSummary(Authentication authentication) {
        return service.progressSummary(authentication.getName());
    }

    @GetMapping("/public/profile-stats/{provider}/{username}")
    public Map<String, Object> profileStats(
            @PathVariable String provider, @PathVariable String username) {
        return service.profileStats(provider, username);
    }

    @GetMapping("/ats/score")
    public Map<String, Object> atsScore(Authentication authentication) {
        return service.atsScore(authentication.getName());
    }

    @GetMapping("/jobs/recommendations")
    public Map<String, Object> jobRecommendations(Authentication authentication) {
        return service.jobRecommendations(authentication.getName());
    }

    @PutMapping("/whatsapp/config")
    public ResponseEntity<Map<String, Object>> configureWhatsApp(
            Authentication authentication, @Valid @RequestBody WhatsAppConfigRequest request) {
        return ResponseEntity.ok(service.saveWhatsAppConfig(authentication.getName(), request));
    }

    @GetMapping("/whatsapp/status")
    public Map<String, Object> whatsappStatus(Authentication authentication) {
        return service.whatsappStatus(authentication.getName());
    }
}
