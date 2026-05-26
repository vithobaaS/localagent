package com.autopropel.localagent_java.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class JobDto {
    public Long id;
    public Long executionId;
    public String agentId;
    public String status;
    public String payloadJson;
}
