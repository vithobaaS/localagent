package com.autopropel.localagent_cloud.controller;

import com.autopropel.localagent_cloud.model.TestSuite;
import com.autopropel.localagent_cloud.service.TestSuiteService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/test-suites")
@CrossOrigin(origins = "*")
public class TestSuiteController {

    private final TestSuiteService testSuiteService;

    public TestSuiteController(TestSuiteService testSuiteService) {
        this.testSuiteService = testSuiteService;
    }

    private Long orgId(HttpServletRequest req) {
        Object o = req.getAttribute("orgId");
        return o != null ? ((Number) o).longValue() : null;
    }

    @GetMapping
    public ResponseEntity<List<TestSuite>> getTestSuites(HttpServletRequest req) {
        return testSuiteService.getAll(orgId(req));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getTestSuiteDetail(@PathVariable("id") Long id) {
        return testSuiteService.getById(id);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createTestSuite(
            @RequestBody Map<String, Object> body, HttpServletRequest req) {
        return testSuiteService.create(body, orgId(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateTestSuite(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Object> body) {
        return testSuiteService.update(id, body);
    }

    @PostMapping("/{id}/run")
    public ResponseEntity<Map<String, Object>> runTestSuite(
            @PathVariable("id") Long id,
            @RequestBody(required = false) Map<String, Object> body) {
        return testSuiteService.run(id, body);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTestSuite(@PathVariable("id") Long id) {
        return testSuiteService.delete(id);
    }
}
