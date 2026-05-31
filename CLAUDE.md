# CLAUDE.md

This file provides guidance when working in `/home/ubuntu/repos/private-kit`.

## Overview

`private-kit` is a parent workspace that groups two different assets side by side:

- `enviroment/`
  - Environment setup assets for WSL Ubuntu, EC2 Ubuntu, and Amazon Linux
- `starter/`
  - Reusable starter kits for new projects

This root directory is not the canonical implementation home for either area. Treat it as an entrypoint and navigation layer.

## How To Work Here

1. Decide which subtree you are changing first.
2. Read that subtree's local guides before editing:
   - `enviroment/README.md`, `enviroment/AGENTS.md`, `enviroment/CLAUDE.md`
   - `starter/README.md`, `starter/AGENTS.md`, `starter/CLAUDE.md`
3. Keep root-level docs short and structural.
4. When cross-linking the two areas, update both sides if paths or naming change.

## Directory Layout

```text
private-kit/
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── .gitignore
├── enviroment/
│   ├── README.md
│   ├── AGENTS.md
│   ├── CLAUDE.md
│   ├── docs/
│   ├── env/
│   ├── platform/
│   └── script/
└── starter/
    ├── README.md
    ├── AGENTS.md
    ├── CLAUDE.md
    ├── docs/
    ├── optional/
    ├── script/
    ├── starters/
    └── tools/
```

## Root-Level Rules

- Do not describe `enviroment/` as if it were the whole repository.
- Do not describe `starter/` as if it were the whole repository.
- Keep secrets, tokens, and personal local settings out of version control.
- Prefer updating the nearest local documentation rather than expanding this root file.

## Notes

- `enviroment/` and `starter/` have different goals and different local conventions.
- If guidance conflicts, the more local document should usually win.
