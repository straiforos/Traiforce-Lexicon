# Contributing to Traiforce-Lexicon

Thank you for your interest in contributing to **Traiforce-Lexicon**! This guide explains how to report issues, propose changes, and submit pull requests.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Report an Issue](#how-to-report-an-issue)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
  - [Modifying Existing Lexicons](#modifying-existing-lexicons)
  - [Adding New Lexicons](#adding-new-lexicons)
  - [Updating Documentation](#updating-documentation)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Lexicon Design Guidelines](#lexicon-design-guidelines)

---

## Code of Conduct

By participating in this project, you agree to treat all contributors with respect. Please keep discussions constructive and inclusive.

---

## How to Report an Issue

1. Search [existing issues](https://github.com/straiforos/Traiforce-Lexicon/issues) to avoid duplicates.
2. Open a [new issue](https://github.com/straiforos/Traiforce-Lexicon/issues/new) and include:
   - A clear, descriptive title.
   - A summary of the problem or proposal.
   - Relevant context (e.g., which lexicon is affected, links to ATproto documentation).

---

## Development Setup

No build toolchain is required. The lexicons are plain JSON files and the documentation is Markdown.

```bash
# Clone the repository
git clone https://github.com/straiforos/Traiforce-Lexicon.git
cd Traiforce-Lexicon
```

To validate lexicon JSON syntax, use any JSON linter or your editor's built-in validator. For example, using Node.js:

```bash
node -e "JSON.parse(require('fs').readFileSync('lexicons/net/traiforce/actor/profile.json', 'utf8'))"
```

---

## Making Changes

### Modifying Existing Lexicons

1. Edit the relevant `.json` file under `lexicons/`.
2. Validate that the file is valid JSON.
3. Confirm that the change is backward-compatible wherever possible. Breaking changes (removing required fields, changing field types) require discussion in an issue first.
4. Update the corresponding documentation in `docs/architecture/` if the change affects the architecture or field descriptions.

### Adding New Lexicons

1. Follow the [ATproto Lexicon schema specification](https://atproto.com/specs/lexicon).
2. Place the new file under `lexicons/net/traiforce/<namespace>/<record-name>.json`.
3. Use the `net.traiforce` namespace prefix for all new records.
4. Add a description of the new lexicon to `docs/architecture/02-lexicon-specifications.md`.
5. Update the repository structure in `README.md` if a new directory is created.

### Updating Documentation

Documentation lives in `docs/architecture/`. Each file covers a specific aspect of the protocol:

| File | Topic |
|---|---|
| `01-protocol-architecture.md` | Tripartite data model |
| `02-lexicon-specifications.md` | Core record definitions |
| `03-access-workflow.md` | End-to-end access sequence |
| `04-security-privacy.md` | Security and privacy mechanisms |
| `05-system-overview.md` | High-level component diagram |

All diagrams use [Mermaid](https://mermaid.js.org/) syntax. Keep them consistent with the existing style.

---

## Submitting a Pull Request

1. Fork the repository and create a branch from `main`:
   ```bash
   git checkout -b feature/my-change
   ```
2. Make your changes following the guidelines above.
3. Commit with a clear, descriptive message:
   ```bash
   git commit -m "lexicon: add expiry validation notes to actor.grant"
   ```
4. Push your branch and open a pull request against `main`.
5. Fill in the pull request template with a description of your changes and any relevant context.

All pull requests require at least one review before merging.

---

## Lexicon Design Guidelines

- **Namespace**: All Traiforce records must use the `net.traiforce` namespace.
- **Field names**: Use `camelCase` for all field names.
- **Required fields**: Only mark fields as `required` when the record is meaningless without them.
- **Optional fields**: Document the default behavior when an optional field is absent (e.g., a missing `expiry` means the grant never expires).
- **Formats**: Use ATproto built-in formats (`did`, `uri`, `datetime`, `at-uri`) wherever applicable.
- **Descriptions**: Every field must have a `description` that explains its purpose and any constraints.
- **Backward compatibility**: Prefer adding optional fields over removing or renaming existing ones.
