var mongoose = require('mongoose')
var Schema = mongoose.Schema

var BurgerSchema = new Schema({
    burger_name: String
})

module.exports = mongoose.model('Burger', BurgerSchema)