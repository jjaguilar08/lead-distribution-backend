module.exports = {
  apps: [
    {
      name: 'lead-distribution-backend',
      script: 'dist/index.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 8568,
      },
    },
  ],
};
