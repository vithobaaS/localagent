package com.autopilot.localagent_cloud.service;

import com.autopilot.localagent_cloud.model.Agent;
import com.autopilot.localagent_cloud.model.AgentToken;
import com.autopilot.localagent_cloud.model.Execution;
import com.autopilot.localagent_cloud.model.Scheduler;
import com.autopilot.localagent_cloud.model.Screenshot;
import com.autopilot.localagent_cloud.model.StepResult;
import com.autopilot.localagent_cloud.model.TestCaseGroupMapping;
import com.autopilot.localagent_cloud.model.TestStep;
import com.autopilot.localagent_cloud.model.TestSuite;
import com.autopilot.localagent_cloud.model.TestSuiteGroupMapping;
import com.autopilot.localagent_cloud.repository.AgentRepository;
import com.autopilot.localagent_cloud.repository.AgentTokenRepository;
import com.autopilot.localagent_cloud.repository.ExecutionRepository;
import com.autopilot.localagent_cloud.repository.SchedulerRepository;
import com.autopilot.localagent_cloud.repository.ScreenshotRepository;
import com.autopilot.localagent_cloud.repository.StepResultRepository;
import com.autopilot.localagent_cloud.repository.TestCaseGroupMappingRepository;
import com.autopilot.localagent_cloud.repository.TestStepRepository;
import com.autopilot.localagent_cloud.repository.TestSuiteGroupMappingRepository;
import com.autopilot.localagent_cloud.repository.TestSuiteRepository;
import com.autopilot.localagent_cloud.repository.VariableRepository;
import com.autopilot.localagent_cloud.repository.OrganisationRepository;
import com.autopilot.localagent_cloud.repository.AgentGroupMappingRepository;
import com.autopilot.localagent_cloud.repository.JobRepository;
import com.autopilot.localagent_cloud.model.Organisation;
import com.autopilot.localagent_cloud.model.Variable;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.PageRequest;
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
    private final OrganisationRepository organisationRepository;
    private final VariableRepository variableRepository;
    private final AgentGroupMappingRepository agentGroupMappingRepository;
    private final JobRepository jobRepository;
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
                        OrganisationRepository organisationRepository,
                        VariableRepository variableRepository,
                        AgentGroupMappingRepository agentGroupMappingRepository,
                        JobRepository jobRepository,
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
        this.organisationRepository = organisationRepository;
        this.variableRepository = variableRepository;
        this.agentGroupMappingRepository = agentGroupMappingRepository;
        this.jobRepository = jobRepository;
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

        String orgName = "Unknown Organisation";
        if (token.getOrgId() != null) {
            Organisation org = organisationRepository.findById(token.getOrgId()).orElse(null);
            if (org != null) {
                orgName = org.getName();
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("orgName", orgName);
        response.put("tokenLabel", token.getLabel());
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
    @SuppressWarnings("unchecked")
    public ResponseEntity<Map<String, Object>> getNextJob(String agentId) {
        Agent agent = agentRepository.findById(agentId).orElse(null);
        if (agent == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        agent.setLastSeenAt(java.time.LocalDateTime.now());
        agentRepository.save(agent);

        Long agentOrgId = agent.getOrgId();

        List<Long> agentGroupIds = agentGroupMappingRepository.findByAgentId(agentId).stream()
                .map(com.autopilot.localagent_cloud.model.AgentGroupMapping::getGroupId)
                .toList();
        List<Long> groupIDsForQuery = agentGroupIds.isEmpty() ? List.of(-1L) : agentGroupIds;

        String agentBrowserVersion = "";
        try {
            if (agent.getCapabilitiesJson() != null) {
                Map<String, Object> caps = objectMapper.readValue(agent.getCapabilitiesJson(), Map.class);
                if (caps.containsKey("browserVersion")) {
                    agentBrowserVersion = (String) caps.get("browserVersion");
                }
            }
        } catch (Exception e) {}
        final String finalAgentBrowserVer = agentBrowserVersion;

        // Phase 1: Try to pick up an existing QUEUED job
        List<com.autopilot.localagent_cloud.model.Job> candidateJobs = jobRepository.findNextAvailableJobs(agentId, groupIDsForQuery, PageRequest.of(0, 50));
        com.autopilot.localagent_cloud.model.Job selectedJob = candidateJobs.stream().findFirst().orElse(null);

        if (selectedJob != null) {
            selectedJob.setStatus("ASSIGNED");
            selectedJob.setAgentId(agentId);
            selectedJob.setLeaseExpiresAt(java.time.LocalDateTime.now().plusMinutes(10));
            jobRepository.save(selectedJob);

            try {
                Map<String, Object> runRequest = objectMapper.readValue(selectedJob.getPayloadJson(), Map.class);
                runRequest.put("jobId", selectedJob.getId()); // Inject jobId for the agent

                Map<String, Object> jobDto = new HashMap<>();
                jobDto.put("executionId", selectedJob.getExecutionId());
                jobDto.put("jobId", selectedJob.getId());
                jobDto.put("payloadJson", objectMapper.writeValueAsString(runRequest));
                return ResponseEntity.ok(jobDto);
            } catch (Exception e) {
                e.printStackTrace();
                return ResponseEntity.internalServerError().build();
            }
        }

        // Phase 2: Unwrap a Scheduler into multiple QUEUED Jobs
        List<Scheduler> activeJobs = schedulerRepository.findAll().stream()
                .filter(s -> "now".equals(s.getExecutionType()) && "active".equals(s.getStatus()))
                .filter(s -> agentOrgId == null || agentOrgId.equals(s.getOrgId()))
                .toList();

        if (activeJobs.isEmpty()) {
            return ResponseEntity.noContent().build();
        }

        Scheduler job = activeJobs.get(0);
        job.setStatus("processing");
        schedulerRepository.save(job);

        Execution execution = new Execution();
        execution.setOrgId(agentOrgId);

        long count = agentOrgId != null ? executionRepository.countByOrgId(agentOrgId) : 0;
        execution.setOrgExecutionId(count + 1);
        execution.setEnvironmentId(job.getEnvironmentId());
        execution.setTargetGroupId(job.getTargetGroupId());
        execution.setBrowserType(job.getBrowserType());
        execution.setBrowserVersion(job.getBrowserVersion());
        execution.setSchedulerId(job.getId());

        execution.setEnvironmentJson("{\"referenceId\":\"" + job.getTestSuiteName() + "\",\"browserTypeName\":\"" + job.getBrowserType() + "\"}");
        execution.setStatus("running");
        execution.setCreatedAt(java.time.LocalDateTime.now());
        execution = executionRepository.save(execution);

        // Resolve Variables: GLOBAL and ENVIRONMENT
        Map<String, String> executionVariables = new HashMap<>();
        if (agentOrgId != null) {
            List<Variable> globalVars = variableRepository.findByOrgIdAndScope(agentOrgId, "GLOBAL");
            for (Variable v : globalVars) {
                executionVariables.put(v.getKeyName(), v.getValue());
            }

            if (job.getEnvironmentId() != null) {
                List<Variable> envVars = variableRepository.findByOrgIdAndScopeAndScopeId(agentOrgId, "ENVIRONMENT", job.getEnvironmentId());
                for (Variable v : envVars) {
                    executionVariables.put(v.getKeyName(), v.getValue()); // overrides global
                }
            }
        }

        if (job.getTestSuiteId() != null) {
            List<TestSuiteGroupMapping> groupMappings = testSuiteGroupMappingRepository.findByTestSuiteIdOrderByGroupOrder(job.getTestSuiteId());
            for (TestSuiteGroupMapping gm : groupMappings) {
                List<TestCaseGroupMapping> caseMappings = testCaseGroupMappingRepository.findByTestCaseGroupIdOrderByCaseOrder(gm.getTestCaseGroupId());
                for (TestCaseGroupMapping cm : caseMappings) {
                    List<TestStep> steps = testStepRepository.findByTestCaseIdOrderByStepOrder(cm.getTestCaseId());

                    Map<String, Object> iter = new HashMap<>();
                    iter.put("testCaseId", cm.getTestCaseId());
                    iter.put("steps", steps);

                    Map<String, Object> runRequest = new HashMap<>();
                    runRequest.put("executionId", execution.getId());
                    runRequest.put("browserType", job.getBrowserType());
                    runRequest.put("iterations", List.of(iter)); // ONLY THIS TEST CASE!
                    runRequest.put("variables", executionVariables);

                    try {
                        String payloadJson = objectMapper.writeValueAsString(runRequest);
                        com.autopilot.localagent_cloud.model.Job newJob = new com.autopilot.localagent_cloud.model.Job();
                        newJob.setExecutionId(execution.getId());
                        newJob.setTestCaseId(cm.getTestCaseId());
                        newJob.setTargetGroupId(job.getTargetGroupId());
                        newJob.setBrowserType(job.getBrowserType());
                        newJob.setBrowserVersion(job.getBrowserVersion());
                        newJob.setStatus("QUEUED");
                        newJob.setPayloadJson(payloadJson);
                        jobRepository.save(newJob);
                    } catch (Exception e) {}
                }
            }
        }

        // Bug fix: replaced unbounded recursion with a simple retry — pick up one of the jobs just created.
        // The recursive approach had no depth limit and could cause a StackOverflowError
        // if job creation failed unexpectedly.
        List<com.autopilot.localagent_cloud.model.Job> retryJobs = jobRepository.findNextAvailableJobs(
                agentId, groupIDsForQuery, PageRequest.of(0, 50));
        com.autopilot.localagent_cloud.model.Job retryJob = retryJobs.stream().filter(j -> {
            if (j.getBrowserVersion() == null || j.getBrowserVersion().isBlank()) return true;
            if (finalAgentBrowserVer.isBlank()) return false;
            String reqMajor = j.getBrowserVersion().split("\\.")[0];
            String agentMajor = finalAgentBrowserVer.split("\\.")[0];
            return reqMajor.equals(agentMajor);
        }).findFirst().orElse(null);

        if (retryJob != null) {
            retryJob.setStatus("ASSIGNED");
            retryJob.setAgentId(agentId);
            retryJob.setLeaseExpiresAt(java.time.LocalDateTime.now().plusMinutes(10));
            jobRepository.save(retryJob);
            try {
                Map<String, Object> runRequest = objectMapper.readValue(retryJob.getPayloadJson(), Map.class);
                runRequest.put("jobId", retryJob.getId());
                Map<String, Object> jobDto = new HashMap<>();
                jobDto.put("executionId", retryJob.getExecutionId());
                jobDto.put("jobId", retryJob.getId());
                jobDto.put("payloadJson", objectMapper.writeValueAsString(runRequest));
                return ResponseEntity.ok(jobDto);
            } catch (Exception e) {
                return ResponseEntity.internalServerError().build();
            }
        }
        return ResponseEntity.noContent().build();
    }

    @Transactional
    @SuppressWarnings("unchecked")
    public ResponseEntity<Void> postResults(Long executionId, Map<String, Object> result) {
        try {
            Map<String, Object> runResult = result;
            if (result.containsKey("result")) {
                runResult = (Map<String, Object>) result.get("result");
            }

            // Correctly parse the overall result_status sent by the Java Agent
            String finalStatus = "completed";
            if (runResult.containsKey("result_status")) {
                Object rs = runResult.get("result_status");
                if (rs instanceof Number && ((Number) rs).intValue() == 0) {
                    finalStatus = "failed";
                }
            } else if (result.containsKey("status")) {
                finalStatus = (String) result.get("status");
            }
            
            final String statusToSave = finalStatus;
            
            Long jobId = null;
            if (result.containsKey("jobId")) {
                jobId = ((Number) result.get("jobId")).longValue();
            }

            if (jobId != null) {
                jobRepository.findById(jobId).ifPresent(job -> {
                    job.setStatus(statusToSave);
                    jobRepository.save(job);
                });
                
                // Check if all jobs are completed
                List<com.autopilot.localagent_cloud.model.Job> allJobs = jobRepository.findByExecutionId(executionId);
                boolean allDone = allJobs.stream().allMatch(j -> "completed".equals(j.getStatus()) || "failed".equals(j.getStatus()));
                boolean anyFailed = allJobs.stream().anyMatch(j -> "failed".equals(j.getStatus()));
                
                if (allDone && !allJobs.isEmpty()) {
                    executionRepository.findById(executionId).ifPresent(exec -> {
                        exec.setStatus(anyFailed ? "failed" : "completed");
                        exec.setFinishedAt(java.time.LocalDateTime.now());
                        executionRepository.save(exec);
                    });
                }
            } else {
                // Fallback if jobId is not provided
                executionRepository.findById(executionId).ifPresent(exec -> {
                    exec.setStatus(statusToSave);
                    exec.setFinishedAt(java.time.LocalDateTime.now());
                    executionRepository.save(exec);
                });
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
                            sr.setStepType((String) stepData.getOrDefault("stepType", "ACTION"));

                            Object execStatus = stepData.get("executed_status");
                            sr.setExecutedStatus(execStatus != null ? (Integer) execStatus : 0);

                            Object resStatus = stepData.get("result_status");
                            sr.setResultStatus(resStatus != null ? (Integer) resStatus : 0);

                            sr.setErrorJson((String) stepData.getOrDefault("errorLog", ""));
                            sr.setActualValue((String) stepData.get("actualValue"));
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
            // Bug fix: was silently swallowing all exceptions and returning 200 OK even when data was lost.
            // Now logs the error properly and returns 500 so the agent knows it must retry.
            org.slf4j.LoggerFactory.getLogger(AgentService.class)
                    .error("Critical error processing results for executionId={}: {}", executionId, ex.getMessage(), ex);
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).build();
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
                scheduler.setOrgId(exec.getOrgId());
                schedulerRepository.save(scheduler);
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
        return ResponseEntity.ok().build();
    }
}
