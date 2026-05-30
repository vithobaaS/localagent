package com.autopropel.localagent_java.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.net.ServerSocket;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

import jakarta.annotation.PreDestroy;

@Service
public class DriverService {

    private static final Logger logger = LoggerFactory.getLogger(DriverService.class);

    @Value("${localagent.driver-path}")
    private String driverPath;

    public String getDriverPath() {
        return this.driverPath;
    }

    private final List<Process> spawnedProcesses = new ArrayList<>();

    /**
     * Checks if a local port is already in use (i.e. occupied by a running driver).
     * Returns true if occupied, false if free.
     */
    public boolean isPortInUse(int port) {
        try (ServerSocket ignored = new ServerSocket(port)) {
            // If ServerSocket successfully opens, the port was free!
            return false;
        } catch (IOException e) {
            // Port is occupied
            return true;
        }
    }

    /**
     * Checks if the driver binary exists in configured or fallback relative paths.
     */
    public boolean isDriverBinaryPresent(int browserTypeId) {
        String os = System.getProperty("os.name").toLowerCase();
        boolean isWindows = os.contains("win");

        if (browserTypeId == 3) {
            return os.contains("mac"); // Safari is native to macOS
        }

        String driverSubPath;
        if (browserTypeId == 1) { // Chrome
            driverSubPath = isWindows ? "chrome/chromedriver.exe" : "chrome/chromedriver";
        } else if (browserTypeId == 2) { // Firefox
            driverSubPath = isWindows ? "firefox_20/geckodriver.exe" : "firefox_20/geckodriver";
        } else {
            return false;
        }

        // 1. Try configured path
        if (driverPath != null && !driverPath.trim().isEmpty()) {
            File file = Paths.get(driverPath, driverSubPath).toFile();
            if (file.exists()) return true;
        }

        // 2. Fallback relative paths
        File fallback1 = Paths.get(".", "localagent", "DriverFiles", driverSubPath).toFile();
        if (fallback1.exists()) return true;

        if (browserTypeId == 1 && !isWindows) {
            File fallback2 = Paths.get(".", "localagent", "Linuxdrivers", "chromedriver").toFile();
            if (fallback2.exists()) return true;
        }

        // 3. Fallback parent paths (if running inside nested localagent-java folder)
        File parentFallback1 = Paths.get("..", "..", "localagent", "DriverFiles", driverSubPath).toFile();
        if (parentFallback1.exists()) return true;

        if (browserTypeId == 1 && !isWindows) {
            File parentFallback2 = Paths.get("..", "..", "localagent", "Linuxdrivers", "chromedriver").toFile();
            if (parentFallback2.exists()) return true;
        }

        return false;
    }

    /**
     * Spawns the driver binary in the background if it's not already running.
     */
    public boolean startDriver(Integer browserTypeId) {
        String os = System.getProperty("os.name").toLowerCase();
        boolean isWindows = os.contains("win");

        if (browserTypeId == 3) { // Safari (macOS only)
            if (!os.contains("mac")) {
                logger.error("Safari execution is only supported on macOS!");
                return false;
            }
            logger.info("Safari driver is handled natively by macOS safaridriver. No background process to start.");
            return true;
        }

        // Map browserTypeId to Port and Executable Path
        int port;
        String driverSubPath;

        if (browserTypeId == 1) { // Chrome
            port = 6001;
            driverSubPath = isWindows ? "chrome/chromedriver.exe" : "chrome/chromedriver";
        } else if (browserTypeId == 2) { // Firefox
            port = 6000;
            driverSubPath = isWindows ? "firefox_20/geckodriver.exe" : "firefox_20/geckodriver";
        } else {
            logger.warn("Unsupported browserTypeId: {}. Skipping driver launch.", browserTypeId);
            return false;
        }

        // Check if the driver is already listening on the designated port
        if (isPortInUse(port)) {
            logger.info("Driver is already running on port {}.", port);
            return true; 
        }

        // Resolve absolute executable path with fallback checking
        File driverFile = null;
        if (driverPath != null && !driverPath.trim().isEmpty()) {
            driverFile = Paths.get(driverPath, driverSubPath).toFile();
        }

        if (driverFile == null || !driverFile.exists()) {
            logger.warn("Configured driver path not found. Checking fallbacks...");
            
            File fallback1 = Paths.get(".", "localagent", "DriverFiles", driverSubPath).toFile();
            File fallback2 = (browserTypeId == 1 && !isWindows) ? Paths.get(".", "localagent", "Linuxdrivers", "chromedriver").toFile() : null;

            if (fallback1.exists()) {
                driverFile = fallback1;
            } else if (fallback2 != null && fallback2.exists()) {
                driverFile = fallback2;
            } else {
                File parentFallback1 = Paths.get("..", "..", "localagent", "DriverFiles", driverSubPath).toFile();
                File parentFallback2 = (browserTypeId == 1 && !isWindows) ? Paths.get("..", "..", "localagent", "Linuxdrivers", "chromedriver").toFile() : null;

                if (parentFallback1.exists()) {
                    driverFile = parentFallback1;
                } else if (parentFallback2 != null && parentFallback2.exists()) {
                    driverFile = parentFallback2;
                }
            }
        }

        if (driverFile == null || !driverFile.exists()) {
            logger.error("Driver binary not found at configured path or fallback relative paths for browserTypeId: {}", browserTypeId);
            return false;
        }

        // On macOS/Linux, make sure the binary is executable
        if (!isWindows) {
            try {
                if (!driverFile.canExecute()) {
                    logger.info("Setting executable permission for driver binary: {}", driverFile.getAbsolutePath());
                    boolean success = driverFile.setExecutable(true);
                    if (!success) {
                        logger.warn("Failed to set executable permission via setExecutable(true) on driver: {}", driverFile.getAbsolutePath());
                        new ProcessBuilder("chmod", "+x", driverFile.getAbsolutePath()).start().waitFor();
                    }
                }
            } catch (Exception e) {
                logger.error("Failed to verify/set execution permissions for {}", driverFile.getAbsolutePath(), e);
            }
        }

        logger.info("Starting driver on port {} using binary: {}", port, driverFile.getAbsolutePath());

        try {
            // Build the command: e.g., chromedriver.exe --port=6001
            List<String> command = new ArrayList<>();
            command.add(driverFile.getAbsolutePath());
            command.add("--port=" + port);

            ProcessBuilder pb = new ProcessBuilder(command);
            
            // Redirect output to discard to avoid Access Denied in Program Files
            pb.redirectOutput(ProcessBuilder.Redirect.DISCARD);
            pb.redirectError(ProcessBuilder.Redirect.DISCARD);
            
            // Start the background process
            Process process = pb.start();
            synchronized (spawnedProcesses) {
                spawnedProcesses.add(process);
            }
            
            logger.info("Background driver process spawned successfully.");
            return true;
        } catch (IOException e) {
            logger.error("Failed to launch background driver process", e);
            return false;
        }
    }

    @PreDestroy
    public void cleanup() {
        logger.info("Cleaning up background driver processes...");
        synchronized (spawnedProcesses) {
            for (Process process : spawnedProcesses) {
                if (process.isAlive()) {
                    process.destroy();
                    try {
                        process.waitFor(5, java.util.concurrent.TimeUnit.SECONDS);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                    if (process.isAlive()) {
                        process.destroyForcibly();
                    }
                }
            }
            spawnedProcesses.clear();
        }
    }
}
