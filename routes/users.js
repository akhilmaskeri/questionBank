var express = require('express');
var router = express.Router();

var db = require('../queries')

/* GET users listing. */

router.get('/signup',function(req,res,next){
    res.render('signin');
});

router.get('/login',function(req,res,next){
    res.render('login')
})

router.post('/register',db.register);

module.exports = router;
