package com.autopropel.localagent_cloud.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "test_case_group_mappings")
public class TestCaseGroupMapping {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "test_case_group_id", nullable = false)
    private Long testCaseGroupId;

    @Column(name = "test_case_id", nullable = false)
    private Long testCaseId;

    @Column(name = "case_order", nullable = false)
    private Integer caseOrder = 0;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getTestCaseGroupId() { return testCaseGroupId; }
    public void setTestCaseGroupId(Long testCaseGroupId) { this.testCaseGroupId = testCaseGroupId; }

    public Long getTestCaseId() { return testCaseId; }
    public void setTestCaseId(Long testCaseId) { this.testCaseId = testCaseId; }

    public Integer getCaseOrder() { return caseOrder; }
    public void setCaseOrder(Integer caseOrder) { this.caseOrder = caseOrder; }
}
