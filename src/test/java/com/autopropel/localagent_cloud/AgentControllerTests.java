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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.autopropel.localagent_cloud.dto.RunRequest;
import com.autopropel.localagent_cloud.dto.RunResult;
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
    public void testSchedulePollAndSubmitFlow() throws Exception {
        // 1. Initial poll should return 204 No Content
        mockMvc.perform(get("/api/agent/poll?agentId=test_agent"))
                .andExpect(status().isNoContent());

        // 2. Schedule a job
        RunRequest job = new RunRequest();
        job.result = new RunResult();
        job.result.referenceId = "cloud_job_789";
        job.result.iterationval = "iteration1";
        job.result.testCase = new ArrayList<>();
        job.result.testCase.add(Map.of("iteration1", new ArrayList<>()));

        mockMvc.perform(post("/api/agent/schedule-job?agentId=test_agent")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(job)))
                .andExpect(status().isOk())
                .andExpect(content().string("Job scheduled successfully"));

        // 3. Poll again - should return the job
        mockMvc.perform(get("/api/agent/poll?agentId=test_agent"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.referenceId").value("cloud_job_789"));

        // 4. Poll again - queue should be empty (204 No Content)
        mockMvc.perform(get("/api/agent/poll?agentId=test_agent"))
                .andExpect(status().isNoContent());

        // 5. Submit result
        job.result.result_status = 1;
        mockMvc.perform(post("/api/agent/result")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(job)))
                .andExpect(status().isOk());

        // 6. Check stored result
        mockMvc.perform(get("/api/agent/job-result?referenceId=cloud_job_789"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.result_status").value(1));

        // 7. Check status is exposed
        mockMvc.perform(get("/api/agent/job-status?referenceId=cloud_job_789"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", org.hamcrest.Matchers.is("SUCCESS")));

        // 8. Unknown jobs should return 404
        mockMvc.perform(get("/api/agent/job-status?referenceId=missing_job"))
                .andExpect(status().isNotFound());
    }
}
