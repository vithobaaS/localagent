package com.autopropel.localagent_cloud;

import java.util.ArrayList;
import java.util.Map;

import org.junit.jupiter.api.AfterEach;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.autopropel.localagent_cloud.dto.RunRequest;
import com.autopropel.localagent_cloud.dto.RunResult;
import com.autopropel.localagent_cloud.persistence.JobRecordRepository;
import com.autopropel.localagent_cloud.service.CloudJobService;
import com.autopropel.localagent_cloud.service.JobStatus;

@SpringBootTest
@ActiveProfiles("test")
class CloudJobServiceTests {

    @Autowired
    private CloudJobService service;

    @Autowired
    private JobRecordRepository jobRecordRepository;

    @AfterEach
    void cleanup() {
        jobRecordRepository.deleteAll();
    }

    @Test
    void scheduleAndPollJob_shouldTrackAssignedStatus() {
        RunRequest job = buildJob("job-1");

        assertTrue(service.scheduleJob("agent-1", job));
        assertEquals(JobStatus.QUEUED, service.getJobStatus("job-1"));

        RunRequest polled = service.pollJob("agent-1");

        assertNotNull(polled);
        assertEquals("job-1", polled.result.referenceId);
        assertEquals(JobStatus.ASSIGNED, service.getJobStatus("job-1"));
        assertNull(service.pollJob("agent-1"));
    }

    @Test
    void receiveResult_shouldStoreSuccessAndAllowLookup() {
        RunRequest job = buildJob("job-2");
        service.scheduleJob("agent-2", job);

        RunRequest result = buildResult("job-2", 1);
        assertTrue(service.receiveResult(result));

        assertEquals(JobStatus.SUCCESS, service.getJobStatus("job-2"));
        assertNotNull(service.getJobResult("job-2"));
        assertEquals(1, service.getJobResult("job-2").result.result_status);
    }

    @Test
    void invalidInput_shouldBeRejected() {
        assertFalse(service.scheduleJob("", buildJob("job-3")));
        assertFalse(service.scheduleJob("agent-3", null));
        assertFalse(service.receiveResult(buildResult("", 0)));
        assertNull(service.getJobResult(""));
    }

    private RunRequest buildJob(String referenceId) {
        RunRequest request = new RunRequest();
        RunResult result = new RunResult();
        result.referenceId = referenceId;
        result.iterationval = "iteration1";
        result.testCase = new ArrayList<>();
        result.testCase.add(Map.of("iteration1", new ArrayList<>()));
        request.result = result;
        return request;
    }

    private RunRequest buildResult(String referenceId, Integer status) {
        RunRequest request = new RunRequest();
        RunResult result = new RunResult();
        result.referenceId = referenceId;
        result.result_status = status;
        request.result = result;
        return request;
    }
}
