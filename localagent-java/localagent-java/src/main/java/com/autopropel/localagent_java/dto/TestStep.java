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
    public String screenshotBase64;

    // We will mutate these statuses during execution
    public Integer executed_status = 0;
    public Integer result_status = 0;
}
