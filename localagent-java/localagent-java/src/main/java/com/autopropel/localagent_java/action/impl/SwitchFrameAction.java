package com.autopropel.localagent_java.action.impl;

import com.autopropel.localagent_java.service.ExecutionService;
import org.openqa.selenium.WebDriver;
import com.autopropel.localagent_java.dto.TestStep;
import com.autopropel.localagent_java.service.ExecutionService;
import com.autopropel.localagent_java.action.ActionHandler;

public class SwitchFrameAction implements ActionHandler {
    @Override
    public void execute(WebDriver driver, TestStep step, ExecutionService context) throws Exception {
        try {
            int index = Integer.parseInt(step.data);
            driver.switchTo().frame(index);
        } catch (NumberFormatException e) {
            driver.switchTo().frame(step.data);
        }
        step.result_status = 1;
    }
}
