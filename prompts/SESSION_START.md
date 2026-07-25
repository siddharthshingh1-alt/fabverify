# SESSION_START.md
> Paste this at the start of a Claude Code session (or rely on CLAUDE.md being read). It primes Claude Code with the right context before any work.

---

## PASTE THIS TO CLAUDE CODE AT SESSION START:

Before doing anything, read these files in order and confirm you've read them:
1. CLAUDE.md (how you must behave)
2. PROJECT_MEMORY.md (what already exists — never rebuild it)
3. DECISIONS.md (locked decisions — never silently reverse)
4. CURRENT_SPRINT.md + TASKS.md (what we're working on now)
5. CORE.md (the non-negotiable rules)

Then tell me:
- What is the current sprint focus?
- What's the top unstarted task?
- Any blockers noted?

Do NOT write code until I confirm the task. When I give you a task:
- Check PROJECT_MEMORY.md to confirm it isn't already built.
- Read the relevant docs/MODULES/*.md and docs/ARCHITECTURE/DATABASE.md.
- Follow docs/ARCHITECTURE/CODING_STANDARDS.md exactly.
- Route all DB access through app/lib/db.ts.
- Run `npm run build` before declaring done.
- Update PROJECT_MEMORY.md + CHANGELOG.md and write an accurate commit message.

Confirm you understand.
