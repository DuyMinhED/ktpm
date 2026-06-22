package com.project.specification;

import com.project.entity.Patient;
import jakarta.persistence.criteria.*;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.jpa.domain.Specification;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@SuppressWarnings({ "unchecked", "rawtypes" })
public class PatientSpecificationTest {

    @Test
    void belongsToDoctor_success() {
        Specification<Patient> spec = PatientSpecification.belongsToDoctor(1L);
        assertNotNull(spec);

        Root root = mock(Root.class);
        CriteriaQuery query = mock(CriteriaQuery.class);
        CriteriaBuilder cb = mock(CriteriaBuilder.class);
        Path path = mock(Path.class);

        when(root.get("doctorId")).thenReturn(path);
        spec.toPredicate(root, query, cb);

        verify(cb, times(1)).equal(path, 1L);
    }

    @Test
    void hasNameLike_success() {
        Specification<Patient> spec = PatientSpecification.hasNameLike("John");
        assertNotNull(spec);

        Root root = mock(Root.class);
        CriteriaQuery query = mock(CriteriaQuery.class);
        CriteriaBuilder cb = mock(CriteriaBuilder.class);
        Path path = mock(Path.class);
        Expression expression = mock(Expression.class);

        when(root.get("fullName")).thenReturn(path);
        when(cb.lower(path)).thenReturn(expression);
        spec.toPredicate(root, query, cb);

        verify(cb, times(1)).like(expression, "%john%");
    }

    @Test
    void hasNameLike_nullOrEmpty() {
        Specification<Patient> specNull = PatientSpecification.hasNameLike(null);
        Specification<Patient> specEmpty = PatientSpecification.hasNameLike("");

        Root root = mock(Root.class);
        CriteriaQuery query = mock(CriteriaQuery.class);
        CriteriaBuilder cb = mock(CriteriaBuilder.class);

        assertNull(specNull.toPredicate(root, query, cb));
        assertNull(specEmpty.toPredicate(root, query, cb));
    }

    @Test
    void hasRiskLevel_success() {
        Specification<Patient> spec = PatientSpecification.hasRiskLevel("HIGH");
        assertNotNull(spec);

        Root root = mock(Root.class);
        CriteriaQuery query = mock(CriteriaQuery.class);
        CriteriaBuilder cb = mock(CriteriaBuilder.class);
        Path path = mock(Path.class);

        when(root.get("riskLevel")).thenReturn(path);
        spec.toPredicate(root, query, cb);

        verify(cb, times(1)).equal(path, "HIGH");
    }

    @Test
    void hasRiskLevel_nullOrEmpty() {
        Specification<Patient> specNull = PatientSpecification.hasRiskLevel(null);
        Specification<Patient> specEmpty = PatientSpecification.hasRiskLevel("");

        Root root = mock(Root.class);
        CriteriaQuery query = mock(CriteriaQuery.class);
        CriteriaBuilder cb = mock(CriteriaBuilder.class);

        assertNull(specNull.toPredicate(root, query, cb));
        assertNull(specEmpty.toPredicate(root, query, cb));
    }
}
