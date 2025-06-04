# Moving Again Car Transport Site

This project contains the new Astro based build of the **Moving Again** car transport website.
It uses [Astro](https://astro.build), Tailwind CSS and a small set of helper scripts to migrate
and enhance content from the previous site.

## Getting Started

1. Install dependencies and download the required fonts:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

   The site will be available at `http://localhost:4321`.

3. Create a production build with:

   ```bash
   npm run build
   ```

4. Preview the build locally using:

   ```bash
   npm run preview
   ```

## Available Scripts

The repository includes several utilities for working with the site content.

| Script | Description |
| ------ | ----------- |
| `npm run dev` | Start the Astro development server. |
| `npm run build` | Build the site to the `dist` directory. |
| `npm run preview` | Preview the production build locally. |
| `npm run migrate` | Convert pages from the old PHP site into JSON route files in `src/content/routes`. |
| `npm run test-route` | Run the migration on a single example route for quick testing. |
| `npm run enhance-content` | Use a local [Ollama](https://ollama.ai) installation to enhance all JSON content files. |
| `npm run enhance` | Enhance content using the Ollama HTTP API instead of the local CLI. |
| `npm run download-fonts` | Download the webfonts used by the site. This runs automatically after `npm install`. |

Additional helper scripts can be found in the `scripts/` directory, including a
shell script for generating social images (`create-social-images.sh`).

## Project Structure

- `src/` – Site source files: pages, components, layouts and styles.
- `src/content/routes/` – JSON data for each dynamic route.
- `public/` – Static assets such as images and fonts.
- `scripts/` – Utility scripts for content migration and enhancement.

## Deployment

The project includes a `vercel.json` configuration for deploying the site to
[Vercel](https://vercel.com). A simple `vercel --prod` will build and deploy the
site using the settings defined in that file.

