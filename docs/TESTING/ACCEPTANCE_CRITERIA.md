# TESTING: ACCEPTANCE_CRITERIA
> A feature is "done" only when ALL are true.

## DEFINITION OF DONE
1. Behavior matches docs/PRODUCT/USER_TYPES.md for that feature.
2. All DB access via db.ts; real columns (DATABASE.md).
3. loading + empty + error states handled.
4. Unique keys; API validation + try/catch + getErrorMessage; async params.
5. No secrets exposed; no raw IDs stored; migration-ready.
6. If money: no funds held by FabVerify; release on verified milestone only.
7. npm run build passes zero TS errors.
8. Manually tested: happy/empty/error/wrong-type/mobile; console clean.
9. PROJECT_MEMORY.md + CHANGELOG.md updated; accurate commit.

## RULE
If any item fails, it's not done — regardless of how it looks.
