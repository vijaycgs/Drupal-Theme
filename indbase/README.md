# INDBase styles

Edit theme styles in `scss/`. Sass compiles each SCSS file to the matching
file in `css/`. Drupal continues to load the existing CSS paths registered in
`indbase.libraries.yml`. Commit generated CSS alongside SCSS sources.

Install dependencies once:

```sh
ddev exec --dir /var/www/html/web/themes/custom/indbase npm ci
```

Build all styles:

```sh
ddev exec --dir /var/www/html/web/themes/custom/indbase npm run build
```

Watch while editing (Ctrl+C to stop):

```sh
ddev exec --dir /var/www/html/web/themes/custom/indbase npm run watch
```

The watcher polls for changes to support DDEV file synchronization.
Clear Drupal caches with `ddev drush cr` after building if CSS aggregation is
enabled, then refresh the browser.

Theme colors are centralized in `scss/_colors.scss`. Each stylesheet loads
the palette with `@use 'colors'` and references values such as
`colors.$primary`, `colors.$white`, and `colors.$modal-warning`.
Edit a palette variable and rebuild to update all its uses across the theme.
Typography is centralized in `scss/_fonts.scss`, loaded with `@use 'fonts'`.
Use `fonts.$family-body`, `fonts.$size-14px`, and `fonts.$weight-semibold`
for shared families, sizes, and weights. Full font shorthand presets preserve
their original line heights and reset behavior.
You can introduce nesting and additional underscore-prefixed partials as needed.
New standalone stylesheets must be registered in `indbase.libraries.yml`.
