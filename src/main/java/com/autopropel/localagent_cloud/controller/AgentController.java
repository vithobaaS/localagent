package com.autopropel.localagent_cloud.controller;

import com.autopropel.localagent_cloud.model.Agent;
import com.autopropel.localagent_cloud.model.AgentGroupMapping;
import com.autopropel.localagent_cloud.service.AgentService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/agents")
@CrossOrigin(origins = "*")
public class AgentController {

    private final AgentService agentService;

    public AgentController(AgentService agentService) {
        this.agentService = agentService;
    }

    private Long orgId(HttpServletRequest req) {
        Object o = req.getAttribute("orgId");
        return o != null ? ((Number) o).longValue() : null;
    }

    @GetMapping
    public ResponseEntity<List<Agent>> getAgents(HttpServletRequest req) {
        return agentService.getAll(orgId(req));
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> registerAgent(@RequestBody Map<String, Object> body) {
        return agentService.register(body);
    }

    @PostMapping("/{id}/heartbeat")
    public ResponseEntity<Void> agentHeartbeat(@PathVariable("id") String id) {
        return agentService.heartbeat(id);
    }

    @GetMapping("/{id}/jobs/next")
    public ResponseEntity<Map<String, Object>> getNextJob(@PathVariable("id") String agentId) {
        return agentService.getNextJob(agentId);
    }
}
