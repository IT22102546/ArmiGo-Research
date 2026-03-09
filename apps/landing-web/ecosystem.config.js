module.exports = {
  apps: [{
    name: 'armigo-app',
    script: 'npm',
    args: 'start',
    cwd: '/root/ArmiGo-Research',
    env: {
      NODE_ENV: 'production',
      PORT: 8302
    },
    watch: false,
    instances: 1,
    exec_mode: 'fork'
  }]
};
