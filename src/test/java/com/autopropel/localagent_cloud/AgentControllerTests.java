package com.autopropel.localagent_cloud;

import java.util.ArrayList;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.autopropel.localagent_cloud.dto.RunRequest;
import com.autopropel.localagent_cloud.dto.RunResult;
import com.autopropel.localagent_cloud.persistence.Agent;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AgentControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void testMvpFlow() throws Exception {
        // 1. Register agent
        Agent agent = new Agent();
        agent.setId("agent_test_01");
        agent.setName("Test Agent");
        agent.setOs("Linux");
        agent.setAgentVersion("1.0");

        mockMvc.perform(post("/agents/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(agent)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("agent_test_01"))
                .andExpect(jsonPath("$.name").value("Test Agent"));

        // 2. Heartbeat
        mockMvc.perform(post("/agents/agent_test_01/heartbeat"))
                .andExpect(status().isOk());

        // 3. Create Execution & Job
        RunRequest runRequest = new RunRequest();
        runRequest.result = new RunResult();
        runRequest.result.referenceId = "mvp_run_789";
        runRequest.result.environmentId = "agent_test_01";
        runRequest.result.iterationval = "iteration1";
        runRequest.result.testCase = new ArrayList<>();
        runRequest.result.testCase.add(Map.of("iteration1", new ArrayList<>()));

        MvcResult execResult = mockMvc.perform(post("/executions?agentId=agent_test_01")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(runRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String execIdStr = execResult.getResponse().getContentAsString();
        Long execId = Long.parseLong(execIdStr);

        // 4. Lease next job
        mockMvc.perform(get("/agents/agent_test_01/jobs/next"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.agentId").value("agent_test_01"))
                .andExpect(jsonPath("$.status").value("ASSIGNED"));

        // 5. Submit execution results
        runRequest.result.result_status = 1; // SUCCESS
        mockMvc.perform(post("/executions/" + execId + "/results")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(runRequest)))
                .andExpect(status().isOk());
    }
}
