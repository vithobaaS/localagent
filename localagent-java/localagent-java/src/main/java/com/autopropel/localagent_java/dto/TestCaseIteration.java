package com.autopropel.localagent_java.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class TestCaseIteration {
    public List<TestStep> testSteps;

    public Integer executed_status;
    public Integer result_status;
}
