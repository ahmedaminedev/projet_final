package com.example.Usersmicroservice.Implementations;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.Map;

@Service
public class MailSenderImpl {

    @Autowired
    private JavaMailSender emailSender;

    public void sendHtmlMessage(String to, String subject, String templatePath, Map<String, String> placeholders) throws MessagingException, IOException {
        MimeMessage message = emailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        // Charger le contenu du fichier HTML en tant que template
        ClassPathResource templateResource = new ClassPathResource(templatePath);
        String htmlContent = new String(Files.readAllBytes(templateResource.getFile().toPath()), StandardCharsets.UTF_8);

        // Remplacer les placeholders dans le contenu HTML avec les valeurs spécifiées
        for (Map.Entry<String, String> entry : placeholders.entrySet()) {
            htmlContent = htmlContent.replace("{{" + entry.getKey() + "}}", entry.getValue());
        }

        // Définir le destinataire, le sujet et le contenu de l'e-mail
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);

        // Ajouter une image en ligne (logo de la société)
        ClassPathResource logo = new ClassPathResource("static/logo.png");
        helper.addInline("logoImage", logo);

        // Envoyer l'e-mail
        emailSender.send(message);
    }
}
