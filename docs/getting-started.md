# Getting started

In this guide we will create a Vite-based (strongly recommended build tool) application with Flexipanel under-the-hood.

First you should create an empty folder for the application.

## Base code

Create an `index.html` with the following contents:

```html
<!DOCTYPE html>
<html lang="ru">

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Loading...</title>
  <!-- Add font link if you want to customize font -->
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
  <!-- Add Font Awesome or some other icon library if you want to use icons -->
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css" rel="stylesheet">
  <!-- Add Bootstrap (CSS only, JS is not used) -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.0/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-gH2yIJqKdNHPEq0n4Mqa/HGKIhSkIHeL5AyhkYV8i59U5AR6csBvApHHNl/vI1Bx" crossorigin="anonymous">
  <!-- Link to your entry point -->
  <script type="module" src="/src/main.ts"></script>
</head>

<body>
	<div id="app"></div>
</body>

</html>
```

Create `src/main.ts` file. There we will bootstrap our application with Flexipanel:

```typescript
import App from 'flexipanel/dist/main';

// here is a control and customization API for your dashboard
const app = new App();

// ...
// this section is covered in other parts of the docs
// ...

// this shows an application to the user and actually bootstraps it
app.mount('#app');
```

## Build

Now we are ready to build the application.

Install dependencies:

```bash
npm i flexipanel typescript vite vite-plugin-html
```

Add `vite.config.ts` file to configure a build:

```typescript
import { defineConfig } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';

export default defineConfig(({ command }) => ({
	plugins: [createHtmlPlugin()],
}));
```

Add some useful scripts to the `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "serve": "vite preview",
  }
}
```

* `npm run dev` starts dev-server for the application
* `npm run build` makes a ready-to-deploy production build in `dist` directory
* `npm run serve` runs a static server to test your production build locally

From now you are all-set to [integrate your own backend API](./setup-api.md) with the UI provided by Flexipanel.
