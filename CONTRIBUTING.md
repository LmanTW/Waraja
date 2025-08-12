# Contributing

Please follow this guideline when contributing!

- [Developing](#developing)
- [Commit Message](#commit-message)
- [Pull Request Message](#pull-request-message)

## Developing

> [!NOTE]
> Requirements: [Bun](https://bun.sh), [Rust](https://www.rust-lang.org).

1. Clone the repository.

```bash
git clone https://github.com/LmanTW/Waraja.git
cd Waraja
```

2. Install the dependencies.

```bash
bun install
```

3. Run Waraja in development mode with live-reloading.

```bast
bun run start
```

## Commit Message

Use the following format when writing a commit message:

```
<type>: <message>
```

> [!NOTE]
> The scope is optional, in most cases you wouldn't need this.

Use the following rules to determine the type of your commit:

- **feat**: When something is added.
- **fix**: When something is fixed.
- **perf**: When the performance of something is improved.
- **chore**: When something is changed but is doesn't match anything above.
- **style**: When the style of the code is changed but no logic is changed.
- **refactor**: When the structure of the code is changed but no logic is changed.
- **docs**: When some documentation is changed.

## Pull Request Message

The same as [Commit Message](#commit-message).
