package com.autopropel.localagent_cloud.service;

import com.autopropel.localagent_cloud.model.Execution;
import com.autopropel.localagent_cloud.model.Screenshot;
import com.autopropel.localagent_cloud.model.StepResult;
import com.autopropel.localagent_cloud.repository.ExecutionRepository;
import com.autopropel.localagent_cloud.repository.ScreenshotRepository;
import com.autopropel.localagent_cloud.repository.StepResultRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ExecutionService {

    private final ExecutionRepository executionRepository;
    private final StepResultRepository stepResultRepository;
    private final ScreenshotRepository screenshotRepository;

    public ExecutionService(ExecutionRepository executionRepository,
                            StepResultRepository stepResultRepository,
                            ScreenshotRepository screenshotRepository) {
        this.executionRepository = executionRepository;
        this.stepResultRepository = stepResultRepository;
        this.screenshotRepository = screenshotRepository;
    }

    public ResponseEntity<List<Execution>> getAll(Long orgId) {
        List<Execution> list = orgId != null
                ? executionRepository.findAll().stream().filter(e -> orgId.equals(e.getOrgId())).toList()
                : executionRepository.findAll();
        return ResponseEntity.ok(list);
    }

    public ResponseEntity<Map<String, Object>> getById(Long id) {
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
}
