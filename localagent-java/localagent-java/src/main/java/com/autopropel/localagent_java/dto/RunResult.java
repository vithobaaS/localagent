package com.autopropel.localagent_java.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public class RunResult {
    public String environmentId;
    public String environmentName;
    public String projectId;
    public String applicationId;
    public String applicationName;
    public String platformId;
    public String platformName;
    public Integer browserTypeId;
    public String browserTypeName;
    public String groupId;
    public String groupName;
    public String referenceId;
    public String serviceUrl;
    public String request_handler;
    public String iterationval;
    public String jiraUserName;
    public String jirapassword;
    public String jiraUserSiteName;
    public String projectJiraKey;

    // Mutated overall status
    public Integer result_status;

    // Config overrides
    public Boolean headless;
    public String speed; // "fast" or "slow"
    public Integer delayMs; // custom delay in milliseconds between steps

    // Parameterized environment variables
    public Map<String, String> variables;

    // This handles the dynamic "iteration1" array format
    public List<Map<String, List<TestCaseIteration>>> testCase;
}
