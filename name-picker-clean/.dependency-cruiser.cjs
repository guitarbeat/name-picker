/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies are not allowed',
      from: {},
      to: {
        circular: true
      }
    },
    {
      name: 'features-isolation',
      comment: 'Features should not import from other features directly',
      severity: 'error',
      from: {
        path: '^src/features/([^/]+)/'
      },
      to: {
        path: '^src/features/(?!\\1/)'
      }
    },
    {
      name: 'shared-utils-only',
      comment: 'Features should only use shared utils, not other features utils',
      severity: 'error',
      from: {
        path: '^src/features/'
      },
      to: {
        path: '^src/utils/'
      }
    }
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    includeOnly: '^src',
    tsConfig: {
      fileName: 'tsconfig.json'
    }
  }
}; 