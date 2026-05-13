package com.project.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

public class DateTimeUtils {

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM");

    /**
     * Format a LocalDateTime to a human-readable "Today/Tomorrow" string used in DoctorDashboard.
     * Example: "Today 14:30", "Tomorrow 09:00", or "25/11 10:00"
     */
    public static String formatForDashboard(LocalDateTime dateTime) {
        if (dateTime == null) return "";
        
        LocalDate date = dateTime.toLocalDate();
        LocalDate today = LocalDate.now();
        
        String dayPrefix;
        if (date.equals(today)) {
            dayPrefix = "Hôm nay";
        } else if (date.equals(today.plusDays(1))) {
            dayPrefix = "Ngày mai";
        } else {
            dayPrefix = date.format(DATE_FORMATTER);
        }
        
        return dayPrefix + " " + dateTime.format(TIME_FORMATTER);
    }

    /**
     * Calculate age from a birthday.
     */
    public static int calculateAge(LocalDate birthDay) {
        if (birthDay == null) return 0;
        return (int) ChronoUnit.YEARS.between(birthDay, LocalDate.now());
    }

    /**
     * Format time ago string in Vietnamese.
     * Example: "2 phút trước", "1 ngày trước"
     */
    public static String formatTimeAgo(LocalDateTime time) {
        if (time == null) return "Vừa xong";
        long seconds = java.time.Duration.between(time, LocalDateTime.now()).getSeconds();
        if (seconds < 60) return seconds + " giây trước";
        if (seconds < 3600) return (seconds / 60) + " phút trước";
        if (seconds < 86400) return (seconds / 3600) + " giờ trước";
        return (seconds / 86400) + " ngày trước";
    }

    private DateTimeUtils() {}
}
