# Contributing to meta-cli

Thank you for your interest in contributing to meta-cli! This document provides guidelines and instructions for contributing.

## Ways to Contribute

- Report bugs
- Suggest features
- Improve documentation
- Submit bug fixes
- Add new features (discuss first!)

## Before You Start

1. **Check existing issues/PRs** to avoid duplication
2. **For new features**, open an issue first to discuss the proposal
3. **Read the testing section** below

## Development Setup

### Prerequisites

- Node.js 22+
- npm 10+

### Setup Steps

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/meta-ads-cli.git
cd meta-ads-cli

# Install dependencies
npm install

# Set up environment variables for testing against real API (optional)
export META_ADS_ACCESS_TOKEN="your-token"
export META_ADS_ACCOUNT_ID="act_XXXXX"

# Run tests
npm test

# Build
npm run build

# Test the CLI locally
npx meta-cli --version
```

## Coding Standards

### TypeScript Style

- Use strict TypeScript mode (already configured)
- Prefer `const` over `let`, avoid `var`
- Use descriptive variable names
- Avoid `any` type — use `unknown` if needed
- Add types for function parameters and return values

### Commit Message Convention

Format: `<type>: <subject>`

Types:
- `feat:` New feature
- `fix:` Bug fix
- `test:` Test additions/changes
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `chore:` Maintenance tasks

Examples:
```
feat: add campaign duplication command
fix: handle missing daily_budget in campaign response
test: add edge case tests for targeting search
docs: update README with pages commands
```

## Testing Requirements

**All code contributions MUST include tests.**

### Running Tests

```bash
npm test             # Run all tests
npm run test:watch   # Run in watch mode
```

### Test Writing Guidelines

- Follow Arrange/Act/Assert pattern
- One assertion per test when possible
- Use descriptive test names: `it("should reject invalid account ID format", ...)`
- Mock external dependencies (`fetch`, `process.env`, Meta SDK)
- See existing tests in `src/__tests__/` for examples

### Test Coverage Expectations

- **New features**: Tests for new code
- **Bug fixes**: Add regression test reproducing the bug
- **Refactoring**: Maintain existing test coverage

## Submitting Changes

### Pull Request Process

1. Create a branch: `git checkout -b feat/your-feature`
2. Make changes and add tests
3. Ensure quality: `npm test && npm run build`
4. Commit with conventional message
5. Push and create PR via GitHub

### PR Requirements

- All tests pass
- Build succeeds
- Code follows project style
- Tests added for new functionality
- Documentation updated if applicable

## Code Review

- Initial review within 2-3 business days
- Be responsive to feedback
- Push updates to the same branch

## Getting Help

- **Questions**: Open a [GitHub Discussion](https://github.com/tackeyy/meta-ads-cli/discussions)
- **Bug Reports**: Open an [Issue](https://github.com/tackeyy/meta-ads-cli/issues)

---

Thank you for contributing to meta-cli!
