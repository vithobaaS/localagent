package com.autopropel.localagent_java.controller;

import com.autopropel.localagent_java.service.DriverService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.File;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/agent")
public class AgentInfoController {

    private final DriverService driverService;

    public AgentInfoController(DriverService driverService) {
        this.driverService = driverService;
    }

    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getAgentInfo() {
        Map<String, Object> info = new HashMap<>();

        // OS Details
        info.put("osName", System.getProperty("os.name"));
        info.put("osVersion", System.getProperty("os.version"));
        info.put("osArch", System.getProperty("os.arch"));

        // Java Runtime
        info.put("javaVersion", System.getProperty("java.version"));
        info.put("javaVendor", System.getProperty("java.vendor"));

        // Capabilities (checking if driver binaries exist)
        Map<String, Boolean> capabilities = new HashMap<>();
        
        boolean hasChrome = driverService.isDriverBinaryPresent(1);
        boolean hasFirefox = driverService.isDriverBinaryPresent(2);
        boolean hasSafari = driverService.isDriverBinaryPresent(3);

        capabilities.put("supportsChrome", hasChrome);
        capabilities.put("supportsFirefox", hasFirefox);
        capabilities.put("supportsSafari", hasSafari);
        info.put("capabilities", capabilities);

        // System Health / Resource Usage
        MemoryMXBean memoryMXBean = ManagementFactory.getMemoryMXBean();
        Map<String, Object> memory = new HashMap<>();
        memory.put("usedHeapMb", memoryMXBean.getHeapMemoryUsage().getUsed() / (1024 * 1024));
        memory.put("maxHeapMb", memoryMXBean.getHeapMemoryUsage().getMax() / (1024 * 1024));
        info.put("memory", memory);

        info.put("status", "idle");

        return ResponseEntity.ok(info);
    }
}
