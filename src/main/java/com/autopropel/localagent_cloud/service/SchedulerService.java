package com.autopropel.localagent_cloud.service;

import com.autopropel.localagent_cloud.model.Scheduler;
import com.autopropel.localagent_cloud.repository.SchedulerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@Service
public class SchedulerService {

    private final SchedulerRepository schedulerRepository;

    public SchedulerService(SchedulerRepository schedulerRepository) {
        this.schedulerRepository = schedulerRepository;
    }

    public ResponseEntity<List<Scheduler>> getAll(Long orgId) {
        List<Scheduler> list = orgId != null
                ? schedulerRepository.findAll().stream().filter(s -> orgId.equals(s.getOrgId())).toList()
                : schedulerRepository.findAll();
        return ResponseEntity.ok(list);
    }

    public ResponseEntity<Scheduler> create(Map<String, Object> body, Long orgId) {
        Scheduler scheduler = buildSchedulerFromBody(new Scheduler(), body);
        scheduler.setOrgId(orgId);
        if (scheduler.getTestSuiteName() == null || scheduler.getTestSuiteName().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (scheduler.getExecutionType() == null || scheduler.getExecutionType().isBlank()) {
            scheduler.setExecutionType("now");
        }
        if (scheduler.getBrowserType() == null || scheduler.getBrowserType().isBlank()) {
            scheduler.setBrowserType("chrome");
        }
        if (scheduler.getStatus() == null || scheduler.getStatus().isBlank()) {
            scheduler.setStatus("active");
        }
        // Auto-compute cron expression from Outlook-style fields
        if (scheduler.getRecurrenceType() != null && !scheduler.getRecurrenceType().isBlank()) {
            String computed = CronExecutionEngine.buildCronFromOutlookFields(scheduler);
            if (computed != null) scheduler.setCronExpression(computed);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(schedulerRepository.save(scheduler));
    }

    public ResponseEntity<Scheduler> update(Long id, Map<String, Object> body) {
        return schedulerRepository.findById(id).map(existing -> {
            buildSchedulerFromBody(existing, body);
            // Auto-compute cron expression from Outlook-style fields
            if (existing.getRecurrenceType() != null && !existing.getRecurrenceType().isBlank()) {
                String computed = CronExecutionEngine.buildCronFromOutlookFields(existing);
                if (computed != null) existing.setCronExpression(computed);
            }
            return ResponseEntity.ok(schedulerRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    public ResponseEntity<Void> delete(Long id) {
        if (!schedulerRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        schedulerRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Maps a JSON request body (from the Outlook-style scheduler form) onto a Scheduler entity.
     * Handles both the legacy fields and the new Outlook-style fields.
     */
    private Scheduler buildSchedulerFromBody(Scheduler s, Map<String, Object> body) {
        if (body.containsKey("testSuiteName"))  s.setTestSuiteName((String) body.get("testSuiteName"));
        if (body.containsKey("executionType"))  s.setExecutionType((String) body.get("executionType"));
        if (body.containsKey("browserType"))    s.setBrowserType((String) body.get("browserType"));
        if (body.containsKey("status"))         s.setStatus((String) body.get("status"));
        if (body.containsKey("cronExpression")) s.setCronExpression((String) body.get("cronExpression"));
        if (body.containsKey("testSuiteId") && body.get("testSuiteId") != null) {
            s.setTestSuiteId(((Number) body.get("testSuiteId")).longValue());
        }
        // Outlook-style fields
        if (body.containsKey("recurrenceType"))  s.setRecurrenceType((String) body.get("recurrenceType"));
        if (body.containsKey("recurrenceDays"))  s.setRecurrenceDays((String) body.get("recurrenceDays"));
        if (body.containsKey("scheduledDate") && body.get("scheduledDate") != null) {
            try { s.setScheduledDate(LocalDate.parse((String) body.get("scheduledDate"))); } catch (Exception ignored) {}
        }
        if (body.containsKey("scheduledTime") && body.get("scheduledTime") != null) {
            try { s.setScheduledTime(LocalTime.parse((String) body.get("scheduledTime"))); } catch (Exception ignored) {}
        }
        if (body.containsKey("recurrenceEndDate") && body.get("recurrenceEndDate") != null) {
            String endDateStr = (String) body.get("recurrenceEndDate");
            if (!endDateStr.isBlank()) {
                try { s.setRecurrenceEndDate(LocalDate.parse(endDateStr)); } catch (Exception ignored) {}
            } else {
                s.setRecurrenceEndDate(null);
            }
        }
        return s;
    }
}
