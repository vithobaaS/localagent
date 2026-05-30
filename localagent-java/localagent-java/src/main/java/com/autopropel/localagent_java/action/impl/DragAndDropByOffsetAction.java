package com.autopropel.localagent_java.action.impl;

import com.autopropel.localagent_java.service.ExecutionService;
import org.openqa.selenium.WebDriver;
import com.autopropel.localagent_java.dto.TestStep;
import com.autopropel.localagent_java.service.ExecutionService;
import com.autopropel.localagent_java.action.ActionHandler;

public class DragAndDropByOffsetAction implements ActionHandler {
    @Override
    public void execute(WebDriver driver, TestStep step, ExecutionService context) throws Exception {
        org.openqa.selenium.By locator = context.getLocator(step.locatorName, step.objectDetail, step.data);
        org.openqa.selenium.WebElement el = driver.findElement(locator);
        String[] offsets = step.data.split(",");
        int xOffset = Integer.parseInt(offsets[0].trim());
        int yOffset = Integer.parseInt(offsets[1].trim());
        new org.openqa.selenium.interactions.Actions(driver).dragAndDropBy(el, xOffset, yOffset).perform();
        step.result_status = 1;
    }
}
