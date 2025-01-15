module.exports = {
  plugins: [
    require('postcss-preset-env')({
      stage: 0,
      features: {
        'custom-properties': false,
        'nesting-rules': true,
        'custom-media-queries': true
      }
    }),
    require('postcss-combine-duplicated-selectors')({
      removeDuplicatedProperties: true
    }),
    require('postcss-merge-rules'),
    require('postcss-sort-media-queries')({
      sort: 'mobile-first'
    }),
    require('autoprefixer'),
    require('cssnano')({
      preset: ['default', {
        cssDeclarationSorter: true,
        discardComments: { removeAll: true },
        discardDuplicates: true,
        discardEmpty: true,
        mergeRules: true,
        normalizeWhitespace: false,
        minifySelectors: true,
        minifyParams: true,
        calc: true,
        colormin: true
      }]
    })
  ]
} 