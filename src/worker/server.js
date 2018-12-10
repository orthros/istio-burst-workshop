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

var express = require('express');
var app = express();
var cors = require('cors');

var morgan = require('morgan');
var bodyParser = require('body-parser');
var http = require('http').Server(app);

var crypto = require('crypto')

// Log every request to the console
app.use(morgan('dev'));
app.use(bodyParser.json());

//Enable cors
app.options('*', cors());


if (process.env.REDIS_URL == null) {
    console.error('Need to set REDIS_URL enviornment variable');
}

// We will use this later in part 2 to demonstrate the bursty capabilities of the system
prefix = ''
if (process.env.PREFIX != null) {
    prefix = process.env.PREFIX
}
console.log(`Using prefix ${prefix}`)

var Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);


app.post('/', function (req, res) {
    processor = req.body.str;
    crypto.randomBytes(processor.length, async function (err, buffer) {
        var token = buffer.toString('hex');
        for (var i = 0; i < token.length; i++) {
            processor += token.charAt(i);
        }

        processor += (new Date()).getHours();
        var hash = crypto.createHash('sha256').update(processor).digest('base64');

        redis.publish('calculation', prefix + hash);
        res.sendStatus(200);
    });
});

// Health probe
app.get('/_healthz', function (req, res) {
    res.send('ok');
});
// Livelyness probe
app.get('/', function (req, res) {
    res.send('ok');
});

var port = process.env.PORT || 5001;
http.listen(port, function () {
    console.log('Listening on *:' + port);
});