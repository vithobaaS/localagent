package com.autopropel.localagent_java.action.impl;

import org.openqa.selenium.WebDriver;
import com.autopropel.localagent_java.dto.TestStep;
import com.autopropel.localagent_java.service.ExecutionService;
import com.autopropel.localagent_java.action.ActionHandler;

public class AssertNotVisibleAction implements ActionHandler {
    @Override
    public void execute(WebDriver driver, TestStep step, ExecutionService context) throws Exception {
        org.openqa.selenium.By locator = context.getLocator(step.locatorName, step.objectDetail, step.data);
        try { if(driver.findElement(locator).isDisplayed()) { step.result_status = 0; throw new Exception("Element is visible"); } } catch (org.openqa.selenium.NoSuchElementException e) { step.result_status = 1; }
        step.result_status = 1;
    }
}
