package com.autopropel.localagent_java;

import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.autopropel.localagent_java.dto.RunRequest;
import com.autopropel.localagent_java.dto.RunResult;
import com.autopropel.localagent_java.dto.TestCaseIteration;
import com.autopropel.localagent_java.dto.TestStep;

@SpringBootTest
public class ExecutionSeleniumTests {

    @Autowired
    private ExecutionService executionService;

    @Autowired
    private DriverService driverService;

    @Test
    public void testRealChromeBrowserExecution() {
        // Prepare a real browser execution run request
        RunRequest request = new RunRequest();
        request.result = new RunResult();
        request.result.browserTypeId = 1; // Chrome
        request.result.iterationval = "iteration1";
        request.result.testCase = new ArrayList<>();

        Map<String, List<TestCaseIteration>> testCaseMap = new HashMap<>();
        List<TestCaseIteration> iterations = new ArrayList<>();
        TestCaseIteration iteration = new TestCaseIteration();
        iteration.testSteps = new ArrayList<>();

        // Step 1: Navigate to google and capture a screenshot before the action
        TestStep step1 = new TestStep();
        step1.step_result_id = "step_nav";
        step1.actionName = "Navigate";
        step1.data = "https://www.google.com";
        step1.screenShot = "Before";

        // Step 2: Set search text in the query input element
        TestStep step2 = new TestStep();
        step2.step_result_id = "step_set";
        step2.actionName = "Set";
        step2.locatorName = "css";
        step2.objectDetail = "textarea[name='q']"; // Google's query input is a textarea on modern search pages
        step2.data = "Antigravity AI Coding Assistant";
        step2.screenShot = "After"; // Test screenshot capture after successful action

        iteration.testSteps.add(step1);
        iteration.testSteps.add(step2);

        iterations.add(iteration);
        testCaseMap.put("iteration1", iterations);
        request.result.testCase.add(testCaseMap);

        // Execute!
        RunRequest response = executionService.execute(request);

        // Verify overall execution success
        assertEquals(1, response.result.result_status, "Overall execution should succeed");

        // Verify step statuses
        assertEquals(1, step1.executed_status, "Step 1 should be executed");
        assertEquals(1, step1.result_status, "Step 1 should succeed");

        assertEquals(1, step2.executed_status, "Step 2 should be executed");
        assertEquals(1, step2.result_status, "Step 2 should succeed");

        // Verify screenshots were generated and exist
        assertNotNull(step1.screenshot_path, "Before screenshot path should be captured");
        assertNotNull(step2.screenshot_path, "After screenshot path should be captured");

        File beforeScreenshot = new File(step1.screenshot_path);
        File afterScreenshot = new File(step2.screenshot_path);

        assertTrue(beforeScreenshot.exists(), "Before screenshot file should exist on disk: " + step1.screenshot_path);
        assertTrue(afterScreenshot.exists(), "After screenshot file should exist on disk: " + step2.screenshot_path);
    }
}
