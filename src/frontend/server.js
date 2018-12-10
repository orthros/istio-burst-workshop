// Copyright 2018 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

require("dotenv").config();

// WebServer
var express = require('express');
var app = express();

// Used to make http requests on the server
var request = require('request');

// Nice logging
var morgan = require('morgan');
// Parse our incoming requests
var bodyParser = require('body-parser');
// Need an http server for our express app
var http = require('http').Server(app);
// socket.io to handle bidirectional communication with the web page
var io = require('socket.io')(http);

if (process.env.PROCESSOR_URL == null) {
    console.error('Need to set the PROCESSOR_URL environment variable');
}

if (process.env.REDIS_URL == null) {
    console.error('Need to set REDIS_URL enviornment variable');
}

var Redis = require('ioredis');
var redis = new Redis(process.env.REDIS_URL);

redis.subscribe('calculation', function (err, count) {
    if (err != null) {
        console.log(err);
    }
    console.log('Subscribed to %s channel(s)', count);
});

redis.on('message', function (channel, message) {
    console.log('Receive message %s from channel %s', message, channel);
    io.emit('calculation', message);
});

// The interval timeout
var timeout;

io.on('connection', function (socket) {
    var inter = 5
    socket.on('frequency', function (msg) {
        //msg should be of form { freq }        
        if (timeout != null) {
            clearInterval(timeout);
        }
        inter = msg.freq;
        timeout = setInterval(function () {
            //Every inter times a second, lets make a post request to our processor
            request.post(
                process.env.PROCESSOR_URL,
                { json: { str: Math.random().toString(36).replace('0.','') } },
                function (error, response, body) {
                    if (error || response.statusCode != 200) {
                        console.warn(error);
                    }
                }
            );
        }, 1 / (inter / 1000));
    });
});

// Log every request to the console
app.use(morgan('dev'));
app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/views/index.html');
});

// Health probe
app.get('/_healthz', function (req, res) {
    res.send('ok');
});

var port = process.env.PORT || 5000;
http.listen(port, function () {
    console.log('Listening on *:' + port);
});