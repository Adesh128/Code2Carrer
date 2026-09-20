package com.careeros.careeros.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class WhatsAppReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppReminderScheduler.class);
    private final CareerMvpService service;
    private final boolean enabled;

    public WhatsAppReminderScheduler(
            CareerMvpService service,
            @Value("${integrations.whatsapp.reminders-enabled:false}") boolean enabled) {
        this.service = service;
        this.enabled = enabled;
    }

    @Scheduled(fixedDelayString = "${integrations.whatsapp.reminder-interval-ms:3600000}")
    public void processReminders() {
        if (!enabled) {
            log.debug("WhatsApp reminders are disabled by configuration");
            return;
        }
        if (!service.whatsappCredentialsPresent()) {
            log.info("Skipping WhatsApp reminders: provider credentials are absent");
            return;
        }
        log.info("WhatsApp reminder run skipped outbound delivery; {} opted-in student(s) pending",
                service.enabledReminderCount());
    }
}
