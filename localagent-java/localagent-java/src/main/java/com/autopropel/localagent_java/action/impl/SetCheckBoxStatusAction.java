package com.autopropel.localagent_java.action.impl;

import com.autopropel.localagent_java.service.ExecutionService;
import org.openqa.selenium.WebDriver;
import com.autopropel.localagent_java.dto.TestStep;
import com.autopropel.localagent_java.service.ExecutionService;
import com.autopropel.localagent_java.action.ActionHandler;

public class SetCheckBoxStatusAction implements ActionHandler {
    @Override
    public void execute(WebDriver driver, TestStep step, ExecutionService context) throws Exception {
        org.openqa.selenium.By locator = context.getLocator(step.locatorName, step.objectDetail, step.data);
        org.openqa.selenium.WebElement el = driver.findElement(locator);
        boolean shouldBeChecked = "true".equalsIgnoreCase(step.data) || "checked".equalsIgnoreCase(step.data) || "1".equals(step.data);
        if (el.isSelected() != shouldBeChecked) {
            el.click();
        }
        step.result_status = 1;
    }
}
