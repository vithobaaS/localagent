package com.autopropel.localagent_java;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.client.MockRestServiceServer;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import org.springframework.web.client.RestTemplate;

import com.autopropel.localagent_java.dto.RunRequest;
import com.autopropel.localagent_java.dto.RunResult;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@TestPropertySource(properties = {
    "localagent.polling-enabled=true",
    "localagent.poll-interval-ms=100000000",
    "localagent.poll-initial-delay-ms=100000000",
    "localagent.cloud-url=http://mock-cloud",
    "localagent.agent-id=test_agent"
})
public class AgentPollingServiceTests {

    @Autowired
    private AgentPollingService pollingService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void testPollingAndExecutionFlow() throws Exception {
        // Retrieve the RestTemplate from AgentPollingService using reflection
        Field restTemplateField = AgentPollingService.class.getDeclaredField("restTemplate");
        restTemplateField.setAccessible(true);
        RestTemplate restTemplate = (RestTemplate) restTemplateField.get(pollingService);

        // Bind MockRestServiceServer to the restTemplate
        MockRestServiceServer mockServer = MockRestServiceServer.createServer(restTemplate);

        // Prepare the mock request
        RunRequest mockRequest = new RunRequest();
        mockRequest.result = new RunResult();
        mockRequest.result.referenceId = "poll_job_123";
        mockRequest.result.iterationval = "iteration1";
        mockRequest.result.testCase = new ArrayList<>();
        mockRequest.result.testCase.add(Map.of("iteration1", new ArrayList<>()));

        String responseJson = objectMapper.writeValueAsString(mockRequest);

        // Expect GET to poll endpoint
        mockServer.expect(requestTo("http://mock-cloud/api/agent/poll?agentId=test_agent"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess(responseJson, MediaType.APPLICATION_JSON));

        // Expect POST to result endpoint with updated status = 1 (Success)
        mockServer.expect(requestTo("http://mock-cloud/api/agent/result"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("\"referenceId\":\"poll_job_123\"")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("\"result_status\":1")))
                .andRespond(withSuccess());

        // Trigger polling logic manually
        pollingService.pollForJobs();

        // Verify mock server expectations
        mockServer.verify();
    }
}
