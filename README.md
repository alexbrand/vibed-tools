# Vibed Tools

A collection of "vibe-coded" JavaScript/browser-based tools served from a single container at [tools.apps.alexbrand.dev](https://tools.apps.alexbrand.dev).

## Philosophy

These tools embrace the art of vibing - quick, intuitive, and functional web applications built without overthinking the architecture. Each tool is self-contained, browser-based, and ready to ship.

## Structure

```
vibed-tools/
├── tools/
│   ├── tool-name/
│   │   ├── index.html
│   │   ├── script.js
│   │   └── style.css
│   └── another-tool/
│       └── ...
├── Dockerfile
├── nginx.conf
└── README.md
```

Each tool lives in its own directory under `/tools/` and is accessible via URL routing.

## Deployment Pipeline

This repository integrates with the [alexbrand-cloud](https://github.com/alexbrand/alexbrand-cloud) GitOps workflow for automatic deployment to your Kubernetes cluster.

### Simple Deployment Strategy

1. **Single Container**: All tools packaged in one nginx container
2. **URL Routing**: Access tools via `tools.apps.alexbrand.dev/tool-name/`
3. **GitOps Integration**: Flux monitors this repo and syncs changes to your cluster
4. **Zero Config**: Push to main branch → Automatic deployment

### Adding a New Tool

1. Create a new directory: `mkdir tools/my-awesome-tool`
2. Add your files: `index.html`, `script.js`, `style.css`
3. Commit and push - Flux rebuilds and deploys automatically

### Tool Access

- Home page: `https://tools.apps.alexbrand.dev/`
- Individual tools: `https://tools.apps.alexbrand.dev/tool-name/`

## Tool Guidelines

- **Keep it simple**: Pure JavaScript, no build steps unless necessary
- **Self-contained**: Each tool should work independently
- **Mobile-friendly**: Responsive design encouraged
- **Fast loading**: Minimal dependencies, inline styles/scripts when possible
- **Vibe first**: Function over form, but make it feel good to use

## Contributing

1. Fork the repo
2. Create your tool directory
3. Vibe out your implementation
4. Submit a PR
5. Watch it deploy automatically ✨

---

*Built with vibes, deployed with GitOps* 🚀
