module.exports = {
  apps: [
    {
      name: 'backend2',
      script: 'yarn',
      args: 'start:prod',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '10G',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 6500,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 6500,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 6500,
      },
    },
  ],

  deploy: {
    development: {
      user: 'root',
      key: './gitlab.dev.key',
      host: '45.95.173.37',
      ref: 'origin/main',
      repo: 'git@github.com:DATN-TKTW-FALL-2023/backend2.git',
      path: '/home/backend2',
      'post-setup':
        'yarn; yarn build; pm2 start ecosystem.config.js --env development',
      'post-deploy':
        'git pull; yarn; yarn build; cd ..; pm2 reload ecosystem.config.js --env development',
      ssh_options: ['StrictHostKeyChecking=no', 'PasswordAuthentication=no'],
    },
  },
};
// 123
