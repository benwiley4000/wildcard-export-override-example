# wildcard-export-override-example

This repo presents a minimal example, of a situation that exists in current JavaScript implementations where "double-exports" via wildcard are considered untreatable. In the accompanying files is a minimal demonstration which can be run in a browser. In this file is a more illustrative description of the problem.

Let's you're relying on a widely popular library of design icons in your application. Your organization has decided to base their design on this icon library but also to create a handful of overrides that better suit the use case.

The base library looks like this:

```js
// base-library.js
export const bookmarkIcon = 'someSvgContent';
export const menuIcon = 'someSvgContent';
export const hourglassIcon = 'someSvgContent';
export const globeIcon = 'someSvgContent';
export const searchIcon = 'someSvgContent';
```

Your library meanwhile has a couple of custom icons with the same names, to be used as replacements:

```js
// our-library.js
export const hourglassIcon = 'someCustomSvgContent';
export const searchIcon = 'someCustomSvgContent';
```

So now you can write some code in your app that uses icons from both libraries!

```jsx
// Using React as an example

import { menuIcon, globeIcon } from 'base-library';
import { hourglassIcon } from 'our-library';

<Icon svg={menuIcon} />
<Icon svg={globeIcon} />
<Icon svg={hourglassIcon} />
```

The trouble is, a couple of days later the designers decide to add another override, for the `globeIcon` export. Now you need to go into your code to change the import source for the `globeIcon`:

```js
import { menuIcon } from 'base-library';
import { hourglassIcon, globeIcon } from 'our-library';
```

But wouldn't it be nice if all the icons came from the same place, so all you had to do was just update the package version?

You think your designers might decide to add even more icon overrides in the future. In order to alleviate the burden of the development team needing to keep track of which icons should be imported from which packages when the designers make updates, you decide to have your downstream package first export the icons from the base library, then the custom icons, so the developers can rely on a single package for icons, which may receive updates in the form of additional releases, without much fanfare.

Your new, improved library's entry point looks like this now:

```js
// index.js (our-library)

// for simplicity let's pretend it's in the same directory
export * from './base-library.js';

// although hourglassIcon and searchIcon are available from base-library,
// we want them to be overriden by the subsequent exports from our-library
export * from './our-library.js';
```

You decide to keep the old `'our-library.js'` file since you might still need to reference the full list of custom icons without referencing the upstream library.

Just one problem: the last code snippet won't compile! You find TypeScript and Babel won't accept this code because they consider it ambiguous what the exported values of `hourglassIcon` and `searchIcon` should be, since they're implicitly re-exported without being named in the file which combines those exports. In the browser, you find that the code will run, but the `hourglassIcon` and `searchIcon` exports are stripped out- nowhere to be found.

## are there workarounds?

One thing you can do is to just export the overrides explicitly in the index file:

```js
// index.js (our-library)

export * from './base-library.js';

export {
  hourglassIcon,
  globeIcon,
  searchIcon
} from './our-library.js';
```

The main reason not to do the above is that it's annoying, for one of two reasons:
1. Now you have to maintain this list in two different places, or
2. If your list is kept in the main index file, now you no longer have an export file containing *only* your library's own exports.

Another workaround is to export a merged object instead of naming separate exports:

```js
// index.js (our-library)

import * as baseLibrary from './base-library.js';
import * as ourLibrary from './our-library.js';

export default {
  ...baseLibrary,
  ...ourLibrary
};
```

This way you're also making it a bit more clear that some exports from baseLibrary might be overridden by ourLibrary.

However there are some important drawbacks:
1. Named imports are no longer available from your app (e.g. `import { globeIcon } from 'our-library'`). You'll need to read a single `ourLibrary` import and read properties off of it (Babel might let you get away with pretending these are named imports, for historical reasons, but this isn't part of the JavaScript spec).
2. A module bundler like Webpack or Rollup won't be able to apply tree-shaking (removing unused modules) to your library import, so you'll end up downloading stuff you aren't using. This could add up to a lot, especially if your merged export includes thousands of icons from the upstream library, and you're only using a few of them. The nice thing about named JavaScript exports is that a static analyzer can figure out if you're not really using them, but as soon as you assign a wildcard import to a saved value somewhere, all bets are off for that part of the bundle.

## are "ambiguous exports" always bad?

Clearly browser and compiler vendors have decided double-exports are undesirable because of potential cases of ambiguity, where an export has accidentally been replaced by another of the same name, which may have totally different behavior.

However it appears to be that these exports should at least be resolvable in a deterministic way from the standpoint of the compiler. It's a shame we're currently unable to support cases like the one I demonstrated earlier, where a downstream complement library wants to re-export the upstream library's exports by default, but offer its own override exports in a number of cases.

## about the accompanying files

You can test the example in the browser by running:

```console
npx http-server -o
```

And opening the developer console to see the output. In browsers that I've tested, "double-exports" get stripped but the code continues uninterrupted. In TypeScript and Babel, they cause the compiler to fail altogether. You will see, if you comment out any double-exports in the source files and refresh the browser, more values will appear for the second log. Make sure the "disable cache" option is checked in the browser dev tools' network tab.
