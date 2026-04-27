# Node.js Reverse Proxy Server

A lightweight, configurable reverse proxy server built with Node.js that mimics nginx-like functionality. It routes incoming requests to different upstream servers based on path rules defined in a YAML configuration file.

## Features

- **Multi-worker Architecture**: Utilizes Node.js cluster module to spawn multiple worker processes for improved performance
- **YAML Configuration**: Simple and intuitive YAML-based configuration
- **Path-based Routing**: Route requests to different upstream servers based on URL paths
- **Upstream Management**: Define and manage multiple upstream servers
- **Custom Headers**: Add custom headers to proxied requests
- **Schema Validation**: Built-in configuration validation using Zod

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd REVERSE_PROXY

# Install dependencies
npm install
```

## Quick Start

```bash
# Run with default configuration
npm run dev
```

The server will start on port 8080 (as defined in `config.yml`).

## Configuration

All configuration is done through a YAML file. By default, the server looks for `config.yml` in the project root.

### Configuration File Structure

```yaml
server:
  listen: <port>          # Port number to listen on
  workers: <number>       # Number of worker processes (optional, defaults to CPU cores)

  upstreams:              # List of upstream servers
    - id: <unique-id>     # Unique identifier for the upstream
      url: <server-url>   # Full URL of the upstream server

  headers:                # Custom headers to add to requests (optional)
    - key: <header-name>
      value: <header-value>

  rules:                  # Routing rules
    - path: <path-pattern>    # URL path pattern (supports regex)
      upstreams:
        - <upstream-id>       # ID of upstream to route to
```

### Configuration Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `server.listen` | number | Yes | Port number for the proxy server to listen on |
| `server.workers` | number | No | Number of worker processes (defaults to CPU core count) |
| `server.upstreams` | array | Yes | List of upstream server definitions |
| `server.upstreams[].id` | string | Yes | Unique identifier for the upstream |
| `server.upstreams[].url` | string | Yes | Full URL of the upstream server |
| `server.headers` | array | No | Custom headers to include in proxied requests |
| `server.headers[].key` | string | Yes | Header name |
| `server.headers[].value` | string | Yes | Header value |
| `server.rules` | array | Yes | Routing rules for path-based request forwarding |
| `server.rules[].path` | string | Yes | Path pattern to match (supports regex) |
| `server.rules[].upstreams` | array | Yes | List of upstream IDs to route matching requests to |

### Example Configuration

```yaml
server:
  listen: 8080
  workers: 3

  upstreams:
    - id: api
      url: https://api.example.com
    - id: docs
      url: https://docs.example.com

  headers:
    - key: X-Custom-Header
      value: "MyValue"
    - key: Authorization
      value: "Bearer token123"

  rules:
    - path: /api
      upstreams:
        - api
    - path: /docs
      upstreams:
        - docs
    - path: /
      upstreams:
        - api
```

## Usage

### Running the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
node src/index.js --config=config.yml
```

### Custom Config Path

```bash
node src/index.js --config=path/to/your/config.yml
```

### How It Works

1. **Master Process**: The primary process spawns worker processes based on the `workers` configuration
2. **Worker Processes**: Each worker handles incoming requests and forwards them to the appropriate upstream
3. **Request Routing**: When a request comes in, the master process selects a worker using round-robin (random) distribution
4. **Path Matching**: Workers match incoming request paths against configured rules using regex
5. **Proxying**: Matching requests are forwarded to the corresponding upstream server

### Request Flow

```
Client Request
      │
      ▼
┌─────────────────┐
│  Master Process │ (Selects worker via round-robin)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Worker Process │ (Matches path against rules)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Upstream Server │ (Forwards request)
└─────────────────┘
```

## Architecture

### File Structure

```
REVERSE_PROXY/
├── config.yml           # Configuration file
├── package.json         # Project dependencies
└── src/
    ├── index.js         # Entry point & CLI
    ├── config.js        # YAML parsing & validation
    ├── configSchema.js  # Zod schema definitions
    ├── server.js        # Server implementation
    └── serverSchema.js  # Worker message schemas
```

### Key Components

- **index.js**: CLI entry point using Commander.js
- **config.js**: Handles YAML file parsing and Zod validation
- **configSchema.js**: Defines the configuration schema
- **server.js**: Implements the reverse proxy logic with cluster support
- **serverSchema.js**: Validates inter-process messages

## Development

### Prerequisites

- Node.js 18+ 
- npm 9+

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start server in development mode with auto-reload |

## Troubleshooting

### Common Issues

1. **Port already in use**: Change the `listen` port in `config.yml`
2. **Upstream not found**: Ensure the upstream ID in your rule matches an upstream definition
3. **Rule not found**: Check that your path pattern matches the incoming request URL

### Debug Mode

Add console.log statements in `server.js` to debug request routing:

```javascript
console.log('Request URL:', requestURL);
console.log('Matched rule:', rule);
```

## Author

**Deep Saha**

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.