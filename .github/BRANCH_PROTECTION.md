# Branch Protection Rules

This document outlines the branch protection settings that should be configured on GitHub.

## How to Configure

Go to: Repository Settings → Branches → Add rule (or edit existing)

---

## Rule for `main` Branch

### Branch name pattern
```
main
```

### Protection Rules

#### Protect matching branches
- ✅ **Require a pull request before merging**
  - ✅ Require approvals: **2**
  - ✅ Dismiss stale pull request approvals when new commits are pushed
  - ✅ Require review from Code Owners (if CODEOWNERS file exists)
  - ❌ Require approval of the most recent reviewable push

- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - Required status checks:
    - `build`
    - `lint` (if configured)
    - `test` (if configured)

- ✅ **Require conversation resolution before merging**
- ✅ **Require signed commits** (optional, recommended for security)
- ✅ **Require linear history** (prevents merge commits)
- ✅ **Include administrators** (enforce rules on admins)
- ❌ Allow force pushes
- ❌ Allow deletions

---

## Rule for `develop` Branch

### Branch name pattern
```
develop
```

### Protection Rules

#### Protect matching branches
- ✅ **Require a pull request before merging**
  - ✅ Require approvals: **1**
  - ✅ Dismiss stale pull request approvals when new commits are pushed
  - ❌ Require review from Code Owners

- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - Required status checks:
    - `build`

- ✅ **Require conversation resolution before merging**
- ❌ Require linear history (allow merge commits from feature branches)
- ✅ **Include administrators**
- ❌ Allow force pushes
- ❌ Allow deletions

---

## Setup Instructions

### Via GitHub Web Interface

1. Go to your repository on GitHub
2. Click **Settings** → **Branches**
3. Click **Add rule** (or edit existing)
4. Enter branch name pattern (`main` or `develop`)
5. Check the boxes as specified above
6. Click **Create** or **Save changes**

### Via GitHub CLI

```bash
# Install GitHub CLI if not already installed
# brew install gh (macOS)
# See https://cli.github.com for other platforms

# Authenticate
gh auth login

# Set up protection for main branch
gh api repos/apexphere/codekid-ai-chess-online/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["build"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":2,"dismiss_stale_reviews":true}' \
  --field restrictions=null \
  --field required_linear_history=true \
  --field allow_force_pushes=false \
  --field allow_deletions=false

# Set up protection for develop branch
gh api repos/apexphere/codekid-ai-chess-online/branches/develop/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["build"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false
```

---

## Additional Recommendations

### Create CODEOWNERS file
Create `.github/CODEOWNERS` to auto-assign reviewers:

```
# Global owners
* @apexphere

# Specific paths
/src/ @apexphere
/vite.config.js @apexphere
/package.json @apexphere
```

### Auto-delete head branches
Enable in Settings → General → Pull Requests:
- ✅ Automatically delete head branches

### Required workflows
Enable in Settings → Actions → General:
- ✅ Require status checks to pass before merging

---

## Troubleshooting

**Q: How do I push to main in an emergency?**
A: Temporarily disable branch protection (requires admin), push, then re-enable. Better: use hotfix branch.

**Q: CI check is failing but code is fine**
A: Fix the CI issue. Don't bypass checks.

**Q: Need to force push to clean history**
A: Only on feature branches. Never on main/develop.

**Q: Can't create branch protection rules**
A: Ensure you have admin access to the repository.

---

Last updated: 2025-09-30