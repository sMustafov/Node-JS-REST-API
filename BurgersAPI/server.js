'use strict'

var express = require('express')
var bodyParser = require('body-parser')
var app = express()
var mongoose = require('mongoose')
var mongoose_paginage = require('mongoose-paginate')
var cors = require('cors')
var fs = require('fs')
var https = require('https')
var router = express.Router()

var Burger = require('./app/models/burger')

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

var options = {
    key: fs.readFileSync('./https/key.pem', 'utf8'),
    cert: fs.readFileSync('./https/server.crt', 'utf8')
}

router.use(function(req, res, next) {
    console.log('Something is happening.')
    next()
})

mongoose.connect('mongodb://burger:burger@ds247027.mlab.com:47027/burgers')

mongoose.connection.on('error', function() {
    console.log('Could not connect to the database. Exiting now...')
    process.exit()
})

mongoose.connection.once('open', function() {
    console.log("Successfully connected to the database")
})

// GET http://localhost:8080/v2
router.get('/', function(req, res) {
    res.status(200).json({ message: 'Welcome to Burgers!' })
})

// POST http://localhost:8080/v2/burgers
// CREATE Burger
router.route('/burgers').post(function(req, res) {
    var burger = new Burger()
    var new_burger_name = req.body.burger_name
    if(new_burger_name == '') {
        res.status(204).json({ message: 'No burger created!' })
        return
    }
    burger.burger_name = req.body.burger_name
    
    burger.save(function(err) {
        if (err) {
            res.send(err)
        }
        res.status(201).json({ message: 'Burger created!' })
    })
})

// GET http://localhost:8080/v2/burgers
// GET http://localhost:8080/v2/burgers?page=:page_num&per_page=:per_page_num
// LIST All Burgers and Pagination
router.route('/burgers').get(function(req, res) {
    var page_num = Number(req.query.page);
    var per_page_num = Number(req.query.per_page);

    var pageOptions = {
        page: page_num || 0,
        per_page: per_page_num || 25
    }
    
    Burger.find()
        .skip(pageOptions.page * pageOptions.per_page)
        .limit(pageOptions.per_page)
        .exec(function (err, burgers) {
            if(err) { 
                res.status(500).json(err)
                res.send(err)
                return
            }
            res.status(200).json(burgers)
        })
})

// Get a Single RANDOM ID Burger or Single Burger by ID
router.route('/burgers/:burger_id').get(function(req, res) {
    Burger.find(function(err, burgers) {
        if (err) {
            res.send(err)
            return
        }

        var id = 0;
        if(req.params.burger_id == 'random') {
            // GET http://localhost:8080/v2/burgers/random
            var max = burgers.length;
            id = Math.floor(Math.random() * Math.floor(max))
        } else {
            // GET http://localhost:8080/v2/burgers/burger_id
            id = Number(req.params.burger_id);
            if(id < 0 || id >= burgers.length) {
                res.status(404).json({ message: 'Burger not found!' })
                res.send(err)
                return
            }
        }
        
        res.status(200).json(burgers[id])
    })
})

app.use('/v2', router)

https.createServer(options, app).listen(port)
