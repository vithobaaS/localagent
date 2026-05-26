package com.autopropel.localagent_cloud.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class RunRequest {
    public RunResult result;
}
