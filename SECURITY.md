# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| 1.0.x | Yes |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability in DevFlow Suite, please report it privately by contacting:

**webkmsyed** — [github.com/webkmsyed](https://github.com/webkmsyed)

Include the following in your report:

- A description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Any suggested fix (optional)

You will receive a response within **72 hours**. If the issue is confirmed, a fix will be prioritized and released as soon as possible. You will be credited in the release notes unless you prefer to remain anonymous.

## Scope

DevFlow Suite is a **100% local** VS Code extension. It does not transmit any data externally, connect to any backend, or store credentials. The primary security surface is:

- Local file system read/write (pin snapshots, log exports)
- VS Code `globalState` storage (tasks, logs, settings)
- Webview panels (Timeline, Pins Manager, Notes)

## Out of Scope

- Vulnerabilities in VS Code itself or the VS Code Marketplace
- Issues related to the user's own workspace files
