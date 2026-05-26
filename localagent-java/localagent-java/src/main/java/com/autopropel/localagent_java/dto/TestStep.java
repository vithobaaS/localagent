package com.autopropel.localagent_java.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class TestStep {
    public String step_result_id;
    public String actionName;
    public String locatorName;
    public String objectDetail;
    public String data;
    public String screenShot;
    public String screenshot_path;
    public String stepDesc;
    public String errorLog;

    // We will mutate these statuses during execution
    public Integer executed_status;
    public Integer result_status;
}
