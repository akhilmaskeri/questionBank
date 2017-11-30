var express = require('express');
var router = express.Router();

var db = require('../queries')

/* GET home page. */
router.get('/', function(req, res, next) {

    if(req.session.user){
        
        res.render('home', { user : req.session.user});
    }
    else
        res.render('login');
});

router.get('/edit',function(req,res,next){
    if(req.session.user)
        return db.getCurrentUserQuestions(req,res,next);
    else
        res.redirect('/');
});

router.get('/delete',function(req,res,next){

     if(req.session.user)
         return db.deleteQuestion(req,res,next);
     else
         res.redirect('/');
});

router.post('/login',function(req,res,next){
    return db.login(req,res,next);
});

router.get('/logout',function(req,res,next){
    if(req.session){
        req.session.destroy(function(err){
            if(err)
                return next(err);
            else
                res.redirect('/');
        });
    }
});


/* the insertion functions */
router.get('/publish',function(req,res,next){
    res.render('publish',{user:req.session.user});
});

router.get('/help',function(req,res,next){
    res.render('help');
});

/* search */
router.get('/search',function(req,res,next){

    if(req.query.search.trim()=='')
        res.render('home',{user:req.session.user});
    else{
        if(req.query.searchBy == 'concept')
            return db.searchByConcepts(req,res,next);
        else if(req.query.searchBy == 'publisher')
            return db.searchByPublisher(req,res,next);
        else
            return db.searchByExam(req,res,next);
    }
});

router.get('/getDetails',function(req,res,next){

    return db.details(req,res,next);

});

router.post('/addQuestion',db.addQuestion);

module.exports = router;
