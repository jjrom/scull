const appConfig = require('../../../config');
const nedb = require('nedb');
const child_process = require('child_process');

module.exports = (function() {
  'use strict'

  // Initialize datastore
  var db = new nedb({
    filename: appConfig.dbPath,
    autoload: true
  });

  return {
    addProcess:addProcess,
    getProcesses:getProcesses
  }

  /////////////////////////////////////////


  /**
   * Add a new process
   * 
   * scull will launch the command line equivalent to
   * 
   *    docker run -e $env --rm $image $command 
   * 
   * The body properties :
   * 
   *    {
   *      "image":// Name of existing docker image on server (MANDATORY),
   *      "env":// Environnement variable (OPTIONAL),
   *      "args":// Process arguments (OPTIONAL)
   *    }
   *
   * @param {Object} req Request object
   * @param {type} res Response object
   * @returns {undefined}
   */
  function addProcess (req, res) {

    // Check mandatory body content
    if ( !req.body ) {
      return res.status(400).send('Bad Request');
    }

    if ( !req.body.image ) {
      return res.status(400).send('Bad Request - mandatory docker image name');
    }

    // Initialiaze pending process
    var newProcess = {
      timestamp:Date.now(),
      image:req.body.image,
      status:'pending'
    }

    // Optional fields
    if ( req.body.env ) {
      newProcess.env = req.body.env;
    }
    if ( req.body.args ) {
      newProcess.args = req.body.args;
    }

    // Insert new process with status 'pending'
    db.insert(newProcess, function (err, newProcess) { 

      if (err) {
        res.status(500).send('Internal Server Error:' + err);
      }
      else {

        // If appConfig.maxNumberOfProcesses is not reach, launch process
        db.count({ status: 'running'}, function (err, count) {
          if ( !err ) {
            if (count <= appConfig.maxNumberOfProcesses){
              executeProcess(newProcess);
            }
            else {
              console.log("[" + newProcess._id + "][PENDING]");
            }
          }
        });
       
        res.status(200).json(newProcess);

      }

    });

  }

  /**
   * List all processes
   *
   * @param {Object} req Request object
   * @param {type} res Response object
   * @returns {undefined}
   */
  function getProcesses (req, res) {

    var query = {};

    if ( req.query && req.query.status ) {
      query.status = req.query.status;
    }

    db.find(query).sort({timestamp:1}).exec(function (err, processes) {

      if (err) {
        res.status(500).send('Internal Server Error:' + err);
      }
      else {
        res.status(200).json(processes);
      }

    });

  }


  /**
   * 
   * @param {Object} p Process
   * @param {Object} properties Properties to update
   * @param {Boolean} respawn True to respawn a process if status is set to finished
   */
  function updateProcess(p, properties, respawn) {

    respawn = respawn || false;

    db.update({ _id: p._id }, { $set: properties }, {}, function (err, numReplaced) {
      
      // Respawn a process
      if ( respawn && properties.status ) {

        if ( properties.status === 'finished' || properties.status === 'error' ) {

          executePendingProcesses();

        }

      }

    });

  }

  /**
   * Spawn a docker process from input parameters
   * 
   * @param {Object} p 
   */
  function executeProcess(p) {

    var params = [
      'run'
    ];

    if ( appConfig.defaultEnv ) {
      for (var i = 0, ii = appConfig.defaultEnv.length; i < ii; i++) {
        params.push('-e', appConfig.defaultEnv[i]);
      }
    }

    if ( p.env ) {
      for (var i = 0, ii = p.env.length; i < ii; i++) {
        params.push('-e', p.env[i]);
      }
    } 

    params.push('--rm', p.image);
    
    if ( p.args ) {
      for (var i = 0, ii = p.args.length; i < ii; i++) {
        params.push(p.args[i]);
      }
    }

    // Set status to running
    db.update({ _id: p._id }, { $set: {status: 'running' } }, {}, function (err, numReplaced) {
      
      if ( !err ) {

        console.log("[" + p._id + "][STARTED]");

        var command = child_process.spawn('docker', params);

        command.stdout.on('data', (data) => {
          console.log("[" + p._id + "][OUT]" + data);
        });

        command.stderr.on('data', (data) => {
          console.log("[" + p._id + "][ERR]" + data);
        });

        command.on('close', (code) => {

          // Process is finished successully
          if ( code === 0 ) {
            console.log("[" + p._id + "][FINISHED][SUCCESS]");
            updateProcess(p, {status: 'finished'}, true);
          }
          // Process is in error
          else {
            console.log("[" + p._id + "][FINISHED][ERROR]");
            updateProcess(p, {status: 'error'}, true);
          }

        });

      }
      else {
        console.log("[" + p._id + "][ERROR] Cannot update status to running");
      }

    });

  }

  /**
   * Execute pending processes
   */
  function executePendingProcesses() {

    // If appConfig.maxNumberOfProcesses is not reach, launch process
    db.count({ status: 'running'}, function (err, count) {

      var diff = appConfig.maxNumberOfProcesses - count;

      if ( !err && diff > 0 ) {

        // Get the oldest pending process
        db.find({ status: 'pending' }).sort({timestamp:-1}).exec(function (err, processes) {

          for ( var i = 0, ii = processes.length; i < ii; i++ ) {

            if (diff > 0) {
              diff--;
              executeProcess(processes[i]);
            }
            
            if (diff === 0) {
              break;
            }

          }

        });

      }

    });

  }

})()
