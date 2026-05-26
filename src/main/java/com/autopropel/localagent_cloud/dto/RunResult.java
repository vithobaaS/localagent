package com.autopropel.localagent_cloud.dto;

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
    public List<Map<String, List<TestCaseIteration>>> testCase;

    // Mutated status
    public Integer result_status;
}
