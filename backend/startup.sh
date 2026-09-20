#!/bin/bash
set -e

if [ -z "$DB_URL" ]; then
  echo "DB_URL is not set; using H2 in-memory database."
fi

java -jar /app/app.jar
