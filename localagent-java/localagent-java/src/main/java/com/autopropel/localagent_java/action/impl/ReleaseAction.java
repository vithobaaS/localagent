package com.autopropel.localagent_java.action.impl;

import com.autopropel.localagent_java.service.ExecutionService;
import org.openqa.selenium.WebDriver;
import com.autopropel.localagent_java.dto.TestStep;
import com.autopropel.localagent_java.service.ExecutionService;
import com.autopropel.localagent_java.action.ActionHandler;

public class ReleaseAction implements ActionHandler {
    @Override
    public void execute(WebDriver driver, TestStep step, ExecutionService context) throws Exception {
        new org.openqa.selenium.interactions.Actions(driver).release().perform();
        step.result_status = 1;
    }
}
