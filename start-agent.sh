#!/bin/bash
echo "Starting AutoPropel LocalAgent in visual foreground mode..."
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Ensure mvnw has execution permission
chmod +x ./mvnw

# Run the spring-boot application with interactive visual mode arguments
./mvnw spring-boot:run -pl localagent-java/localagent-java -Dspring-boot.run.arguments="--localagent.headless=false"
