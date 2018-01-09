'use strict'

var express = require('express')
var bodyParser = require('body-parser')
var app = express()
var mongoose = require('mongoose')
var mongoose_paginage = require('mongoose-paginate')
var cors = require('cors')
var fs = require('fs')
var https = require('https')
var helmet = require('helmet')
var router = require('./app/routers/burgers')

var port = process.env.PORT || 8080

// Rate Limits
var RateLimit = require('express-rate-limit')

app.enable('trust proxy');
 
var limiter = new RateLimit({
  windowMs: 60*60*1000, // 60 minutes
  max: 3600, // limit each IP to 3600 requests per windowMs
  delayMs: 0
});
 
app.use(limiter);

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cors())

app.use(helmet())
app.use(helmet.noCache())
app.use(helmet.frameguard())

var options = {
    key: fs.readFileSync('./https/key.pem', 'utf8'),
    cert: fs.readFileSync('./https/server.crt', 'utf8')
}

var connectionString = 'mongodb://burger:burger@ds247027.mlab.com:47027/burgers'
mongoose.connect(connectionString)

mongoose.connection.on('error', () => {
    console.log('Could not connect to the database. Exiting now...')
    process.exit()
})

mongoose.connection.once('open', () => {
    console.log("Successfully connected to the database")
})

app.use('/v2', router)

https.createServer(options, app).listen(port)