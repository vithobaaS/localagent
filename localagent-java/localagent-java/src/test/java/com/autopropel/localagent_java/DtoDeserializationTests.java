package com.autopropel.localagent_java;

import com.autopropel.localagent_java.dto.RunRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import java.io.InputStream;

import static org.junit.jupiter.api.Assertions.*;

public class DtoDeserializationTests {

    // ObjectMapper is Spring Boot's built-in tool for converting JSON string <->
    // Java Objects
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    public void testSample1Deserialization() throws Exception {
        // 1. Read our sample JSON file from the classpath resources folder
        InputStream inputStream = getClass().getClassLoader()
                .getResourceAsStream("parity-pack/run_sample_1.json");

        assertNotNull(inputStream, "Could not find run_sample_1.json in classpath resources");

        // 2. Attempt to parse it into our RunRequest Java class
        RunRequest runRequest = objectMapper.readValue(inputStream, RunRequest.class);

        // 3. Verify the fields mapped correctly!
        assertNotNull(runRequest);
        assertNotNull(runRequest.result);
        assertEquals("1", runRequest.result.environmentId);
        assertEquals("Chrome", runRequest.result.browserTypeName);
        assertEquals("iteration1", runRequest.result.iterationval);

        // Ensure our dynamic iteration array loaded successfully
        assertNotNull(runRequest.result.testCase);
        assertFalse(runRequest.result.testCase.isEmpty());

        // Grab the "iteration1" key from the list to make sure it's readable
        assertTrue(runRequest.result.testCase.get(0).containsKey("iteration1"));
    }
}
