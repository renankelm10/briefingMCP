# Code signing (free, via SignPath Foundation)

Unsigned Windows installers trigger the SmartScreen warning *"Windows protected your PC"*.
[SignPath Foundation](https://signpath.org) signs open-source projects for free, with a certificate
issued to the Foundation, and the release workflow is already prepared for it.

## 1. Apply (maintainer, once)

1. Read the [conditions](https://signpath.org/terms) — the project must be OSI-licensed (MIT ✓),
   publicly built from source (GitHub Actions ✓) and free of malware/PUP behavior.
2. Submit the application at **https://signpath.org/apply** with:
   - Repository: `https://github.com/renankelm10/briefingMCP`
   - Build system: GitHub Actions — workflow `.github/workflows/release.yml`
   - Artifact: NSIS installer `release/Briefing-Setup-<version>.exe`
3. When approved, SignPath creates an organization and a project for Briefing.

## 2. Configure SignPath (web UI)

1. **Trusted build system**: add GitHub.com and link this repository.
2. **Artifact configuration** for the project: a ZIP containing one PE file
   (`Briefing-Setup-*.exe`) signed with Authenticode. The default configuration usually works.
3. **Signing policy**: create `release-signing` (the Foundation policy may require manual approval
   of each request — you approve it in the SignPath dashboard or by e-mail).
4. Create an **API token** for a CI user with *submitter* permission on the project.

## 3. Configure the GitHub repository

*Settings → Secrets and variables → Actions*

| Type | Name | Value |
|---|---|---|
| Secret | `SIGNPATH_API_TOKEN` | the API token from step 2.4 |
| Variable | `SIGNPATH_ORGANIZATION_ID` | your organization ID (UUID shown in SignPath) |
| Variable | `SIGNPATH_PROJECT_SLUG` | e.g. `briefing` |
| Variable | `SIGNPATH_SIGNING_POLICY_SLUG` | e.g. `release-signing` |

## 4. Release

```bash
git tag v0.3.1
git push origin v0.3.1
```

The Windows job uploads the unsigned installer, waits for SignPath to sign it and attaches the
**signed** `.exe` (plus `SHA256SUMS-Windows.txt`) to the draft release. Without the secret the
workflow keeps working and publishes an unsigned installer.

## macOS

Apple requires a paid Apple Developer membership (US$ 99/year) for Developer ID signing and
notarization; there is no free equivalent. Until then, users open the app with right-click → **Open**.
