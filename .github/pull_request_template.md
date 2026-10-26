## Package

- Package id: `<id>`
- Version: `x.y.z`
- New package or update: <!-- new / update -->

## What changed

<!-- One or two sentences. Release notes for users go in `packages/<id>/release-notes.json`. -->

## Checklist

- [ ] My pull request touches exactly one `packages/<id>/` folder.
- [ ] `mxwidget validate packages/<id>` reports no findings on my machine.
- [ ] The version in `manifest.json` is higher than the published one (a published version never changes).
- [ ] `locales/<lang>.json` exists for all 16 languages and `release-notes.json` has at least `en`.
- [ ] Every capability and network host the script uses is declared in `manifest.json`, and nothing else.
- [ ] New package only: I added one entry for my id to `registry/packages.json` (`owner` = my GitHub login, `official` false, `bundled` false).
- [ ] I did not include secrets, personal data or minified/obfuscated code.

Pull requests that change only one package you own are checked and merged automatically.
Registry, revocation, workflow and validator-pin changes are reviewed by the maintainer.
