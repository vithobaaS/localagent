package com.autopropel.localagent_cloud.persistence;
import jakarta.persistence.*;
import java.time.LocalDateTime;
@Entity
@Table(name = "agent_tokens")
public class AgentToken {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "org_id", nullable = false) private Long orgId;
    @Column(nullable = false, unique = true) private String token;
    @Column private String label;
    @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;
    @PrePersist protected void onCreate() { this.createdAt = LocalDateTime.now(); }
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public Long getOrgId() { return orgId; } public void setOrgId(Long orgId) { this.orgId = orgId; }
    public String getToken() { return token; } public void setToken(String token) { this.token = token; }
    public String getLabel() { return label; } public void setLabel(String label) { this.label = label; }
    public LocalDateTime getCreatedAt() { return createdAt; } public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
