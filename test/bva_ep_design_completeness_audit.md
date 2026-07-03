# BVA/EP Design Completeness Audit

## 1. Purpose

This audit verifies that the BVA and EP design files include the minimum information needed for review, implementation, and traceability.

Minimum required fields:

1. Scope / feature under test.
2. Code basis or requirement basis.
3. Boundary or partition rule.
4. Concrete test data.
5. Expected result.
6. Preconditions and execution steps.
7. Automation target.
8. Evidence or traceability target.
9. Gap/correction notes when source code and older SRS assumptions differ.

## 2. File Status

| File | Status | Notes |
|---|---|---|
| `TEST_DESIGN_INDEX.md` | Complete | Navigation source of truth for non-Postman design. |
| `core_business_bva_spec.md` | Complete | Has scope, BVA rules, concrete cases, expected result, supplemental code-based gaps, automation target. |
| `code_based_bva_ep_completion.md` | Complete | Best source for current code-based BVA/EP rules and minimum automation set. |
| `junit_bva_ep_traceability_spec.md` | Complete | Maps BVA/EP rows to JUnit evidence. |
| `crud_api_bva_spec.md` | Completed by addendum | Added code-basis corrections, corrected automation rows, and traceability. |
| `crud_data_ep_spec.md` | Completed by addendum | Added preconditions, steps, automation target, traceability, and code gaps. |
| `auth_user_test_spec.md` | Completed by addendum | Added preconditions, execution steps, automation target, and JUnit mapping. |
| `auth_user_ep_test_spec.md` | Completed by addendum | Added traceability and execution matrix. |
| `health_metric_ep_bva_spec.md` | Complete | Has EP/BVA partitions, thresholds, detailed cases, and JUnit target. Use code-based thresholds when older docs conflict. |
| `id_status_ep_spec.md` | Acceptable | EP data for IDs/status should be read with `crud_data_ep_spec.md` and `code_based_bva_ep_completion.md`. |
| `patient_appointment_ep_test_spec.md` | Acceptable | Appointment EP is covered more completely by `core_business_bva_spec.md` and `patient_appointment_whitebox_spec.md`. |
| `frontend_form_bva_spec.md` | Complete with known mismatch | Includes frontend BVA and frontend/backend mismatch rows. |
| `frontend_backend_test_design_traceability_spec.md` | Complete | Cross-layer traceability matrix and evidence checklist. |
| `bva_ep_test_cases_summary_report.md` | Reference only | Summary has known encoding and old-assumption issues; use code-based correction notes and primary specs for execution. |
| `bva_test_cases_report.md` | Reference only | Use for reporting context, not as source of truth if it conflicts with code-based docs. |

## 3. Remaining Design Risks

| Risk | Resolution |
|---|---|
| Old SRS-based health metric thresholds differ from service code for SpO2 and blood pressure | Use `code_based_bva_ep_completion.md` and Section 6 of `crud_api_bva_spec.md` for execution. |
| Pagination assumptions in old summary use one-based page numbering | Use Spring code-based rule: `page=0` is valid unless an endpoint adds explicit validation. |
| Frontend password min length can differ from backend min length | Keep `TC-FE-MISMATCH-001` as cross-layer mismatch case. |
| Some API-level expected errors are not enforced in direct service code | Record layer-specific expected results: DTO/API may reject, service may tolerate. |

## 4. Final Readiness

| Area | Readiness |
|---|---|
| BVA design values | Ready |
| EP design values | Ready |
| Traceability to JUnit/API | Ready |
| Frontend/backend mapping | Ready |
| Known code mismatches | Documented |

Conclusion: the BVA/EP design set is now complete enough for submission when `TEST_DESIGN_INDEX.md` is used as the entry point and code-based documents are treated as source of truth for execution.
