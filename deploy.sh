#! /bin/bash
#
# scull deployment
#
# Author : Jérôme Gasperi (https://github.com/jjrom)
# Date   : 2018-06-03
#
#

MY_PWD=`pwd`
SRC_DIR=`pwd`
USE_PM2=NO

SCULL_PATH=./server

function showUsage {
    echo ""
    echo "   scull deployment"
    echo ""
    echo "   Usage $0 [options]"
    echo ""
    echo "      -C | --config : local config file"
    echo "      -p | --pm2 : use pm2 for startup (default use node)"
    echo "      -h | --help : show this help"
    echo ""
    echo ""
}

# Parsing arguments
while [[ $# > 0 ]]
do
	key="$1"

	case $key in
        -C|--config)
            CONFIG="$2"
            shift # past argument
            ;;
        -p|--pm2)
            USE_PM2=YES
            shift # past argument
            ;;
        -h|--help)
            showUsage
            exit 0
            shift # past argument
            ;;
            *)
        shift # past argument
        # unknown option
        ;;
	esac
done

if [ "${CONFIG}" == "" ]
then
    showUsage
    echo ""
    echo "   ** Missing mandatory config file ** ";
    echo ""
    exit 0
fi

# Source config file
. ${CONFIG}

# Use pm2 for startup
if [ "${USE_PM2}" == "YES" ]
then
    
    # First check if pm2 is 
    command -v pm2 >/dev/null 2>&1 || { echo >&2 "pm2 is needed but it's not installed.  Aborting."; exit 1; }

    echo " ==> Stop scull"
    pm2 stop scull

fi

echo -e "[INFO] Create ${SCULL_PATH}/.env from ${CONFIG}"
cat > ${CONFIG} << EOF
SCULL_VERSION_ENDPOINT=${SCULL_VERSION_ENDPOINT}
SCULL_SERVER_NODE_PORT=${SCULL_SERVER_NODE_PORT}
MAX_NUMBER_OF_PROCESSES=${MAX_NUMBER_OF_PROCESSES}
DEFAULT_ENV_STRING=${DEFAULT_ENV_STRING}
SCULL_DB_FILE_PATH=${SCULL_DB_FILE_PATH}
EOF

echo " ==> Update node packages"
npm install

if [ "${USE_PM2}" == "YES" ]
then

  echo " ==> Start pm2 on one instance"
  pm2 start ${SCULL_PATH}/server.js -i 1 --name scull --no-pmx --merge-logs --log-date-format="YYYY-MM-DD HH:mm:ss"

  echo " ==> Save pm2"
  pm2 save

else
  echo " ==> Go to ${SCULL_PATH} and run 'node server.js'"
fi

cd "$MY_PWD"
echo " Done !"

