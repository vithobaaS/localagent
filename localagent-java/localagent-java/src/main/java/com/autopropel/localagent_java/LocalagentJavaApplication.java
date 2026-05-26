package com.autopropel.localagent_java;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class LocalagentJavaApplication {

	public static void main(String[] args) {
		// Force headless mode so it doesn't try to initialize any UI
		System.setProperty("java.awt.headless", "true");
		
		SpringApplication.run(LocalagentJavaApplication.class, args);
	}
}
