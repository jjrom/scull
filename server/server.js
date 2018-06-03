/**
 * scull API server
 *
 * Copyright 2018 Jérôme Gasperi
 *
 * Licensed under the Apache License, version 2.0 (the "License");
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at:
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */

'use strict'

const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config');

var app = express();

// Fix AWS wrong headers
app.use(function (req, res, next) {
    if (req.headers['x-amz-sns-message-type']) {
        req.headers['content-type'] = 'application/json;charset=UTF-8';
    }
    next();
  }
)
app.use(bodyParser.json());

// Register all routes with /app
app.use(config.api.route, require('./app' + config.api.route + '/routes')(express));

// Start the server on localhost only
app.listen(config.api.port, '127.0.0.1', () => {
  console.log('scull API server ' + config.api.route + ' as process ' + process.pid + ' is listening on port ' + config.api.port + ' to all incoming requests');
});

module.exports = app;
