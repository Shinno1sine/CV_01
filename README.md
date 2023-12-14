<p align="center">
  <a href="http://twinger.vn/" target="blank"><img src="https://twinger.vn/wp-content/themes/main/assets/images/logo_twinger.png" width="200" alt="Twinger Logo" /></a>
</p>

## Prerequisite

- VS Code's extensions:
  - EditorConfig
  - TODO Highlight
  - ESLint
  - Code Spell Checker

- Yarn: <https://yarnpkg.com/>

## Note

- Use `yarn` instead of `npm`.
- Don't forget to commit `yarn.lock` when you are adding new packages.

## How to Start

- `.env.development` copied from the wiki from the project's repository 
- Create `.env.development.local` from `.env.development` with your own modifications:

```sh
git config core.autocrlf false
```

```sh
cp .env.development{,.local}
```

## Installation

```bash
npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
# CV_01
