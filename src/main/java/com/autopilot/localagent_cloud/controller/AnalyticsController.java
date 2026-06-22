package com.autopilot.localagent_cloud.controller;

import com.autopilot.localagent_cloud.service.AnalyticsService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    private Long orgId(HttpServletRequest req) {
        Object o = req.getAttribute("orgId");
        return o != null ? ((Number) o).longValue() : null;
    }

    /**
     * GET /api/analytics/flaky-suites
     * Returns the top N flakiest test suites for the authenticated org.
     */
    @GetMapping("/flaky-suites")
    public ResponseEntity<List<Map<String, Object>>> getFlakySuites(
            @RequestParam(defaultValue = "5") int limit,
            HttpServletRequest req) {
        Long orgId = orgId(req);
        List<Map<String, Object>> data = analyticsService.getFlakySuites(orgId, limit);
        return ResponseEntity.ok(data);
    }
}
