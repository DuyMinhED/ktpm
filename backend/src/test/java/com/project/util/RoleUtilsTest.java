package com.project.util;

import org.junit.jupiter.api.Test;

import java.lang.reflect.Constructor;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RoleUtilsTest {

    @Test
    void getRoleLabel_handlesNullKnownCaseInsensitiveAndUnknownRoles() {
        assertEquals("N/A", RoleUtils.getRoleLabel(null));
        assertEquals(RoleUtils.getRoleLabel("ADMIN"), RoleUtils.getRoleLabel("admin"));
        assertEquals("UNKNOWN_ROLE", RoleUtils.getRoleLabel("UNKNOWN_ROLE"));
    }

    @Test
    void isValidRole_handlesNullKnownCaseInsensitiveAndUnknownRoles() {
        assertFalse(RoleUtils.isValidRole(null));
        assertTrue(RoleUtils.isValidRole("doctor"));
        assertTrue(RoleUtils.isValidRole("PATIENT"));
        assertFalse(RoleUtils.isValidRole("NURSE"));
    }

    @Test
    void getAllRoles_returnsDefensiveCopy() {
        Map<String, String> roles = RoleUtils.getAllRoles();
        roles.clear();

        assertEquals(4, RoleUtils.getAllRoles().size());
        assertTrue(RoleUtils.getAllRoles().containsKey(RoleUtils.ADMIN));
    }

    @Test
    void privateConstructor_isCoveredForUtilityClass() throws Exception {
        Constructor<RoleUtils> constructor = RoleUtils.class.getDeclaredConstructor();
        constructor.setAccessible(true);

        assertDoesNotThrow(() -> constructor.newInstance());
    }
}
