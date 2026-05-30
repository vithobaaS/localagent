package com.autopropel.localagent_java.action;

import com.autopropel.localagent_java.service.ExecutionService;
import org.openqa.selenium.WebDriver;
import com.autopropel.localagent_java.dto.TestStep;
import com.autopropel.localagent_java.service.ExecutionService;

public interface ActionHandler {
    void execute(WebDriver driver, TestStep step, ExecutionService context) throws Exception;
}
