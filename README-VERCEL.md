# Vercel Build Guard

This project uses `scripts/vercel-build-filter.sh` as the Vercel `ignoreCommand`.

This repo uses a default-deny build policy to control Vercel build-minute usage.

Builds are allowed only when:

- the commit message contains `[build]`
- the commit message starts with `release:`
- the commit message starts with `hotfix:`

All other Git-triggered commits are skipped by default.

Examples:

- `feat: fix layout copy` -> skipped
- `release: deploy ERP patch` -> build allowed
- `feat: deploy ERP patch [build]` -> build allowed

If Vercel runs a deployment without a Git commit message, the build is allowed.
