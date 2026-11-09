package com.femora.backend.reminder;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Builds a standard .ics calendar file for the next few predicted periods.
 *
 * For each predicted period it adds:
 *  1. a short event at 9:00 AM, N days before, with an alarm that fires at the start time, and
 *  2. an all-day event on the expected day.
 *
 * Times are "floating" (no time zone), so 9:00 AM means 9:00 AM wherever the phone is.
 * Event titles are discreet by default because they can show on a phone's lock screen.
 */
public final class CalendarFileBuilder {

    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final DateTimeFormatter STAMP =
            DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'");
    private static final DateTimeFormatter NICE_DATE =
            DateTimeFormatter.ofPattern("EEE, d MMM yyyy", Locale.ENGLISH);
    private static final String CRLF = "\r\n";

    private CalendarFileBuilder() {
    }

    public static byte[] build(Long userId, LocalDate today, LocalDate nextPeriod, int cycleDays,
                               int daysBefore, int cycles, boolean discreet) {
        StringBuilder out = new StringBuilder();
        String stamp = ZonedDateTime.now(ZoneOffset.UTC).format(STAMP);

        line(out, "BEGIN:VCALENDAR");
        line(out, "VERSION:2.0");
        line(out, "PRODID:-//Femora//Period reminders//EN");
        line(out, "CALSCALE:GREGORIAN");
        line(out, "METHOD:PUBLISH");
        line(out, "X-WR-CALNAME:Femora");

        for (int i = 0; i < cycles; i++) {
            LocalDate period = nextPeriod.plusDays((long) cycleDays * i);
            LocalDate remindOn = period.minusDays(daysBefore);

            if (remindOn.isAfter(today)) {
                addReminder(out, userId, stamp, period, remindOn, daysBefore, discreet);
            }
            if (!period.isBefore(today)) {
                addExpectedDay(out, userId, stamp, period, discreet);
            }
        }

        line(out, "END:VCALENDAR");
        return out.toString().getBytes(StandardCharsets.UTF_8);
    }

    private static void addReminder(StringBuilder out, Long userId, String stamp, LocalDate period,
                                    LocalDate remindOn, int daysBefore, boolean discreet) {
        String title = discreet
                ? "Femora reminder"
                : "Period expected in " + daysBefore + (daysBefore == 1 ? " day" : " days");

        line(out, "BEGIN:VEVENT");
        line(out, "UID:femora-reminder-" + userId + "-" + period.format(DAY) + "@femora");
        line(out, "DTSTAMP:" + stamp);
        line(out, "DTSTART:" + remindOn.format(DAY) + "T090000");
        line(out, "DTEND:" + remindOn.format(DAY) + "T091500");
        line(out, "SUMMARY:" + escape(title));
        line(out, "DESCRIPTION:" + escape(description(period)));
        line(out, "TRANSP:TRANSPARENT");
        line(out, "BEGIN:VALARM");
        line(out, "ACTION:DISPLAY");
        line(out, "DESCRIPTION:" + escape(title));
        line(out, "TRIGGER:PT0S");
        line(out, "END:VALARM");
        line(out, "END:VEVENT");
    }

    private static void addExpectedDay(StringBuilder out, Long userId, String stamp,
                                       LocalDate period, boolean discreet) {
        String title = discreet
                ? "Femora: expected day (estimate)"
                : "Period expected today (estimate)";

        line(out, "BEGIN:VEVENT");
        line(out, "UID:femora-period-" + userId + "-" + period.format(DAY) + "@femora");
        line(out, "DTSTAMP:" + stamp);
        line(out, "DTSTART;VALUE=DATE:" + period.format(DAY));
        line(out, "DTEND;VALUE=DATE:" + period.plusDays(1).format(DAY));
        line(out, "SUMMARY:" + escape(title));
        line(out, "DESCRIPTION:" + escape(description(period)));
        line(out, "TRANSP:TRANSPARENT");
        line(out, "END:VEVENT");
    }

    private static String description(LocalDate period) {
        return "Your period is expected around " + period.format(NICE_DATE) + ". "
                + "This is an estimate. Log your period in Femora to keep your predictions up to date.";
    }

    /**
     * Escapes text values as required by the iCalendar format.
     */
    private static String escape(String value) {
        return value
                .replace("\\", "\\\\")
                .replace(";", "\\;")
                .replace(",", "\\,")
                .replace("\r\n", "\\n")
                .replace("\n", "\\n");
    }

    /**
     * Writes one line, folding anything longer than the 75 character limit.
     */
    private static void line(StringBuilder out, String text) {
        final int limit = 73;
        String rest = text;

        while (rest.length() > limit) {
            out.append(rest, 0, limit).append(CRLF).append(' ');
            rest = rest.substring(limit);
        }
        out.append(rest).append(CRLF);
    }
}
