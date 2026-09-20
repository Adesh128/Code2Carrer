# EC2 deployment guide

## 1. Build the backend

```bash
cd backend
mvn clean package -DskipTests
```

## 2. Copy JAR to EC2

```bash
scp target/careeros-0.0.1-SNAPSHOT.jar ubuntu@YOUR_EC2_IP:/home/ubuntu/code2career/
```

## 3. Run the deploy script

```bash
chmod +x deploy/ec2-deploy.sh
sudo ./deploy/ec2-deploy.sh /home/ubuntu/code2career/careeros-0.0.1-SNAPSHOT.jar
```

## 4. Configure AWS values

Edit the generated `.env` file in `/home/ubuntu/code2career/.env` and set real values.

## 5. Check status

```bash
sudo systemctl status code2career
curl http://localhost:8080/actuator/health
```

## 6. Required AWS setup

- Create an RDS PostgreSQL database
- Create an S3 bucket for resume uploads
- Verify the SES sender email
- Create an IAM user/role with the permissions in `iam-policy.json`

## 7. Production note

Use IAM roles, not hard-coded credentials, wherever possible.
