# Homepage theme tests

Run from `web/themes/custom/indbase` with Docker Desktop and the DDEV site running:

```powershell
npm.cmd test
npm.cmd run test:headed
npm.cmd run test:report
```

The suite uses anonymous visitors on the local homepage, with desktop Chrome and Pixel 5 viewport projects. It covers loading, overflow, branding, desktop navigation, mobile menu toggling, news titles/links, notification clipping, footer content, keyboard interactions, image loading, and visual regression. Desktop-only and mobile-only cases are skipped in the other project.

Screenshot baselines are in `theme.spec.js-snapshots`. Review these images before accepting them as the intended design. News titles/dates, the moving notification track, and embedded media are masked because they can change independently of styling. Generate and compare screenshots on the same operating system/browser version.

After an intentional visual change, review the report and update baselines:

```powershell
npm.cmd test -- --update-snapshots
```

Do not update snapshots simply to hide unintended regressions. Commit the baseline PNGs with the tests. News checks do not depend on exact headlines or item counts; the first link is requested to check that it resolves. The tests do not submit forms or change Drupal data.
