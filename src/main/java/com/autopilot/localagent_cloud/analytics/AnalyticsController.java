package com.autopilot.localagent_cloud.analytics;

import java.util.List;
import java.util.Map;

import com.autopilot.localagent_cloud.service.AnalyticsService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Data Normalization & Quality Feature Engineering
 * Handles aggregated metrics, pass/fail rates, and coverage data.
 */
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

    @GetMapping("/dashboard/summary")
    public ResponseEntity<Map<String, Object>> getQualitySummary() {
        // TODO: Aggregate test data from DB and calculate pass/fail and coverage rates
        return ResponseEntity.ok(Map.of(
                "totalTests", 0,
                "passRate", 0.0,
                "flakyTestsDetected", 0
        ));
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

    /**
     * GET /api/analytics/fleet-health
     * Returns live fleet status: agent statuses, counts, and queue depth.
     */
    @GetMapping("/fleet-health")
    public ResponseEntity<Map<String, Object>> getFleetHealth(HttpServletRequest req) {
        Long orgId = orgId(req);
        Map<String, Object> data = analyticsService.getFleetHealth(orgId);
        return ResponseEntity.ok(data);
    }
}
