# Security & Privacy

beckyOS is an open-source project that ships to strangers. Keeping it free of
secrets and personal data is everyone's job. This doc covers how to report
issues and how to keep commits clean.

## Reporting a security issue

Found a vulnerability or a leaked secret in the repo or its history? Please
**do not open a public issue.** Instead, open a private security advisory on the
project's GitHub page (Security → Advisories → "Report a vulnerability"). We'll
acknowledge within a few days and work with you on a fix and disclosure timeline.

## The two hard rules

1. **No secrets in commits.** No API keys, tokens, private keys, passwords, or
   `.env` files. Use environment variables and keep real values out of the repo.
2. **No personal data in commits.** This repo is public. Don't commit real
   names, emails, phone numbers, private domains, or internal codenames. Address
   the adopter generically as "you", or read their name from `becky.config.yaml`.

## The privacy scanner

A dependency-free scanner ships in `scripts/privacy-scan.mjs`. It walks the repo
and flags common secret patterns (OpenAI/Anthropic keys, AWS keys, bearer
tokens, JWTs, private-key headers, `*_KEY`/`*_SECRET`/`*_TOKEN` assignments) plus
personal-identity markers from an optional deny-list.

Run it any time:

```bash
node scripts/privacy-scan.mjs
```

It prints `file:line  [pattern]  snippet` for every hit, then a summary. It
exits `1` if anything is found and `0` if the repo is clean — so it works as a
gate in scripts and hooks.

### Personal deny-list (git-ignored)

To catch your own names, handles, and domains, copy the example and fill it in:

```bash
cp scripts/.privacy-deny.example scripts/.privacy-deny.local
# edit scripts/.privacy-deny.local — one regex per line
```

`scripts/.privacy-deny.local` is git-ignored, so your personal terms are never
committed. If it's absent, the scanner falls back to a small built-in set
(emails, phone-like numbers) so it still does something useful out of the box.

## Wire it as a pre-commit hook

Block commits that contain secrets or personal data. Create
`.git/hooks/pre-commit` (and make it executable with `chmod +x`):

```bash
#!/bin/sh
# Block commits that leak secrets or personal data.
node scripts/privacy-scan.mjs || {
  echo "privacy-scan found issues — commit blocked. Fix the hits above."
  exit 1
}
```

Prefer a managed setup? Add the same command to your Husky or
`pre-commit`-framework config. Either way, a clean scan should be a precondition
for every commit and every pull request.
