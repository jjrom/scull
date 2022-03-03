module.exports = {
    debug: true,
    api: {
      route: process.env.SCULL_VERSION_ENDPOINT,
      port: process.env.SCULL_SERVER_NODE_PORT
    },
    maxNumberOfProcesses:process.env.MAX_NUMBER_OF_PROCESSES,
    defaultEnv:[
      process.env.DEFAULT_ENV_STRING
    ],
    dbPath: process.env.SCULL_DB_FILE_PATH
  }