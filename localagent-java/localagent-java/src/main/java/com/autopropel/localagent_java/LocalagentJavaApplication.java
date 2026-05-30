package com.autopropel.localagent_java;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class LocalagentJavaApplication {

	public static void main(String[] args) {
		// Allow Swing UI for the first-time setup popup
		System.setProperty("java.awt.headless", "false");
		
		SpringApplication app = new SpringApplication(LocalagentJavaApplication.class);
		
		// Load external config from user home directory so the token persists across runs
		String userHome = System.getProperty("user.home");
		java.util.Map<String, Object> props = new java.util.HashMap<>();
		props.put("spring.config.additional-location", "optional:file:" + userHome + "/.autopropel/agent.properties");
		app.setDefaultProperties(props);
		
		app.run(args);
	}
}
