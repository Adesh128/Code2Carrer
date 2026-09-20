#!/bin/bash
set -euo pipefail

APP_NAME="code2career"
APP_USER="ubuntu"
APP_DIR="/home/$APP_USER/$APP_NAME"
JAR_SRC="${1:-$APP_DIR/careeros-0.0.1-SNAPSHOT.jar}"
JAR_DEST="$APP_DIR/careeros-0.0.1-SNAPSHOT.jar"

DB_URL="${DB_URL:-jdbc:postgresql://your-rds-endpoint:5432/careeros}"
DB_USERNAME="${DB_USERNAME:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-change-me}"
DB_DRIVER_CLASS_NAME="${DB_DRIVER_CLASS_NAME:-org.postgresql.Driver}"
JWT_SECRET="${JWT_SECRET:-change-me-with-a-strong-random-secret}"
SERVER_PORT="${SERVER_PORT:-8080}"
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_SES_ENABLED="${AWS_SES_ENABLED:-true}"
AWS_SES_FROM_EMAIL="${AWS_SES_FROM_EMAIL:-noreply@yourdomain.com}"
AWS_S3_ENABLED="${AWS_S3_ENABLED:-true}"
AWS_S3_BUCKET="${AWS_S3_BUCKET:-your-s3-bucket-name}"

sudo apt-get update
sudo apt-get install -y openjdk-21-jdk awscli curl

sudo mkdir -p "$APP_DIR"
sudo chown -R "$APP_USER:$APP_USER" "$APP_DIR"

if [ -f "$JAR_SRC" ]; then
  cp "$JAR_SRC" "$JAR_DEST"
else
  echo "Missing JAR at $JAR_SRC"
  echo "Build it first with: cd backend && mvn clean package -DskipTests"
  exit 1
fi

cat > "$APP_DIR/.env" <<EOF
DB_URL=$DB_URL
DB_USERNAME=$DB_USERNAME
DB_PASSWORD=$DB_PASSWORD
DB_DRIVER_CLASS_NAME=$DB_DRIVER_CLASS_NAME
JWT_SECRET=$JWT_SECRET
SERVER_PORT=$SERVER_PORT
AWS_REGION=$AWS_REGION
AWS_SES_ENABLED=$AWS_SES_ENABLED
AWS_SES_FROM_EMAIL=$AWS_SES_FROM_EMAIL
AWS_S3_ENABLED=$AWS_S3_ENABLED
AWS_S3_BUCKET=$AWS_S3_BUCKET
EOF

sudo tee /etc/systemd/system/code2career.service >/dev/null <<EOF
[Unit]
Description=Code2Career Backend
After=network.target

[Service]
User=$APP_USER
WorkingDirectory=$APP_DIR
EnvironmentFile=$APP_DIR/.env
ExecStart=/usr/bin/java -jar $JAR_DEST
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable code2career
sudo systemctl start code2career
sudo systemctl status code2career --no-pager

printf "\nDeployment complete.\n"
printf "Health check: curl http://localhost:%s/actuator/health\n" "$SERVER_PORT"
