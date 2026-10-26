# Publishing the catalog (maintainer steps)

Nothing in this folder is published yet. These are the manual steps, to be done by the repository owner, in this
order. No step here has been run on your behalf; no repository exists, no key has been generated and nothing was pushed.

## 0. Before you start

- `validator-ref` must hold a commit of `aliozzkkan/MacMaxxing` that contains the `mxwidget` CLI and is reachable
  without authentication (the workflows check it out). Push that commit to the app repository first. If the app repository
  is private, make the validator available another way before continuing, otherwise `check.yml` and `publish.yml` cannot build it.
- Generate the signing key pair locally (the private key never leaves your machine and never goes into git):
  `swift run mxwidget keygen --out .local/catalog-signing/` (`.local/` is git-ignored).
  Embed the public key in `CatalogTrust.publicKeys` in the app and ship that app version before the first publish.

## 1. Create the repository

```sh
gh repo create aliozzkkan/macmaxxing-widgets --public
```

## 2. Push the catalog contents

From the MacMaxxing repository:

```sh
scripts/publish_catalog.sh --confirm
```

(run it without `--confirm` first: it is a dry run that prints the repository name and file count and runs no network command;
or copy the `Catalog/` folder to the root of the new repository yourself, then commit and push to `main`).

## 3. Repository settings (Settings in the browser)

- Actions > General: allow "Allow auto-merge"; workflow permissions "Read repository contents" by default
  (the workflows request what they need). For pull requests from forks, require approval for first-time contributors.
- Branches: protect `main` and require the status check `validate` (the job in `check.yml`).
- Pages: source = branch `gh-pages`, folder `/ (root)`.
- Optionally: require code owner review for `main` so registry, revocation and workflow changes always need you.

## 4. Add the signing secret

```sh
gh secret set CATALOG_SIGNING_KEY --repo aliozzkkan/macmaxxing-widgets < .local/catalog-signing/catalog-signing.key
```

Only `publish.yml` reads this secret. `check.yml` and `automerge.yml` never see it.

## 5. First publish and verification

Push to `main` (or re-run the `publish` workflow). When it finishes, verify the live index with the embedded trust:

```sh
curl -fsSO https://aliozzkkan.github.io/macmaxxing-widgets/index.json
curl -fsSO https://aliozzkkan.github.io/macmaxxing-widgets/index.json.sig
swift run mxwidget verify index.json index.json.sig
```

## 6. Back up and rotate

- Store the private key in your password manager (a lost key means a new app release to change the trusted key).
- For rotation, add the new public key as the second slot of `CatalogTrust.publicKeys`, ship that app, then switch the secret.

## Keeping the copies in sync

The app repository's `Catalog/` is a mirror. After the catalog repository exists, it is the source of truth;
use `scripts/sync_catalog.sh` before each app release.
