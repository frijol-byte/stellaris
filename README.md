# Stellaris Damage Calculator

A fan-made web calculator that compares Stellaris weapons, defenses, auxiliary components, and ship classes. Data was extracted from the original `Stellaris Damage Calcs.xlsx` spreadsheet.

Live features:

- Sortable, filterable weapon table (110 weapons)
- Toggle target (Shields / Armor / Hull) and metric (Average DPS, Day 1 damage, per slot, per alloy)
- Defense module comparison (54 components)
- Auxiliary module and ship class reference tables
- Single-page, zero build step, pure HTML + JS

## Run locally

Just open `index.html` in a browser, or serve the folder:

```
python -m http.server 8000
```

Then visit <http://localhost:8000>.

## Publish to GitHub Pages

1. Create a new GitHub repository, e.g. `stellaris-damage-calc`.
2. Copy the contents of this folder (`index.html`, `app.js`, `data.js`, `README.md`) into the repo.
3. Commit and push to the `main` branch.
4. On GitHub, open **Settings → Pages**.
5. Under **Build and deployment**, set **Source** to `Deploy from a branch`, **Branch** to `main` and folder to `/ (root)`, then **Save**.
6. Your site will be live at `https://<your-username>.github.io/<repo-name>/` in a minute or two.

If you'd rather use a `docs/` folder or a `gh-pages` branch, move the files accordingly and pick that option in the Pages settings.

## Updating the data

The numbers in `data.js` come straight from the spreadsheet. To refresh them, re-export the relevant sheets to JSON and replace the assignment in `data.js`:

```js
window.STELLARIS_DATA = { weapons: [...], utilities: [...], auxiliaries: [...], ships: [...] };
```

## Credits

- Data: the original `Stellaris Damage Calcs.xlsx` spreadsheet
- Stellaris is © Paradox Interactive. This is an unofficial fan project.
