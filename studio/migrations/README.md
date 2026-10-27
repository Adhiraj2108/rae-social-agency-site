# Webflow → Sanity import (already done)

`webflow-export/` holds the Webflow CMS content (JSON + images) as it was on 27 Oct 2026.
It was imported into the `production` dataset on 28 Oct 2026. **Do not run it again**:
documents get new IDs, so a second import duplicates every item.

To rebuild the dataset from scratch (e.g. into a new, empty dataset):

```bash
cd studio
node migrations/build-import.mjs                                   # writes webflow-import.ndjson
npx sanity dataset import migrations/webflow-import.ndjson <dataset>  # uploads images too
```
