package com.autopropel.localagent_java;

import java.io.File;
import java.net.Socket;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.autopropel.localagent_java.dto.RunRequest;
import com.autopropel.localagent_java.dto.RunResult;
import com.autopropel.localagent_java.dto.TestCaseIteration;
import com.autopropel.localagent_java.dto.TestStep;

@Service
public class ExecutionService {

    private static final Logger logger = LoggerFactory.getLogger(ExecutionService.class);

    private final DriverService driverService;

    @Value("${localagent.headless:true}")
    private boolean headless;

    private int maxSteps = 500;
    private long maxExecutionMs = 300000L;

    public ExecutionService(DriverService driverService) {
        this.driverService = driverService;
    }

    @Value("${localagent.max-step-count:500}")
    public void setMaxSteps(int maxSteps) {
        this.maxSteps = maxSteps;
    }

    @Value("${localagent.max-execution-ms:300000}")
    public void setMaxExecutionMs(long maxExecutionMs) {
        this.maxExecutionMs = maxExecutionMs;
    }

    /**
     * Convenience overload with no live-step callback.
     */
    public RunRequest execute(RunRequest request) {
        return execute(request, null);
    }

    /**
     * Executes the request and calls stepCallback after EVERY step (whether it
     * passed, failed or was skipped) so the UI can update live.
     */
    public RunRequest execute(RunRequest request, Consumer<TestStep> stepCallback) {
        if (request == null || request.result == null) {
            throw new IllegalArgumentException("result is required");
        }

        RunResult result = request.result;
        if (result.iterationval == null || result.iterationval.isBlank()) {
            throw new IllegalArgumentException("iterationval is required");
        }
        if (result.testCase == null || result.testCase.isEmpty()) {
            throw new IllegalArgumentException("testCase must contain at least one iteration");
        }

        String iterationKey = result.iterationval; // e.g. "iteration1"

        logger.info("Starting execution for run reference: {}", result.referenceId);

        // Start the browser driver process and initialize WebDriver if browserTypeId is specified
        WebDriver driver = null;
        if (result.browserTypeId != null) {
            boolean driverStarted = driverService.startDriver(result.browserTypeId);
            if (!driverStarted) {
                logger.error("Failed to start webdriver for browserTypeId: {}", result.browserTypeId);
                result.result_status = 0;
                return request;
            }

            // Wait for the driver TCP port to be ready (handles freshly-spawned processes)
            int driverPort = (result.browserTypeId == 2) ? 6000 : 6001;
            boolean portReady = waitForDriverPort("localhost", driverPort, 15000);
            if (!portReady) {
                logger.error("Driver port {} did not become ready within 15 seconds.", driverPort);
                result.result_status = 0;
                return request;
            }

            // Give the driver's HTTP server a moment to fully initialize after TCP port opens
            try {
                Thread.sleep(500);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
            }

            // Retry WebDriver session creation up to 3 times (driver may still be booting)
            Exception lastException = null;
            int maxRetries = 3;
            for (int attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    boolean useHeadless = (result.headless != null) ? result.headless : this.headless;
                    driver = DriverFactory.createDriver(result.browserTypeId, useHeadless);
                    lastException = null;
                    break; // success
                } catch (Exception e) {
                    lastException = e;
                    String cause = e.getCause() != null ? e.getCause().getMessage() : e.getMessage();
                    logger.warn("WebDriver session attempt {}/{} failed: {}", attempt, maxRetries, cause);
                    if (attempt < maxRetries) {
                        try {
                            Thread.sleep(1000);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                        }
                    }
                }
            }
            if (lastException != null) {
                String cause = lastException.getCause() != null ? lastException.getCause().getMessage() : lastException.getMessage();
                logger.error("Failed to establish WebDriver session after {} attempts. Cause: {}", maxRetries, cause);
                result.result_status = 0;
                return request;
            }
        }

        boolean overallSuccess = true;
        boolean executionAborted = false;
        int executedSteps = 0;
        long executionStart = System.currentTimeMillis();

        try {
            // Loop through the test cases list
            for (Map<String, List<TestCaseIteration>> testCaseMap : result.testCase) {
                if (executionAborted) {
                    break;
                }

                List<TestCaseIteration> iterations = testCaseMap.get(iterationKey);
                if (iterations == null) {
                    logger.warn("No iterations found for key: {}", iterationKey);
                    continue;
                }

                for (TestCaseIteration iteration : iterations) {
                    if (executionAborted) {
                        break;
                    }

                    boolean iterationFailed = false;

                    // Track how many times each Goto step has been executed to avoid infinite loops
                    Map<String, Integer> gotoCounts = new HashMap<>();

                    // Loop through individual steps
                    for (int i = 0; i < iteration.testSteps.size(); i++) {
                        TestStep step = iteration.testSteps.get(i);

                        // Dependency Rule: If a previous step failed, skip this step
                        if (iterationFailed) {
                            logger.info("Skipping step: {} (due to previous failure)", step.step_result_id);
                            step.executed_status = 0;
                            step.result_status = 0;
                            if (stepCallback != null) {
                                stepCallback.accept(step);
                            }
                            continue;
                        }

                        logger.info("Executing step [{}/{}]: {} ({})",
                                (i + 1), iteration.testSteps.size(), step.step_result_id, step.actionName);

                        // Mark as executed
                        step.executed_status = 1;

                        String abortReason = getAbortReason(executedSteps, executionStart);
                        if (abortReason != null) {
                            step.result_status = 0;
                            step.errorLog = abortReason;
                            executionAborted = true;
                            iterationFailed = true;
                            overallSuccess = false;
                            if (stepCallback != null) {
                                stepCallback.accept(step);
                            }
                            break;
                        }

                        // Resolve dynamic variables
                        if (result.variables != null) {
                            step.data = resolveVariables(step.data, result.variables);
                            step.locatorName = resolveVariables(step.locatorName, result.variables);
                            step.objectDetail = resolveVariables(step.objectDetail, result.variables);
                        }

                        // Inject human-friendly delay if "slow" speed or custom delayMs is requested
                        int sleepTime = 0;
                        if (result.delayMs != null && result.delayMs > 0) {
                            sleepTime = result.delayMs;
                        } else if ("slow".equalsIgnoreCase(result.speed)) {
                            sleepTime = 2000; // Default "slow" delay to 2 seconds
                        }

                        if (sleepTime > 0) {
                            try {
                                Thread.sleep(sleepTime);
                            } catch (InterruptedException ignored) {
                            }
                        }

                        if (driver != null && "Before".equalsIgnoreCase(step.screenShot)) {
                            captureScreenshot(driver, step);
                        }

                        try {
                            if (driver == null) {
                                // Stub NOOP Execution Mode (No browser requested)
                                if ("Goto".equalsIgnoreCase(step.actionName)) {
                                    i = handleGoto(step, i, gotoCounts);
                                } else {
                                    step.result_status = 1;
                                }
                            } else {
                                // Real Selenium Execution Mode
                                if ("Navigate".equalsIgnoreCase(step.actionName)) {
                                    driver.navigate().to(step.data);
                                    driver.manage().window().maximize();
                                    step.result_status = 1;
                                } else if ("Click".equalsIgnoreCase(step.actionName)) {
                                    By locator = getLocator(step.locatorName, step.objectDetail, step.data);
                                    driver.findElement(locator).click();
                                    step.result_status = 1;
                                } else if ("Set".equalsIgnoreCase(step.actionName)) {
                                    By locator = getLocator(step.locatorName, step.objectDetail, step.data);
                                    WebElement el = driver.findElement(locator);
                                    el.click();
                                    el.clear();
                                    el.sendKeys(resolveKeyPlaceholders(step.data));
                                    step.result_status = 1;
                                } else if ("SendKeys".equalsIgnoreCase(step.actionName)) {
                                    By locator = getLocator(step.locatorName, step.objectDetail, step.data);
                                    WebElement el = driver.findElement(locator);
                                    el.sendKeys(resolveKeyPlaceholders(step.data));
                                    step.result_status = 1;
                                } else if ("Wait".equalsIgnoreCase(step.actionName)) {
                                    long value = Long.parseLong(step.data);
                                    long sleepMs = (value > 999) ? value : (value * 1000);
                                    Thread.sleep(sleepMs);
                                    step.result_status = 1;
                                } else if ("WaitUntill".equalsIgnoreCase(step.actionName)) {
                                    By locator = getLocator(step.locatorName, step.objectDetail, step.data);
                                    new WebDriverWait(driver, Duration.ofSeconds(60))
                                            .until(ExpectedConditions.visibilityOfElementLocated(locator));
                                    step.result_status = 1;
                                } else if ("WaitUntillWithtimer".equalsIgnoreCase(step.actionName)) {
                                    By locator = getLocator(step.locatorName, step.objectDetail, step.data);
                                    new WebDriverWait(driver, Duration.ofSeconds(300))
                                            .until(ExpectedConditions.visibilityOfElementLocated(locator));
                                    step.result_status = 1;
                                } else if ("WaitUntilElementIsClickable".equalsIgnoreCase(step.actionName)) {
                                    By locator = getLocator(step.locatorName, step.objectDetail, step.data);
                                    new WebDriverWait(driver, Duration.ofSeconds(30))
                                            .until(ExpectedConditions.elementToBeClickable(locator));
                                    step.result_status = 1;
                                } else if ("AssertEquals".equalsIgnoreCase(step.actionName)) {
                                    By locator = getLocator(step.locatorName, step.objectDetail, step.data);
                                    WebElement element = driver.findElement(locator);
                                    String expected = step.data.trim().toLowerCase();
                                    String actual = element.getText().trim().toLowerCase();
                                    if (expected.equals(actual)) {
                                        step.result_status = 1;
                                    } else {
                                        logger.warn("AssertEquals failed. Expected: '{}', Actual: '{}'", expected, actual);
                                        step.result_status = 0;
                                    }
                                } else if ("AssertContains".equalsIgnoreCase(step.actionName)) {
                                    By locator = getLocator(step.locatorName, step.objectDetail, step.data);
                                    WebElement element = driver.findElement(locator);
                                    String expected = step.data.trim().toLowerCase();
                                    String actual = element.getText().trim().toLowerCase();
                                    if (actual.contains(expected)) {
                                        step.result_status = 1;
                                    } else {
                                        logger.warn("AssertContains failed. Expected: '{}' in Actual: '{}'", expected, actual);
                                        step.result_status = 0;
                                    }
                                } else if ("DoubleClick".equalsIgnoreCase(step.actionName)) {
                                    By locator = getLocator(step.locatorName, step.objectDetail, step.data);
                                    WebElement el = driver.findElement(locator);
                                    new Actions(driver).doubleClick(el).perform();
                                    step.result_status = 1;
                                } else if ("RightClick".equalsIgnoreCase(step.actionName)) {
                                    By locator = getLocator(step.locatorName, step.objectDetail, step.data);
                                    WebElement el = driver.findElement(locator);
                                    new Actions(driver).contextClick(el).perform();
                                    step.result_status = 1;
                                } else if ("SelectDropdown".equalsIgnoreCase(step.actionName)) {
                                    By locator = getLocator(step.locatorName, step.objectDetail, step.data);
                                    WebElement el = driver.findElement(locator);
                                    Select select = new Select(el);
                                    try {
                                        select.selectByVisibleText(step.data);
                                    } catch (Exception ex) {
                                        select.selectByValue(step.data);
                                    }
                                    step.result_status = 1;
                                } else if ("ScrollTo".equalsIgnoreCase(step.actionName)) {
                                    By locator = getLocator(step.locatorName, step.objectDetail, step.data);
                                    WebElement el = driver.findElement(locator);
                                    ((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView(true);", el);
                                    step.result_status = 1;
                                } else if ("SwitchFrame".equalsIgnoreCase(step.actionName)) {
                                    try {
                                        int index = Integer.parseInt(step.data);
                                        driver.switchTo().frame(index);
                                    } catch (NumberFormatException e) {
                                        driver.switchTo().frame(step.data);
                                    }
                                    step.result_status = 1;
                                } else if ("SwitchDefaultContent".equalsIgnoreCase(step.actionName)) {
                                    driver.switchTo().defaultContent();
                                    step.result_status = 1;
                                } else if ("ClickAlert".equalsIgnoreCase(step.actionName)) {
                                    if ("Dismiss".equalsIgnoreCase(step.data)) {
                                        driver.switchTo().alert().dismiss();
                                    } else {
                                        driver.switchTo().alert().accept();
                                    }
                                    step.result_status = 1;
                                } else if ("Refresh".equalsIgnoreCase(step.actionName)) {
                                    driver.navigate().refresh();
                                    step.result_status = 1;
                                } else if ("GoBack".equalsIgnoreCase(step.actionName)) {
                                    driver.navigate().back();
                                    step.result_status = 1;
                                } else if ("UploadFile".equalsIgnoreCase(step.actionName)) {
                                    By locator = getLocator(step.locatorName, step.objectDetail, step.data);
                                    WebElement el = driver.findElement(locator);
                                    el.sendKeys(step.data);
                                    step.result_status = 1;
                                } else if ("SetCheckBoxStatus".equalsIgnoreCase(step.actionName)) {
                                    By locator = getLocator(step.locatorName, step.objectDetail, step.data);
                                    WebElement el = driver.findElement(locator);
                                    boolean shouldBeChecked = "true".equalsIgnoreCase(step.data) || "checked".equalsIgnoreCase(step.data) || "1".equals(step.data);
                                    if (el.isSelected() != shouldBeChecked) {
                                        el.click();
                                    }
                                    step.result_status = 1;
                                } else if ("Goto".equalsIgnoreCase(step.actionName)) {
                                    i = handleGoto(step, i, gotoCounts);
                                } else {
                                    logger.warn("Unknown action '{}'. Running as stub.", step.actionName);
                                    step.result_status = 1;
                                }

                                if (step.result_status == 1 && "After".equalsIgnoreCase(step.screenShot)) {
                                    captureScreenshot(driver, step);
                                }
                            }
                        } catch (Exception e) {
                            logger.error("Step execution failed: {} ({})", step.step_result_id, step.actionName, e);
                            step.result_status = 0;
                            step.errorLog = e.getMessage();

                            if (driver != null) {
                                try {
                                    captureScreenshot(driver, step);
                                } catch (Exception se) {
                                    logger.error("Failed to capture error screenshot", se);
                                }
                            }
                        }

                        executedSteps++;

                        if (stepCallback != null) {
                            final TestStep completedStep = step;
                            stepCallback.accept(completedStep);
                        }

                        if (step.result_status == 0) {
                            iterationFailed = true;
                            overallSuccess = false;
                        }
                    }

                    iteration.executed_status = 1;
                    iteration.result_status = iterationFailed ? 0 : 1;
                }
            }
        } finally {
            if (driver != null) {
                try {
                    driver.quit();
                    logger.info("WebDriver session closed successfully.");
                } catch (Exception e) {
                    logger.error("Error closing WebDriver session", e);
                }
            }
        }

        result.result_status = overallSuccess ? 1 : 0;
        logger.info("Execution finished. Overall status: {}", result.result_status);

        return request;
    }

    /**
     * Polls the given host:port up to timeoutMs milliseconds, returning true as
     * soon as a TCP connection can be established (driver is ready), or false
     * on timeout.
     */
    private boolean waitForDriverPort(String host, int port, long timeoutMs) {
        long deadline = System.currentTimeMillis() + timeoutMs;
        while (System.currentTimeMillis() < deadline) {
            try (Socket socket = new Socket(host, port)) {
                logger.info("Driver port {} is ready.", port);
                return true;
            } catch (Exception e) {
                try {
                    Thread.sleep(300);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                }
            }
        }
        return false;
    }

    private String getAbortReason(int executedSteps, long executionStart) {
        if (executedSteps >= maxSteps) {
            return "Execution aborted: max steps exceeded (" + maxSteps + ")";
        }
        if (System.currentTimeMillis() - executionStart >= maxExecutionMs) {
            return "Execution aborted: max execution time exceeded (" + maxExecutionMs + " ms)";
        }
        return null;
    }

    private int handleGoto(TestStep step, int currentIndex, Map<String, Integer> gotoCounts) {
        try {
            int targetStepNum = Integer.parseInt(step.data);
            int targetIndex = targetStepNum - 1;

            int currentCount = gotoCounts.getOrDefault(step.step_result_id, 0);

            if (currentCount < 10 && targetIndex >= 0 && targetIndex < currentIndex) {
                gotoCounts.put(step.step_result_id, currentCount + 1);
                logger.info("Goto triggered: jumping back to step {} (Loop count: {}/10)", targetStepNum, currentCount + 1);
                step.result_status = 1;
                return targetIndex - 1; // subtract 1 since loop adds 1
            } else {
                logger.info("Goto limit (10) reached or invalid target index. Proceeding forward.");
                step.result_status = 1;
            }
        } catch (NumberFormatException e) {
            logger.error("Failed to parse Goto target step: {}", step.data);
            step.result_status = 0;
        }
        return currentIndex;
    }

    private By getLocator(String locatorName, String objectDetail, String data) {
        String type = "";
        String value = "";

        if (objectDetail != null && !objectDetail.trim().isEmpty()) {
            type = (locatorName != null) ? locatorName.trim() : "";
            value = objectDetail.trim();
        } else if (locatorName != null && !locatorName.trim().isEmpty()) {
            String ln = locatorName.trim();
            if (ln.contains("=")) {
                int idx = ln.indexOf("=");
                type = ln.substring(0, idx).trim();
                value = ln.substring(idx + 1).trim();
            } else {
                value = ln;
                // Auto-detect type
                if (value.startsWith("//") || value.startsWith("(") || value.toLowerCase().startsWith("xpath=")) {
                    type = "xpath";
                } else if (value.contains("[") || value.contains("]") || value.contains(".") || value.contains("#") || value.contains(">")) {
                    type = "css";
                } else {
                    type = "id";
                }
            }
        } else {
            return By.cssSelector(data);
        }

        if ("data-qa-id".equalsIgnoreCase(type)) {
            return By.xpath("//*[@data-qa-id='" + value + "']");
        }

        switch (type.toLowerCase()) {
            case "id":
                return By.id(value);
            case "name":
                return By.name(value);
            case "class":
            case "classname":
                return By.className(value);
            case "css":
            case "cssselector":
                return By.cssSelector(value);
            case "linktext":
                return By.linkText(value);
            case "xpath":
                return By.xpath(value);
            default:
                if (value.startsWith("//") || value.startsWith("(")) {
                    return By.xpath(value);
                }
                return By.cssSelector(value);
        }
    }

    private void captureScreenshot(WebDriver driver, TestStep step) {
        try {
            File screenshotDir = new File("screenshots");
            if (!screenshotDir.exists()) {
                screenshotDir.mkdirs();
            }
            File srcFile = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
            File destFile = new File(screenshotDir, "screenshot_" + step.step_result_id + "_" + System.currentTimeMillis() + ".png");
            Files.copy(srcFile.toPath(), destFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
            step.screenshot_path = destFile.getAbsolutePath();
            logger.info("Screenshot saved to: {}", step.screenshot_path);
        } catch (Exception e) {
            logger.error("Failed to capture screenshot", e);
        }
    }

    private String resolveVariables(String input, Map<String, String> variables) {
        if (input == null) {
            return null;
        }
        if (variables == null || variables.isEmpty()) {
            return input;
        }
        String resolved = input;
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            String placeholder = "{{" + entry.getKey() + "}}";
            if (resolved.contains(placeholder)) {
                String val = entry.getValue() != null ? entry.getValue() : "";
                resolved = resolved.replace(placeholder, val);
            }
        }
        return resolved;
    }

    private String resolveKeyPlaceholders(String input) {
        if (input == null) {
            return null;
        }
        String result = input;
        result = result.replace("[ENTER]", org.openqa.selenium.Keys.ENTER.toString());
        result = result.replace("[RETURN]", org.openqa.selenium.Keys.RETURN.toString());
        result = result.replace("[TAB]", org.openqa.selenium.Keys.TAB.toString());
        result = result.replace("[ESCAPE]", org.openqa.selenium.Keys.ESCAPE.toString());
        result = result.replace("[BACKSPACE]", org.openqa.selenium.Keys.BACK_SPACE.toString());
        result = result.replace("[DOWN]", org.openqa.selenium.Keys.ARROW_DOWN.toString());
        result = result.replace("[UP]", org.openqa.selenium.Keys.ARROW_UP.toString());
        result = result.replace("[LEFT]", org.openqa.selenium.Keys.ARROW_LEFT.toString());
        result = result.replace("[RIGHT]", org.openqa.selenium.Keys.ARROW_RIGHT.toString());
        return result;
    }
}
