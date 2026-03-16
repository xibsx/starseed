module.exports = {
   apps: [{
      name: 'bot',
      script: './index.js',
      node_args: ['--max-old-space-size=288'],
      stop_exit_codes: [0],
      env: {
         NODE_ENV: 'production'
      }
   }, {
      name: 'smol',
      script: './index.js',
      node_args: [
         '--max-old-space-size=144',
         '--max-semi-space-size=1',
         '--optimize-for-size',
         '--expose-gc'
      ],
      stop_exit_codes: [0],
      env: {
         NODE_ENV: 'production'
      }
   }]
}