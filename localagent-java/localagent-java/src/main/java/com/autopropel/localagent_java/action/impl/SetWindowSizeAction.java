package com.autopropel.localagent_java.action.impl;

import org.openqa.selenium.WebDriver;
import com.autopropel.localagent_java.dto.TestStep;
import com.autopropel.localagent_java.service.ExecutionService;
import com.autopropel.localagent_java.action.ActionHandler;

public class SetWindowSizeAction implements ActionHandler {
    @Override
    public void execute(WebDriver driver, TestStep step, ExecutionService context) throws Exception {
        String[] dims = step.data.split(",");
        driver.manage().window().setSize(new org.openqa.selenium.Dimension(Integer.parseInt(dims[0].trim()), Integer.parseInt(dims[1].trim())));
        step.result_status = 1;
    }
}
