package com.careeros.careeros.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class DashboardController {

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("studentName", "Student");
        result.put("profileCompletion", 82);
        result.put("resumeAtsScore", 88);
        result.put("monthlyGrowth", 12);
        result.put("coding", Map.of(
                "githubCommits", 124,
                "githubRepositories", 12,
                "leetcodeSolved", 146,
                "codeforcesRating", 1248,
                "currentStreak", 18));
        result.put("career", Map.of(
                "jobs", 8,
                "internships", 5,
                "applications", 23,
                "upcomingDeadlines", 4));
        result.put("recommendedJobs", List.of(
                Map.of("title", "Software Engineer Intern", "company", "Google", "match", 92, "location", "Bengaluru"),
                Map.of("title", "Frontend Engineer", "company", "Microsoft", "match", 88, "location", "Hyderabad"),
                Map.of("title", "SDE Intern", "company", "Amazon", "match", 90, "location", "Pune")));
        result.put("recommendedInternships", List.of(
                Map.of("title", "Backend Intern", "company", "Paytm", "match", 86, "location", "Remote"),
                Map.of("title", "Data Engineer Intern", "company", "Oracle", "match", 84, "location", "Bengaluru")));
        result.put("applications", List.of(
                Map.of("company", "Amazon", "role", "SDE Intern", "status", "Interview", "deadline", "2026-09-28"),
                Map.of("company", "Google", "role", "Software Engineer", "status", "Applied", "deadline", "2026-10-05"),
                Map.of("company", "Microsoft", "role", "Frontend Engineer", "status", "Shortlisted", "deadline", "2026-10-10"),
                Map.of("company", "Atlassian", "role", "Full Stack Engineer", "status", "Rejected", "deadline", "2026-09-20")));
        result.put("dailyGoals", List.of(
                Map.of("title", "Finish DS/A mock interview", "status", "In Progress", "progress", 70),
                Map.of("title", "Submit resume to 3 targets", "status", "Pending", "progress", 35),
                Map.of("title", "Solve 3 LeetCode medium questions", "status", "Done", "progress", 100)));
        result.put("weeklyCodingActivity", List.of(
                Map.of("day", "Mon", "commits", 16),
                Map.of("day", "Tue", "commits", 22),
                Map.of("day", "Wed", "commits", 19),
                Map.of("day", "Thu", "commits", 28),
                Map.of("day", "Fri", "commits", 18),
                Map.of("day", "Sat", "commits", 12),
                Map.of("day", "Sun", "commits", 9)));
        result.put("leetcodeProgress", List.of(
                Map.of("week", "W1", "solved", 18),
                Map.of("week", "W2", "solved", 24),
                Map.of("week", "W3", "solved", 28),
                Map.of("week", "W4", "solved", 34)));
        result.put("codeforcesHistory", List.of(
                Map.of("week", "W1", "rating", 1030),
                Map.of("week", "W2", "rating", 1095),
                Map.of("week", "W3", "rating", 1168),
                Map.of("week", "W4", "rating", 1248)));
        result.put("applicationsByStatus", List.of(
                Map.of("status", "Applied", "count", 8),
                Map.of("status", "Interview", "count", 5),
                Map.of("status", "Offer", "count", 2),
                Map.of("status", "Rejected", "count", 4)));
        return result;
    }

    @GetMapping("/student/github")
    public Map<String, Object> github() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("username", "student-demo");
        result.put("repositories", 12);
        result.put("publicRepos", 12);
        result.put("commitsThisWeek", 18);
        result.put("pullRequests", 4);
        result.put("issues", 3);
        result.put("stars", 36);
        result.put("followers", 210);
        result.put("following", 130);
        result.put("languages", List.of("Java", "TypeScript", "Python", "SQL"));
        result.put("recentRepos", List.of(
                Map.of("name", "career-os", "language", "Java", "stars", 25),
                Map.of("name", "ai-resume-analyzer", "language", "Python", "stars", 18),
                Map.of("name", "react-dashboard", "language", "TypeScript", "stars", 11)));
        result.put("contributionHistory", List.of(
                Map.of("day", "Mon", "count", 12),
                Map.of("day", "Tue", "count", 18),
                Map.of("day", "Wed", "count", 15),
                Map.of("day", "Thu", "count", 24),
                Map.of("day", "Fri", "count", 17),
                Map.of("day", "Sat", "count", 9),
                Map.of("day", "Sun", "count", 11)));
        return result;
    }

    @GetMapping("/student/leetcode")
    public Map<String, Object> leetcode() {
        return Map.of(
                "username", "aarav_mehta",
                "totalSolved", 146,
                "easy", 63,
                "medium", 58,
                "hard", 25,
                "currentStreak", 18,
                "contestRating", 1807,
                "submissionHistory", List.of(
                        Map.of("date", "Mon", "count", 7),
                        Map.of("date", "Tue", "count", 11),
                        Map.of("date", "Wed", "count", 9),
                        Map.of("date", "Thu", "count", 14),
                        Map.of("date", "Fri", "count", 8),
                        Map.of("date", "Sat", "count", 12),
                        Map.of("date", "Sun", "count", 6)
                )
        );
    }

    @GetMapping("/student/codeforces")
    public Map<String, Object> codeforces() {
        return Map.of(
                "username", "aarav_mehta",
                "currentRating", 1248,
                "maxRating", 1383,
                "contests", 19,
                "problemsSolved", 286,
                "ratingHistory", List.of(
                        Map.of("contest", "Round 1", "rating", 1010),
                        Map.of("contest", "Round 2", "rating", 1066),
                        Map.of("contest", "Round 3", "rating", 1152),
                        Map.of("contest", "Round 4", "rating", 1248)
                )
        );
    }

    @GetMapping("/student/resume")
    public Map<String, Object> resume() {
        return Map.of(
                "atsScore", 88,
                "profileCompleteness", 82,
                "skillGap", List.of("System design", "Data structures", "Cloud deployment"),
                "suggestions", List.of(
                        "Add a one-line summary emphasizing Java backend and distributed systems experience",
                        "Include measurable impact metrics for projects and internships",
                        "Add a projects section with architecture diagrams and deployment details"
                )
        );
    }

    @GetMapping("/student/jobs")
    public Map<String, Object> jobs() {
        return Map.of(
                "recommendations", List.of(
                        Map.of("title", "Software Engineer Intern", "company", "Google", "match", 92, "location", "Bengaluru"),
                        Map.of("title", "Frontend Engineer", "company", "Microsoft", "match", 88, "location", "Hyderabad"),
                        Map.of("title", "SDE Intern", "company", "Amazon", "match", 90, "location", "Pune")
                )
        );
    }

    @GetMapping("/student/applications")
    public Map<String, Object> applications() {
        return Map.of(
                "items", List.of(
                        Map.of("company", "Amazon", "role", "SDE Intern", "status", "Interview", "deadline", "2026-09-28"),
                        Map.of("company", "Google", "role", "Software Engineer", "status", "Applied", "deadline", "2026-10-05"),
                        Map.of("company", "Microsoft", "role", "Frontend Engineer", "status", "Shortlisted", "deadline", "2026-10-10")
                )
        );
    }

    @GetMapping("/student/goals")
    public Map<String, Object> goals() {
        return Map.of(
                "items", List.of(
                        Map.of("title", "Finish DS/A mock interview", "status", "In Progress", "progress", 70),
                        Map.of("title", "Submit resume to 3 targets", "status", "Pending", "progress", 35),
                        Map.of("title", "Solve 3 LeetCode medium questions", "status", "Done", "progress", 100)
                )
        );
    }

    @GetMapping("/student/notifications")
    public Map<String, Object> notifications() {
        return Map.of(
                "items", List.of(
                        Map.of("title", "Google interview slot booked", "type", "Interview", "time", "Today, 5:00 PM"),
                        Map.of("title", "Resume ATS improved", "type", "Insight", "time", "Yesterday"),
                        Map.of("title", "Daily goal reminder", "type", "Reminder", "time", "Tomorrow")
                )
        );
    }

    @GetMapping("/student/assistant")
    public Map<String, Object> assistant() {
        return Map.of(
                "response", "You are on track for software engineering roles. Focus on strengthening system design and backend scalability before the next interview cycle.",
                "nextSteps", List.of(
                        "Complete one advanced DB design problem",
                        "Polish resume metrics and project outcomes",
                        "Reach 150 LeetCode solves by month-end"
                )
        );
    }
}
