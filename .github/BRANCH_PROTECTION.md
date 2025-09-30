# Branch Protection Rules

This document outlines the simplified branch protection settings configured on GitHub.

## Current Configuration

Both `main` and `develop` branches have minimal protection to allow solo development while maintaining code quality.

---

## Rule for `main` Branch

### Branch name pattern
```
main
```

### Protection Rules

#### Protect matching branches
- ❌ **Require a pull request before merging** (Optional - can push directly)

- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - Required status checks:
    - `build` (must pass on Node 18.x and 20.x)

- ❌ **Require conversation resolution before merging**
- ❌ **Require linear history**
- ❌ **Include administrators** (allows admin bypass if needed)
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
- ❌ **Require a pull request before merging** (Optional - can push directly)

- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - Required status checks:
    - `build` (must pass on Node 18.x and 20.x)

- ❌ **Require conversation resolution before merging**
- ❌ **Require linear history**
- ❌ **Include administrators** (allows admin bypass if needed)
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
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "checks": [{"context": "build"}]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "required_conversation_resolution": false,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF

# Set up protection for develop branch
gh api repos/apexphere/codekid-ai-chess-online/branches/develop/protection \
  --method PUT \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "checks": [{"context": "build"}]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "required_conversation_resolution": false,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

---

## Notes

- PRs are optional but recommended for tracking changes
- No approval required - you can merge your own PRs once build passes
- The `build` check ensures code compiles on Node 18.x and 20.x
- Branch protection can be adjusted later as the project grows

---

Last updated: 2025-09-30