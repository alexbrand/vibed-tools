# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vibed Tools is a collection of self-contained browser-based utilities served from a single nginx container. The philosophy embraces "vibe-coding" - quick, functional web applications without overthinking architecture.

## Architecture

### Container Structure
- **Single container deployment**: All tools packaged in one nginx:alpine container
- **Static file serving**: nginx serves tools with custom routing configuration
- **Docker buildx**: Multi-arch builds targeting AMD64 by default

### URL Routing Strategy
- Root: `index.html` lists all available tools
- Tools: `/{tool-name}/` serves tool directories
- Automatic trailing slash redirects prevent relative path issues
- Static asset caching: 5 minutes (for development flexibility)

### Tool Structure
Each tool lives in `tools/{tool-name}/` with:
- `index.html` - Main tool interface
- `script.js` - Tool logic (vanilla JavaScript)
- `style.css` - Tool-specific styles
- Self-contained with no build dependencies

## Common Commands

### Build and Deploy
```bash
make push                    # Build and push container using buildx
make build                   # Local build for testing
make info                    # Show current build configuration
make clean                   # Remove local images
```

### Build Variables
```bash
make PLATFORM=linux/arm64 push     # Override platform
make IMAGE_NAME=custom push         # Override image name
make REGISTRY=custom.io push        # Override registry
```

## Development Workflow

### Adding New Tools
1. Create directory: `tools/{tool-name}/`
2. Add `index.html`, `script.js`, `style.css`
3. Update root `index.html` to list the new tool
4. Deploy with `make push`

### nginx Configuration
The `nginx.conf` handles:
- Tool directory routing with regex patterns
- Proper MIME types for static assets
- Security headers (selectively applied)
- Cache control (5min for assets, nosniff for HTML)

### Container Tag Strategy
- Tags use git short SHA: `docker.io/alexbrand/vibed-tools:{git-sha}`
- Always tags `latest` for deployment
- Integrated with GitOps workflow via alexbrand-cloud

## Tool Implementation Notes

### Relative Path Handling
Tools use relative paths for assets. nginx redirects `/{tool}/` to `/{tool}/` (with trailing slash) to ensure proper relative path resolution.

### Smart Data Handling
Tools like markdown-table-sorter demonstrate intelligent data processing:
- Markdown link extraction for sorting
- Multi-type data detection (numbers, dates, text)
- Preserve original formatting while sorting by extracted values

### Mobile-First Design
Tools use responsive design patterns with:
- Flexible layouts that work on mobile and desktop
- Modern CSS (backdrop-filter, grid, flexbox)
- Touch-friendly interfaces

## Terminal Aesthetic Guidelines

**All tools MUST follow this terminal aesthetic for consistency across the vibed-tools collection.**

### Color Scheme
- Pure black background (#000000)
- Bright green text (#00ff00) for primary content
- Dimmed green (#00aa00) for secondary elements
- Red (#ff0000) for errors
- Gray (#808080) for muted text

### Typography
- Monospace fonts only (Monaco, Menlo, Ubuntu Mono)
- Consider ALL CAPS for headers/commands
- Consistent spacing and alignment

### Interactive Elements
- Minimal borders using terminal green
- Button text like `[ACTION]` or `> ACTION`
- Input prompts: `$ ` or `>> ` prefixes
- Black backgrounds with green borders/text

### Layout Philosophy
- Clean, minimal interfaces
- Terminal-inspired spacing
- ASCII-style separators where appropriate
- No gradients, shadows, or modern effects