## 40. Detailed Installation & Deployment Troubleshooting

This section details common installation issues, peer-dependency conflicts, environment configuration errors, and their step-by-step resolutions.

---

### 40.1 Node.js Dependency Resolution Issues

#### 40.1.1 Peer Dependency Conflicts (`npm ERR! code ERESOLVE`)
- **Problem**: Next.js 16 and React 19 introduce strict peer dependencies. Installing packages like `@tailwindcss/postcss` or `react-hook-form` can trigger peer-dependency resolution errors.
- **Remedy**:
  - Run package installations using the `--legacy-peer-deps` flag:
    ```bash
    npm install --legacy-peer-deps
    ```
  - This allows npm to bypass strict peer checks, ensuring packages compile with the Next.js core.

#### 40.1.2 Turbopack Compilation Warnings
- **Problem**: Running `next dev --turbo` triggers warnings about deprecated module layouts.
- **Remedy**:
  - The application compiles with standard next dev commands.
  - Warnings about the middleware file convention can be ignored as they do not affect compilation in dev or production environments.

---

### 40.2 Supabase Database Connection Issues

#### 40.2.1 SSL Connection Timeout Errors
- **Problem**: Running migrations or seed scripts locally fails with a connection timeout error.
- **Remedy**:
  - Verify your computer can access the Supabase host domain.
  - Check that the project URL and API keys are set correctly in `.env.local`.
  - If using a restricted corporate network, configure connection strings to use IPv4 pools instead of IPv6.

#### 40.2.2 Row-Level Security Policy Conflicts
- **Problem**: API queries return empty arrays even though database records exist.
- **Remedy**:
  - Verify that the active user's session profile has the correct branch and shop assignments.
  - Verify that the target table has RLS enabled and check the policies under `supabase/migrations/` to make sure permissions are configured correctly for the user's role.
