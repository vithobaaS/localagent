package com.autopropel.localagent_java.ui;

import javax.swing.*;
import java.awt.*;
import java.io.File;
import java.io.FileOutputStream;
import java.util.Properties;
import java.util.concurrent.CountDownLatch;

public class AgentConfigUI {

    public static JFrame showPairingCode(String code) {
        JFrame frame = new JFrame("AutoPropel Agent Pairing");
        SwingUtilities.invokeLater(() -> {
            try {
                UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
            } catch (Exception ignored) {}

            frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
            frame.setSize(450, 250);
            frame.setLocationRelativeTo(null);
            frame.setAlwaysOnTop(true);

            JPanel panel = new JPanel(new GridBagLayout());
            panel.setBorder(BorderFactory.createEmptyBorder(15, 15, 15, 15));
            GridBagConstraints gbc = new GridBagConstraints();
            gbc.insets = new Insets(10, 10, 10, 10);
            gbc.fill = GridBagConstraints.HORIZONTAL;

            gbc.gridx = 0; gbc.gridy = 0; gbc.gridwidth = 2;
            JLabel titleLabel = new JLabel("Connect this Agent", SwingConstants.CENTER);
            titleLabel.setFont(new Font("Segoe UI", Font.BOLD, 18));
            panel.add(titleLabel, gbc);

            gbc.gridy = 1;
            JLabel subtitleLabel = new JLabel("Go to your Web Dashboard and enter this code:", SwingConstants.CENTER);
            panel.add(subtitleLabel, gbc);

            gbc.gridy = 2;
            JLabel codeLabel = new JLabel(code, SwingConstants.CENTER);
            codeLabel.setFont(new Font("Monospaced", Font.BOLD, 42));
            codeLabel.setForeground(new Color(41, 128, 185));
            panel.add(codeLabel, gbc);

            gbc.gridy = 3;
            JLabel statusLabel = new JLabel("Waiting for authorization...", SwingConstants.CENTER);
            statusLabel.setForeground(Color.GRAY);
            panel.add(statusLabel, gbc);

            frame.add(panel);
            frame.setVisible(true);
        });

        return frame;
    }

    public static void saveProperties(String url, String token) {
        try {
            String userHome = System.getProperty("user.home");
            File dir = new File(userHome, ".autopropel");
            if (!dir.exists()) {
                dir.mkdirs();
            }
            File propsFile = new File(dir, "agent.properties");
            Properties props = new Properties();
            if (propsFile.exists()) {
                try (java.io.FileInputStream fis = new java.io.FileInputStream(propsFile)) {
                    props.load(fis);
                }
            }
            props.setProperty("localagent.cloud-url", url);
            props.setProperty("localagent.token", token);
            
            try (FileOutputStream fos = new FileOutputStream(propsFile)) {
                props.store(fos, "AutoPropel Agent Configuration");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
