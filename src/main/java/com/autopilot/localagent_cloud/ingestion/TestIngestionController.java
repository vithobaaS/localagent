package com.autopilot.localagent_cloud.ingestion;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Test Data Ingestion Layer
 * Handles incoming webhooks and test scripts from CI/CD systems.
 */
@RestController
@RequestMapping("/api/ingestion")
public class TestIngestionController {

    @PostMapping("/webhook")
    public ResponseEntity<String> receiveWebhook(@RequestBody String payload) {
        // TODO: Parse webhook payload from GitHub/Jenkins and enqueue for execution
        return ResponseEntity.ok("Webhook received and queued for processing");
    }
}
