package com.autopilot.localagent_cloud.service;

import com.autopilot.localagent_cloud.model.Execution;
import com.autopilot.localagent_cloud.model.Scheduler;
import com.autopilot.localagent_cloud.model.StepResult;
import com.autopilot.localagent_cloud.repository.ExecutionRepository;
import com.autopilot.localagent_cloud.repository.SchedulerRepository;
import com.autopilot.localagent_cloud.repository.StepResultRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final ExecutionRepository executionRepository;
    private final SchedulerRepository schedulerRepository;
    private final StepResultRepository stepResultRepository;

    public AnalyticsService(ExecutionRepository executionRepository,
                            SchedulerRepository schedulerRepository,
                            StepResultRepository stepResultRepository) {
        this.executionRepository = executionRepository;
        this.schedulerRepository = schedulerRepository;
        this.stepResultRepository = stepResultRepository;
    }

    /**
     * Calculates the "Top Flaky Test Suites" for an org.
     *
     * Flakiness Score is defined as:
     *   (number of runs that were NOT all-pass AND not-all-fail) / total runs * 100
     * A suite must have at least 3 runs to be considered.
     *
     * Returns top 5 flaky suites sorted by flakiness score descending.
     */
    public List<Map<String, Object>> getFlakySuites(Long orgId, int limit) {
        // 1. Get all executions for the org
        List<Execution> allExecs = executionRepository.findAllByOrderByIdDesc()
                .stream()
                .filter(e -> orgId == null || orgId.equals(e.getOrgId()))
                .filter(e -> e.getSchedulerId() != null)
                .collect(Collectors.toList());

        // 2. Build a map of schedulerId -> Scheduler (for suite name)
        Map<Long, String> schedulerNames = new HashMap<>();
        Map<Long, Long> schedulerSuiteIds = new HashMap<>();
        schedulerRepository.findAll().forEach(s -> {
            schedulerNames.put(s.getId(), s.getTestSuiteName());
            schedulerSuiteIds.put(s.getId(), s.getTestSuiteId());
        });

        // 3. Group executions by testSuiteName via schedulerId
        Map<String, List<Execution>> bySuite = allExecs.stream()
                .collect(Collectors.groupingBy(e -> {
                    String name = schedulerNames.get(e.getSchedulerId());
                    return name != null ? name : "Suite #" + e.getSchedulerId();
                }));

        // 4. For each suite, calculate flakiness
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<String, List<Execution>> entry : bySuite.entrySet()) {
            String suiteName = entry.getKey();
            List<Execution> runs = entry.getValue();

            // Need at least 2 runs to determine flakiness
            if (runs.size() < 2) continue;

            int totalRuns = runs.size();
            int passedRuns = 0;
            int failedRuns = 0;
            int partialRuns = 0; // Mixed pass/fail steps = flaky

            for (Execution exec : runs) {
                String status = exec.getStatus();
                if (status == null) continue;
                if (status.equalsIgnoreCase("success") || status.equalsIgnoreCase("completed")) {
                    passedRuns++;
                } else if (status.equalsIgnoreCase("failed")) {
                    failedRuns++;
                }
            }

            // Flakiness: suite that doesn't consistently pass or fail
            // High flakiness = many alternating results
            int notConsistent = totalRuns - Math.max(passedRuns, failedRuns);
            // Score from 0-100
            double flakinessScore = totalRuns > 0 ? ((double) Math.min(passedRuns, failedRuns) / totalRuns) * 100.0 : 0;

            if (flakinessScore == 0 && (passedRuns == 0 || failedRuns == 0)) {
                // Consistent suite - not flaky
                continue;
            }

            Map<String, Object> suiteData = new LinkedHashMap<>();
            suiteData.put("suiteName", suiteName);
            suiteData.put("totalRuns", totalRuns);
            suiteData.put("passedRuns", passedRuns);
            suiteData.put("failedRuns", failedRuns);
            suiteData.put("flakinessScore", Math.round(flakinessScore * 10.0) / 10.0);
            suiteData.put("trend", failedRuns > passedRuns ? "deteriorating" : "improving");
            result.add(suiteData);
        }

        // Sort by flakiness score descending, return top N
        result.sort((a, b) -> Double.compare(
                (double) b.get("flakinessScore"),
                (double) a.get("flakinessScore")
        ));

        return result.stream().limit(limit).collect(Collectors.toList());
    }
}
