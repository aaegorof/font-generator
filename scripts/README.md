# Scripts

Utility scripts for Font Generator project.

## Available Scripts

### test-google-oauth.sh

Automated test script for Google OAuth configuration.

**Usage**:

```bash
./scripts/test-google-oauth.sh
```

**What it checks**:

- ✅ Auth service health
- ✅ Google OAuth provider status
- ✅ Config.toml configuration
- ✅ Environment variables

**When to run**:

- After configuring Google OAuth credentials
- Before testing OAuth flow
- When troubleshooting OAuth issues

**Output**:

- Color-coded results (green ✅, red ❌, yellow ⚠️)
- Clear error messages with solutions
- Next steps and verification commands

**Documentation**: See [docs/GOOGLE_OAUTH_SETUP.md](../docs/GOOGLE_OAUTH_SETUP.md)

---

## Adding New Scripts

When adding new scripts to this directory:

1. Make them executable: `chmod +x scripts/your-script.sh`
2. Add a shebang: `#!/bin/bash`
3. Include error handling: `set -e`
4. Document in this README
5. Add usage examples
