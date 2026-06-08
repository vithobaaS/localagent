package com.autopropel.localagent_cloud.model;

import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "executions")
public class Execution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "org_id")
    private Long orgId;

    @Column(name = "org_execution_id")
    private Long orgExecutionId;

    @Column(name = "environment_id")
    private Long environmentId;

    @Column(name = "target_group_id")
    private Long targetGroupId;

    @Column(name = "browser_type")
    private String browserType;

    @Column(name = "browser_version")
    private String browserVersion;

    @Column(nullable = false)
    private String status; // QUEUED, RUNNING, SUCCESS, FAILED

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @Column(name = "environment_json", columnDefinition = "text")
    private String environmentJson;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getFinishedAt() {
        return finishedAt;
    }

    public void setFinishedAt(LocalDateTime finishedAt) {
        this.finishedAt = finishedAt;
    }

    public String getEnvironmentJson() {
        return environmentJson;
    }

    public void setEnvironmentJson(String environmentJson) {
        this.environmentJson = environmentJson;
    }

    public Long getOrgId() { return orgId; }
    public void setOrgId(Long orgId) { this.orgId = orgId; }

    public Long getOrgExecutionId() { return orgExecutionId; }
    public void setOrgExecutionId(Long orgExecutionId) { this.orgExecutionId = orgExecutionId; }

    public Long getEnvironmentId() { return environmentId; }
    public void setEnvironmentId(Long environmentId) { this.environmentId = environmentId; }

    public Long getTargetGroupId() { return targetGroupId; }
    public void setTargetGroupId(Long targetGroupId) { this.targetGroupId = targetGroupId; }

    public String getBrowserType() { return browserType; }
    public void setBrowserType(String browserType) { this.browserType = browserType; }

    public String getBrowserVersion() { return browserVersion; }
    public void setBrowserVersion(String browserVersion) { this.browserVersion = browserVersion; }
}
