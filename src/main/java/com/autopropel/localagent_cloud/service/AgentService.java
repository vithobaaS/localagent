package com.autopropel.localagent_cloud.service;

import com.autopropel.localagent_cloud.model.Agent;
import com.autopropel.localagent_cloud.model.AgentToken;
import com.autopropel.localagent_cloud.model.Execution;
import com.autopropel.localagent_cloud.model.Scheduler;
import com.autopropel.localagent_cloud.model.Screenshot;
import com.autopropel.localagent_cloud.model.StepResult;
import com.autopropel.localagent_cloud.model.TestCaseGroupMapping;
import com.autopropel.localagent_cloud.model.TestStep;
import com.autopropel.localagent_cloud.model.TestSuite;
import com.autopropel.localagent_cloud.model.TestSuiteGroupMapping;
import com.autopropel.localagent_cloud.repository.AgentRepository;
import com.autopropel.localagent_cloud.repository.AgentTokenRepository;
import com.autopropel.localagent_cloud.repository.ExecutionRepository;
import com.autopropel.localagent_cloud.repository.SchedulerRepository;
import com.autopropel.localagent_cloud.repository.ScreenshotRepository;
import com.autopropel.localagent_cloud.repository.StepResultRepository;
import com.autopropel.localagent_cloud.repository.TestCaseGroupMappingRepository;
import com.autopropel.localagent_cloud.repository.TestStepRepository;
import com.autopropel.localagent_cloud.repository.TestSuiteGroupMappingRepository;
import com.autopropel.localagent_cloud.repository.TestSuiteRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AgentService {

    private final AgentRepository agentRepository;
    private final AgentTokenRepository agentTokenRepository;
    private final SchedulerRepository schedulerRepository;
    private final ExecutionRepository executionRepository;
    private final TestSuiteRepository testSuiteRepository;
    private final TestSuiteGroupMappingRepository testSuiteGroupMappingRepository;
    private final TestCaseGroupMappingRepository testCaseGroupMappingRepository;
    private final TestStepRepository testStepRepository;
    private final ScreenshotRepository screenshotRepository;
    private final StepResultRepository stepResultRepository;
    private final ObjectMapper objectMapper;
    private final S3Service s3Service;

    public AgentService(AgentRepository agentRepository,
                        AgentTokenRepository agentTokenRepository,
                        SchedulerRepository schedulerRepository,
                        ExecutionRepository executionRepository,
                        TestSuiteRepository testSuiteRepository,
                        TestSuiteGroupMappingRepository testSuiteGroupMappingRepository,
                        TestCaseGroupMappingRepository testCaseGroupMappingRepository,
                        TestStepRepository testStepRepository,
                        ScreenshotRepository screenshotRepository,
                        StepResultRepository stepResultRepository,
                        ObjectMapper objectMapper,
                        S3Service s3Service) {
        this.agentRepository = agentRepository;
        this.agentTokenRepository = agentTokenRepository;
        this.schedulerRepository = schedulerRepository;
        this.executionRepository = executionRepository;
        this.testSuiteRepository = testSuiteRepository;
        this.testSuiteGroupMappingRepository = testSuiteGroupMappingRepository;
        this.testCaseGroupMappingRepository = testCaseGroupMappingRepository;
        this.testStepRepository = testStepRepository;
        this.screenshotRepository = screenshotRepository;
        this.stepResultRepository = stepResultRepository;
        this.objectMapper = objectMapper;
        this.s3Service = s3Service;
    }

    public ResponseEntity<List<Agent>> getAll(Long orgId) {
        List<Agent> list = orgId != null
                ? agentRepository.findAll().stream().filter(a -> orgId.equals(a.getOrgId())).toList()
                : agentRepository.findAll();
        return ResponseEntity.ok(list);
    }

    @Transactional
    public ResponseEntity<Map<String, Object>> register(Map<String, Object> body) {
        String agentId = (String) body.get("id");
        String agentTokenStr = (String) body.get("agentToken");

        if (agentId == null || agentId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing agent id"));
        }
        if (agentTokenStr == null || agentTokenStr.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Missing agentToken"));
        }

        AgentToken token = agentTokenRepository.findByToken(agentTokenStr).orElse(null);
        if (token == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid agentToken"));
        }

        Agent agent = agentRepository.findById(agentId).orElse(new Agent());
        agent.setId(agentId);
        agent.setOrgId(token.getOrgId());
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

    @Transactional
    public ResponseEntity<Void> heartbeat(String id) {
        agentRepository.findById(id).ifPresent(agent -> {
            agent.setLastSeenAt(java.time.LocalDateTime.now());
            agentRepository.save(agent);
        });
        return ResponseEntity.ok().build();
    }

    @Transactional
    public ResponseEntity<Map<String, Object>> getNextJob(String agentId) {
        Agent agent = agentRepository.findById(agentId).orElse(null);
        if (agent == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<Scheduler> activeJobs = schedulerRepository.findAll().stream()
                .filter(s -> "now".equals(s.getExecutionType()) && "active".equals(s.getStatus()))
                .toList();

        if (activeJobs.isEmpty()) {
            return ResponseEntity.noContent().build();
        }

        Scheduler job = activeJobs.get(0);
        job.setStatus("processing");
        schedulerRepository.save(job);

        Long agentOrgId = agent.getOrgId();

        Execution execution = new Execution();
        execution.setOrgId(agentOrgId);

        long count = agentOrgId != null ? executionRepository.countByOrgId(agentOrgId) : 0;
        execution.setOrgExecutionId(count + 1);

        execution.setEnvironmentJson("{\"referenceId\":\"" + job.getTestSuiteName() + "\",\"browserTypeName\":\"" + job.getBrowserType() + "\"}");
        execution.setStatus("running");
        execution.setCreatedAt(java.time.LocalDateTime.now());
        execution = executionRepository.save(execution);

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

    @Transactional
    public ResponseEntity<Void> postResults(Long executionId, Map<String, Object> result) {
        executionRepository.findById(executionId).ifPresent(exec -> {
            exec.setStatus((String) result.getOrDefault("status", "completed"));
            exec.setFinishedAt(java.time.LocalDateTime.now());
            executionRepository.save(exec);
        });

        try {
            Map<String, Object> runResult = result;
            if (result.containsKey("result")) {
                runResult = (Map<String, Object>) result.get("result");
            }
            java.util.List<Map<String, Object>> testCaseList = (java.util.List<Map<String, Object>>) runResult.get("testCase");
            if (testCaseList != null && !testCaseList.isEmpty()) {
                Map<String, Object> firstIterationMap = testCaseList.get(0);
                java.util.List<Map<String, Object>> iterations = (java.util.List<Map<String, Object>>) firstIterationMap.get("iteration1");
                if (iterations != null && !iterations.isEmpty()) {
                    java.util.List<Map<String, Object>> testSteps = (java.util.List<Map<String, Object>>) iterations.get(0).get("testSteps");
                    if (testSteps != null) {
                        for (int i = 0; i < testSteps.size(); i++) {
                            Map<String, Object> stepData = testSteps.get(i);

                            StepResult sr = new StepResult();
                            sr.setExecutionId(executionId);
                            sr.setStepIndex(i + 1);
                            sr.setActionName((String) stepData.getOrDefault("actionName", "unknown"));

                            Object execStatus = stepData.get("executed_status");
                            sr.setExecutedStatus(execStatus != null ? (Integer) execStatus : 0);

                            Object resStatus = stepData.get("result_status");
                            sr.setResultStatus(resStatus != null ? (Integer) resStatus : 0);

                            sr.setErrorJson((String) stepData.getOrDefault("errorLog", ""));
                            sr = stepResultRepository.save(sr);

                            String base64 = (String) stepData.get("screenshotBase64");
                            if (base64 != null && !base64.isEmpty()) {
                                byte[] imageBytes = java.util.Base64.getDecoder().decode(base64);
                                String fileName = "exec_" + executionId + "_step_" + sr.getId() + "_" + System.currentTimeMillis() + ".png";

                                String s3Url = s3Service.uploadImage(fileName, imageBytes);

                                Screenshot sc = new Screenshot();
                                sc.setExecutionId(executionId);
                                sc.setStepResultId(sr.getId());
                                sc.setFileName(fileName);
                                sc.setContentType("image/png");
                                sc.setStoragePath(s3Url);
                                screenshotRepository.save(sc);
                            }
                        }
                    }
                }
            }
        } catch (Exception ex) {
            ex.printStackTrace();
        }
        return ResponseEntity.ok().build();
    }

    @Transactional
    public ResponseEntity<Void> stopExecution(Long executionId) {
        executionRepository.findById(executionId).ifPresent(exec -> {
            if ("running".equals(exec.getStatus()) || "queued".equals(exec.getStatus())) {
                exec.setStatus("aborted");
                exec.setFinishedAt(java.time.LocalDateTime.now());
                executionRepository.save(exec);
            }
        });
        return ResponseEntity.ok().build();
    }

    @Transactional
    public ResponseEntity<Void> rerunExecution(Long executionId) {
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
}
