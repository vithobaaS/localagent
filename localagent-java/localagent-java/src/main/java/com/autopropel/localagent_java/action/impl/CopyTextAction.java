package com.autopropel.localagent_java.action.impl;

import org.openqa.selenium.WebDriver;
import com.autopropel.localagent_java.dto.TestStep;
import com.autopropel.localagent_java.service.ExecutionService;
import com.autopropel.localagent_java.action.ActionHandler;

public class CopyTextAction implements ActionHandler {
    @Override
    public void execute(WebDriver driver, TestStep step, ExecutionService context) throws Exception {
        org.openqa.selenium.By locator = context.getLocator(step.locatorName, step.objectDetail, "");
        driver.findElement(locator).sendKeys(org.openqa.selenium.Keys.chord(org.openqa.selenium.Keys.CONTROL, "c"));
        step.result_status = 1;
    }
}
