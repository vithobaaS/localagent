package com.autopilot.localagent_cloud.aiengine;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.autopilot.localagent_cloud.service.ExecutionService;

/**
 * Intelligent Decision Engine Layer
 * Implements rule-based validation and AI risk models.
 */
@RestController
@RequestMapping("/api/ai-engine")
public class DecisionEngineController {

    private final ExecutionService executionService;

    public DecisionEngineController(ExecutionService executionService) {
        this.executionService = executionService;
    }

    @SuppressWarnings("unchecked")
    @GetMapping("/predict-release-risk")
    public ResponseEntity<Map<String, Object>> predictRisk(@RequestParam Long executionId) {
        ResponseEntity<Map<String, Object>> res = executionService.getById(executionId);
        if (res.getStatusCode() != HttpStatus.OK || res.getBody() == null) {
            return ResponseEntity.status(res.getStatusCode()).build();
        }

        Map<String, Object> executionData = res.getBody();
        Map<String, Object> execution = (Map<String, Object>) executionData.get("execution");
        
        int passed = execution.get("passedCount") != null ? ((Number) execution.get("passedCount")).intValue() : 0;
        int failed = execution.get("failedCount") != null ? ((Number) execution.get("failedCount")).intValue() : 0;

        String decision;
        double qualityScore;
        String[] riskFactors;

        if (failed > 0) {
            decision = "REJECTED_HIGH_RISK";
            qualityScore = 0.0;
            riskFactors = new String[]{failed + " tests failed during execution"};
        } else if (passed > 0 && failed == 0) {
            decision = "APPROVED";
            qualityScore = 1.0;
            riskFactors = new String[]{"All tests passed successfully"};
        } else {
            decision = "CONDITIONAL_DEPLOYMENT";
            qualityScore = 0.5;
            riskFactors = new String[]{"Insufficient test data. " + passed + " passed, " + failed + " failed"};
        }

        return ResponseEntity.ok(Map.of(
                "executionId", executionId,
                "qualityScore", qualityScore,
                "decision", decision,
                "riskFactors", riskFactors
        ));
    }
}
