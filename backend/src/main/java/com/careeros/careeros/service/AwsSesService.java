package com.careeros.careeros.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.ses.SesClient;
import software.amazon.awssdk.services.ses.model.Body;
import software.amazon.awssdk.services.ses.model.Content;
import software.amazon.awssdk.services.ses.model.Destination;
import software.amazon.awssdk.services.ses.model.Message;
import software.amazon.awssdk.services.ses.model.SendEmailRequest;

@Service
public class AwsSesService {

    private static final Logger log = LoggerFactory.getLogger(AwsSesService.class);

    private final boolean enabled;
    private final String fromEmail;
    private final String region;

    public AwsSesService(
            @Value("${aws.ses.enabled:false}") boolean enabled,
            @Value("${aws.ses.from-email:}") String fromEmail,
            @Value("${aws.region:us-east-1}") String region) {
        this.enabled = enabled;
        this.fromEmail = fromEmail;
        this.region = region;
    }

    public boolean sendTextEmail(String to, String subject, String body) {
        if (!enabled) {
            log.debug("AWS SES is disabled; skipping email to {}", to);
            return false;
        }
        if (to == null || to.isBlank() || fromEmail == null || fromEmail.isBlank()) {
            log.warn("AWS SES email not sent because recipient or sender is missing");
            return false;
        }

        try (SesClient sesClient = SesClient.builder().region(Region.of(region)).build()) {
            Destination destination = Destination.builder().toAddresses(to).build();
            Content emailSubject = Content.builder().data(subject).charset("UTF-8").build();
            Content emailBody = Content.builder().data(body).charset("UTF-8").build();
            Message message = Message.builder()
                    .subject(emailSubject)
                    .body(Body.builder().text(emailBody).build())
                    .build();

            SendEmailRequest request = SendEmailRequest.builder()
                    .source(fromEmail)
                    .destination(destination)
                    .message(message)
                    .build();

            sesClient.sendEmail(request);
            log.info("AWS SES email sent to {} successfully", to);
            return true;
        } catch (Exception ex) {
            log.error("Failed to send AWS SES email to {}", to, ex);
            return false;
        }
    }
}
