package com.autopropel.localagent_cloud.service;

import com.autopropel.localagent_cloud.model.TestCase;
import com.autopropel.localagent_cloud.model.TestStep;
import com.autopropel.localagent_cloud.repository.TestCaseRepository;
import com.autopropel.localagent_cloud.repository.TestStepRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class TestCaseService {

    private final TestCaseRepository testCaseRepository;
    private final TestStepRepository testStepRepository;

    public TestCaseService(TestCaseRepository testCaseRepository,
                           TestStepRepository testStepRepository) {
        this.testCaseRepository = testCaseRepository;
        this.testStepRepository = testStepRepository;
    }

    public ResponseEntity<List<TestCase>> getAll(Long orgId) {
        List<TestCase> list = orgId != null
                ? testCaseRepository.findAllByOrderByIdDesc().stream().filter(t -> orgId.equals(t.getOrgId())).toList()
                : testCaseRepository.findAllByOrderByIdDesc();
        return ResponseEntity.ok(list);
    }

    public ResponseEntity<Map<String, Object>> getById(Long id) {
        return testCaseRepository.findById(id).map(tc -> {
            List<TestStep> steps = testStepRepository.findByTestCaseIdOrderByStepOrder(id);
            Map<String, Object> detail = new HashMap<>();
            detail.put("testCase", tc);
            detail.put("steps", steps);
            return ResponseEntity.ok(detail);
        }).orElse(ResponseEntity.notFound().build());
    }

    public ResponseEntity<Map<String, Object>> create(Map<String, Object> body, Long orgId) {
        String name = (String) body.get("name");
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        TestCase tc = new TestCase();
        tc.setName(name);
        tc.setDescription((String) body.get("description"));
        tc.setStatus(body.getOrDefault("status", "active").toString());
        tc.setOrgId(orgId);
        tc = testCaseRepository.save(tc);

        List<TestStep> savedSteps = saveStepsFromBody(body, tc.getId());

        Map<String, Object> result = new HashMap<>();
        result.put("testCase", tc);
        result.put("steps", savedSteps);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    public ResponseEntity<Map<String, Object>> update(Long id, Map<String, Object> body) {
        return testCaseRepository.findById(id).map(existing -> {
            if (body.containsKey("name")) existing.setName((String) body.get("name"));
            if (body.containsKey("description")) existing.setDescription((String) body.get("description"));
            if (body.containsKey("status")) existing.setStatus((String) body.get("status"));
            testCaseRepository.save(existing);

            List<TestStep> savedSteps;
            if (body.containsKey("steps")) {
                testStepRepository.deleteByTestCaseId(id);
                savedSteps = saveStepsFromBody(body, id);
            } else {
                savedSteps = testStepRepository.findByTestCaseIdOrderByStepOrder(id);
            }

            Map<String, Object> result = new HashMap<>();
            result.put("testCase", existing);
            result.put("steps", savedSteps);
            return ResponseEntity.ok(result);
        }).orElse(ResponseEntity.notFound().build());
    }

    public ResponseEntity<Void> delete(Long id) {
        if (!testCaseRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        testCaseRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @SuppressWarnings("unchecked")
    private List<TestStep> saveStepsFromBody(Map<String, Object> body, Long testCaseId) {
        List<TestStep> saved = new ArrayList<>();
        Object stepsObj = body.get("steps");
        if (stepsObj instanceof List<?>) {
            List<Map<String, Object>> stepsList = (List<Map<String, Object>>) stepsObj;
            int order = 1;
            for (Map<String, Object> s : stepsList) {
                TestStep step = new TestStep();
                step.setTestCaseId(testCaseId);
                step.setStepOrder(s.containsKey("stepOrder") ? ((Number) s.get("stepOrder")).intValue() : order);
                step.setActionName((String) s.get("actionName"));
                step.setLocatorType((String) s.get("locatorType"));
                step.setLocatorValue((String) s.get("locatorValue"));
                step.setTestData((String) s.get("testData"));
                step.setDescription((String) s.get("description"));
                saved.add(testStepRepository.save(step));
                order++;
            }
        }
        return saved;
    }
}
