package com.autopilot.localagent_cloud.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/screenshots")
public class ScreenshotController {

    private static final Logger logger = LoggerFactory.getLogger(ScreenshotController.class);
    private static final Path SCREENSHOTS_DIR = Paths.get("data/screenshots").toAbsolutePath().normalize();

    private Long orgId(HttpServletRequest req) {
        Object o = req.getAttribute("orgId");
        return o != null ? ((Number) o).longValue() : null;
    }

    @GetMapping("/{fileName:.+}")
    public ResponseEntity<Resource> getScreenshotFile(
            @PathVariable("fileName") String fileName,
            HttpServletRequest req) {

        // Security: require authenticated user
        if (orgId(req) == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            // Security: prevent path traversal by resolving inside the base dir and verifying it stays within
            Path resolvedPath = SCREENSHOTS_DIR.resolve(fileName).normalize();
            if (!resolvedPath.startsWith(SCREENSHOTS_DIR)) {
                logger.warn("Path traversal attempt blocked: {}", fileName);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            File file = resolvedPath.toFile();
            if (!file.exists() || !file.isFile()) {
                return ResponseEntity.notFound().build();
            }

            Resource resource = new UrlResource(file.toURI());
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.getName() + "\"")
                    .contentType(MediaType.IMAGE_PNG)
                    .body(resource);
        } catch (MalformedURLException e) {
            logger.error("Failed to serve screenshot file: {}", fileName, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
