package com.autopropel.localagent_java.action.impl;

import org.openqa.selenium.WebDriver;
import com.autopropel.localagent_java.dto.TestStep;
import com.autopropel.localagent_java.service.ExecutionService;
import com.autopropel.localagent_java.action.ActionHandler;

public class WaitForTitleAction implements ActionHandler {
    @Override
    public void execute(WebDriver driver, TestStep step, ExecutionService context) throws Exception {
        new org.openqa.selenium.support.ui.WebDriverWait(driver, java.time.Duration.ofSeconds(30)).until(org.openqa.selenium.support.ui.ExpectedConditions.titleContains(step.data));
        step.result_status = 1;
    }
}
