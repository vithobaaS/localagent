package com.autopropel.localagent_cloud.controller;

import com.autopropel.localagent_cloud.model.Scheduler;
import com.autopropel.localagent_cloud.service.SchedulerService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/schedulers")
@CrossOrigin(origins = "*")
public class SchedulerController {

    private final SchedulerService schedulerService;

    public SchedulerController(SchedulerService schedulerService) {
        this.schedulerService = schedulerService;
    }

    private Long orgId(HttpServletRequest req) {
        Object o = req.getAttribute("orgId");
        return o != null ? ((Number) o).longValue() : null;
    }

    @GetMapping
    public ResponseEntity<List<Scheduler>> getSchedulers(HttpServletRequest req) {
        return schedulerService.getAll(orgId(req));
    }

    @PostMapping
    public ResponseEntity<Scheduler> createScheduler(@RequestBody Map<String, Object> body, HttpServletRequest req) {
        return schedulerService.create(body, orgId(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Scheduler> updateScheduler(@PathVariable("id") Long id, @RequestBody Map<String, Object> body) {
        return schedulerService.update(id, body);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteScheduler(@PathVariable("id") Long id) {
        return schedulerService.delete(id);
    }
}
