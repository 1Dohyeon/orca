# Orca (custom fork)

This repository is a personal fork of [stablyai/orca](https://github.com/stablyai/orca) for custom changes.
For Orca's overview, installation, and features, see the [upstream README](https://github.com/stablyai/orca#readme).

## Branches

| Branch                  | Purpose                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------- |
| `main`                  | Kept identical to upstream `stablyai/orca` `main`. No direct commits.                 |
| `develop`               | Holds personal customizations. The custom app is built from this branch.              |
| `feat/*`, `fix/*`, etc. | Upstream contributions. Created from `main`, with PRs opened against `stablyai/orca`. |

## Syncing Upstream

1. Fast-forward `main` to `upstream/main`.
2. Rebase `develop` onto `main` and resolve conflicts with the customizations.

See [CLAUDE.md](CLAUDE.md) for the detailed procedure.

## License

[MIT License](LICENSE), same as upstream.
