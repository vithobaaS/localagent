package com.autopropel.localagent_java;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import org.junit.jupiter.api.Test;

import com.autopropel.localagent_java.dto.RunRequest;
import com.autopropel.localagent_java.dto.RunResult;
import com.autopropel.localagent_java.dto.TestCaseIteration;
import com.autopropel.localagent_java.dto.TestStep;

public class ExecutionEngineTests {

    private static class StubDriverService extends DriverService {

        @Override
        public boolean startDriver(Integer browserTypeId) {
            return true;
        }
    }

    private final ExecutionService executionService = new ExecutionService(new StubDriverService());

    @Test
    public void testDependencyCheckFailure() {
        // Create a mock RunRequest structure
        RunRequest request = new RunRequest();
        request.result = new RunResult();
        request.result.iterationval = "iteration1";
        request.result.testCase = new ArrayList<>();

        Map<String, List<TestCaseIteration>> testCaseMap = new HashMap<>();
        List<TestCaseIteration> iterations = new ArrayList<>();
        TestCaseIteration iteration = new TestCaseIteration();
        iteration.testSteps = new ArrayList<>();

        // Step 1: Normal action (Success)
        TestStep step1 = new TestStep();
        step1.step_result_id = "step_1";
        step1.actionName = "Navigate";

        // Step 2: Failed action. In our mock code, an invalid Goto target (non-number) 
        // will throw a NumberFormatException and fail the step (result_status = 0).
        TestStep step2 = new TestStep();
        step2.step_result_id = "step_2";
        step2.actionName = "Goto";
        step2.data = "invalid-target";

        // Step 3: Next action (Should be skipped due to dependency rules)
        TestStep step3 = new TestStep();
        step3.step_result_id = "step_3";
        step3.actionName = "Click";

        iteration.testSteps.add(step1);
        iteration.testSteps.add(step2);
        iteration.testSteps.add(step3);

        iterations.add(iteration);
        testCaseMap.put("iteration1", iterations);
        request.result.testCase.add(testCaseMap);

        // Run the service logic!
        RunRequest response = executionService.execute(request);

        // Assertions:
        assertEquals(1, step1.executed_status, "Step 1 should be executed");
        assertEquals(1, step1.result_status, "Step 1 should succeed");

        assertEquals(1, step2.executed_status, "Step 2 should be executed");
        assertEquals(0, step2.result_status, "Step 2 should fail");

        // The dependency check should skip step 3!
        assertEquals(0, step3.executed_status, "Step 3 should not be executed");
        assertEquals(0, step3.result_status, "Step 3 result status should be 0 (unexecuted)");

        assertEquals(0, response.result.result_status, "Overall result status should be failed");
    }

    @Test
    public void testGotoLoopLimit() {
        RunRequest request = new RunRequest();
        request.result = new RunResult();
        request.result.iterationval = "iteration1";
        request.result.testCase = new ArrayList<>();

        Map<String, List<TestCaseIteration>> testCaseMap = new HashMap<>();
        List<TestCaseIteration> iterations = new ArrayList<>();
        TestCaseIteration iteration = new TestCaseIteration();
        iteration.testSteps = new ArrayList<>();

        // Step 1: Navigate
        TestStep step1 = new TestStep();
        step1.step_result_id = "step_1";
        step1.actionName = "Navigate";

        // Step 2: Goto Step 1 (This will trigger a loop back)
        TestStep step2 = new TestStep();
        step2.step_result_id = "step_2";
        step2.actionName = "Goto";
        step2.data = "1";

        iteration.testSteps.add(step1);
        iteration.testSteps.add(step2);

        iterations.add(iteration);
        testCaseMap.put("iteration1", iterations);
        request.result.testCase.add(testCaseMap);

        // Run the execution engine
        // If there is an infinite loop, this test will run forever and timeout.
        // If the limit of 10 works, the test will finish in milliseconds!
        RunRequest response = executionService.execute(request);

        // Verify it finished with overall success
        assertEquals(1, response.result.result_status);
        assertNotNull(response);
    }

    @Test
    public void testExecutionStopsAfterMaxSteps() {
        RunRequest request = new RunRequest();
        request.result = new RunResult();
        request.result.iterationval = "iteration1";
        request.result.testCase = new ArrayList<>();

        Map<String, List<TestCaseIteration>> testCaseMap = new HashMap<>();
        List<TestCaseIteration> iterations = new ArrayList<>();
        TestCaseIteration iteration = new TestCaseIteration();
        iteration.testSteps = new ArrayList<>();

        for (int i = 1; i <= 501; i++) {
            TestStep step = new TestStep();
            step.step_result_id = "step_" + i;
            step.actionName = "Navigate";
            step.data = "https://example.com";
            iteration.testSteps.add(step);
        }

        iterations.add(iteration);
        testCaseMap.put("iteration1", iterations);
        request.result.testCase.add(testCaseMap);

        RunRequest response = executionService.execute(request);

        assertEquals(0, response.result.result_status);
        assertEquals(1, iteration.testSteps.get(500).executed_status);
        assertEquals(0, iteration.testSteps.get(500).result_status);
        assertEquals("Execution aborted: max steps exceeded (500)", iteration.testSteps.get(500).errorLog);
    }
}
