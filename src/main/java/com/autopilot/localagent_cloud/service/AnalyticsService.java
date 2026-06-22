package com.autopilot.localagent_cloud.service;

import com.autopilot.localagent_cloud.model.Agent;
import com.autopilot.localagent_cloud.model.Execution;
import com.autopilot.localagent_cloud.model.Job;
import com.autopilot.localagent_cloud.model.Scheduler;
import com.autopilot.localagent_cloud.model.StepResult;
import com.autopilot.localagent_cloud.repository.AgentRepository;
import com.autopilot.localagent_cloud.repository.ExecutionRepository;
import com.autopilot.localagent_cloud.repository.JobRepository;
import com.autopilot.localagent_cloud.repository.SchedulerRepository;
import com.autopilot.localagent_cloud.repository.StepResultRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final ExecutionRepository executionRepository;
    private final SchedulerRepository schedulerRepository;
    private final StepResultRepository stepResultRepository;
    private final AgentRepository agentRepository;
    private final JobRepository jobRepository;

    public AnalyticsService(ExecutionRepository executionRepository,
                            SchedulerRepository schedulerRepository,
                            StepResultRepository stepResultRepository,
                            AgentRepository agentRepository,
                            JobRepository jobRepository) {
        this.executionRepository = executionRepository;
        this.schedulerRepository = schedulerRepository;
        this.stepResultRepository = stepResultRepository;
        this.agentRepository = agentRepository;
        this.jobRepository = jobRepository;
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

    /**
     * Calculates live fleet health: agent statuses + queue depth.
     * An agent is considered ONLINE if it sent a heartbeat within the last 2 minutes.
     * An agent is RUNNING if it has an ASSIGNED job with a valid lease.
     */
    public Map<String, Object> getFleetHealth(Long orgId) {
        // Get all agents for this org
        List<Agent> agents = orgId != null
                ? agentRepository.findByOrgId(orgId)
                : agentRepository.findAll();

        LocalDateTime onlineThreshold = LocalDateTime.now().minusMinutes(2);

        // Get all currently assigned jobs (to detect which agents are running)
        List<Job> assignedJobs = jobRepository.findAll().stream()
                .filter(j -> "ASSIGNED".equalsIgnoreCase(j.getStatus()))
                .filter(j -> j.getLeaseExpiresAt() != null && j.getLeaseExpiresAt().isAfter(LocalDateTime.now()))
                .collect(Collectors.toList());
        Set<String> busyAgentIds = assignedJobs.stream()
                .map(Job::getAgentId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        // Count queue depth (QUEUED jobs with no agent yet)
        long queueDepth = jobRepository.findAll().stream()
                .filter(j -> "QUEUED".equalsIgnoreCase(j.getStatus()))
                .count();

        // Build per-agent summaries
        List<Map<String, Object>> agentDetails = new ArrayList<>();
        int onlineCount = 0;
        int runningCount = 0;
        int offlineCount = 0;

        for (Agent agent : agents) {
            boolean isOnline = agent.getLastSeenAt() != null && agent.getLastSeenAt().isAfter(onlineThreshold);
            boolean isRunning = isOnline && busyAgentIds.contains(agent.getId());

            String agentStatus;
            if (isRunning) { agentStatus = "running"; runningCount++; }
            else if (isOnline) { agentStatus = "idle"; onlineCount++; }
            else { agentStatus = "offline"; offlineCount++; }

            Map<String, Object> detail = new LinkedHashMap<>();
            detail.put("id", agent.getId());
            detail.put("name", agent.getName());
            detail.put("os", agent.getOs());
            detail.put("agentVersion", agent.getAgentVersion());
            detail.put("status", agentStatus);
            detail.put("lastSeenAt", agent.getLastSeenAt());
            agentDetails.add(detail);
        }

        // Sort: running first, then idle, then offline
        agentDetails.sort((a, b) -> {
            String[] order = {"running", "idle", "offline"};
            int ai = Arrays.asList(order).indexOf(a.get("status").toString());
            int bi = Arrays.asList(order).indexOf(b.get("status").toString());
            return Integer.compare(ai, bi);
        });

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalAgents", agents.size());
        result.put("onlineCount", onlineCount);
        result.put("runningCount", runningCount);
        result.put("offlineCount", offlineCount);
        result.put("queueDepth", queueDepth);
        result.put("agents", agentDetails);
        return result;
    }
}
