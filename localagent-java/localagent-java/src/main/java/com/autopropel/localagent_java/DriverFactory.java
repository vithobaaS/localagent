package com.autopropel.localagent_java;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.firefox.FirefoxOptions;
import org.openqa.selenium.remote.RemoteWebDriver;
import java.net.URL;

public class DriverFactory {

    public static WebDriver createDriver(Integer browserTypeId) {
        return createDriver(browserTypeId, true);
    }

    public static WebDriver createDriver(Integer browserTypeId, boolean headless) {
        String urlStr;
        if (browserTypeId == 1) { // Chrome
            urlStr = "http://localhost:6001";
            ChromeOptions options = new ChromeOptions();
            options.addArguments("--remote-allow-origins=*");
            if (headless) {
                options.addArguments("--headless=new"); // Headless mode for background execution
            }
            try {
                return new RemoteWebDriver(new URL(urlStr), options);
            } catch (Exception e) {
                throw new RuntimeException("Failed to connect to Chrome driver on " + urlStr, e);
            }
        } else if (browserTypeId == 2) { // Firefox
            urlStr = "http://localhost:6000";
            FirefoxOptions options = new FirefoxOptions();
            if (headless) {
                options.addArguments("-headless");
            }
            try {
                return new RemoteWebDriver(new URL(urlStr), options);
            } catch (Exception e) {
                throw new RuntimeException("Failed to connect to Firefox driver on " + urlStr, e);
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
