# Simple Register Component for Community Solid Server

A component that adds a simplified registration form to the [Community Solid Server](https://github.com/CommunitySolidServer/CommunitySolidServer/) (CSS). This component automatically creates a pod and WebID for new users in one step.

## Features

- One-step registration process
- Automatic pod and WebID creation
- Seamless integration with CSS



## local test run

```
 git clone ...
 npm i
 npm build
 npm run start
 firefox http://localhost:3000/.account/login/password/register-with-pod/
```
## add it to a recipe

On your recipe folder:

```
npm install --save css-simple-register-component
```

Then merge the following to your `config.json`

```
{
  "@context": [
    "https://linkedsoftwaredependencies.org/bundles/npm/@solid/community-server/^7.0.0/components/context.jsonld",
    "https://linkedsoftwaredependencies.org/bundles/npm/simple-register-module/^7.0.0/components/context.jsonld"
  ],
  "import": [
    "simple-register:config/simple-register-partial.json"
  ]
}
```



## Installation

1. Install the package:
```bash
npm install css-simple-register-component
```

2. Add the component to your server configuration, either by creating json file with the following, and adding it to your start script, 
either by merging the following to you `config.json` file:
```json
{
  "@context": [
    "https://linkedsoftwaredependencies.org/bundles/npm/@solid/community-server/^7.0.0/components/context.jsonld",
    "https://linkedsoftwaredependencies.org/bundles/npm/css-simple-register-component/^7.0.0/components/context.jsonld"
  ],
  "import": [
    "@simple-register:simple-register-partial.json"
  ]
}
```

## Usage

Just go to the registration page, and see the new 'Podname' field.

## TODO

 - [ ] add test
  - [ ] make combination ( already existing pod, already existing email etc.. )
 - [ ] change hardcoded link in landing page to /register-with-pod/ ( PR upstream ? )
