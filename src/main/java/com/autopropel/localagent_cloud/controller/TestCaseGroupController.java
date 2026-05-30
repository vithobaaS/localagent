package com.autopropel.localagent_cloud.controller;

import com.autopropel.localagent_cloud.model.TestCaseGroup;
import com.autopropel.localagent_cloud.service.TestCaseGroupService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/test-case-groups")
@CrossOrigin(origins = "*")
public class TestCaseGroupController {

    private final TestCaseGroupService testCaseGroupService;

    public TestCaseGroupController(TestCaseGroupService testCaseGroupService) {
        this.testCaseGroupService = testCaseGroupService;
    }

    private Long orgId(HttpServletRequest req) {
        Object o = req.getAttribute("orgId");
        return o != null ? ((Number) o).longValue() : null;
    }

    @GetMapping
    public ResponseEntity<List<TestCaseGroup>> getTestCaseGroups(HttpServletRequest req) {
        return testCaseGroupService.getAll(orgId(req));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getTestCaseGroupDetail(@PathVariable("id") Long id) {
        return testCaseGroupService.getById(id);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createTestCaseGroup(
            @RequestBody Map<String, Object> body, HttpServletRequest req) {
        return testCaseGroupService.create(body, orgId(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateTestCaseGroup(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Object> body) {
        return testCaseGroupService.update(id, body);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTestCaseGroup(@PathVariable("id") Long id) {
        return testCaseGroupService.delete(id);
    }
}
