package com.autopropel.localagent_cloud;

import java.io.File;
import java.net.MalformedURLException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.autopropel.localagent_cloud.persistence.Agent;
import com.autopropel.localagent_cloud.persistence.AgentRepository;
import com.autopropel.localagent_cloud.persistence.Execution;
import com.autopropel.localagent_cloud.persistence.ExecutionRepository;
import com.autopropel.localagent_cloud.persistence.Group;
import com.autopropel.localagent_cloud.persistence.GroupRepository;
import com.autopropel.localagent_cloud.persistence.Scheduler;
import com.autopropel.localagent_cloud.persistence.SchedulerRepository;
import com.autopropel.localagent_cloud.persistence.Screenshot;
import com.autopropel.localagent_cloud.persistence.ScreenshotRepository;
import com.autopropel.localagent_cloud.persistence.StepResult;
import com.autopropel.localagent_cloud.persistence.StepResultRepository;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class MvpUiController {

    private final ExecutionRepository executionRepository;
    private final StepResultRepository stepResultRepository;
    private final ScreenshotRepository screenshotRepository;
    private final AgentRepository agentRepository;
    private final SchedulerRepository schedulerRepository;
    private final GroupRepository groupRepository;

    public MvpUiController(
            ExecutionRepository executionRepository,
            StepResultRepository stepResultRepository,
            ScreenshotRepository screenshotRepository,
            AgentRepository agentRepository,
            SchedulerRepository schedulerRepository,
            GroupRepository groupRepository) {
        this.executionRepository = executionRepository;
        this.stepResultRepository = stepResultRepository;
        this.screenshotRepository = screenshotRepository;
        this.agentRepository = agentRepository;
        this.schedulerRepository = schedulerRepository;
        this.groupRepository = groupRepository;
    }

    // 1. Get all executions (newest first)
    @GetMapping("/executions")
    public ResponseEntity<List<Execution>> getExecutions() {
        return ResponseEntity.ok(executionRepository.findAllByOrderByIdDesc());
    }

    // 2. Get detailed execution by id
    @GetMapping("/executions/{id}")
    public ResponseEntity<Map<String, Object>> getExecutionDetail(@PathVariable("id") Long id) {
        return executionRepository.findById(id).map(exec -> {
            List<StepResult> steps = stepResultRepository.findByExecutionId(id);
            List<Screenshot> screenshots = screenshotRepository.findByExecutionId(id);

            Map<String, Object> detail = new HashMap<>();
            detail.put("execution", exec);
            detail.put("steps", steps);
            detail.put("screenshots", screenshots);

            return ResponseEntity.ok(detail);
        }).orElse(ResponseEntity.notFound().build());
    }

    // 3. Get all registered agents
    @GetMapping("/agents")
    public ResponseEntity<List<Agent>> getAgents() {
        return ResponseEntity.ok(agentRepository.findAll());
    }

    // 4. Schedulers
    @GetMapping("/schedulers")
    public ResponseEntity<List<Scheduler>> getSchedulers() {
        return ResponseEntity.ok(schedulerRepository.findAll());
    }

    @PostMapping("/schedulers")
    public ResponseEntity<Scheduler> createScheduler(@RequestBody Scheduler scheduler) {
        if (scheduler.getTestSuiteName() == null || scheduler.getTestSuiteName().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (scheduler.getExecutionType() == null || scheduler.getExecutionType().isBlank()) {
            scheduler.setExecutionType("now");
        }
        if (scheduler.getBrowserType() == null || scheduler.getBrowserType().isBlank()) {
            scheduler.setBrowserType("chrome");
        }
        if (scheduler.getStatus() == null || scheduler.getStatus().isBlank()) {
            scheduler.setStatus("active");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(schedulerRepository.save(scheduler));
    }

    // 5. Groups
    @GetMapping("/groups")
    public ResponseEntity<List<Group>> getGroups() {
        return ResponseEntity.ok(groupRepository.findAll());
    }

    @PostMapping("/groups")
    public ResponseEntity<Group> createGroup(@RequestBody Group group) {
        if (group.getName() == null || group.getName().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(groupRepository.save(group));
    }

    // 6. Serve screenshot binary files
    @GetMapping("/screenshots/{fileName:.+}")
    public ResponseEntity<Resource> getScreenshotFile(@PathVariable("fileName") String fileName) {
        try {
            File file = new File("data/screenshots", fileName);
            if (!file.exists()) {
                return ResponseEntity.notFound().build();
            }
            Resource resource = new UrlResource(file.toURI());
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.getName() + "\"")
                    .contentType(MediaType.IMAGE_PNG)
                    .body(resource);
        } catch (MalformedURLException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
