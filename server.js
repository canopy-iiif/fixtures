const express = require('express');
const fs = require('fs/promises');
const path = require('path');

const PORT = Number(process.env.PORT || 5002);
const PUBLIC_BASE_URL = normalizeBase(process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`);
const SOURCE_BASE_URL = normalizeBase(process.env.SOURCE_BASE_URL || 'https://raw.githubusercontent.com/canopy-iiif/fixtures/refs/heads/main');
const ROOT_DIR = process.cwd();

const app = express();

app.get(/\/iiif\/presentation\/.*\.json$/, async (req, res, next) => {
  try {
    const filePath = secureJoin(ROOT_DIR, req.path);
    const raw = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(raw);
    rewriteIds(data);
    res.setHeader('Content-Type', 'application/ld+json;profile="http://iiif.io/api/presentation/3/context.json"');
    res.setHeader('Cache-Control', 'no-store');
    res.send(JSON.stringify(data, null, 2));
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).send('Not found');
    } else {
      next(error);
    }
  }
});

app.use(express.static(ROOT_DIR, { fallthrough: true }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Fixtures server running at http://localhost:${PORT}`);
  console.log(`Rewriting IDs from ${SOURCE_BASE_URL} -> ${PUBLIC_BASE_URL}`);
});

function rewriteIds(node) {
  if (Array.isArray(node)) {
    node.forEach(rewriteIds);
    return;
  }

  if (node && typeof node === 'object') {
    Object.entries(node).forEach(([key, value]) => {
      if (key === 'id' && typeof value === 'string') {
        node[key] = rebaseId(value);
      } else {
        rewriteIds(value);
      }
    });
  }
}

function rebaseId(value) {
  if (value.startsWith(SOURCE_BASE_URL)) {
    return PUBLIC_BASE_URL + value.slice(SOURCE_BASE_URL.length);
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  if (value.startsWith('/')) {
    return PUBLIC_BASE_URL + value;
  }

  return value;
}

function secureJoin(root, requestPath) {
  const resolved = path.join(root, requestPath);
  if (!resolved.startsWith(root)) {
    throw new Error('Path traversal attempt');
  }
  return resolved;
}

function normalizeBase(url) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}
