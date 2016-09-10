## Setup:
This project has **VERY** strict eslint rules. Adding eslint support to your text-editor will make contributing a lot easier.

### Atom
* https://atom.io/packages/linter-eslint
* https://atom.io/packages/linter-eslint
* https://atom.io/packages/language-babel

### Sublime
* https://github.com/SublimeLinter/SublimeLinter3
* https://github.com/roadhump/SublimeLinter-eslint
* https://github.com/babel/babel-sublime

## Development Tooling
The Redux devtools are hidden by default and can be shown with `ctrl + h`

## Dependencies
* All dependencies are `devDependencies`.

## Code Conventions:
* Code style:
 * Imports must have at least two lines after them
 * All function declarations and expressions must include parameter type annotations. Callbacks should not be annotated
 * All destructured imports should be broken down into new lines.
* Functional Programming
 * Use **pure functions** when possible
 * Use Array `.map`, `.reduce`, and `.filter` instead of for loops
 * Avoid all mutation, use the ES6 spread instead
* React
 * Use Higher Order Components when possible
 * Avoid `setState` as much as possible! Use **Redux** to update the state.

## FAQ
 * If your node process's heap runs out of memory (`CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory`), kill close the electron app and restart the electron process. A proper solution hasn't been found for this yet.
