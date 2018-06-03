# scull
A nodejs super simple scheduler to launch docker processes for lazy people 

# Deploy server

    ./deploy.sh -C config
    
# Note on PM2

To have the server automatically respawn in case of crash you should deploy using pm2 instead of node

To install PM2 (ubuntu)

    apt-get install nodejs build-essential -y
    npm install pm2 -g
    pm2 install pm2-logrotate
    pm2 startup ubuntu

