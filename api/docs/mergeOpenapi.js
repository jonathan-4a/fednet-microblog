#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Simple logger for the script
const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${msg}`),
};

// Read the base OpenAPI spec
const baseSpecPath = path.join(__dirname, 'index.json');
if (!fs.existsSync(baseSpecPath)) {
  logger.warn('Base spec index.json not found, creating minimal spec');
  const minimalSpec = {
    openapi: '3.0.0',
    info: {
      title: 'FedNet Microblog API',
      version: '1.0.0',
    },
    paths: {},
    components: {
      schemas: {},
    },
  };
  fs.writeFileSync(baseSpecPath, JSON.stringify(minimalSpec, null, 2));
}

const baseSpec = JSON.parse(fs.readFileSync(baseSpecPath, 'utf8'));

// List of feature files to merge
const featureFiles = [
  'auth.json',
  'admin.json',
  'users.json',
  'webfinger.json',
  'federation.json',
  'socials.json',
  'posts.json',
];

// Merge all feature specs
featureFiles.forEach((file) => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const featureSpec = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Merge paths
    if (featureSpec.paths) {
      baseSpec.paths = { ...baseSpec.paths, ...featureSpec.paths };
    }

    // Merge components (deep merge for schemas)
    if (featureSpec.components) {
      if (!baseSpec.components) {
        baseSpec.components = {};
      }

      // Deep merge schemas
      if (featureSpec.components.schemas) {
        if (!baseSpec.components.schemas) {
          baseSpec.components.schemas = {};
        }
        baseSpec.components.schemas = {
          ...baseSpec.components.schemas,
          ...featureSpec.components.schemas,
        };
      }

      // Merge other component types (parameters, responses, etc.)
      Object.keys(featureSpec.components).forEach((key) => {
        if (key !== 'schemas') {
          if (!baseSpec.components[key]) {
            baseSpec.components[key] = {};
          }
          baseSpec.components[key] = {
            ...baseSpec.components[key],
            ...featureSpec.components[key],
          };
        }
      });
    }

    logger.info(`✅ Successfully merged ${file}`);
  } else {
    logger.warn(`⚠️  File not found, skipped: ${file}`);
  }
});

// Write the merged spec
const outputPath = path.join(__dirname, '..', 'openapi.json');
fs.writeFileSync(outputPath, JSON.stringify(baseSpec, null, 2));

logger.info('Merged OpenAPI spec written successfully');
logger.info(`Total paths: ${Object.keys(baseSpec.paths || {}).length}`);

