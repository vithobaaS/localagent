package com.autopropel.localagent_cloud.controller;

import com.autopropel.localagent_cloud.model.TestCase;
import com.autopropel.localagent_cloud.service.TestCaseService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/test-cases")
@CrossOrigin(origins = "*")
public class TestCaseController {

    private final TestCaseService testCaseService;

    public TestCaseController(TestCaseService testCaseService) {
        this.testCaseService = testCaseService;
    }

    private Long orgId(HttpServletRequest req) {
        Object o = req.getAttribute("orgId");
        return o != null ? ((Number) o).longValue() : null;
    }

    @GetMapping
    public ResponseEntity<List<TestCase>> getTestCases(HttpServletRequest req) {
        return testCaseService.getAll(orgId(req));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getTestCaseDetail(@PathVariable("id") Long id) {
        return testCaseService.getById(id);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createTestCase(
            @RequestBody Map<String, Object> body, HttpServletRequest req) {
        return testCaseService.create(body, orgId(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateTestCase(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Object> body) {
        return testCaseService.update(id, body);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTestCase(@PathVariable("id") Long id) {
        return testCaseService.delete(id);
    }
}
