package com.autopropel.localagent_java.action.impl;

import org.openqa.selenium.WebDriver;
import com.autopropel.localagent_java.dto.TestStep;
import com.autopropel.localagent_java.service.ExecutionService;
import com.autopropel.localagent_java.action.ActionHandler;

public class AcceptCookiesAction implements ActionHandler {
    @Override
    public void execute(WebDriver driver, TestStep step, ExecutionService context) throws Exception {
        String[] xpaths = {"//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'accept')]", "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'agree')]", "//button[contains(@id, 'accept')]", "//button[contains(@class, 'accept')]", "//*[@id='onetrust-accept-btn-handler']"};
        for(String xp : xpaths) {
            try {
                org.openqa.selenium.WebElement btn = driver.findElement(org.openqa.selenium.By.xpath(xp));
                if (btn.isDisplayed()) { btn.click(); break; }
            } catch(Exception ignored) {}
        }
        step.result_status = 1;
    }
}
