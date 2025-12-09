# Scripts

This directory contains utility scripts for maintaining the GenLayer documentation.

## Quick Reference

```sh
# Update version list and download command from changelog
node scripts/update-setup-guide-versions.js

# Update config.yaml example in setup guide
node scripts/update-config-in-setup-guide.js

# Update docker-compose.yaml example in setup guide
node scripts/update-docker-compose-in-setup-guide.js
```

## Setup Guide Update Scripts

These scripts update specific sections of the validator setup guide (`pages/validators/setup-guide.mdx`) from source files in the `content/` directory.

### update-setup-guide-versions.js

Updates the version list and download command in the setup guide based on available changelog versions.

**Source:** `content/validators/changelog/*.mdx`

**What it updates:**
- Version list example output (sorted newest first)
- `export version=vX.X.X` download command with latest version

**Run:**
```sh
node scripts/update-setup-guide-versions.js
```

### update-config-in-setup-guide.js

Updates the `config.yaml` example block in the setup guide.

**Source:** `content/validators/config.yaml`

**What it updates:**
- The YAML code block after "You can use the following example configuration"

**Run:**
```sh
node scripts/update-config-in-setup-guide.js
```

### update-docker-compose-in-setup-guide.js

Updates the `docker-compose.yaml` example block in the setup guide.

**Source:** `content/validators/docker-compose.yaml`

**What it updates:**
- The YAML code block after "Create a `docker-compose.yaml` file with the following content"

**Run:**
```sh
node scripts/update-docker-compose-in-setup-guide.js
```

## Other Scripts

| Script | Description |
|--------|-------------|
| `generate-full-docs.js` | Concatenates all MDX files into a single documentation file |
| `generate-sitemap-xml.js` | Generates `sitemap.xml` from all MDX files |
| `generate-changelog.js` | Generates the changelog page from individual version files |
| `generate-node-api-docs.js` | Generates API documentation and navigation |
| `sync-meta-files.js` | Synchronizes `_meta.json` files with actual content |
