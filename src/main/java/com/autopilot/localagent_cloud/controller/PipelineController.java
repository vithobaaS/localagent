package com.autopilot.localagent_cloud.controller;

import com.autopilot.localagent_cloud.service.ExecutionService;
import com.autopilot.localagent_cloud.service.TestSuiteService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/v1")
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

        try {
            // Pass empty body for now (no overrides)
            ResponseEntity<Map<String, Object>> res = testSuiteService.run(id, new HashMap<>(), orgId);
            
            if (res.getStatusCode() == HttpStatus.OK || res.getStatusCode() == HttpStatus.CREATED) {
                Map<String, Object> body = res.getBody();
                if (body != null && body.containsKey("scheduler")) {
                    com.autopilot.localagent_cloud.model.Scheduler sched = (com.autopilot.localagent_cloud.model.Scheduler) body.get("scheduler");
                    Map<String, Object> response = new HashMap<>();
                    response.put("schedulerId", sched.getId());
                    response.put("message", "Test Suite queued successfully");
                    return ResponseEntity.ok(response);
                }
            }
            return ResponseEntity.status(res.getStatusCode()).body(res.getBody());
        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Failed to trigger Test Suite");
            err.put("details", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @SuppressWarnings("unchecked")
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

        return ResponseEntity.ok(buildExecutionStatusResponse(res.getBody()));
    }

    @SuppressWarnings("unchecked")
    @GetMapping("/schedulers/{id}/execution-status")
    public ResponseEntity<Map<String, Object>> getSchedulerExecutionStatus(
            @PathVariable("id") Long id,
            HttpServletRequest req) {
        Long orgId = orgId(req);
        if (orgId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        ResponseEntity<Map<String, Object>> res = executionService.getBySchedulerId(id);
        if (res.getStatusCode() != HttpStatus.OK || res.getBody() == null) {
            Map<String, Object> queuedResponse = new HashMap<>();
            queuedResponse.put("status", "queued");
            queuedResponse.put("message", "Waiting for Local Agent to pick up the job...");
            return ResponseEntity.ok(queuedResponse);
        }

        return ResponseEntity.ok(buildExecutionStatusResponse(res.getBody()));
    }

    private Map<String, Object> buildExecutionStatusResponse(Map<String, Object> executionData) {
        com.autopilot.localagent_cloud.model.Execution execution = (com.autopilot.localagent_cloud.model.Execution) executionData.get("execution");
        java.util.List<com.autopilot.localagent_cloud.model.StepResult> steps = (java.util.List<com.autopilot.localagent_cloud.model.StepResult>) executionData.get("steps");
        
        int passed = 0;
        int failed = 0;
        if (steps != null) {
            for (com.autopilot.localagent_cloud.model.StepResult step : steps) {
                if (step.getResultStatus() != null && step.getResultStatus() == 1) passed++;
                else if (step.getResultStatus() != null && step.getResultStatus() == 2) failed++;
            }
        }
        int total = passed + failed;
        double passPercentage = total > 0 ? ((double) passed / total) * 100.0 : 0.0;

        long durationMs = 0;
        if (execution.getCreatedAt() != null && execution.getFinishedAt() != null) {
            durationMs = java.time.Duration.between(execution.getCreatedAt(), execution.getFinishedAt()).toMillis();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("executionId", execution.getId());
        response.put("status", execution.getStatus());
        response.put("passedCount", passed);
        response.put("failedCount", failed);
        response.put("totalCount", total);
        response.put("passPercentage", Math.round(passPercentage * 100.0) / 100.0);
        response.put("durationMs", durationMs);
        response.put("aiAnalysis", execution.getAiAnalysis());
        response.put("startedAt", execution.getCreatedAt());
        response.put("completedAt", execution.getFinishedAt());
        return response;
    }
}
