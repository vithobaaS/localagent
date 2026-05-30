package com.autopropel.localagent_java.action.impl;

import com.autopropel.localagent_java.service.ExecutionService;
import org.openqa.selenium.WebDriver;
import com.autopropel.localagent_java.dto.TestStep;
import com.autopropel.localagent_java.service.ExecutionService;
import com.autopropel.localagent_java.action.ActionHandler;

public class DragAndDropAction implements ActionHandler {
    @Override
    public void execute(WebDriver driver, TestStep step, ExecutionService context) throws Exception {
        org.openqa.selenium.By sourceLocator = context.getLocator(step.locatorName, step.objectDetail, "");
        org.openqa.selenium.WebElement source = driver.findElement(sourceLocator);
        org.openqa.selenium.By targetLocator = context.getLocator(null, null, step.data);
        org.openqa.selenium.WebElement target = driver.findElement(targetLocator);
        new org.openqa.selenium.interactions.Actions(driver).dragAndDrop(source, target).perform();
        step.result_status = 1;
    }
}
