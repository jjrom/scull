# scull
A super simple scheduler written in nodejs to launch docker processes for lazy people 

# Deploy server

    ./deploy.sh -C config
    
# Using PM2

To have the server automatically respawn in case of crash you should deploy using pm2 instead of node

To install PM2 (ubuntu)

    # Install package for pm2
    apt-get install nodejs npm build-essential -y
    ln -s /usr/bin/nodejs /usr/bin/node
    npm install pm2 -g
    pm2 install pm2-logrotate
    
    # Copy paste the output of pm2 startup to the console
    pm2 startup

Then deploy scull with -p option

    ./deploy.sh -C config -p

## Set up a nginx proxy

scull runs on localhost only. To access scull REST API from internet, add this to /etc/nginx/sites-available/default file

    location /scull/ {

        # remove leading /scull/ otherwise node route is invalid
        rewrite /scull/(.*) /\$1  break;

        proxy_pass http://127.0.0.1:4002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
   