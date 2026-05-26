package com.autopropel.localagent_cloud;

import java.io.File;
import java.net.MalformedURLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.autopropel.localagent_cloud.persistence.*;

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
    private final TestCaseRepository testCaseRepository;
    private final TestStepRepository testStepRepository;
    private final TestCaseGroupRepository testCaseGroupRepository;
    private final TestCaseGroupMappingRepository testCaseGroupMappingRepository;
    private final TestSuiteRepository testSuiteRepository;
    private final TestSuiteGroupMappingRepository testSuiteGroupMappingRepository;
    private final AgentGroupMappingRepository agentGroupMappingRepository;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    public MvpUiController(
            ExecutionRepository executionRepository,
            StepResultRepository stepResultRepository,
            ScreenshotRepository screenshotRepository,
            AgentRepository agentRepository,
            SchedulerRepository schedulerRepository,
            GroupRepository groupRepository,
            TestCaseRepository testCaseRepository,
            TestStepRepository testStepRepository,
            TestCaseGroupRepository testCaseGroupRepository,
            TestCaseGroupMappingRepository testCaseGroupMappingRepository,
            TestSuiteRepository testSuiteRepository,
            TestSuiteGroupMappingRepository testSuiteGroupMappingRepository,
            AgentGroupMappingRepository agentGroupMappingRepository,
            com.fasterxml.jackson.databind.ObjectMapper objectMapper) {
        this.executionRepository = executionRepository;
        this.stepResultRepository = stepResultRepository;
        this.screenshotRepository = screenshotRepository;
        this.agentRepository = agentRepository;
        this.schedulerRepository = schedulerRepository;
        this.groupRepository = groupRepository;
        this.testCaseRepository = testCaseRepository;
        this.testStepRepository = testStepRepository;
        this.testCaseGroupRepository = testCaseGroupRepository;
        this.testCaseGroupMappingRepository = testCaseGroupMappingRepository;
        this.testSuiteRepository = testSuiteRepository;
        this.testSuiteGroupMappingRepository = testSuiteGroupMappingRepository;
        this.agentGroupMappingRepository = agentGroupMappingRepository;
        this.objectMapper = objectMapper;
    }

    // =========================================================================
    // EXECUTIONS
    // =========================================================================

    @GetMapping("/executions")
    public ResponseEntity<List<Execution>> getExecutions() {
        return ResponseEntity.ok(executionRepository.findAllByOrderByIdDesc());
    }

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

    // =========================================================================
    // AGENTS & EXECUTION BRIDGE
    // =========================================================================

    @GetMapping("/agents")
    public ResponseEntity<List<Agent>> getAgents() {
        return ResponseEntity.ok(agentRepository.findAll());
    }

    @PostMapping("/agents/register")
    @Transactional
    public ResponseEntity<Map<String, Object>> registerAgent(@RequestBody Map<String, Object> body) {
        String agentId = (String) body.get("id");
        if (agentId == null || agentId.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        Agent agent = agentRepository.findById(agentId).orElse(new Agent());
        agent.setId(agentId);
        agent.setName((String) body.getOrDefault("name", agentId));
        agent.setOs((String) body.get("os"));
        agent.setAgentVersion((String) body.get("agentVersion"));
        agent.setCapabilitiesJson((String) body.get("capabilitiesJson"));
        agent.setLastSeenAt(java.time.LocalDateTime.now());
        
        agentRepository.save(agent);
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/agents/{id}/heartbeat")
    @Transactional
    public ResponseEntity<Void> agentHeartbeat(@PathVariable("id") String id) {
        agentRepository.findById(id).ifPresent(agent -> {
            agent.setLastSeenAt(java.time.LocalDateTime.now());
            agentRepository.save(agent);
        });
        return ResponseEntity.ok().build();
    }

    @GetMapping("/agents/{id}/jobs/next")
    @Transactional
    public ResponseEntity<Map<String, Object>> getNextJob(@PathVariable("id") String agentId) {
        // Find any active scheduler with executionType "now" (instant run)
        List<Scheduler> activeJobs = schedulerRepository.findAll().stream()
                .filter(s -> "now".equals(s.getExecutionType()) && "active".equals(s.getStatus()))
                .toList();

        if (activeJobs.isEmpty()) {
            return ResponseEntity.noContent().build();
        }

        // Grab the first job
        Scheduler job = activeJobs.get(0);
        
        // Mark it as running/processed so other agents don't grab it
        job.setStatus("processing");
        schedulerRepository.save(job);

        // Create an Execution record
        Execution execution = new Execution();
        execution.setEnvironmentJson("{\"referenceId\":\"" + job.getTestSuiteName() + "\",\"browserTypeName\":\"" + job.getBrowserType() + "\"}");
        execution.setStatus("running");
        execution.setCreatedAt(java.time.LocalDateTime.now());
        execution = executionRepository.save(execution);

        // Fetch Test Suite and Steps to build the payload
        List<Map<String, Object>> iterations = new ArrayList<>();
        if (job.getTestSuiteId() != null) {
            List<TestSuiteGroupMapping> groupMappings = testSuiteGroupMappingRepository.findByTestSuiteIdOrderByGroupOrder(job.getTestSuiteId());
            for (TestSuiteGroupMapping gm : groupMappings) {
                List<TestCaseGroupMapping> caseMappings = testCaseGroupMappingRepository.findByTestCaseGroupIdOrderByCaseOrder(gm.getTestCaseGroupId());
                for (TestCaseGroupMapping cm : caseMappings) {
                    List<TestStep> steps = testStepRepository.findByTestCaseIdOrderByStepOrder(cm.getTestCaseId());
                    
                    Map<String, Object> iter = new HashMap<>();
                    iter.put("testCaseId", cm.getTestCaseId());
                    iter.put("steps", steps);
                    iterations.add(iter);
                }
            }
        }

        Map<String, Object> runRequest = new HashMap<>();
        runRequest.put("executionId", execution.getId());
        runRequest.put("browserType", job.getBrowserType());
        runRequest.put("iterations", iterations);

        try {
            String payloadJson = objectMapper.writeValueAsString(runRequest);
            Map<String, Object> jobDto = new HashMap<>();
            jobDto.put("executionId", execution.getId());
            jobDto.put("payloadJson", payloadJson);
            return ResponseEntity.ok(jobDto);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/executions/{id}/results")
    @Transactional
    public ResponseEntity<Void> postExecutionResults(
            @PathVariable("id") Long executionId, 
            @RequestBody Map<String, Object> result) {
            
        executionRepository.findById(executionId).ifPresent(exec -> {
            exec.setStatus((String) result.getOrDefault("status", "completed"));
            exec.setFinishedAt(java.time.LocalDateTime.now());
            executionRepository.save(exec);
        });
        
        return ResponseEntity.ok().build();
    }

    @PostMapping("/executions/{id}/stop")
    @Transactional
    public ResponseEntity<Void> stopExecution(@PathVariable("id") Long executionId) {
        executionRepository.findById(executionId).ifPresent(exec -> {
            if ("running".equals(exec.getStatus()) || "queued".equals(exec.getStatus())) {
                exec.setStatus("aborted");
                exec.setFinishedAt(java.time.LocalDateTime.now());
                executionRepository.save(exec);
            }
        });
        return ResponseEntity.ok().build();
    }

    @PostMapping("/executions/{id}/rerun")
    @Transactional
    public ResponseEntity<Void> rerunExecution(@PathVariable("id") Long executionId) {
        executionRepository.findById(executionId).ifPresent(exec -> {
            try {
                com.fasterxml.jackson.databind.JsonNode env = objectMapper.readTree(exec.getEnvironmentJson());
                String suiteName = env.path("referenceId").asText();
                String browser = env.path("browserTypeName").asText("chrome");
                
                TestSuite suite = testSuiteRepository.findAll().stream()
                        .filter(s -> s.getName().equals(suiteName))
                        .findFirst().orElse(null);
                        
                Scheduler scheduler = new Scheduler();
                scheduler.setTestSuiteName(suiteName);
                if (suite != null) {
                    scheduler.setTestSuiteId(suite.getId());
                }
                scheduler.setExecutionType("now");
                scheduler.setBrowserType(browser);
                scheduler.setStatus("active");
                schedulerRepository.save(scheduler);
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
        return ResponseEntity.ok().build();
    }

    // =========================================================================
    // SCHEDULERS (CRUD)
    // =========================================================================

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

    @PutMapping("/schedulers/{id}")
    public ResponseEntity<Scheduler> updateScheduler(@PathVariable("id") Long id, @RequestBody Scheduler updated) {
        return schedulerRepository.findById(id).map(existing -> {
            if (updated.getTestSuiteName() != null) existing.setTestSuiteName(updated.getTestSuiteName());
            if (updated.getExecutionType() != null) existing.setExecutionType(updated.getExecutionType());
            if (updated.getBrowserType() != null) existing.setBrowserType(updated.getBrowserType());
            if (updated.getStatus() != null) existing.setStatus(updated.getStatus());
            if (updated.getTestSuiteId() != null) existing.setTestSuiteId(updated.getTestSuiteId());
            return ResponseEntity.ok(schedulerRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/schedulers/{id}")
    public ResponseEntity<Void> deleteScheduler(@PathVariable("id") Long id) {
        if (!schedulerRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        schedulerRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // GROUPS (CRUD)
    // =========================================================================

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

    @PutMapping("/groups/{id}")
    public ResponseEntity<Group> updateGroup(@PathVariable("id") Long id, @RequestBody Group updated) {
        return groupRepository.findById(id).map(existing -> {
            if (updated.getName() != null) existing.setName(updated.getName());
            if (updated.getDescription() != null) existing.setDescription(updated.getDescription());
            return ResponseEntity.ok(groupRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/groups/{id}")
    public ResponseEntity<Void> deleteGroup(@PathVariable("id") Long id) {
        if (!groupRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        groupRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // AGENT-GROUP MAPPING
    // =========================================================================

    @GetMapping("/groups/{id}/agents")
    public ResponseEntity<List<Map<String, Object>>> getAgentsInGroup(@PathVariable("id") Long groupId) {
        List<AgentGroupMapping> mappings = agentGroupMappingRepository.findByGroupId(groupId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (AgentGroupMapping m : mappings) {
            agentRepository.findById(m.getAgentId()).ifPresent(agent -> {
                Map<String, Object> entry = new HashMap<>();
                entry.put("mappingId", m.getId());
                entry.put("agent", agent);
                result.add(entry);
            });
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/groups/{id}/agents")
    public ResponseEntity<AgentGroupMapping> addAgentToGroup(
            @PathVariable("id") Long groupId,
            @RequestBody Map<String, String> body) {
        String agentId = body.get("agentId");
        if (agentId == null || agentId.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (!groupRepository.existsById(groupId)) {
            return ResponseEntity.notFound().build();
        }
        AgentGroupMapping mapping = new AgentGroupMapping();
        mapping.setAgentId(agentId);
        mapping.setGroupId(groupId);
        return ResponseEntity.status(HttpStatus.CREATED).body(agentGroupMappingRepository.save(mapping));
    }

    @DeleteMapping("/groups/{groupId}/agents/{agentId}")
    @Transactional
    public ResponseEntity<Void> removeAgentFromGroup(
            @PathVariable("groupId") Long groupId,
            @PathVariable("agentId") String agentId) {
        agentGroupMappingRepository.deleteByAgentIdAndGroupId(agentId, groupId);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // TEST CASES (CRUD with inline steps)
    // =========================================================================

    @GetMapping("/test-cases")
    public ResponseEntity<List<TestCase>> getTestCases() {
        return ResponseEntity.ok(testCaseRepository.findAllByOrderByIdDesc());
    }

    @GetMapping("/test-cases/{id}")
    public ResponseEntity<Map<String, Object>> getTestCaseDetail(@PathVariable("id") Long id) {
        return testCaseRepository.findById(id).map(tc -> {
            List<TestStep> steps = testStepRepository.findByTestCaseIdOrderByStepOrder(id);
            Map<String, Object> detail = new HashMap<>();
            detail.put("testCase", tc);
            detail.put("steps", steps);
            return ResponseEntity.ok(detail);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/test-cases")
    @Transactional
    public ResponseEntity<Map<String, Object>> createTestCase(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        TestCase tc = new TestCase();
        tc.setName(name);
        tc.setDescription((String) body.get("description"));
        tc.setStatus(body.getOrDefault("status", "active").toString());
        tc = testCaseRepository.save(tc);

        // Save inline steps
        List<TestStep> savedSteps = saveStepsFromBody(body, tc.getId());

        Map<String, Object> result = new HashMap<>();
        result.put("testCase", tc);
        result.put("steps", savedSteps);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @PutMapping("/test-cases/{id}")
    @Transactional
    public ResponseEntity<Map<String, Object>> updateTestCase(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Object> body) {
        return testCaseRepository.findById(id).map(existing -> {
            if (body.containsKey("name")) existing.setName((String) body.get("name"));
            if (body.containsKey("description")) existing.setDescription((String) body.get("description"));
            if (body.containsKey("status")) existing.setStatus((String) body.get("status"));
            testCaseRepository.save(existing);

            // Replace steps if provided
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

    @DeleteMapping("/test-cases/{id}")
    public ResponseEntity<Void> deleteTestCase(@PathVariable("id") Long id) {
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

    // =========================================================================
    // TEST CASE GROUPS (CRUD with test case assignments)
    // =========================================================================

    @GetMapping("/test-case-groups")
    public ResponseEntity<List<TestCaseGroup>> getTestCaseGroups() {
        return ResponseEntity.ok(testCaseGroupRepository.findAllByOrderByIdDesc());
    }

    @GetMapping("/test-case-groups/{id}")
    public ResponseEntity<Map<String, Object>> getTestCaseGroupDetail(@PathVariable("id") Long id) {
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

    @PostMapping("/test-case-groups")
    @Transactional
    @SuppressWarnings("unchecked")
    public ResponseEntity<Map<String, Object>> createTestCaseGroup(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        TestCaseGroup group = new TestCaseGroup();
        group.setName(name);
        group.setDescription((String) body.get("description"));
        group.setStatus(body.getOrDefault("status", "active").toString());
        group = testCaseGroupRepository.save(group);

        // Assign test cases if provided
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

    @PutMapping("/test-case-groups/{id}")
    @Transactional
    @SuppressWarnings("unchecked")
    public ResponseEntity<Map<String, Object>> updateTestCaseGroup(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Object> body) {
        return testCaseGroupRepository.findById(id).map(existing -> {
            if (body.containsKey("name")) existing.setName((String) body.get("name"));
            if (body.containsKey("description")) existing.setDescription((String) body.get("description"));
            if (body.containsKey("status")) existing.setStatus((String) body.get("status"));
            testCaseGroupRepository.save(existing);

            // Reassign test cases if provided
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

    @DeleteMapping("/test-case-groups/{id}")
    public ResponseEntity<Void> deleteTestCaseGroup(@PathVariable("id") Long id) {
        if (!testCaseGroupRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        testCaseGroupRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // TEST SUITES (CRUD with group assignments)
    // =========================================================================

    @GetMapping("/test-suites")
    public ResponseEntity<List<TestSuite>> getTestSuites() {
        return ResponseEntity.ok(testSuiteRepository.findAllByOrderByIdDesc());
    }

    @GetMapping("/test-suites/{id}")
    public ResponseEntity<Map<String, Object>> getTestSuiteDetail(@PathVariable("id") Long id) {
        return testSuiteRepository.findById(id).map(suite -> {
            List<TestSuiteGroupMapping> mappings = testSuiteGroupMappingRepository.findByTestSuiteIdOrderByGroupOrder(id);
            List<Map<String, Object>> groups = new ArrayList<>();
            for (TestSuiteGroupMapping m : mappings) {
                testCaseGroupRepository.findById(m.getTestCaseGroupId()).ifPresent(grp -> {
                    // For each group, also load its test cases
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

    @PostMapping("/test-suites")
    @Transactional
    @SuppressWarnings("unchecked")
    public ResponseEntity<Map<String, Object>> createTestSuite(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        TestSuite suite = new TestSuite();
        suite.setName(name);
        suite.setDescription((String) body.get("description"));
        suite.setBrowserType(body.getOrDefault("browserType", "chrome").toString());
        suite.setStatus(body.getOrDefault("status", "active").toString());
        suite = testSuiteRepository.save(suite);

        // Assign groups if provided
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

    @PutMapping("/test-suites/{id}")
    @Transactional
    @SuppressWarnings("unchecked")
    public ResponseEntity<Map<String, Object>> updateTestSuite(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Object> body) {
        return testSuiteRepository.findById(id).map(existing -> {
            if (body.containsKey("name")) existing.setName((String) body.get("name"));
            if (body.containsKey("description")) existing.setDescription((String) body.get("description"));
            if (body.containsKey("browserType")) existing.setBrowserType((String) body.get("browserType"));
            if (body.containsKey("status")) existing.setStatus((String) body.get("status"));
            testSuiteRepository.save(existing);

            // Reassign groups if provided
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

    @PostMapping("/test-suites/{id}/run")
    @Transactional
    public ResponseEntity<Map<String, Object>> runTestSuite(
            @PathVariable("id") Long id,
            @RequestBody(required = false) Map<String, Object> body) {
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

    @DeleteMapping("/test-suites/{id}")
    public ResponseEntity<Void> deleteTestSuite(@PathVariable("id") Long id) {
        if (!testSuiteRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        testSuiteRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // SCREENSHOTS (file serving)
    // =========================================================================

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
