#! /bin/bash
#
# scull deployment
#
# Author : Jérôme Gasperi (https://github.com/jjrom)
# Date   : 2018-06-03
#
#

PWD=`pwd`
SRC_DIR=`pwd`
USE_PM2=NO

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

# Set endpoints
SCULL_ENDPOINT=${SCULL_TARGET_DIR}

mkdir -p "${SCULL_ENDPOINT}"

# Use pm2 for startup
if [ "${USE_PM2}" == "YES" ]
then
    
    # First check if pm2 is 
    command -v pm2 >/dev/null 2>&1 || { echo >&2 "pm2 is needed but it's not installed.  Aborting."; exit 1; }

    echo " ==> Stop pm2"
    pm2 stop scull

fi

echo " ==> Clean directory ${SCULL_ENDPOINT}"
rm -Rf "${SCULL_ENDPOINT}/server.js" "${SCULL_ENDPOINT}/config.js" "${SCULL_ENDPOINT}/package.json" "${SCULL_ENDPOINT}/app"

cd "${SCULL_ENDPOINT}"

echo " ==> Install new version on ${SCULL_ENDPOINT}"
cp -R "${SRC_DIR}/server/server.js" "${SRC_DIR}/server/package.json" "${SRC_DIR}/server/app" "${SCULL_ENDPOINT}"

echo " ==> Generate config.js file"
cat <<< "
module.exports = {
  debug: true,
  api: {
    route: '${SCULL_VERSION_ENDPOINT}',
    port: ${SCULL_SERVER_NODE_PORT}
  },
  maxNumberOfProcesses:${MAX_NUMBER_OF_PROCESSES},
  defaultEnv:${DEFAULT_ENV_STRING},
  dbPath:'${SCULL_DB_FILE_PATH}'
}
" > ${SCULL_ENDPOINT}/config.js

echo " ==> Update node packages"
npm install

if [ "${USE_PM2}" == "YES" ]
then
  echo " ==> Start pm2 on one instance"
  pm2 start ${SCULL_ENDPOINT}/server.js -i 1 --name scull --no-pmx --merge-logs --log-date-format="YYYY-MM-DD HH:mm:ss"

  echo " ==> Save pm2"
  pm2 save
else
  echo " ==> Go to ${SCULL_ENDPOINT} and run 'node server.js'"
fi

cd "$PWD"
echo " Done !"

