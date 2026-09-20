package com.careeros.careeros.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class AwsSesServiceTest {

    @Test
    void shouldSkipEmailWhenSesIsDisabled() {
        AwsSesService service = new AwsSesService(false, "", "us-east-1");

        boolean sent = service.sendTextEmail("student@example.com", "Welcome", "Hello");

        assertThat(sent).isFalse();
    }
}
