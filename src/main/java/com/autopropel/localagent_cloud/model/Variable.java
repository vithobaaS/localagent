package com.autopropel.localagent_cloud.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "variables")
public class Variable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "org_id")
    private Long orgId;

    @Column(name = "scope", nullable = false)
    private String scope = "GLOBAL"; // GLOBAL, SUITE, ENVIRONMENT

    @Column(name = "scope_id")
    private Long scopeId;

    @Column(name = "key_name", nullable = false)
    private String keyName;

    @Column(name = "value", columnDefinition = "text")
    private String value;

    @Column(name = "is_secret")
    private Boolean isSecret = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { this.createdAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getOrgId() { return orgId; }
    public void setOrgId(Long orgId) { this.orgId = orgId; }
    public String getScope() { return scope; }
    public void setScope(String scope) { this.scope = scope; }
    public Long getScopeId() { return scopeId; }
    public void setScopeId(Long scopeId) { this.scopeId = scopeId; }
    public String getKeyName() { return keyName; }
    public void setKeyName(String keyName) { this.keyName = keyName; }
    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
    public Boolean getIsSecret() { return isSecret; }
    public void setIsSecret(Boolean isSecret) { this.isSecret = isSecret; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
