package com.project.controller;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import static org.junit.jupiter.api.Assertions.*;

class PaginationBvaTest {

    @Test
    void pageMinus1_failsBecauseSpringPageRequestRequiresZeroBasedPage() {
        assertThrows(IllegalArgumentException.class, () -> PageRequest.of(-1, 10));
    }

    @Test
    void page0_isValidFirstPage() {
        Pageable pageable = PageRequest.of(0, 10);

        assertEquals(0, pageable.getPageNumber());
        assertEquals(10, pageable.getPageSize());
    }

    @Test
    void size0_failsBecausePageSizeMustBePositive() {
        assertThrows(IllegalArgumentException.class, () -> PageRequest.of(0, 0));
    }

    @Test
    void size1_isValidLowerBoundary() {
        Pageable pageable = PageRequest.of(0, 1);

        assertEquals(0, pageable.getPageNumber());
        assertEquals(1, pageable.getPageSize());
    }
}
