package com.autopropel.localagent_java;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.autopropel.localagent_java.dto.RunRequest;

@RestController
public class StatusController {

    // 1. Declare the ExecutionService dependency
    private final ExecutionService executionService;

    // 2. Constructor injection (Spring automatically injects ExecutionService here)
    public StatusController(ExecutionService executionService) {
        this.executionService = executionService;
    }

    @GetMapping("/checkavailstatus")
    public ResponseEntity<Map<String, String>> checkAvailStatus() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "Success");
        response.put("message", "workingfine");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/run")
    public ResponseEntity<?> runJob(@RequestBody RunRequest request) {

        // 1. Basic validation
        if (request == null || request.result == null) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Invalid payload: 'result' object is required.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
        }

        // 2. Validate crucial fields
        if (request.result.environmentId == null || request.result.browserTypeId == null
                || request.result.iterationval == null || request.result.iterationval.isBlank()
                || request.result.testCase == null || request.result.testCase.isEmpty()) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Missing required fields: iterationval and testCase");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
        }

        // 3. Delegate the execution to our ExecutionService
        RunRequest executedResult = executionService.execute(request);

        return ResponseEntity.ok(executedResult);
    }

    @GetMapping("/api/screenshots/{filename}")
    public ResponseEntity<org.springframework.core.io.Resource> getScreenshot(@org.springframework.web.bind.annotation.PathVariable String filename) {
        try {
            java.io.File file = new java.io.File("screenshots", filename);
            if (!file.exists() || !file.isFile()) {
                return ResponseEntity.notFound().build();
            }
            org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(file.toURI());
            return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.IMAGE_PNG)
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
