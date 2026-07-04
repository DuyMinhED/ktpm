# Test Specification Index

Thu muc nay chua hai nhom noi dung:

1. **Executable tests** duoc trien khai o noi khac:
   - Backend JUnit/Mockito/Integration: `backend/src/test/java`
   - API/Postman/Newman: `postman/DamDiep_Healthcare_API.postman_collection.json`
   - Frontend E2E/CodeceptJS: `frontend/e2e_tests`
2. **Test specification/report** trong cac file `.md`: dung de thiet ke, doi chieu va bao cao test case.

## Tai Lieu Chinh

- `00_index/00_consolidated_test_design_index.md`: chi muc gom nhom cac tai lieu thiet ke test, bang dieu kien bien, so test case toi thieu va cac gap con lai.
- `00_index/01_backend_whitebox_graph_index.md`: chi muc rieng cho cac tai lieu white-box graph.
- `00_index/02_regression_suite_traceability_matrix.md`: ma tran truy vet regression suite.

## Cau Truc Thu Muc

| Folder | Noi dung |
|---|---|
| `00_index/` | Chi muc tong hop va traceability matrix. |
| `01_bva_ep/` | Tai lieu Boundary Value Analysis va Equivalence Partitioning. |
| `02_whitebox_backend/` | Tai lieu white-box, basis path, graph, checklist unit test backend. |
| `03_frontend/` | Tai lieu frontend form BVA, E2E, static review, dieu kien test UI. |
| `04_api_postman/` | Tai lieu API/Postman duoc gom rieng de de tim, khong tron voi JUnit/frontend. |
| `05_reports_reviews/` | Bao cao, audit, static review, bug evidence, coverage progress. |
| `06_testware_env/` | Testware, moi truong va du lieu test. |
| `resource/` | Tai nguyen phu tro test. |

## Static Review Ticket

- `05_reports_reviews/kcpm_813_static_review_requirements_test_cases.md`: review checklist, ambiguous requirement points, test gaps, and follow-up actions for KCPM-813.

## Chuan Trinh Bay Bat Buoc

Moi test spec nen co cung mot cau truc:

```markdown
# <Ten phan he> Test Specification

## 1. Scope
- Chuc nang/API/UI duoc kiem thu
- Ngoai pham vi neu co

## 2. Code/Requirement Basis
| Source | Constraint / Rule |
|---|---|
| `CreateUserRequest.password` | `@Size(min = 8)` |

## 3. EP/BVA Matrix
| Condition | Valid Partitions | Tag | Invalid Partitions | Tag | Valid Boundaries | Tag |
|---|---|---|---|---|---|---|

## 4. Test Cases
| Test Case | Type | Preconditions | Input | Steps | Expected Outcome | New Tags Covered | Automation Target |
|---|---|---|---|---|---|---|---|

## 5. Traceability / Notes
- Mapping toi JUnit/Postman/E2E neu da co
- Ghi chu cac case chua tu dong hoa
```

## Quy Uoc Tag

- `EP-<MODULE>-Vxx`: lop tuong duong hop le.
- `EP-<MODULE>-Ixx`: lop tuong duong khong hop le.
- `BVA-<MODULE>-Bxx`: gia tri tai bien hoac gan bien.
- `SEC-<MODULE>-xx`: xac thuc/phan quyen.
- `WB-<MODULE>-xx`: white-box/basis path.

Vi du:

| Tag | Y nghia |
|---|---|
| `EP-AUTH-V01` | Email dung dinh dang va do dai hop le |
| `EP-AUTH-I02` | Password rong |
| `BVA-AUTH-B01` | Password `min - 1 = 7` |
| `BVA-AUTH-B02` | Password `min = 8` |
| `BVA-AUTH-B03` | Password `min + 1 = 9` |

## Nguyen Tac BVA Theo Code Hien Tai

- Backend pagination dang dung zero-based page: `page=0` la hop le.
- Chi ghi `max page`, `max size`, `max keyword` neu code co validation hoac yeu cau SRS ro rang. Neu code chua chan, danh dau la **Gap** thay vi viet expected la loi.
- Frontend va backend dang lech password create-user: frontend cho `min=6`, backend yeu cau `min=8`. Test spec phai ghi ro day la **mismatch**.
- Cac file trong `backend/target/site/jacoco` la output sinh tu Maven/Jacoco, khong sua tay.

