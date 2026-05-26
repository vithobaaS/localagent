package com.autopropel.localagent_cloud.service;

import com.autopropel.localagent_cloud.persistence.Scheduler;
import com.autopropel.localagent_cloud.persistence.SchedulerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.support.CronExpression;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
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
            if (schedule.getCronExpression() != null && !schedule.getCronExpression().trim().isEmpty()) {
                try {
                    CronExpression cron = CronExpression.parse(schedule.getCronExpression());
                    LocalDateTime nextExecution = cron.next(now.minusSeconds(1));
                    
                    if (nextExecution != null && nextExecution.truncatedTo(ChronoUnit.MINUTES).equals(now)) {
                        logger.info("Cron trigger matched for suite: {}", schedule.getTestSuiteName());
                        queueExecution(schedule);
                    }
                } catch (Exception e) {
                    logger.error("Failed to parse or evaluate cron expression: {} for scheduler ID: {}", schedule.getCronExpression(), schedule.getId(), e);
                }
            }
        }
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
