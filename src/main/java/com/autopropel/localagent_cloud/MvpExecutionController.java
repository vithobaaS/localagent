package com.autopropel.localagent_cloud;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.autopropel.localagent_cloud.dto.RunRequest;
import com.autopropel.localagent_cloud.dto.TestCaseIteration;
import com.autopropel.localagent_cloud.dto.TestStep;
import com.autopropel.localagent_cloud.persistence.Execution;
import com.autopropel.localagent_cloud.persistence.ExecutionRepository;
import com.autopropel.localagent_cloud.persistence.Job;
import com.autopropel.localagent_cloud.persistence.JobRepository;
import com.autopropel.localagent_cloud.persistence.Screenshot;
import com.autopropel.localagent_cloud.persistence.ScreenshotRepository;
import com.autopropel.localagent_cloud.persistence.StepResult;
import com.autopropel.localagent_cloud.persistence.StepResultRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/executions")
public class MvpExecutionController {

    private final ExecutionRepository executionRepository;
    private final JobRepository jobRepository;
    private final StepResultRepository stepResultRepository;
    private final ScreenshotRepository screenshotRepository;
    private final ObjectMapper objectMapper;

    public MvpExecutionController(
            ExecutionRepository executionRepository,
            JobRepository jobRepository,
            StepResultRepository stepResultRepository,
            ScreenshotRepository screenshotRepository,
            ObjectMapper objectMapper) {
        this.executionRepository = executionRepository;
        this.jobRepository = jobRepository;
        this.stepResultRepository = stepResultRepository;
        this.screenshotRepository = screenshotRepository;
        this.objectMapper = objectMapper;
    }

    @PostMapping
    public ResponseEntity<Long> createExecution(
            @RequestParam(name = "agentId", required = false) String agentId,
            @RequestBody RunRequest runRequest) {
        if (runRequest == null || runRequest.result == null) {
            return ResponseEntity.badRequest().build();
        }

        // 1. Save Execution
        Execution exec = new Execution();
        exec.setStatus("QUEUED");
        
        try {
            exec.setEnvironmentJson(objectMapper.writeValueAsString(runRequest.result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
        
        Execution savedExec = executionRepository.save(exec);

        // 2. Save Job
        Job job = new Job();
        job.setExecutionId(savedExec.getId());
        job.setAgentId(agentId != null && !agentId.isBlank() ? agentId : runRequest.result.environmentId);
        job.setStatus("QUEUED");
        
        try {
            job.setPayloadJson(objectMapper.writeValueAsString(runRequest));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
        
        jobRepository.save(job);

        return ResponseEntity.ok(savedExec.getId());
    }

    @PostMapping("/{id}/results")
    public ResponseEntity<Void> receiveResults(
            @PathVariable("id") Long executionId,
            @RequestBody RunRequest runRequest) {
        return executionRepository.findById(executionId).map(exec -> {
            if (runRequest == null || runRequest.result == null) {
                return ResponseEntity.badRequest().<Void>build();
            }

            // 1. Save Step Results
            if (runRequest.result.testCase != null) {
                int stepIndex = 1;
                for (Map<String, List<TestCaseIteration>> tcMap : runRequest.result.testCase) {
                    for (List<TestCaseIteration> iterations : tcMap.values()) {
                        for (TestCaseIteration iter : iterations) {
                            if (iter.testSteps != null) {
                                for (TestStep step : iter.testSteps) {
                                    StepResult sr = new StepResult();
                                    sr.setExecutionId(executionId);
                                    sr.setStepIndex(stepIndex++);
                                    sr.setActionName(step.actionName);
                                    sr.setExecutedStatus(step.executed_status != null ? step.executed_status : 0);
                                    sr.setResultStatus(step.result_status != null ? step.result_status : 0);
                                    sr.setErrorJson(step.errorLog);
                                    stepResultRepository.save(sr);
                                }
                            }
                        }
                    }
                }
            }

            // 2. Update Execution
            boolean isSuccess = runRequest.result.result_status != null && runRequest.result.result_status == 1;
            exec.setStatus(isSuccess ? "SUCCESS" : "FAILED");
            exec.setFinishedAt(LocalDateTime.now());
            executionRepository.save(exec);

            // 3. Mark matching jobs as COMPLETED
            List<Job> jobs = jobRepository.findByExecutionId(executionId);
            for (Job job : jobs) {
                job.setStatus("COMPLETED");
                jobRepository.save(job);
            }

            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/screenshots")
    public ResponseEntity<Void> uploadScreenshot(
            @PathVariable("id") Long executionId,
            @RequestParam(name = "stepResultId", required = false) Long stepResultId,
            @RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        if (!executionRepository.existsById(executionId)) {
            return ResponseEntity.notFound().build();
        }

        try {
            // Save file to local storage inside data/screenshots/
            File dir = new File("data/screenshots");
            if (!dir.exists()) {
                dir.mkdirs();
            }

            String filename = "exec_" + executionId + "_" + System.currentTimeMillis() + "_" + file.getOriginalFilename();
            File dest = new File(dir, filename);
            file.transferTo(dest);

            // Save Screenshot metadata
            Screenshot sc = new Screenshot();
            sc.setExecutionId(executionId);
            sc.setStepResultId(stepResultId);
            sc.setFileName(filename);
            sc.setContentType(file.getContentType() != null ? file.getContentType() : "image/png");
            sc.setStoragePath(dest.getAbsolutePath());
            screenshotRepository.save(sc);

            return ResponseEntity.ok().build();
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
