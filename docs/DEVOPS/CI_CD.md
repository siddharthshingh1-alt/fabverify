# DEVOPS: CI_CD
## CURRENT
Vercel build-on-push is the pipeline. Build must pass (TS zero-error) or deploy fails.

## RECOMMENDED ADDITIONS (as project grows)
- Pre-push: npm run build + lint locally.
- GitHub Actions: run build + type-check + tests on PR.
- Block merge to main if build/tests fail.
- Preview deployments per PR (Vercel provides these).

## RELEASE FLOW
Feature branch → build passes → PR → review (REVIEW_RULES/CODE_REVIEW_RULES) → merge to main → auto-deploy → verify live → update CHANGELOG/PROJECT_MEMORY.
