package com.autopropel.localagent_cloud;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class LocalagentCloudApplication {

    public static void main(String[] args) {
        SpringApplication.run(LocalagentCloudApplication.class, args);
    }
}
