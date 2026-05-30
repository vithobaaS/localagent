package com.autopropel.localagent_java.action.impl;

import org.openqa.selenium.WebDriver;
import com.autopropel.localagent_java.dto.TestStep;
import com.autopropel.localagent_java.service.ExecutionService;
import com.autopropel.localagent_java.action.ActionHandler;

public class AssertAttributeValueAction implements ActionHandler {
    @Override
    public void execute(WebDriver driver, TestStep step, ExecutionService context) throws Exception {
        org.openqa.selenium.By locator = context.getLocator(step.locatorName, step.objectDetail, "");
        String[] parts = step.data.split(",");
        String attr = driver.findElement(locator).getAttribute(parts[0].trim());
        if(!parts[1].trim().equals(attr)) { step.result_status = 0; throw new Exception("Attribute mismatch: " + attr); }
        step.result_status = 1;
    }
}
