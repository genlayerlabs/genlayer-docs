# GenLayer Documentation

This repo contains technical documentation for the [GenLayer project](https://genlayer.com/).

The live site is available at [https://docs.genlayer.com/](https://docs.genlayer.com/).

## Setting up the Docs Locally

You can use either `npm` or `pnpm` as your package manager.

### Using pnpm

#### Development Mode

1. Install dependencies: `pnpm i`
2. Start the development server: `pnpm dev`
3. Visit localhost:3000

#### Production Mode

1. Install dependencies: `pnpm i`
2. Build the site: `pnpm build`
3. Start the production server: `pnpm start`
4. Visit localhost:3000

### Using npm

#### Development Mode

1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`
3. Visit localhost:3000

#### Production Mode

1. Install dependencies: `npm install`
2. Build the site: `npm run build`
3. Start the production server: `npm start`
4. Visit localhost:3000

## Maintaining Documentation

### Adding New Changelog Entries

The changelog is automatically generated from individual version files during the build process.

To add a new changelog entry:

1. Create a new file in `content/validators/changelog/` named `vX.X.X.mdx` (e.g., `v0.3.5.mdx`)
2. Structure the content as follows:

```mdx
## vX.X.X

### New features

- Feature description here

### Bug fixes

- Fix description here

### Misc

- Other changes here
```

3. The changelog will be automatically updated when you run the build or dev command:
   - **pnpm**: `pnpm build` or `pnpm dev`
   - **npm**: `npm run build` or `npm run dev`

The entries are sorted in descending order (newest first) automatically.

### Adding New API Documentation

The API documentation for GenLayer Node is automatically generated from individual method files.

To add a new API method:

1. Create a new `.mdx` file in the appropriate directory:
   - For GenLayer methods: `pages/api-references/genlayer-node/gen/`
   - For Debug methods: `pages/api-references/genlayer-node/debug/`

2. Name the file according to the method name (e.g., `gen_newMethod.mdx`)

3. Structure the content following this template:

```mdx
### method_name

Brief description of what the method does.

**Method:** `method_name`

**Parameters:**

- `param1` (type, required/optional): Description
- `param2` (type, required/optional): Description

**Returns:** Description of return value

**Example:**

```json
{
  "jsonrpc": "2.0",
  "method": "method_name",
  "params": [...],
  "id": 1
}
```

**Response:**

```json
{
  "jsonrpc": "2.0",
  "result": ...,
  "id": 1
}
```
```

4. The API documentation and navigation will be automatically updated when you run:
   - **pnpm**: `pnpm build` or `pnpm dev`
   - **npm**: `npm run build` or `npm run dev`

The `_meta.json` files are automatically synchronized with the actual method files, preserving the order of existing entries while adding new ones at the end.

## License

Text and diagrams: [Creative Commons Attribution 4.0 International](https://github.com/genlayerlabs/genlayer-docs/blob/main/LICENSES/CC-BY-4.0.txt).

Code snippets and examples: [MIT License](https://github.com/genlayerlabs/genlayer-docs/blob/main/LICENSES/MIT.txt).
