# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the GenLayer documentation site built with Next.js and Nextra (a Next.js-based static site generator). The documentation covers the GenLayer protocol, intelligent contracts, decentralized applications, and API references.

## Common Commands

### Development
- `pnpm i` - Install dependencies
- `pnpm dev` - Start development server (runs doc generation + Next.js dev server)
- `pnpm build` - Build for production (runs doc generation + Next.js build)
- `pnpm start` - Start production server
- `pnpm generate-sitemap` - Generate sitemap.xml

### Documentation Generation
The build process includes automatic generation of:
- Full documentation concatenation (`scripts/generate-full-docs.js`)
- Sitemap generation (`scripts/generate-sitemap-xml.js`)

## Architecture

### Content Structure
- **pages/**: MDX documentation files organized hierarchically
- **_meta.json**: Navigation and ordering configuration for each directory
- **components/**: Reusable React components (cards, icons, social links)
- **public/**: Static assets including images and generated files
- **scripts/**: Build-time generation scripts

### Key Directories
- `pages/understand-genlayer-protocol/`: Protocol documentation
- `pages/developers/intelligent-contracts/`: Smart contract development guides
- `pages/developers/decentralized-applications/`: DApp development guides
- `pages/api-references/`: API documentation for various GenLayer tools
- `pages/validators/`: Validator node setup and management

### Navigation System
Navigation is controlled by `_meta.json` files in each directory:
- Defines page order and titles
- Supports external links with `href` and `newWindow` properties
- Enables nested navigation structures

### Nextra Configuration
- **theme.config.tsx**: Site-wide configuration including logos, social links, SEO
- **next.config.js**: Next.js configuration with extensive redirect rules for URL migrations
- Uses `nextra-theme-docs` with custom styling

### Build Process
1. `generate-full-docs.js` parses all MDX files and creates concatenated documentation
2. Next.js builds the static site with Nextra theme
3. `generate-sitemap-xml.js` creates SEO sitemap from all MDX files

### Content Management
- All content is in MDX format supporting React components
- Images stored in `/public/` directory
- Redirects managed in `next.config.js` for URL structure changes
- LaTeX support enabled in Nextra config

## Development Notes

### Adding New Pages
1. Create `.mdx` file in appropriate `pages/` subdirectory
2. Update corresponding `_meta.json` to include the new page
3. Add any required images to `/public/`

### Modifying Navigation
- Edit `_meta.json` files to change page ordering or titles
- Use `theme.config.tsx` for top-level navigation changes

### URL Structure Changes
- Add redirects to `next.config.js` to maintain SEO and user experience
- Test both `previousRedirects` and `actualRedirects` arrays

### Component Development
- Custom components go in `/components/` directory
- Import and use within MDX files
- Follow existing patterns for icons and cards

### Validator Documentation Updates
When updating validator documentation for new releases:

#### Release Documentation Pattern
1. **Changelog Updates** (`pages/validators/changelog.mdx`):
   - Add new version entries at the top in reverse chronological order
   - Use consistent format: `# v0.x.x`, `## New features`, `## Bug fixes`, `## Misc`
   - Include missing intermediate versions if needed

2. **Setup Guide Updates** (`pages/validators/setup-guide.mdx`):
   - Update version references in download examples and version lists
   - Update configuration examples with new contract addresses when applicable
   - Enhance command documentation when new features are added to existing commands
   - Update genesis block configuration in consensus section when network upgrades occur

#### Version Reference Locations
Key locations that need updates for new validator releases:
- Line ~88: Version list in curl command output example
- Line ~113: Download command version variable (`export version=v0.x.x`)
- Lines ~143-146: Consensus contract addresses and genesis block number
- Line ~347: Command documentation (e.g., `doctor` command enhancements)

#### Configuration Management
- Consensus contract addresses change with network upgrades
- Genesis block numbers are specified for faster node startup (optional but recommended)
- GenVM diagnostics integration affects the `doctor` command behavior

## GenLayer-Specific Context

This documentation covers:
- **Intelligent Contracts**: AI-powered smart contracts with LLM integration
- **Optimistic Democracy**: GenLayer's consensus mechanism
- **GenVM**: Virtual machine supporting non-deterministic operations
- **Development Tools**: CLI, Studio, JS/Python SDKs
- **Validator Operations**: Node setup and management

The project emphasizes the unique aspects of GenLayer as an "Intelligent Blockchain" that enables contracts to access the internet and make subjective decisions beyond traditional deterministic logic.