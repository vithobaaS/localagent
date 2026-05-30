package com.autopropel.localagent_java.action.impl;

import org.openqa.selenium.WebDriver;
import com.autopropel.localagent_java.dto.TestStep;
import com.autopropel.localagent_java.service.ExecutionService;
import com.autopropel.localagent_java.action.ActionHandler;

public class SelectByIndexAction implements ActionHandler {
    @Override
    public void execute(WebDriver driver, TestStep step, ExecutionService context) throws Exception {
        org.openqa.selenium.By locator = context.getLocator(step.locatorName, step.objectDetail, "");
        new org.openqa.selenium.support.ui.Select(driver.findElement(locator)).selectByIndex(Integer.parseInt(step.data.trim()));
        step.result_status = 1;
    }
}
