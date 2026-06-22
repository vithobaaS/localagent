package com.autopilot.localagent_cloud.controller;

import com.autopilot.localagent_cloud.model.AuditLog;
import com.autopilot.localagent_cloud.model.TestSuite;
import com.autopilot.localagent_cloud.repository.AuditLogRepository;
import com.autopilot.localagent_cloud.service.TestSuiteService;
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
    private final AuditLogRepository auditLogRepository;

    public TestSuiteController(TestSuiteService testSuiteService, AuditLogRepository auditLogRepository) {
        this.testSuiteService = testSuiteService;
        this.auditLogRepository = auditLogRepository;
    }

    private String getUserEmail(HttpServletRequest req) {
        Object e = req.getAttribute("email");
        return e != null ? e.toString() : "SYSTEM";
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
        ResponseEntity<Map<String, Object>> res = testSuiteService.create(body, orgId(req));
        if (res.getStatusCode().is2xxSuccessful() && res.getBody() != null) {
            TestSuite suite = (TestSuite) res.getBody().get("suite");
            auditLogRepository.save(new AuditLog(orgId(req), getUserEmail(req), "CREATE", "TEST_SUITE", suite.getId().toString(), "Created Test Suite: " + suite.getName()));
        }
        return res;
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateTestSuite(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Object> body, HttpServletRequest req) {
        ResponseEntity<Map<String, Object>> res = testSuiteService.update(id, body);
        if (res.getStatusCode().is2xxSuccessful() && res.getBody() != null) {
            TestSuite suite = (TestSuite) res.getBody().get("suite");
            auditLogRepository.save(new AuditLog(orgId(req), getUserEmail(req), "UPDATE", "TEST_SUITE", suite.getId().toString(), "Updated Test Suite: " + suite.getName()));
        }
        return res;
    }

    @PostMapping("/{id}/run")
    public ResponseEntity<Map<String, Object>> runTestSuite(
            @PathVariable("id") Long id,
            @RequestBody(required = false) Map<String, Object> body,
            HttpServletRequest req) {
        return testSuiteService.run(id, body, orgId(req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTestSuite(@PathVariable("id") Long id, HttpServletRequest req) {
        ResponseEntity<Void> res = testSuiteService.delete(id);
        if (res.getStatusCode().is2xxSuccessful()) {
            auditLogRepository.save(new AuditLog(orgId(req), getUserEmail(req), "DELETE", "TEST_SUITE", id.toString(), "Deleted Test Suite ID: " + id));
        }
        return res;
    }
}
