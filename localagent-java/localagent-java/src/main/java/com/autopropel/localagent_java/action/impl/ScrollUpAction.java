package com.autopropel.localagent_java.action.impl;

import com.autopropel.localagent_java.service.ExecutionService;
import org.openqa.selenium.WebDriver;
import com.autopropel.localagent_java.dto.TestStep;
import com.autopropel.localagent_java.service.ExecutionService;
import com.autopropel.localagent_java.action.ActionHandler;

public class ScrollUpAction implements ActionHandler {
    @Override
    public void execute(WebDriver driver, TestStep step, ExecutionService context) throws Exception {
        int pixels = Integer.parseInt(step.data.trim());
        ((org.openqa.selenium.JavascriptExecutor) driver).executeScript("window.scrollBy(0, -" + pixels + ")");
        step.result_status = 1;
    }
}
