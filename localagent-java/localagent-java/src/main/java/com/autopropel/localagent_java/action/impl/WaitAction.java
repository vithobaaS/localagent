package com.autopropel.localagent_java.action.impl;

import com.autopropel.localagent_java.service.ExecutionService;
import org.openqa.selenium.WebDriver;
import com.autopropel.localagent_java.dto.TestStep;
import com.autopropel.localagent_java.service.ExecutionService;
import com.autopropel.localagent_java.action.ActionHandler;

public class WaitAction implements ActionHandler {
    @Override
    public void execute(WebDriver driver, TestStep step, ExecutionService context) throws Exception {
        long value = Long.parseLong(step.data);
        long sleepMs = (value > 999) ? value : (value * 1000);
        Thread.sleep(sleepMs);
        step.result_status = 1;
    }
}
