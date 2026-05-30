package com.autopropel.localagent_cloud.service;

import com.autopropel.localagent_cloud.model.TestCaseGroup;
import com.autopropel.localagent_cloud.model.TestCaseGroupMapping;
import com.autopropel.localagent_cloud.model.TestStep;
import com.autopropel.localagent_cloud.repository.TestCaseGroupMappingRepository;
import com.autopropel.localagent_cloud.repository.TestCaseGroupRepository;
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
public class TestCaseGroupService {

    private final TestCaseGroupRepository testCaseGroupRepository;
    private final TestCaseGroupMappingRepository testCaseGroupMappingRepository;
    private final TestCaseRepository testCaseRepository;
    private final TestStepRepository testStepRepository;

    public TestCaseGroupService(TestCaseGroupRepository testCaseGroupRepository,
                                TestCaseGroupMappingRepository testCaseGroupMappingRepository,
                                TestCaseRepository testCaseRepository,
                                TestStepRepository testStepRepository) {
        this.testCaseGroupRepository = testCaseGroupRepository;
        this.testCaseGroupMappingRepository = testCaseGroupMappingRepository;
        this.testCaseRepository = testCaseRepository;
        this.testStepRepository = testStepRepository;
    }

    public ResponseEntity<List<TestCaseGroup>> getAll(Long orgId) {
        List<TestCaseGroup> list = orgId != null
                ? testCaseGroupRepository.findAllByOrderByIdDesc().stream().filter(g -> orgId.equals(g.getOrgId())).toList()
                : testCaseGroupRepository.findAllByOrderByIdDesc();
        return ResponseEntity.ok(list);
    }

    public ResponseEntity<Map<String, Object>> getById(Long id) {
        return testCaseGroupRepository.findById(id).map(group -> {
            List<TestCaseGroupMapping> mappings = testCaseGroupMappingRepository.findByTestCaseGroupIdOrderByCaseOrder(id);
            List<Map<String, Object>> testCases = new ArrayList<>();
            for (TestCaseGroupMapping m : mappings) {
                testCaseRepository.findById(m.getTestCaseId()).ifPresent(tc -> {
                    Map<String, Object> entry = new HashMap<>();
                    entry.put("testCase", tc);
                    entry.put("caseOrder", m.getCaseOrder());
                    entry.put("steps", testStepRepository.findByTestCaseIdOrderByStepOrder(tc.getId()));
                    testCases.add(entry);
                });
            }
            Map<String, Object> detail = new HashMap<>();
            detail.put("group", group);
            detail.put("testCases", testCases);
            return ResponseEntity.ok(detail);
        }).orElse(ResponseEntity.notFound().build());
    }

    @SuppressWarnings("unchecked")
    public ResponseEntity<Map<String, Object>> create(Map<String, Object> body, Long orgId) {
        String name = (String) body.get("name");
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        TestCaseGroup group = new TestCaseGroup();
        group.setName(name);
        group.setDescription((String) body.get("description"));
        group.setStatus(body.getOrDefault("status", "active").toString());
        group.setOrgId(orgId);
        group = testCaseGroupRepository.save(group);

        List<Number> testCaseIds = (List<Number>) body.get("testCaseIds");
        if (testCaseIds != null) {
            int order = 0;
            for (Number tcId : testCaseIds) {
                TestCaseGroupMapping mapping = new TestCaseGroupMapping();
                mapping.setTestCaseGroupId(group.getId());
                mapping.setTestCaseId(tcId.longValue());
                mapping.setCaseOrder(order++);
                testCaseGroupMappingRepository.save(mapping);
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("group", group);
        result.put("testCaseIds", testCaseIds);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @SuppressWarnings("unchecked")
    public ResponseEntity<Map<String, Object>> update(Long id, Map<String, Object> body) {
        return testCaseGroupRepository.findById(id).map(existing -> {
            if (body.containsKey("name")) existing.setName((String) body.get("name"));
            if (body.containsKey("description")) existing.setDescription((String) body.get("description"));
            if (body.containsKey("status")) existing.setStatus((String) body.get("status"));
            testCaseGroupRepository.save(existing);

            if (body.containsKey("testCaseIds")) {
                testCaseGroupMappingRepository.deleteByTestCaseGroupId(id);
                List<Number> testCaseIds = (List<Number>) body.get("testCaseIds");
                int order = 0;
                for (Number tcId : testCaseIds) {
                    TestCaseGroupMapping mapping = new TestCaseGroupMapping();
                    mapping.setTestCaseGroupId(id);
                    mapping.setTestCaseId(tcId.longValue());
                    mapping.setCaseOrder(order++);
                    testCaseGroupMappingRepository.save(mapping);
                }
            }

            Map<String, Object> result = new HashMap<>();
            result.put("group", existing);
            return ResponseEntity.ok(result);
        }).orElse(ResponseEntity.notFound().build());
    }

    public ResponseEntity<Void> delete(Long id) {
        if (!testCaseGroupRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        testCaseGroupRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
