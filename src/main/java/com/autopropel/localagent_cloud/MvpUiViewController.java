package com.autopropel.localagent_cloud;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class MvpUiViewController {

    @GetMapping({
        "/autopropel",
        "/autopropel/",
        "/autopropel/login",
        "/autopropel/register",
        "/autopropel/dashboard",
        "/autopropel/scheduler",
        "/autopropel/scheduler/**",
        "/autopropel/groups",
        "/autopropel/groups/**",
        "/autopropel/test-cases",
        "/autopropel/test-cases/**",
        "/autopropel/test-case-groups",
        "/autopropel/test-case-groups/**",
        "/autopropel/test-suites",
        "/autopropel/test-suites/**",
        "/autopropel/stub/**"
    })
    public String dashboardRedirect() {
        return "forward:/autopropel/index.html";
    }
}
