package com.autopropel.localagent_cloud.service;

import com.autopropel.localagent_cloud.model.Scheduler;
import com.autopropel.localagent_cloud.repository.SchedulerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.support.CronExpression;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class CronExecutionEngine {

    private static final Logger logger = LoggerFactory.getLogger(CronExecutionEngine.class);
    private final SchedulerRepository schedulerRepository;

    public CronExecutionEngine(SchedulerRepository schedulerRepository) {
        this.schedulerRepository = schedulerRepository;
    }

    // Runs at the 0th second of every minute
    @Scheduled(cron = "0 * * * * *")
    public void evaluateCronSchedules() {
        LocalDateTime now = LocalDateTime.now().truncatedTo(ChronoUnit.MINUTES);
        logger.debug("Evaluating cron schedules at: {}", now);

        List<Scheduler> activeSchedules = schedulerRepository.findAll().stream()
                .filter(s -> "scheduled".equals(s.getExecutionType()) && "active".equals(s.getStatus()))
                .toList();

        for (Scheduler schedule : activeSchedules) {
            try {
                if (shouldRunOutlookSchedule(schedule, now)) {
                    logger.info("Outlook schedule triggered for suite: {}", schedule.getTestSuiteName());
                    queueExecution(schedule);
                    // For 'once' recurrence, deactivate after triggering
                    if ("once".equals(schedule.getRecurrenceType())) {
                        schedule.setStatus("inactive");
                        schedulerRepository.save(schedule);
                    }
                } else if (hasLegacyCron(schedule)) {
                    evaluateLegacyCron(schedule, now);
                }
            } catch (Exception e) {
                logger.error("Failed to evaluate scheduler ID {}: {}", schedule.getId(), e.getMessage(), e);
            }
        }
    }

    /**
     * Evaluates Outlook-style fields (scheduledDate, scheduledTime, recurrenceType, etc.)
     * Returns true if the schedule should fire at the given time.
     */
    private boolean shouldRunOutlookSchedule(Scheduler s, LocalDateTime now) {
        // Only use Outlook mode if recurrenceType is set
        if (s.getRecurrenceType() == null || s.getRecurrenceType().isBlank()) {
            return false;
        }

        LocalTime scheduledTime = s.getScheduledTime();
        if (scheduledTime == null) {
            return false;
        }

        // Check time match (truncated to minutes)
        LocalTime nowTime = now.toLocalTime().truncatedTo(ChronoUnit.MINUTES);
        LocalTime targetTime = scheduledTime.truncatedTo(ChronoUnit.MINUTES);
        if (!nowTime.equals(targetTime)) {
            return false;
        }

        // Check recurrence end date
        if (s.getRecurrenceEndDate() != null && now.toLocalDate().isAfter(s.getRecurrenceEndDate())) {
            // Past end date — deactivate
            s.setStatus("inactive");
            schedulerRepository.save(s);
            logger.info("Deactivating scheduler ID {} — past recurrence end date", s.getId());
            return false;
        }

        switch (s.getRecurrenceType()) {
            case "once": {
                // Must match exact date and time
                LocalDate scheduledDate = s.getScheduledDate();
                if (scheduledDate == null) return false;
                return now.toLocalDate().equals(scheduledDate);
            }

            case "daily": {
                // Check if start date has been reached
                LocalDate scheduledDate = s.getScheduledDate();
                if (scheduledDate != null && now.toLocalDate().isBefore(scheduledDate)) {
                    return false;
                }
                return true; // Time already matched above
            }

            case "weekly": {
                // Check if start date has been reached
                LocalDate scheduledDate = s.getScheduledDate();
                if (scheduledDate != null && now.toLocalDate().isBefore(scheduledDate)) {
                    return false;
                }
                // Match day of week
                String recurrenceDays = s.getRecurrenceDays();
                if (recurrenceDays == null || recurrenceDays.isBlank()) return false;
                String todayAbbr = now.getDayOfWeek().name().substring(0, 3); // MON, TUE, etc.
                for (String day : recurrenceDays.split(",")) {
                    if (day.trim().equalsIgnoreCase(todayAbbr)) return true;
                }
                return false;
            }

            case "monthly": {
                // Check if start date has been reached
                LocalDate scheduledDate = s.getScheduledDate();
                if (scheduledDate == null) return false;
                if (now.toLocalDate().isBefore(scheduledDate)) return false;
                // Match day of month
                return now.getDayOfMonth() == scheduledDate.getDayOfMonth();
            }

            default:
                return false;
        }
    }

    /** Returns true if this scheduler has a legacy cron expression and no Outlook fields */
    private boolean hasLegacyCron(Scheduler s) {
        return s.getCronExpression() != null
                && !s.getCronExpression().isBlank()
                && (s.getRecurrenceType() == null || s.getRecurrenceType().isBlank());
    }

    /** Evaluates legacy raw cron expression (original behavior) */
    private void evaluateLegacyCron(Scheduler schedule, LocalDateTime now) {
        try {
            CronExpression cron = CronExpression.parse(schedule.getCronExpression());
            LocalDateTime nextExecution = cron.next(now.minusSeconds(1));
            if (nextExecution != null && nextExecution.truncatedTo(ChronoUnit.MINUTES).equals(now)) {
                logger.info("Cron trigger matched for suite: {}", schedule.getTestSuiteName());
                queueExecution(schedule);
            }
        } catch (Exception e) {
            logger.error("Failed to parse or evaluate cron expression: {} for scheduler ID: {}",
                    schedule.getCronExpression(), schedule.getId(), e);
        }
    }

    /**
     * Builds a Spring cron expression string from Outlook-style fields.
     * Useful for display purposes or for storing a computed cron on the entity.
     */
    public static String buildCronFromOutlookFields(Scheduler s) {
        if (s.getScheduledTime() == null || s.getRecurrenceType() == null) return null;

        int hour = s.getScheduledTime().getHour();
        int minute = s.getScheduledTime().getMinute();

        return switch (s.getRecurrenceType()) {
            case "once", "daily" -> String.format("0 %d %d * * *", minute, hour);
            case "weekly" -> {
                String days = (s.getRecurrenceDays() != null && !s.getRecurrenceDays().isBlank())
                        ? s.getRecurrenceDays()
                        : "*";
                yield String.format("0 %d %d * * %s", minute, hour, days);
            }
            case "monthly" -> {
                int dayOfMonth = s.getScheduledDate() != null ? s.getScheduledDate().getDayOfMonth() : 1;
                yield String.format("0 %d %d %d * *", minute, hour, dayOfMonth);
            }
            default -> null;
        };
    }

    private void queueExecution(Scheduler original) {
        Scheduler job = new Scheduler();
        job.setTestSuiteId(original.getTestSuiteId());
        job.setTestSuiteName(original.getTestSuiteName());
        job.setBrowserType(original.getBrowserType());
        job.setExecutionType("now");
        job.setStatus("active");
        schedulerRepository.save(job);
        logger.info("Queued test suite '{}' for execution via local agent polling", job.getTestSuiteName());
    }
}
