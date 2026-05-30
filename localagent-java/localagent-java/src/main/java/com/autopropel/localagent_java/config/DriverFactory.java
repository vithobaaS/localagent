package com.autopropel.localagent_java.config;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.firefox.FirefoxOptions;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.firefox.FirefoxDriver;

public class DriverFactory {

    public static WebDriver createDriver(Integer browserTypeId) {
        return createDriver(browserTypeId, true);
    }

    public static WebDriver createDriver(Integer browserTypeId, boolean headless) {
        if (browserTypeId == 1) { // Chrome
            ChromeOptions options = new ChromeOptions();
            options.addArguments("--remote-allow-origins=*");
            if (headless) {
                options.addArguments("--headless=new"); // Headless mode for background execution
            }
            try {
                return new ChromeDriver(options);
            } catch (Exception e) {
                throw new RuntimeException("Failed to launch Chrome driver via Selenium Manager", e);
            }
        } else if (browserTypeId == 2) { // Firefox
            FirefoxOptions options = new FirefoxOptions();
            if (headless) {
                options.addArguments("-headless");
            }
            try {
                return new FirefoxDriver(options);
            } catch (Exception e) {
                throw new RuntimeException("Failed to launch Firefox driver via Selenium Manager", e);
            }
        } else if (browserTypeId == 3) { // Safari (macOS only)
            try {
                // Return native SafariDriver
                return new org.openqa.selenium.safari.SafariDriver();
            } catch (Exception e) {
                throw new RuntimeException("Failed to launch native Safari driver", e);
            }
        } else {
            throw new IllegalArgumentException("Unsupported browserTypeId: " + browserTypeId);
        }
    }
}
