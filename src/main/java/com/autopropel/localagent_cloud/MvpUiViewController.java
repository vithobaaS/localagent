package com.autopropel.localagent_cloud;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class MvpUiViewController {

    @GetMapping({
        "/autopropel",
        "/autopropel/",
        "/autopropel/dashboard",
        "/autopropel/scheduler",
        "/autopropel/scheduler/**",
        "/autopropel/groups",
        "/autopropel/groups/**",
        "/autopropel/stub/**",
        "/autopropel/test-suite",
        "/autopropel/test-suite/**",
        "/autopropel/test-case",
        "/autopropel/test-case/**"
    })
    public String dashboardRedirect() {
        return "forward:/autopropel/dashboard/index.html";
    }
}
