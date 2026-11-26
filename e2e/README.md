# E2E tests (Playwright)

About 170 tests across every role: page smoke checks (render, no crash screen, no console errors, no API 5xx),
the role-access matrix, key flows, and regressions for the WF-01 fixes.

## Before running

1. Java BE running on `http://localhost:8080` against the **dev DB** (`run-historytalk.ps1`, or `mvn spring-boot:run`).
   The suites create schools, classes, teachers and students. Never point them at production.
2. The AI service is **not** needed: chat and AI calls are mocked in `support/ai-mock.ts`.
3. One-time: `npx playwright install chromium`.

## Run

```bash
npm run e2e                                   # build FE, serve on :3456, run everything
E2E_SKIP_BUILD=1 npm run e2e                  # reuse the existing .next build
npm run e2e -- --project=school-admin         # one role
npm run e2e -- -g "FE-WF1"                    # only the WF-01 regressions
npm run e2e:report                            # open the last HTML report
```

## How it works

- `auth.setup.ts` creates a test school on first run (school admin, teacher, class `10E2E`, 2 students), using the
  seeded System Admin. It then logs every role in through the real login form and saves the sessions to
  `e2e/.auth/` (git-ignored). Later runs reuse that school while its accounts still log in.
- Seeded accounts: `systemadmin@historytalk.com`, `contentadmin@historytalk.com`, `customer@gmail.com`
  (password `123456789`). Override them with the `E2E_*` variables in `support/env.ts`.
- Projects: `public`, `rbac`, `system-admin`, `content-admin`, `customer`, `school-admin`, `teacher`, `student`.
