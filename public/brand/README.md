# Brand assets

`nirvona-logo.svg` in this folder is a **temporary placeholder mark**.

To use the official Nirvona logo across the entire product, drop the original
artwork here and point `LOGO_SRC` at it:

```
public/brand/nirvona-logo.svg   ← replace this file (or add nirvona-logo.png)
src/components/brand/logo.tsx   ← LOGO_SRC constant, single line
```

The `<Logo />` component renders the artwork untouched — no recolouring, cropping
or filtering is applied anywhere in the codebase. Every surface (navbar, footer,
both dashboard sidebars, auth screens, admit card, receipt, empty states) reads
from that one constant, so replacing the file updates the whole application.

The mark is rendered on white or on a white "chip" on dark backgrounds, so the
original full-colour artwork stays legible without modification.
