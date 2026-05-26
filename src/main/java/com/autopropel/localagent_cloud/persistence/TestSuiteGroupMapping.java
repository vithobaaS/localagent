package com.autopropel.localagent_cloud.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "test_suite_group_mappings")
public class TestSuiteGroupMapping {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "test_suite_id", nullable = false)
    private Long testSuiteId;

    @Column(name = "test_case_group_id", nullable = false)
    private Long testCaseGroupId;

    @Column(name = "group_order", nullable = false)
    private Integer groupOrder = 0;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getTestSuiteId() { return testSuiteId; }
    public void setTestSuiteId(Long testSuiteId) { this.testSuiteId = testSuiteId; }

    public Long getTestCaseGroupId() { return testCaseGroupId; }
    public void setTestCaseGroupId(Long testCaseGroupId) { this.testCaseGroupId = testCaseGroupId; }

    public Integer getGroupOrder() { return groupOrder; }
    public void setGroupOrder(Integer groupOrder) { this.groupOrder = groupOrder; }
}
