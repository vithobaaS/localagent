package com.autopropel.localagent_cloud;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.autopropel.localagent_cloud.dto.RunRequest;
import com.autopropel.localagent_cloud.service.CloudJobService;

@RestController
@RequestMapping("/api/agent")
public class AgentController {

    private final CloudJobService cloudJobService;

    public AgentController(CloudJobService cloudJobService) {
        this.cloudJobService = cloudJobService;
    }

    @GetMapping("/poll")
    public ResponseEntity<RunRequest> pollJobs(@RequestParam String agentId) {
        RunRequest job = cloudJobService.pollJob(agentId);
        if (job == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(job);
    }

    @PostMapping("/result")
    public ResponseEntity<Void> receiveResult(@RequestBody RunRequest result) {
        if (!cloudJobService.receiveResult(result)) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/schedule-job")
    public ResponseEntity<String> scheduleJob(@RequestParam String agentId, @RequestBody RunRequest job) {
        if (!cloudJobService.scheduleJob(agentId, job)) {
            return ResponseEntity.badRequest().body("Malformed RunRequest");
        }
        return ResponseEntity.ok("Job scheduled successfully");
    }

    @GetMapping("/job-status")
    public ResponseEntity<com.autopropel.localagent_cloud.service.JobStatus> getJobStatus(@RequestParam String referenceId) {
        com.autopropel.localagent_cloud.service.JobStatus status = cloudJobService.getJobStatus(referenceId);
        if (status == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(status);
    }

    @GetMapping("/job-result")
    public ResponseEntity<RunRequest> getJobResult(@RequestParam String referenceId) {
        RunRequest result = cloudJobService.getJobResult(referenceId);
        if (result == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(result);
    }
}
