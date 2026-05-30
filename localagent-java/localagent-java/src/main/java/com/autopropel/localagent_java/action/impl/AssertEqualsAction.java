package com.autopropel.localagent_java.action.impl;

import com.autopropel.localagent_java.service.ExecutionService;
import org.openqa.selenium.WebDriver;
import com.autopropel.localagent_java.dto.TestStep;
import com.autopropel.localagent_java.service.ExecutionService;
import com.autopropel.localagent_java.action.ActionHandler;

public class AssertEqualsAction implements ActionHandler {
    @Override
    public void execute(WebDriver driver, TestStep step, ExecutionService context) throws Exception {
        org.openqa.selenium.By locator = context.getLocator(step.locatorName, step.objectDetail, step.data);
        org.openqa.selenium.WebElement element = driver.findElement(locator);
        String expected = step.data.trim().toLowerCase();
        String actual = element.getText().trim().toLowerCase();
        if (expected.equals(actual)) {
            step.result_status = 1;
        } else {
            step.result_status = 0;
            throw new Exception("AssertEquals failed. Expected: " + expected + ", Actual: " + actual);
        }
    }
}
