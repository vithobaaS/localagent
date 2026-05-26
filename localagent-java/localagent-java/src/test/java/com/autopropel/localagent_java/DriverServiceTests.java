package com.autopropel.localagent_java;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.io.IOException;
import java.net.ServerSocket;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class DriverServiceTests {

    @Autowired
    private DriverService driverService;

    @Test
    public void testIsPortInUse() throws IOException {
        int testPort = 12345;
        
        // Assert port is initially free
        assertFalse(driverService.isPortInUse(testPort), "Port should be free initially");

        // Bind to the port
        try (ServerSocket socket = new ServerSocket(testPort)) {
            // Assert port is now reported in use
            assertTrue(driverService.isPortInUse(testPort), "Port should be in use when bound");
        }

        // Assert port is free again after socket closes
        assertFalse(driverService.isPortInUse(testPort), "Port should be free after releasing");
    }

    @org.junit.jupiter.api.AfterEach
    public void tearDown() {
        driverService.cleanup();
    }

    @Test
    public void testStartChromeDriver() throws InterruptedException {
        // Assert port is free initially
        // If a previously orphaned chromedriver is running, we kill it or check it.
        // We will only run this if it's free, otherwise we skip or let it pass.
        if (!driverService.isPortInUse(6001)) {
            boolean started = driverService.startDriver(1); // 1 = Chrome
            assertTrue(started, "Chrome driver should start successfully");
            
            // Wait for the port to become active (up to 3 seconds) due to process startup latency
            boolean portActive = false;
            for (int i = 0; i < 30; i++) {
                if (driverService.isPortInUse(6001)) {
                    portActive = true;
                    break;
                }
                Thread.sleep(100);
            }
            
            assertTrue(portActive, "Port 6001 should be in use after starting");
        } else {
            System.out.println("ChromeDriver already running on port 6001, skipping launch test.");
        }
    }
}
