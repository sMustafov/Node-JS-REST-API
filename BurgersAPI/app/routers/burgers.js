var express = require('express')
var router = express.Router()
var Burger = require('../models/burger')

const asyncMiddleware = require('../utils/asyncMiddleware')

router.use((req, res, next) => {
    console.log('Something is happening.')
    next()
})

// GET http://localhost:8080/v2
router.get('/', asyncMiddleware(async (req, res, next) => {
    res.status(200).json({ message: 'Welcome to Burgers!' })
}))

// POST http://localhost:8080/v2/burgers
// CREATE Burger
router.post('/burgers', asyncMiddleware(async (req, res) => {
    var burger = new Burger()
    var new_burger_name = req.body.burger_name
    if(new_burger_name == '') {
        res.status(204).json({ message: 'No burger created!' })
        return
    }

    burger.burger_name = req.body.burger_name
    
    await burger.save((err) => {
        if (err) {
            res.send(err)
        }
        res.status(201).json({ message: 'Burger created!' })
    })
}))

// GET http://localhost:8080/v2/burgers
// GET http://localhost:8080/v2/burgers?page=:page_num&per_page=:per_page_num
// LIST All Burgers and Pagination
router.get('/burgers', asyncMiddleware(async (req, res) => {
    var page_num = Number(req.query.page);
    var per_page_num = Number(req.query.per_page);

    var pageOptions = {
        page: page_num || 0,
        per_page: per_page_num || 25
    }
    
    await Burger.find()
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
}))

// Get a Single RANDOM ID Burger or Single Burger by ID
router.get('/burgers/:burger_id', asyncMiddleware(async(req, res) => {
    await Burger.find((err, burgers) =>{
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
}))

module.exports = router