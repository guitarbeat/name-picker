module.exports = {
  plugins: [
    require('postcss-combine-duplicated-selectors')({ removeDuplicatedProperties: true }),
    require('postcss-merge-rules'),
    require('postcss-sort-media-queries'),
    require('postcss-custom-properties')({ preserve: true }),
    require('autoprefixer'),
    require('cssnano')({
      preset: ['advanced', {
        discardComments: { removeAll: true },
        mergeRules: true,
        reduceIdents: false,
        zindex: false
      }]
    })
  ]
} 