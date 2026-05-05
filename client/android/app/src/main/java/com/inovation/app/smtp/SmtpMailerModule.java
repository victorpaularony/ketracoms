package com.inovation.app.smtp;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;

import java.util.Date;
import java.util.Properties;

import javax.activation.DataHandler;
import javax.activation.DataSource;
import javax.activation.FileDataSource;
import javax.mail.BodyPart;
import javax.mail.Message;
import javax.mail.Multipart;
import javax.mail.PasswordAuthentication;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeBodyPart;
import javax.mail.internet.MimeMessage;
import javax.mail.internet.MimeMultipart;

/**
 * React Native module for sending email via Gmail SMTP.
 * Uses JavaMail bundled as local JARs (android-mail + android-activation).
 * Works on Android API 21+ without requiring the deprecated JSSEProvider.
 */
public class SmtpMailerModule extends ReactContextBaseJavaModule {

    public SmtpMailerModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        // Must match the name used in JS: NativeModules.RNSmtpMailer
        return "RNSmtpMailer";
    }

    @ReactMethod
    public void sendMail(final ReadableMap options, final Promise promise) {
        // Read all options on the JS thread before spawning the background thread
        final String mailhost  = options.getString("mailhost");
        final String port      = options.getString("port");
        final String username  = options.getString("username");
        final String password  = options.getString("password");
        final String from      = options.hasKey("from") ? options.getString("from") : username;
        final String recipients = options.getString("recipients");
        final String subject   = options.getString("subject");
        final String htmlBody  = options.getString("htmlBody");
        final boolean ssl      = !options.hasKey("ssl") || options.getBoolean("ssl");

        final ReadableArray attachmentPaths = options.hasKey("attachmentPaths")
                ? options.getArray("attachmentPaths") : null;
        final ReadableArray attachmentNames = options.hasKey("attachmentNames")
                ? options.getArray("attachmentNames") : null;
        final ReadableArray attachmentTypes = options.hasKey("attachmentTypes")
                ? options.getArray("attachmentTypes") : null;

        // Run SMTP on a background thread — never block the UI/JS thread
        new Thread(() -> {
            try {
                sendViaSmtp(
                        mailhost, port, username, password, from,
                        recipients, subject, htmlBody, ssl,
                        attachmentPaths, attachmentNames, attachmentTypes
                );
                WritableMap result = new WritableNativeMap();
                result.putString("status", "SUCCESS");
                promise.resolve(result);
            } catch (Exception e) {
                promise.reject("SMTP_ERROR", e.getMessage(), e);
            }
        }).start();
    }

    // ── Core send logic ───────────────────────────────────────────────────

    private void sendViaSmtp(
            String mailhost, String port, String username, String password,
            String from, String recipients, String subject, String htmlBody,
            boolean ssl, ReadableArray attachmentPaths,
            ReadableArray attachmentNames, ReadableArray attachmentTypes
    ) throws Exception {

        Properties props = new Properties();
        props.put("mail.smtp.host", mailhost);
        props.put("mail.smtp.port", port);
        props.put("mail.smtp.auth", "true");

        if (ssl) {
            // SMTPS — immediate SSL handshake (port 465)
            props.put("mail.smtp.ssl.enable", "true");
            props.put("mail.smtp.socketFactory.port", port);
            props.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
            props.put("mail.smtp.socketFactory.fallback", "false");
        } else {
            // STARTTLS (port 587)
            props.put("mail.smtp.starttls.enable", "true");
        }

        props.put("mail.smtp.ssl.protocols", "TLSv1.2 TLSv1.3");

        final String authUser = username;
        final String authPass = password;

        Session session = Session.getInstance(props, new javax.mail.Authenticator() {
            @Override
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(authUser, authPass);
            }
        });

        MimeMessage message = new MimeMessage(session);
        message.setFrom(new InternetAddress(from));
        message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(recipients));
        message.setSubject(subject);
        message.setSentDate(new Date());

        Multipart multipart = new MimeMultipart();

        // HTML body part
        BodyPart bodyPart = new MimeBodyPart();
        bodyPart.setContent(htmlBody, "text/html; charset=utf-8");
        multipart.addBodyPart(bodyPart);

        // Attachment parts
        if (attachmentPaths != null) {
            for (int i = 0; i < attachmentPaths.size(); i++) {
                String filePath = attachmentPaths.getString(i);
                MimeBodyPart attachPart = new MimeBodyPart();
                DataSource source = new FileDataSource(filePath);
                attachPart.setDataHandler(new DataHandler(source));

                String name = (attachmentNames != null && i < attachmentNames.size())
                        ? attachmentNames.getString(i)
                        : "attachment_" + i;
                attachPart.setFileName(name);
                multipart.addBodyPart(attachPart);
            }
        }

        message.setContent(multipart);
        message.saveChanges();

        Transport.send(message);
    }
}
