const servicesController = require('./controllers/services')

module.exports = function(express) {

  'use strict'

  var router = express.Router()

  // ============================================
  //  List all processes
  // ============================================
  router.route('/processes')
        .get(servicesController.getProcesses)

  // ============================================
  //  Add a new process
  // ============================================
  router.route('/processes')
        .post(servicesController.addProcess)

  return router

}
