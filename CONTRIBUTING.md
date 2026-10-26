# Contributing a widget package

## 1. Build and check locally

Build the validator from the MacMaxxing repository at the commit in `validator-ref`:

```sh
git clone https://github.com/aliozzkkan/MacMaxxing.git
cd MacMaxxing && git checkout "$(cat ../macmaxxing-widgets/validator-ref)"
swift build -c release --product mxwidget
```

Then, from this repository:

```sh
mxwidget validate packages/<id> --registry registry/packages.json --submitter <your-github-login>
```

This is exactly what the pull request check runs. Add `--screenshots <dir>` to render every size.

## 2. Create or change a package

- Copy `templates/starter/` from the MacMaxxing repository (or an existing package) to `packages/<id>/`.
- `id` is a reverse-DNS style name you control, for example `io.github.<login>.timer`. `app.macmaxxing.*` is reserved.
- Raise `version` for every change. A published version is immutable; the check fails if its bytes differ.
- Provide `locales/<lang>.json` for all 16 languages with identical keys (`widget.title` and `widget.summary` are required).
- Provide `release-notes.json` with at least `en`.
- Declare in `manifest.json` every capability and network host the script uses, and nothing more.

## 3. New package: register the id

Add one entry to `registry/packages.json` in the same pull request:

```json
"io.github.you.timer": { "owner": "you", "official": false, "bundled": false }
```

`owner` must be the GitHub login that opens the pull request.

## 4. Open the pull request

Change one `packages/<id>/` folder per pull request. If the check passes and you own the id, it merges by itself and the
site is republished within a few minutes. If it needs a human (registry edits for an existing id, anything outside your
package folder), the maintainer reviews it.

## Updating and removing

Updates are new versions, merged the same way. To withdraw a package or version, open a report issue; the maintainer
revokes it through `revocations/revoked.source.json`, and the app disables it on the next refresh.
