package com.autopropel.localagent_cloud.controller;

import com.autopropel.localagent_cloud.model.Execution;
import com.autopropel.localagent_cloud.service.AgentService;
import com.autopropel.localagent_cloud.service.ExecutionService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/executions")
@CrossOrigin(origins = "*")
public class ExecutionController {

    private final ExecutionService executionService;
    private final AgentService agentService;

    public ExecutionController(ExecutionService executionService, AgentService agentService) {
        this.executionService = executionService;
        this.agentService = agentService;
    }

    private Long orgId(HttpServletRequest req) {
        Object o = req.getAttribute("orgId");
        return o != null ? ((Number) o).longValue() : null;
    }

    @GetMapping
    public ResponseEntity<List<Execution>> getExecutions(HttpServletRequest req) {
        return executionService.getAll(orgId(req));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getExecutionDetail(@PathVariable("id") Long id) {
        return executionService.getById(id);
    }

    @PostMapping("/{id}/results")
    public ResponseEntity<Void> postExecutionResults(
            @PathVariable("id") Long executionId,
            @RequestBody Map<String, Object> result) {
        return agentService.postResults(executionId, result);
    }

    @PostMapping("/{id}/stop")
    public ResponseEntity<Void> stopExecution(@PathVariable("id") Long executionId) {
        return agentService.stopExecution(executionId);
    }

    @PostMapping("/{id}/rerun")
    public ResponseEntity<Void> rerunExecution(@PathVariable("id") Long executionId) {
        return agentService.rerunExecution(executionId);
    }
}
