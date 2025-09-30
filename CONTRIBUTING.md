# Contributing to Chess Online

## Branching Strategy

We follow a **Git Flow** branching strategy to ensure stable releases and organized development.

### Branch Types

#### 1. **main** (Production)
- **Purpose**: Production-ready code only
- **Protection**: Protected branch, requires PR reviews
- **Deployment**: Auto-deploys to production
- **Direct commits**: ❌ NOT allowed

#### 2. **develop** (Integration)
- **Purpose**: Integration branch for features
- **Protection**: Protected, requires PR reviews
- **Deployment**: Auto-deploys to staging environment
- **Direct commits**: ❌ NOT allowed (except hotfixes)

#### 3. **feature/** (Feature Development)
- **Purpose**: New features and enhancements
- **Naming**: `feature/short-description`
- **Examples**:
  - `feature/add-timer`
  - `feature/player-profiles`
  - `feature/multiplayer-mode`
- **Created from**: `develop`
- **Merged into**: `develop`
- **Direct commits**: ✅ Allowed

#### 4. **bugfix/** (Bug Fixes)
- **Purpose**: Bug fixes during development
- **Naming**: `bugfix/short-description`
- **Examples**:
  - `bugfix/castling-validation`
  - `bugfix/pawn-promotion-ui`
- **Created from**: `develop`
- **Merged into**: `develop`
- **Direct commits**: ✅ Allowed

#### 5. **hotfix/** (Production Fixes)
- **Purpose**: Critical fixes for production issues
- **Naming**: `hotfix/short-description`
- **Examples**:
  - `hotfix/game-crash`
  - `hotfix/security-patch`
- **Created from**: `main`
- **Merged into**: `main` AND `develop`
- **Direct commits**: ✅ Allowed

#### 6. **release/** (Release Preparation)
- **Purpose**: Prepare for production release
- **Naming**: `release/v1.0.0`
- **Created from**: `develop`
- **Merged into**: `main` AND `develop`
- **Direct commits**: ⚠️ Only version bumps and minor fixes

## Workflow

### Starting a New Feature

```bash
# 1. Ensure you're on develop and up to date
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/my-new-feature

# 3. Work on your feature
git add .
git commit -m "feat: add new feature"

# 4. Push to remote
git push origin feature/my-new-feature

# 5. Create Pull Request to develop
```

### Fixing a Bug

```bash
# 1. Create bugfix branch from develop
git checkout develop
git pull origin develop
git checkout -b bugfix/fix-issue

# 2. Fix the bug
git add .
git commit -m "fix: resolve issue with..."

# 3. Push and create PR
git push origin bugfix/fix-issue
```

### Critical Production Hotfix

```bash
# 1. Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-fix

# 2. Apply fix
git add .
git commit -m "hotfix: critical fix for..."

# 3. Push and create PRs to BOTH main and develop
git push origin hotfix/critical-fix
```

### Preparing a Release

```bash
# 1. Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/v1.0.0

# 2. Update version in package.json
npm version minor

# 3. Test thoroughly and fix any issues
# (Commit only version bumps and critical fixes)

# 4. Merge to main via PR
# 5. Merge back to develop via PR
# 6. Tag the release on main
git checkout main
git pull origin main
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

## Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build process, dependencies, tooling
- **ci**: CI/CD changes

### Examples
```bash
feat(chess): add move timer functionality
fix(ui): correct pawn promotion dialog position
docs(readme): update installation instructions
refactor(board): simplify move validation logic
chore(deps): update vite to v6.3.6
```

## Pull Request Process

### 1. Before Creating PR
- ✅ Code builds successfully (`npm run build`)
- ✅ All tests pass (if applicable)
- ✅ Code follows project conventions
- ✅ Commit messages follow convention
- ✅ Branch is up to date with target branch

### 2. PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code builds without errors
- [ ] Self-reviewed code
- [ ] Updated documentation
- [ ] No console errors/warnings
```

### 3. Review Process
- Minimum 1 approval required for develop
- Minimum 2 approvals required for main
- All CI checks must pass
- No merge conflicts

### 4. Merging
- Use **Squash and merge** for feature branches
- Use **Merge commit** for release/hotfix to main
- Delete branch after merge

## Code Review Guidelines

### As a Reviewer
- ✅ Check code quality and readability
- ✅ Verify functionality matches description
- ✅ Look for potential bugs or edge cases
- ✅ Ensure proper error handling
- ✅ Check performance implications
- ✅ Verify commit message conventions

### As an Author
- ✅ Respond to all comments
- ✅ Make requested changes
- ✅ Re-request review after updates
- ✅ Keep PRs focused and reasonably sized
- ✅ Add context in PR description

## Environment Strategy

| Environment | Branch | URL | Auto-Deploy |
|-------------|--------|-----|-------------|
| Development | `feature/*` | Local | ❌ |
| Staging | `develop` | staging.chess-online.com | ✅ |
| Production | `main` | chess-online.com | ✅ |

## Quick Reference

```bash
# Clone repository
git clone https://github.com/apexphere/codekid-ai-chess-online.git

# Setup
npm install

# Start development
npm run dev

# Create feature branch
git checkout -b feature/my-feature

# Build
npm run build

# Create PR
gh pr create --base develop --title "feat: my feature"
```

## Need Help?

- Check existing PRs for examples
- Ask in team chat before creating unconventional branches
- Review this guide when unsure about workflow

---

**Remember**: Never commit directly to `main` or `develop`. Always use feature branches and pull requests!