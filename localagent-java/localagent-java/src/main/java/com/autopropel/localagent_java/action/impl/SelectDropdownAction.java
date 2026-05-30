package com.autopropel.localagent_java.action.impl;

import com.autopropel.localagent_java.service.ExecutionService;
import org.openqa.selenium.WebDriver;
import com.autopropel.localagent_java.dto.TestStep;
import com.autopropel.localagent_java.service.ExecutionService;
import com.autopropel.localagent_java.action.ActionHandler;

public class SelectDropdownAction implements ActionHandler {
    @Override
    public void execute(WebDriver driver, TestStep step, ExecutionService context) throws Exception {
        org.openqa.selenium.By locator = context.getLocator(step.locatorName, step.objectDetail, step.data);
        org.openqa.selenium.WebElement el = driver.findElement(locator);
        org.openqa.selenium.support.ui.Select select = new org.openqa.selenium.support.ui.Select(el);
        try {
            select.selectByVisibleText(step.data);
        } catch (Exception ex) {
            select.selectByValue(step.data);
        }
        step.result_status = 1;
    }
}
