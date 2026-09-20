package com.careeros.careeros.dto;

import jakarta.validation.constraints.Pattern;

public record WhatsAppConfigRequest(
        Boolean enabled,
        @Pattern(regexp = "^\\+?[1-9]\\d{7,14}$", message = "phoneNumber must be an international phone number")
        String phoneNumber,
        @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "reminderTime must use HH:mm")
        String reminderTime) {
}
