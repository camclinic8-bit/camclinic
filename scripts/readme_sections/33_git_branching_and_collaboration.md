## 39. Git Branching Strategy & Developer Collaboration

This section documents the git workflows, branch guidelines, code review standards, and CI/CD processes used by the engineering team.

---

### 39.1 Git Branching Model
The repository uses a branching model based on GitFlow to organize development tasks:

- **\`master\`**: The production-ready branch. Code on this branch must be stable, fully audited, and passed through all build verification checks.
- **\`abijithcb\`**: The primary staging/integration branch used for staging updates, layout fixes, and testing features before merging to production.
- **Feature Branches (\`feature/...\` or \`bugfix/...\`)**: Local developer branches created for specific tasks (such as layout modifications, new components, or API fixes).

```
[ feature/jobs-scroll-fix ] -------> ( Local Testing ) -------> [ Pull Request ]
                                                                      |
                                                                      v
[ abijithcb ] <------------------------------------------------ Merge Staged
      |
      v
[ master (Production) ]
```

---

### 39.2 Deployment & Integration Pipeline (CI/CD)

The application uses Vercel and Supabase CLI integration pipelines to automate deployments:

1. **Pre-commit Hooks**:
   - Runs `npm run lint` and TypeScript compilation checks (`npx tsc --noEmit`) to catch type errors and style discrepancies before commits are saved.
2. **Automated Preview Deployments**:
   - Pushing changes to feature branches or the staging branch triggers automatic preview builds on Vercel.
   - Preview URLs are posted to pull request threads, allowing managers to verify UI changes.
3. **Database Schema Migrations**:
   - Changes to the PostgreSQL schema are prepared as SQL migration scripts under `supabase/migrations/`.
   - Before pushing code updates to production, migrations are verified locally and applied to the database:
     ```bash
     supabase db push
     ```
4. **Production Releases**:
   - Merging changes to the `master` branch triggers the production build pipeline.
   - Vercel compiles and optimizes assets, deploying the updated build to the live domain.
