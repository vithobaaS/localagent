package com.autopropel.localagent_java;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.autopropel.localagent_java.dto.AgentRegisterDto;
import com.autopropel.localagent_java.dto.JobDto;
import com.autopropel.localagent_java.dto.RunRequest;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.annotation.PostConstruct;

@Service
@ConditionalOnProperty(name = "localagent.polling-enabled", havingValue = "true")
public class AgentPollingService {

    private static final Logger logger = LoggerFactory.getLogger(AgentPollingService.class);

    private final RestTemplate restTemplate = new RestTemplate();
    private final ExecutionService executionService;
    private final ObjectMapper objectMapper;

    @Value("${localagent.cloud-url}")
    private String cloudUrl;

    private String agentId;

    public AgentPollingService(ExecutionService executionService, ObjectMapper objectMapper) {
        this.executionService = executionService;
        this.objectMapper = objectMapper;
        this.agentId = generateAgentIdentity();
    }

    private String generateAgentIdentity() {
        String computerName = System.getenv("COMPUTERNAME");
        if (computerName == null || computerName.isBlank()) {
            computerName = System.getenv("HOSTNAME");
        }
        if (computerName == null || computerName.isBlank()) {
            computerName = "UNKNOWN-HOST";
        }
        
        String userName = System.getProperty("user.name");
        if (userName == null || userName.isBlank()) {
            userName = "unknown";
        }
        
        return computerName.toUpperCase() + "_" + userName.toLowerCase();
    }

    @PostConstruct
    public void registerOnStartup() {
        logger.info("=================================================");
        logger.info("AutoPropel Local Agent Starting...");
        logger.info("Agent Identity: {}", agentId);
        logger.info("Connecting to Cloud Coordinator: {}", cloudUrl);
        logger.info("=================================================");
        
        try {
            String regUrl = cloudUrl + "/api/agents/register";
            AgentRegisterDto reg = new AgentRegisterDto();
            reg.id = agentId;
            reg.name = "AutoPropel Headless Agent (" + agentId + ")";
            reg.os = System.getProperty("os.name");
            reg.agentVersion = "1.0-headless";
            reg.capabilitiesJson = "{\"chrome\":true,\"firefox\":true}";

            try {
                restTemplate.postForObject(regUrl, reg, Object.class);
                logger.info("Agent successfully registered with cloud coordinator!");
            } catch (Exception e) {
                logger.warn("Could not register with cloud (is the backend running?): {}", e.getMessage());
            }
        } catch (Exception e) {
            logger.warn("Failed to register agent with cloud: {}", e.getMessage());
        }
    }

    @Scheduled(fixedRateString = "${localagent.poll-interval-ms:10000}", initialDelayString = "${localagent.poll-initial-delay-ms:0}")
    public void pollForJobs() {
        logger.debug("Polling cloud at {}/api/agents/{}/jobs/next for jobs...", cloudUrl, agentId);
        try {
            // Poll next job
            String pollUrl = cloudUrl + "/api/agents/" + agentId + "/jobs/next";
            JobDto job = restTemplate.getForObject(pollUrl, JobDto.class);

            if (job != null && job.payloadJson != null) {
                logger.info("Received job execution #{} from cloud queue", job.executionId);

                // Map clean Cloud payload to legacy RunRequest structure expected by ExecutionService
                com.fasterxml.jackson.databind.JsonNode rootNode = objectMapper.readTree(job.payloadJson);
                
                com.autopropel.localagent_java.dto.RunResult runResult = new com.autopropel.localagent_java.dto.RunResult();
                runResult.referenceId = "execution_" + job.executionId;
                
                String browser = rootNode.path("browserType").asText("chrome");
                runResult.browserTypeId = "firefox".equalsIgnoreCase(browser) ? 2 : 1;
                runResult.iterationval = "iteration1";
                
                java.util.List<java.util.Map<String, java.util.List<com.autopropel.localagent_java.dto.TestCaseIteration>>> testCaseList = new java.util.ArrayList<>();
                java.util.Map<String, java.util.List<com.autopropel.localagent_java.dto.TestCaseIteration>> iterationMap = new java.util.HashMap<>();
                java.util.List<com.autopropel.localagent_java.dto.TestCaseIteration> iterations = new java.util.ArrayList<>();
                
                com.fasterxml.jackson.databind.JsonNode iterationsNode = rootNode.path("iterations");
                if (iterationsNode.isArray()) {
                    for (com.fasterxml.jackson.databind.JsonNode iterNode : iterationsNode) {
                        com.autopropel.localagent_java.dto.TestCaseIteration tci = new com.autopropel.localagent_java.dto.TestCaseIteration();
                        tci.testSteps = new java.util.ArrayList<>();
                        
                        com.fasterxml.jackson.databind.JsonNode stepsNode = iterNode.path("steps");
                        if (stepsNode.isArray()) {
                            for (com.fasterxml.jackson.databind.JsonNode stepNode : stepsNode) {
                                com.autopropel.localagent_java.dto.TestStep ts = new com.autopropel.localagent_java.dto.TestStep();
                                ts.step_result_id = stepNode.path("id").asText("0");
                                ts.actionName = stepNode.path("actionName").asText("");
                                ts.locatorName = stepNode.path("locatorType").asText("");
                                ts.objectDetail = stepNode.path("locatorValue").asText("");
                                ts.data = stepNode.path("testData").asText("");
                                ts.stepDesc = stepNode.path("description").asText("");
                                ts.screenShot = "After"; // Default
                                tci.testSteps.add(ts);
                            }
                        }
                        iterations.add(tci);
                    }
                }
                iterationMap.put("iteration1", iterations);
                testCaseList.add(iterationMap);
                runResult.testCase = testCaseList;
                
                RunRequest jobRequest = new RunRequest();
                jobRequest.result = runResult;

                // Execute job
                RunRequest result = executionService.execute(jobRequest);

                // Post results back
                String resultUrl = cloudUrl + "/api/executions/" + job.executionId + "/results";
                logger.info("Posting execution results back to: {}", resultUrl);
                restTemplate.postForLocation(resultUrl, result);
            }
        } catch (Exception e) {
            logger.debug("No jobs or failed to poll cloud: {}", e.getMessage());
        }
    }
}
