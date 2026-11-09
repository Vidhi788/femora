package com.femora.backend.reminder;

/**
 * One way of delivering a reminder. To add a new provider, write another class that
 * implements this and mark it @Component. ReminderService picks the right one by channel.
 */
public interface ReminderSender {

    record Recipient(String email, String name, String phone) {}

    boolean supports(ReminderSettings.Channel channel);

    void send(ReminderSettings.Channel channel, Recipient to, String message) throws Exception;

    /**
     * Same as send, but with an optional calendar file (.ics). Senders that cannot attach
     * files (SMS, WhatsApp) simply ignore it.
     */
    default void send(ReminderSettings.Channel channel, Recipient to, String message,
                      byte[] calendarFile) throws Exception {
        send(channel, to, message);
    }
}