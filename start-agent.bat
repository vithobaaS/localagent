@echo off
echo Starting AutoPropel LocalAgent in visual foreground mode...
cd "%~dp0"
call .\mvnw.cmd spring-boot:run -pl localagent-java/localagent-java "-Dspring-boot.run.arguments=--localagent.headless=false"
