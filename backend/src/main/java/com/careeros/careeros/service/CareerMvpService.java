package com.careeros.careeros.service;

import com.careeros.careeros.dto.WhatsAppConfigRequest;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;
import org.springframework.stereotype.Service;

@Service
public class CareerMvpService {

    private final Map<String, WhatsAppConfig> whatsappConfigs = new ConcurrentHashMap<>();
    private final String atsProviderUrl;
    private final String jobsProviderUrl;
    private final String whatsappProviderUrl;
    private final String whatsappToken;
    private final String whatsappPhoneNumberId;
    private final RestClient restClient = RestClient.create();

    public CareerMvpService(
            @Value("${integrations.ats.url:}") String atsProviderUrl,
            @Value("${integrations.jobs.url:}") String jobsProviderUrl,
            @Value("${integrations.whatsapp.api-url:}") String whatsappProviderUrl,
            @Value("${integrations.whatsapp.token:}") String whatsappToken,
            @Value("${integrations.whatsapp.phone-number-id:}") String whatsappPhoneNumberId) {
        this.atsProviderUrl = atsProviderUrl;
        this.jobsProviderUrl = jobsProviderUrl;
        this.whatsappProviderUrl = whatsappProviderUrl;
        this.whatsappToken = whatsappToken;
        this.whatsappPhoneNumberId = whatsappPhoneNumberId;
    }

    public Map<String, Object> progressSummary(String email) {
        return Map.of(
                "student", email,
                "source", "local-mvp",
                "profileCompletion", 82,
                "resumeAtsScore", 88,
                "coding", Map.of("githubCommits", 124, "leetcodeSolved", 146, "codeforcesRating", 1248),
                "career", Map.of("applications", 23, "interviews", 5, "offers", 2));
    }

    public Map<String, Object> profileStats(String provider, String username) {
        if (provider == null || username == null || !username.matches("[A-Za-z0-9_.-]{1,100}")) {
            throw new IllegalArgumentException("Invalid profile username");
        }
        return switch (provider.toLowerCase()) {
            case "github" -> githubStats(username);
            case "codeforces" -> codeforcesStats(username);
            case "leetcode" -> leetcodeStats(username);
            default -> throw new IllegalArgumentException("Unsupported profile provider");
        };
    }

    private Map<String, Object> githubStats(String username) {
        Map<?, ?> profile = restClient.get()
                .uri("https://api.github.com/users/{username}", username)
                .retrieve()
                .body(Map.class);
        return Map.of(
                "provider", "github",
                "repositories", number(profile, "public_repos"),
                "followers", number(profile, "followers"));
    }

    private Map<String, Object> codeforcesStats(String username) {
        Map<?, ?> response = restClient.get()
                .uri("https://codeforces.com/api/user.info?handles={username}", username)
                .retrieve()
                .body(Map.class);
        List<?> result = (List<?>) response.get("result");
        if (!"OK".equals(response.get("status")) || result == null || result.isEmpty()) {
            throw new IllegalArgumentException("Codeforces profile was not found");
        }
        Map<?, ?> profile = (Map<?, ?>) result.get(0);
        return Map.of(
                "provider", "codeforces",
                "rating", valueOrDefault(profile, "rating", "Unrated"),
                "maxRating", valueOrDefault(profile, "maxRating", "Unrated"));
    }

    private Map<String, Object> leetcodeStats(String username) {
        Map<String, Object> request = Map.of(
                "query", "query userPublicProfile($username: String!) { matchedUser(username: $username) { submitStatsGlobal { acSubmissionNum { difficulty count } } } }",
                "variables", Map.of("username", username));
        Map<?, ?> response = restClient.post()
                .uri("https://leetcode.com/graphql")
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(Map.class);
        Map<?, ?> data = (Map<?, ?>) response.get("data");
        Map<?, ?> matchedUser = data == null ? null : (Map<?, ?>) data.get("matchedUser");
        Map<?, ?> stats = matchedUser == null ? null : (Map<?, ?>) matchedUser.get("submitStatsGlobal");
        List<?> submissions = stats == null ? null : (List<?>) stats.get("acSubmissionNum");
        if (submissions == null) {
            throw new IllegalArgumentException("LeetCode profile was not found");
        }
        Map<?, ?> all = submissions.stream()
                .filter(Map.class::isInstance)
                .map(Map.class::cast)
                .filter(item -> "All".equals(item.get("difficulty")))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("LeetCode stats were unavailable"));
        return Map.of("provider", "leetcode", "solved", number(all, "count"));
    }

    private Object valueOrDefault(Map<?, ?> values, String key, Object fallback) {
        return values.containsKey(key) && values.get(key) != null ? values.get(key) : fallback;
    }

    private Number number(Map<?, ?> values, String key) {
        Object value = values.get(key);
        if (value instanceof Number number) {
            return number;
        }
        throw new IllegalArgumentException("Provider returned an invalid response");
    }

    public Map<String, Object> atsScore(String email) {
        return Map.of(
                "student", email,
                "score", 88,
                "source", atsProviderUrl.isBlank() ? "local-mvp" : "configured-provider-not-called",
                "providerConfigured", !atsProviderUrl.isBlank(),
                "suggestions", List.of("Add measurable project outcomes", "Include cloud deployment experience"));
    }

    public Map<String, Object> jobRecommendations(String email) {
        return Map.of(
                "student", email,
                "source", jobsProviderUrl.isBlank() ? "local-mvp" : "configured-provider-not-called",
                "providerConfigured", !jobsProviderUrl.isBlank(),
                "recommendations", List.of(
                        Map.of("title", "Software Engineer Intern", "company", "Google", "match", 92, "location", "Bengaluru"),
                        Map.of("title", "Backend Engineer", "company", "Microsoft", "match", 88, "location", "Hyderabad")));
    }

    public Map<String, Object> saveWhatsAppConfig(String email, WhatsAppConfigRequest request) {
        WhatsAppConfig current = whatsappConfigs.getOrDefault(email, new WhatsAppConfig(false, null, "09:00"));
        WhatsAppConfig updated = new WhatsAppConfig(
                request.enabled() == null ? current.enabled() : request.enabled(),
                request.phoneNumber() == null ? current.phoneNumber() : request.phoneNumber(),
                request.reminderTime() == null ? current.reminderTime() : request.reminderTime());
        whatsappConfigs.put(email, updated);
        return whatsappStatus(email);
    }

    public Map<String, Object> whatsappStatus(String email) {
        WhatsAppConfig config = whatsappConfigs.getOrDefault(email, new WhatsAppConfig(false, null, "09:00"));
        return Map.of(
                "enabled", config.enabled(),
                "phoneNumberConfigured", config.phoneNumber() != null,
                "reminderTime", config.reminderTime(),
                "providerConfigured", whatsappCredentialsPresent(),
                "providerCallsEnabled", false,
                "message", whatsappCredentialsPresent()
                        ? "WhatsApp provider is configured; outbound calls remain disabled in this MVP"
                        : "WhatsApp credentials are not configured");
    }

    public boolean whatsappCredentialsPresent() {
        return !whatsappProviderUrl.isBlank() && !whatsappToken.isBlank() && !whatsappPhoneNumberId.isBlank();
    }

    public int enabledReminderCount() {
        return (int) whatsappConfigs.values().stream().filter(config -> config.enabled()).count();
    }

    private record WhatsAppConfig(boolean enabled, String phoneNumber, String reminderTime) {
    }
}
