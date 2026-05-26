package com.autopropel.localagent_cloud;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;

import com.autopropel.localagent_cloud.dto.RunRequest;
import com.autopropel.localagent_cloud.dto.RunResult;
import com.autopropel.localagent_cloud.service.CloudJobService;
import com.autopropel.localagent_cloud.service.JobStatus;

class RestartPersistenceTests {

    @TempDir
    Path tempDir;

    @Test
    void scheduledJob_shouldSurviveApplicationRestart() {
        Path dbPath = tempDir.resolve("restart-cloud");
        String dbUrl = "jdbc:h2:file:" + dbPath.toAbsolutePath();

        ConfigurableApplicationContext firstContext = new SpringApplicationBuilder(LocalagentCloudApplication.class)
                .web(WebApplicationType.NONE)
                .properties(
                        "spring.datasource.url=" + dbUrl,
                        "spring.datasource.driver-class-name=org.h2.Driver",
                        "spring.datasource.username=sa",
                        "spring.datasource.password=",
                        "spring.jpa.hibernate.ddl-auto=update",
                        "spring.jpa.show-sql=false"
                )
                .run();

        try {
            CloudJobService service = firstContext.getBean(CloudJobService.class);
            RunRequest job = buildJob("restart-job-1");
            assertTrue(service.scheduleJob("agent-restart", job));
            assertEquals(JobStatus.QUEUED, service.getJobStatus("restart-job-1"));
        } finally {
            firstContext.close();
        }

        ConfigurableApplicationContext secondContext = new SpringApplicationBuilder(LocalagentCloudApplication.class)
                .web(WebApplicationType.NONE)
                .properties(
                        "spring.datasource.url=" + dbUrl,
                        "spring.datasource.driver-class-name=org.h2.Driver",
                        "spring.datasource.username=sa",
                        "spring.datasource.password=",
                        "spring.jpa.hibernate.ddl-auto=update",
                        "spring.jpa.show-sql=false"
                )
                .run();

        try {
            CloudJobService service = secondContext.getBean(CloudJobService.class);
            assertEquals(JobStatus.QUEUED, service.getJobStatus("restart-job-1"));
            assertNotNull(service.getJobResult("restart-job-1"));
        } finally {
            secondContext.close();
        }
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
}
