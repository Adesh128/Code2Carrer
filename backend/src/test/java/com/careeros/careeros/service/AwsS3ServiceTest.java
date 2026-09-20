package com.careeros.careeros.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class AwsS3ServiceTest {

    @Test
    void shouldSkipUploadWhenS3IsDisabled() {
        AwsS3Service service = new AwsS3Service(false, "test-bucket", "us-east-1");

        boolean uploaded = service.uploadFile("resume.pdf", "hello".getBytes(), "application/pdf");

        assertThat(uploaded).isFalse();
    }
}
