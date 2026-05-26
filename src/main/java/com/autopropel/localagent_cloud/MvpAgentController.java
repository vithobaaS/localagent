package com.autopropel.localagent_cloud;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.autopropel.localagent_cloud.persistence.Agent;
import com.autopropel.localagent_cloud.persistence.AgentRepository;
import com.autopropel.localagent_cloud.persistence.Job;
import com.autopropel.localagent_cloud.persistence.JobRepository;

@RestController
@RequestMapping("/agents")
public class MvpAgentController {

    private final AgentRepository agentRepository;
    private final JobRepository jobRepository;

    public MvpAgentController(AgentRepository agentRepository, JobRepository jobRepository) {
        this.agentRepository = agentRepository;
        this.jobRepository = jobRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<Agent> registerAgent(@RequestBody Agent agent) {
        if (agent.getId() == null || agent.getId().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        agent.setLastSeenAt(LocalDateTime.now());
        Agent saved = agentRepository.save(agent);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/{id}/heartbeat")
    public ResponseEntity<Void> heartbeat(@PathVariable("id") String id) {
        return agentRepository.findById(id).map(agent -> {
            agent.setLastSeenAt(LocalDateTime.now());
            agentRepository.save(agent);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/jobs/next")
    @Transactional
    public ResponseEntity<Job> getNextJob(@PathVariable("id") String id) {
        if (!agentRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<Job> jobs = jobRepository.findNextAvailableJobs(id, PageRequest.of(0, 1));
        if (jobs.isEmpty()) {
            return ResponseEntity.noContent().build();
        }

        Job job = jobs.get(0);
        job.setStatus("ASSIGNED");
        job.setAgentId(id);
        job.setLeaseExpiresAt(LocalDateTime.now().plusMinutes(5));
        jobRepository.save(job);

        return ResponseEntity.ok(job);
    }
}
