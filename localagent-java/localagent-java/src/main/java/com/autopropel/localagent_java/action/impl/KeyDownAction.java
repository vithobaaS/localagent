package com.autopropel.localagent_java.action.impl;

import org.openqa.selenium.WebDriver;
import com.autopropel.localagent_java.dto.TestStep;
import com.autopropel.localagent_java.service.ExecutionService;
import com.autopropel.localagent_java.action.ActionHandler;

public class KeyDownAction implements ActionHandler {
    @Override
    public void execute(WebDriver driver, TestStep step, ExecutionService context) throws Exception {
        new org.openqa.selenium.interactions.Actions(driver).keyDown(org.openqa.selenium.Keys.valueOf(step.data.toUpperCase())).perform();
        step.result_status = 1;
    }
}
