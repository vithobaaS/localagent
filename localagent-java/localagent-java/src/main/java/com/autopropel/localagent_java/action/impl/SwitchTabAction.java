package com.autopropel.localagent_java.action.impl;

import org.openqa.selenium.WebDriver;
import com.autopropel.localagent_java.dto.TestStep;
import com.autopropel.localagent_java.service.ExecutionService;
import com.autopropel.localagent_java.action.ActionHandler;

public class SwitchTabAction implements ActionHandler {
    @Override
    public void execute(WebDriver driver, TestStep step, ExecutionService context) throws Exception {
        int index = Integer.parseInt(step.data);
        java.util.ArrayList<String> tabs = new java.util.ArrayList<>(driver.getWindowHandles());
        driver.switchTo().window(tabs.get(index));
        step.result_status = 1;
    }
}
