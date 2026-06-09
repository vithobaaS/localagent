package com.autopropel.localagent_cloud.controller;

import com.autopropel.localagent_cloud.service.ExecutionService;
import com.autopropel.localagent_cloud.service.TestSuiteService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "*")
public class PipelineController {

    private final TestSuiteService testSuiteService;
    private final ExecutionService executionService;

    public PipelineController(TestSuiteService testSuiteService, ExecutionService executionService) {
        this.testSuiteService = testSuiteService;
        this.executionService = executionService;
    }

    private Long orgId(HttpServletRequest req) {
        Object o = req.getAttribute("orgId");
        return o != null ? ((Number) o).longValue() : null;
    }

    @PostMapping("/suites/{id}/trigger")
    public ResponseEntity<Map<String, Object>> triggerSuite(
            @PathVariable("id") Long id,
            HttpServletRequest req) {
        Long orgId = orgId(req);
        if (orgId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        // Pass empty body for now (no overrides)
        ResponseEntity<Map<String, Object>> res = testSuiteService.run(id, new HashMap<>(), orgId);
        
        if (res.getStatusCode() == HttpStatus.OK || res.getStatusCode() == HttpStatus.CREATED) {
            Map<String, Object> body = res.getBody();
            if (body != null && body.containsKey("executionId")) {
                Map<String, Object> response = new HashMap<>();
                response.put("executionId", body.get("executionId"));
                response.put("message", "Test Suite triggered successfully");
                return ResponseEntity.ok(response);
            }
        }
        return ResponseEntity.status(res.getStatusCode()).body(res.getBody());
    }

    @GetMapping("/executions/{id}/status")
    public ResponseEntity<Map<String, Object>> getExecutionStatus(
            @PathVariable("id") Long id,
            HttpServletRequest req) {
        Long orgId = orgId(req);
        if (orgId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        ResponseEntity<Map<String, Object>> res = executionService.getById(id);
        if (res.getStatusCode() != HttpStatus.OK || res.getBody() == null) {
            return ResponseEntity.status(res.getStatusCode()).build();
        }

        Map<String, Object> executionData = res.getBody();
        Map<String, Object> execution = (Map<String, Object>) executionData.get("execution");
        
        // Extract basic fields
        Map<String, Object> response = new HashMap<>();
        response.put("executionId", execution.get("id"));
        response.put("status", execution.get("status"));
        response.put("passedCount", execution.get("passedCount"));
        response.put("failedCount", execution.get("failedCount"));
        response.put("totalCount", execution.get("totalCount"));
        response.put("durationMs", execution.get("durationMs"));
        response.put("startedAt", execution.get("startedAt"));
        response.put("completedAt", execution.get("completedAt"));

        return ResponseEntity.ok(response);
    }
}
