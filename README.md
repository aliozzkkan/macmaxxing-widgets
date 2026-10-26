# MacMaxxing Widget Catalog

The public catalog of widget packages for [MacMaxxing](https://github.com/aliozzkkan/MacMaxxing).
This repository is the source of truth: every package lives in `packages/<id>/`, and a signed static
site is published from `main` to GitHub Pages at `https://aliozzkkan.github.io/macmaxxing-widgets/`.

## Layout

```
packages/<id>/            one widget package
  manifest.json           id, version, capabilities, network hosts, minimum host version
  views/*.json            Component Kit recipes (one per size, plus detail/settings)
  script.js               optional sandboxed script
  locales/<lang>.json     texts for all 16 app languages (widget.title and widget.summary included)
  release-notes.json      release notes by language (at least `en`)
registry/packages.json    ownership: { "<id>": { "owner", "official", "bundled" } }
revocations/              source of the signed revocation list
validator-ref             commit of the MacMaxxing repository whose `mxwidget` validates and publishes
.github/                  workflows, pull request template, report form
```

## How publishing works

1. You open a pull request that changes one `packages/<id>/` folder (a new id also adds one line to the registry).
2. `check.yml` validates it with the same `mxwidget validate` the app's developer mode and the CLI use.
   It has a read-only token and no credentials.
3. `automerge.yml` squash-merges the pull request when the check passed, only one package folder changed and
   you own the id. Everything else (registry edits for existing ids, revocations, workflows, validator pin)
   is reviewed by the maintainer.
4. `publish.yml` builds every package, signs the index (Ed25519, increasing `sequence`) and pushes the site to `gh-pages`.
   Published versions never change; publish a higher version to update.

The app downloads the signed index, verifies the signature and each package's SHA-256, and installs updates only after the
user approves them. Revoked packages are disabled by the app on its next refresh.

## Rules in short

- An id belongs to the first account that registered it; nobody else can update it. `app.macmaxxing.*` is reserved for the maintainer.
- A script may only use capabilities and network hosts that the manifest declares, and must declare everything it uses.
- No obfuscated code, no data collection beyond what the manifest and the user's consent allow.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the step by step guide, [PUBLISHING.md](PUBLISHING.md) for the one-time repository setup,
and the SDK documentation in the MacMaxxing repository (`docs/WIDGET_SDK.md`).

## Reporting a package

Use the "Report a widget package" form (Issues tab), or the report button on the package card in the widget library.
Confirmed reports lead to a revocation.

## License

MIT, see [LICENSE](LICENSE). Each package is contributed under the same license unless its folder says otherwise.
