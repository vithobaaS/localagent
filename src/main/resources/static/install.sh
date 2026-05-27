#!/bin/bash
TOKEN=""
CLOUD_URL="http://localhost:8080"
INSTALL_DIR="$HOME/.autopropel/agent"

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --token) TOKEN="$2"; shift ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

if [ -z "$TOKEN" ]; then
    echo "Error: --token is required."
    exit 1
fi

echo -e "\033[0;36m🚀 Installing AutoPropel Agent...\033[0m"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

echo -e "\033[0;36m📥 Downloading Agent JAR...\033[0m"
# In production, this points to the real hosted JAR
curl -sL "$CLOUD_URL/agent/localagent-java.jar" -o localagent-java.jar

echo -e "\033[0;36m⚙️ Configuring Agent...\033[0m"
cat > application.yml <<EOL
localagent:
  cloud-url: $CLOUD_URL
  token: $TOKEN
  polling-enabled: true
EOL

echo ""
echo -e "\033[0;32m✅ Setup Complete!\033[0m"
echo "To start the agent in the background (as a daemon), we would register systemd/launchd here."
echo -e "\033[0;33mFor now, you can start it manually with:\033[0m"
echo "  cd $INSTALL_DIR"
echo "  java -jar localagent-java.jar"
