module.exports = {
    debug: true,
    api: {
      route: "/1.0",
      port: 4002
    },
    maxNumberOfProcesses:2,
    defaultEnv:[
      "ENV_VAR_1=123",
      "ENV_VAR_2=456"
    ],
    dbPath: "/data/scull.db"
  }