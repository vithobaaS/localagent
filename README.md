# AutoPropel LocalAgent & Cloud Coordinator

AutoPropel LocalAgent is a high-performance web browser automation runner (supporting Chrome, Firefox, and Safari) designed for distributed execution orchestration.

---

## 📂 Project Structure

```text
localagent/
├── localagent-java/        # LocalAgent application runner (Spring Boot)
│   └── localagent-java/    # Java runner codebase, drivers & unit tests
├── localagent-cloud/       # Cloud Coordinator Broker service (Spring Boot)
├── service-packaging/      # Windows Service wrappers and registration scripts
├── start-agent.bat         # Single-click foreground mode launcher for Windows
└── pom.xml                 # Workspace parent POM aggregating all modules
```

---

## 🛠️ Prerequisites
- **Java**: JDK 21 or JDK 25 installed and configured on your `PATH`.
- **Browsers**: Google Chrome and/or Mozilla Firefox installed in default system paths.

---

## 🚀 Running the Agent

### Mode B: Foreground (Interactive Mode)
Running in interactive console mode is ideal for local test execution, debugging, or validation.

1. **Quick Launch (Windows)**:
   - Double-click the **`start-agent.bat`** file at the root of the workspace.
2. **Manual Console Launch**:
   - Open a terminal and run:
     ```bash
     .\mvnw.cmd clean spring-boot:run -pl localagent-java/localagent-java
     ```

### Mode A: Background (Windows Service Mode)
Run the agent silently as a Windows background service that automatically boots with your operating system.

1. Open a Command Prompt or PowerShell terminal **as Administrator**.
2. Navigate to the `service-packaging` directory:
   ```cmd
   cd service-packaging
   ```
3. Run the installer script:
   ```cmd
   install.bat
   ```
   *This automatically builds the project, downloads the lightweight Windows Service Wrapper (`winsw`), installs the service, and starts it.*
4. To stop and uninstall the service at any time:
   ```cmd
   uninstall.bat
   ```

---

## 🔌 API Documentation

Once started, the LocalAgent listens on port **`8080`** by default.

### 1. Check Availability
Returns the active status of the agent.
- **URL**: `GET /checkavailstatus`
- **Response**: `1` (indicates online)

### 2. Agent Info & Capabilities
Returns system architecture, JVM specs, memory usage, and checks if web driver binaries are available.
- **URL**: `GET /api/agent/info`
- **Response JSON**:
  ```json
  {
    "osName": "Windows 11",
    "javaVersion": "25.0.1",
    "capabilities": {
      "supportsChrome": true,
      "supportsFirefox": true,
      "supportsSafari": false
    },
    "memory": {
      "usedHeapMb": 45,
      "maxHeapMb": 2048
    },
    "status": "idle"
  }
  ```

### 3. Run Automation Payload
Submit structured Selenium automation jobs directly via REST.
- **URL**: `POST /run`
- **Request Body**: (Standard test-case definition with steps, actions, locators, and screenshots).
- **Supported Actions**: 
  - Browser Control: `Navigate`, `Refresh`, `GoBack`, `Wait`, `WaitUntill`, `WaitUntilElementIsClickable`
  - Page Actions: `Click`, `Set` (input text), `SetCheckBoxStatus`, `DoubleClick`, `RightClick`, `SelectDropdown`, `ScrollTo`, `UploadFile`
  - Asserts: `AssertEquals`, `AssertContains`
  - Loops/Goto: `Goto` (loops back with infinite-loop prevention cap of 10)
  - Frames: `SwitchFrame`, `SwitchDefaultContent`
  - Popups: `ClickAlert` (accept/dismiss alert modals)

---

## ☁️ Cloud Coordinator Notes
The cloud broker is implemented in `localagent-cloud` and currently runs on port `9090` by default.

### Available cloud endpoints
- `POST /api/agent/schedule-job` — enqueue a job for an agent
- `GET /api/agent/poll?agentId=<id>` — pull the next queued job for the agent
- `POST /api/agent/result` — submit execution output back to the broker
- `GET /api/agent/job-status?referenceId=<id>` — inspect a job status
- `GET /api/agent/job-result?referenceId=<id>` — fetch the stored result payload

### Connect the Java local agent to the cloud
The Java agent now reads the cloud endpoint from environment variables so you can switch to a brand-new domain without changing code.

Set these before starting the agent:
- `LOCALAGENT_CLOUD_URL` — the public base URL for the new cloud, for example `https://your-new-domain.com`
- `LOCALAGENT_AGENT_ID` — the agent identifier the broker should recognize
- `LOCALAGENT_POLLING_ENABLED` — optional override if you want to enable polling from the environment

If you do not set `LOCALAGENT_CLOUD_URL`, the agent falls back to `http://localhost:9090` for local development.

Example:
```bash
set LOCALAGENT_CLOUD_URL=https://your-new-domain.com
set LOCALAGENT_AGENT_ID=agent_windows_01
```

After that, start the Java agent and enable polling for the new cloud service.

### Deployment checklist for AWS
1. Provision a server or EC2 instance with Java 21.
2. Build the cloud module and run it on port `9090` or behind a reverse proxy.
3. Point your DNS to the new public domain and expose the cloud service there.
4. Set `LOCALAGENT_CLOUD_URL` on the machine running the Java agent.
5. Enable polling in the Java agent.
6. Decide whether to keep the current H2 file-backed database locally or replace it with a managed database for production.

---

## 🧪 Running Test Suites
To run all unit and integration tests across both the local agent and the cloud broker:
```bash
.\mvnw.cmd clean test
```
