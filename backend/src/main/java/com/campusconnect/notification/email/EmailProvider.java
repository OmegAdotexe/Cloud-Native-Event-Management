package com.campusconnect.notification.email;

import com.campusconnect.notification.model.NotificationType;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.Map;

/**
 * Sends HTML notification emails using Spring Mail + Thymeleaf templates.
 * <p>
 * Each {@link NotificationType} is mapped to a Thymeleaf template under
 * {@code classpath:/templates/email/}.  If no dedicated template exists for a
 * type, the {@code generic} template is used as a fallback.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EmailProvider {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${app.email.from}")
    private String fromAddress;

    /**
     * Maps each NotificationType to its Thymeleaf template name (without the
     * {@code email/} prefix or {@code .html} suffix).
     */
    private static final Map<NotificationType, String> TEMPLATE_MAP = Map.of(
            NotificationType.REGISTRATION_CONFIRMED, "registration-confirmed",
            NotificationType.REGISTRATION_CANCELLED, "registration-cancelled",
            NotificationType.REGISTRATION_REJECTED,  "registration-rejected",
            NotificationType.EVENT_CANCELLED,         "event-cancelled",
            NotificationType.TIMELINE_UPDATED,        "timeline-updated"
    );

    /**
     * Send an HTML email for the given notification type.
     *
     * @param recipientEmail the recipient's email address
     * @param title          the email subject line
     * @param message        the human-readable message body
     * @param type           the notification type (determines which template is used)
     * @throws MessagingException if the underlying mail transport fails
     */
    public void send(String recipientEmail, String title, String message, NotificationType type)
            throws MessagingException {

        String templateName = TEMPLATE_MAP.getOrDefault(type, "generic");

        Context ctx = new Context();
        ctx.setVariable("title", title);
        ctx.setVariable("message", message);
        ctx.setVariable("type", type.name());

        String htmlBody = templateEngine.process("email/" + templateName, ctx);

        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
        helper.setFrom(fromAddress);
        helper.setTo(recipientEmail);
        helper.setSubject(title);
        helper.setText(htmlBody, true);

        mailSender.send(mimeMessage);
        log.info("Email sent to {} [type={}, template={}]", recipientEmail, type, templateName);
    }
}
