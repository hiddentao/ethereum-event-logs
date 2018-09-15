module.exports = require('babel-jest').createTransformer({
  presets: ['env'],
  plugins: [
    'babel-jest-assertions'
  ]
})
