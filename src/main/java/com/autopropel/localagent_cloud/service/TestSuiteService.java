package com.autopropel.localagent_cloud.service;

import com.autopropel.localagent_cloud.model.Scheduler;
import com.autopropel.localagent_cloud.model.TestCaseGroupMapping;
import com.autopropel.localagent_cloud.model.TestStep;
import com.autopropel.localagent_cloud.model.TestSuite;
import com.autopropel.localagent_cloud.model.TestSuiteGroupMapping;
import com.autopropel.localagent_cloud.repository.SchedulerRepository;
import com.autopropel.localagent_cloud.repository.TestCaseGroupMappingRepository;
import com.autopropel.localagent_cloud.repository.TestCaseGroupRepository;
import com.autopropel.localagent_cloud.repository.TestCaseRepository;
import com.autopropel.localagent_cloud.repository.TestStepRepository;
import com.autopropel.localagent_cloud.repository.TestSuiteGroupMappingRepository;
import com.autopropel.localagent_cloud.repository.TestSuiteRepository;
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
public class TestSuiteService {

    private final TestSuiteRepository testSuiteRepository;
    private final TestSuiteGroupMappingRepository testSuiteGroupMappingRepository;
    private final TestCaseGroupRepository testCaseGroupRepository;
    private final TestCaseGroupMappingRepository testCaseGroupMappingRepository;
    private final TestCaseRepository testCaseRepository;
    private final TestStepRepository testStepRepository;
    private final SchedulerRepository schedulerRepository;

    public TestSuiteService(TestSuiteRepository testSuiteRepository,
                            TestSuiteGroupMappingRepository testSuiteGroupMappingRepository,
                            TestCaseGroupRepository testCaseGroupRepository,
                            TestCaseGroupMappingRepository testCaseGroupMappingRepository,
                            TestCaseRepository testCaseRepository,
                            TestStepRepository testStepRepository,
                            SchedulerRepository schedulerRepository) {
        this.testSuiteRepository = testSuiteRepository;
        this.testSuiteGroupMappingRepository = testSuiteGroupMappingRepository;
        this.testCaseGroupRepository = testCaseGroupRepository;
        this.testCaseGroupMappingRepository = testCaseGroupMappingRepository;
        this.testCaseRepository = testCaseRepository;
        this.testStepRepository = testStepRepository;
        this.schedulerRepository = schedulerRepository;
    }

    public ResponseEntity<List<TestSuite>> getAll(Long orgId) {
        List<TestSuite> list = orgId != null
                ? testSuiteRepository.findAllByOrderByIdDesc().stream().filter(s -> orgId.equals(s.getOrgId())).toList()
                : testSuiteRepository.findAllByOrderByIdDesc();
        return ResponseEntity.ok(list);
    }

    public ResponseEntity<Map<String, Object>> getById(Long id) {
        return testSuiteRepository.findById(id).map(suite -> {
            List<TestSuiteGroupMapping> mappings = testSuiteGroupMappingRepository.findByTestSuiteIdOrderByGroupOrder(id);
            List<Map<String, Object>> groups = new ArrayList<>();
            for (TestSuiteGroupMapping m : mappings) {
                testCaseGroupRepository.findById(m.getTestCaseGroupId()).ifPresent(grp -> {
                    List<TestCaseGroupMapping> caseMappings = testCaseGroupMappingRepository
                            .findByTestCaseGroupIdOrderByCaseOrder(grp.getId());
                    List<Map<String, Object>> testCases = new ArrayList<>();
                    for (TestCaseGroupMapping cm : caseMappings) {
                        testCaseRepository.findById(cm.getTestCaseId()).ifPresent(tc -> {
                            Map<String, Object> tcEntry = new HashMap<>();
                            tcEntry.put("testCase", tc);
                            tcEntry.put("caseOrder", cm.getCaseOrder());
                            tcEntry.put("steps", testStepRepository.findByTestCaseIdOrderByStepOrder(tc.getId()));
                            testCases.add(tcEntry);
                        });
                    }

                    Map<String, Object> entry = new HashMap<>();
                    entry.put("group", grp);
                    entry.put("groupOrder", m.getGroupOrder());
                    entry.put("testCases", testCases);
                    groups.add(entry);
                });
            }

            Map<String, Object> detail = new HashMap<>();
            detail.put("suite", suite);
            detail.put("groups", groups);
            return ResponseEntity.ok(detail);
        }).orElse(ResponseEntity.notFound().build());
    }

    @SuppressWarnings("unchecked")
    public ResponseEntity<Map<String, Object>> create(Map<String, Object> body, Long orgId) {
        String name = (String) body.get("name");
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        TestSuite suite = new TestSuite();
        suite.setName(name);
        suite.setDescription((String) body.get("description"));
        suite.setBrowserType(body.getOrDefault("browserType", "chrome").toString());
        suite.setStatus(body.getOrDefault("status", "active").toString());
        suite.setOrgId(orgId);
        suite = testSuiteRepository.save(suite);

        List<Number> groupIds = (List<Number>) body.get("testCaseGroupIds");
        if (groupIds != null) {
            int order = 0;
            for (Number gId : groupIds) {
                TestSuiteGroupMapping mapping = new TestSuiteGroupMapping();
                mapping.setTestSuiteId(suite.getId());
                mapping.setTestCaseGroupId(gId.longValue());
                mapping.setGroupOrder(order++);
                testSuiteGroupMappingRepository.save(mapping);
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("suite", suite);
        result.put("testCaseGroupIds", groupIds);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @SuppressWarnings("unchecked")
    public ResponseEntity<Map<String, Object>> update(Long id, Map<String, Object> body) {
        return testSuiteRepository.findById(id).map(existing -> {
            if (body.containsKey("name")) existing.setName((String) body.get("name"));
            if (body.containsKey("description")) existing.setDescription((String) body.get("description"));
            if (body.containsKey("browserType")) existing.setBrowserType((String) body.get("browserType"));
            if (body.containsKey("status")) existing.setStatus((String) body.get("status"));
            testSuiteRepository.save(existing);

            if (body.containsKey("testCaseGroupIds")) {
                testSuiteGroupMappingRepository.deleteByTestSuiteId(id);
                List<Number> groupIds = (List<Number>) body.get("testCaseGroupIds");
                int order = 0;
                for (Number gId : groupIds) {
                    TestSuiteGroupMapping mapping = new TestSuiteGroupMapping();
                    mapping.setTestSuiteId(id);
                    mapping.setTestCaseGroupId(gId.longValue());
                    mapping.setGroupOrder(order++);
                    testSuiteGroupMappingRepository.save(mapping);
                }
            }

            Map<String, Object> result = new HashMap<>();
            result.put("suite", existing);
            return ResponseEntity.ok(result);
        }).orElse(ResponseEntity.notFound().build());
    }

    public ResponseEntity<Map<String, Object>> run(Long id, Map<String, Object> body) {
        return testSuiteRepository.findById(id).map(suite -> {
            String browser = "chrome";
            if (body != null && body.containsKey("browserType")) {
                browser = (String) body.get("browserType");
            } else if (suite.getBrowserType() != null) {
                browser = suite.getBrowserType();
            }

            Scheduler scheduler = new Scheduler();
            scheduler.setTestSuiteName(suite.getName());
            scheduler.setTestSuiteId(suite.getId());
            scheduler.setExecutionType("now");
            scheduler.setBrowserType(browser);
            scheduler.setStatus("active");
            scheduler = schedulerRepository.save(scheduler);

            Map<String, Object> result = new HashMap<>();
            result.put("scheduler", scheduler);
            result.put("suite", suite);
            result.put("message", "Test suite queued for immediate execution");
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        }).orElse(ResponseEntity.notFound().build());
    }

    public ResponseEntity<Void> delete(Long id) {
        if (!testSuiteRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        testSuiteRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
