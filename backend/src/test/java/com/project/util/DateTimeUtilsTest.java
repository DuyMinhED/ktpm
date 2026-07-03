package com.project.util;

import org.junit.jupiter.api.Test;

import java.lang.reflect.Constructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DateTimeUtilsTest {

    @Test
    void formatForDashboard_returnsEmptyForNull() {
        assertEquals("", DateTimeUtils.formatForDashboard(null));
    }

    @Test
    void formatForDashboard_formatsTodayTomorrowAndOtherDates() {
        assertTrue(DateTimeUtils.formatForDashboard(LocalDateTime.now().withHour(9).withMinute(5))
                .endsWith("09:05"));

        assertTrue(DateTimeUtils.formatForDashboard(LocalDateTime.now().plusDays(1).withHour(14).withMinute(30))
                .endsWith("14:30"));

        LocalDateTime laterDate = LocalDateTime.now().plusDays(3).withHour(7).withMinute(45);

        assertEquals(laterDate.toLocalDate().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM")) + " 07:45",
                DateTimeUtils.formatForDashboard(laterDate));
    }

    @Test
    void calculateAge_handlesNullAndBirthdayBoundaries() {
        LocalDate today = LocalDate.now();

        assertEquals(0, DateTimeUtils.calculateAge(null));
        assertEquals(0, DateTimeUtils.calculateAge(today));
        assertEquals(1, DateTimeUtils.calculateAge(today.minusYears(1)));
        assertEquals(0, DateTimeUtils.calculateAge(today.minusYears(1).plusDays(1)));
    }

    @Test
    void formatTimeAgo_coversNullSecondsMinutesHoursAndDays() {
        assertEquals("Vừa xong", DateTimeUtils.formatTimeAgo(null));
        assertTrue(DateTimeUtils.formatTimeAgo(LocalDateTime.now().minusSeconds(5)).startsWith("5 "));
        assertTrue(DateTimeUtils.formatTimeAgo(LocalDateTime.now().minusMinutes(2)).startsWith("2 "));
        assertTrue(DateTimeUtils.formatTimeAgo(LocalDateTime.now().minusHours(3)).startsWith("3 "));
        assertTrue(DateTimeUtils.formatTimeAgo(LocalDateTime.now().minusDays(4)).startsWith("4 "));
    }

    @Test
    void privateConstructor_isCoveredForUtilityClass() throws Exception {
        Constructor<DateTimeUtils> constructor = DateTimeUtils.class.getDeclaredConstructor();
        constructor.setAccessible(true);

        assertDoesNotThrow(() -> constructor.newInstance());
    }
}
