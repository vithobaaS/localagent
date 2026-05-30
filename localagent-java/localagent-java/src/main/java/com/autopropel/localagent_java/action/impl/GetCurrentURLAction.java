package com.autopropel.localagent_java.action.impl;

import org.openqa.selenium.WebDriver;
import com.autopropel.localagent_java.dto.TestStep;
import com.autopropel.localagent_java.service.ExecutionService;
import com.autopropel.localagent_java.action.ActionHandler;

public class GetCurrentURLAction implements ActionHandler {
    @Override
    public void execute(WebDriver driver, TestStep step, ExecutionService context) throws Exception {
        step.errorLog = "Extracted: " + driver.getCurrentUrl();
        step.result_status = 1;
    }
}
