package com.autopilot.localagent_cloud.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "organisations")
public class Organisation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false) private String name;
    @Column(nullable = false) private String plan = "trial";
    @Column(unique = true) private String subdomain;
    @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;
    @PrePersist protected void onCreate() { this.createdAt = LocalDateTime.now(); }
    @Column(name = "public_id", unique = true) private String publicId;
    // getters/setters for id, name, plan, createdAt, subdomain, publicId
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public String getName() { return name; } public void setName(String name) { this.name = name; }
    public String getPlan() { return plan; } public void setPlan(String plan) { this.plan = plan; }
    public LocalDateTime getCreatedAt() { return createdAt; } public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getSubdomain() { return subdomain; } public void setSubdomain(String subdomain) { this.subdomain = subdomain; }
    public String getPublicId() { return publicId; } public void setPublicId(String publicId) { this.publicId = publicId; }
}
