package com.autopropel.localagent_java.action;

import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ActionRegistry {
    private static final Logger logger = LoggerFactory.getLogger(ActionRegistry.class);
    private static final Map<String, ActionHandler> registry = new HashMap<>();

    public static void register(String name, ActionHandler handler) {
        registry.put(name.toLowerCase(), handler);
    }

    public static ActionHandler get(String name) {
        if (name == null) return null;
        return registry.get(name.toLowerCase());
    }
}
