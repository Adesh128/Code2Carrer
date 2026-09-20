package com.careeros.careeros.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
public class AwsS3Service {

    private static final Logger log = LoggerFactory.getLogger(AwsS3Service.class);

    private final boolean enabled;
    private final String bucketName;
    private final String region;

    public AwsS3Service(
            @Value("${aws.s3.enabled:false}") boolean enabled,
            @Value("${aws.s3.bucket:}") String bucketName,
            @Value("${aws.region:us-east-1}") String region) {
        this.enabled = enabled;
        this.bucketName = bucketName;
        this.region = region;
    }

    public boolean uploadFile(String key, byte[] content, String contentType) {
        if (!enabled) {
            log.debug("AWS S3 is disabled; skipping upload for key {}", key);
            return false;
        }
        if (key == null || key.isBlank() || bucketName == null || bucketName.isBlank() || content == null) {
            log.warn("AWS S3 upload skipped because key/bucket/content is missing");
            return false;
        }

        try (S3Client s3Client = S3Client.builder().region(Region.of(region)).build()) {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(contentType == null || contentType.isBlank() ? "application/octet-stream" : contentType)
                    .build();

            s3Client.putObject(request, RequestBody.fromBytes(content));
            log.info("Uploaded file {} to S3 bucket {} successfully", key, bucketName);
            return true;
        } catch (Exception ex) {
            log.error("Failed to upload file {} to S3 bucket {}", key, bucketName, ex);
            return false;
        }
    }
}
