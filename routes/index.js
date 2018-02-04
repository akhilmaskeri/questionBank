var express = require('express');
var router = express.Router();

var db = require('../queries')

/* GET home page. */
router.get('/', function(req, res, next) {
    if(req.session.user){
        db.home(req,res,next);
    }
    else res.render('login');
});

router.post('/login',function(req,res,next){
    return db.login(req,res,next);
});

router.get('/logout',function(req,res,next){
    if(req.session){
        req.session.destroy(function(err){
            if(err)
                return next(err);
            else res.redirect('/');
        });
    }
});


router.get('/edit',function(req,res,next){
    if(req.session.user)
        return db.getCurrentUserQuestions(req,res,next);
    else res.redirect('/');
});

router.get('/delete',function(req,res,next){

     if(req.session.user)
         return db.deleteQuestion(req,res,next);
     else res.redirect('/');
});

/* the insertion functions */
router.get('/publish',function(req,res,next){
    if(req.session.user)
        res.render('publish',{user:req.session.user});
    else res.redirect('/');
});

router.get('/help',function(req,res,next){
    if(req.session.user)
        res.render('help',{user:req.session.user});
    else res.redirect('/');
    
});

/* search */
router.get('/search',function(req,res,next){

    if(req.session.user){
        if(req.query.search.trim()=='')
            res.render('home',{user:req.session.user});
        else{
            return db.search(req,res,next);
        }
    }
    else res.render('login');    
});

router.post('/addQuestion',db.addQuestion);

router.get('/getDetails',function(req,res,next){
    if(req.session.user){
        return db.getAnswers(req,res,next);
    }
    else res.render('login');    
});

router.get('/writeAnswer',function(req,res,next){
    if(req.session.user){
        res.render('writeAnswer',{user:req.session.user,q_id:req.query.q_id,q_str:req.query.q_str});
    }
    else res.render('login');    
});

router.post('/addAnswer',db.addAnswer);

// user preview
router.get('/userPreview',function(req,res,next){

    if(req.session.user){
        return db.previewUser(req,res,next);
    }
    else res.render('login');
});

router.get('/followProfile',function(req,res,next){
    if(req.session.user){
        return db.followProfile(req,res,next);
    }
    else res.render('login')
});
router.get('/unfollowProfile',function(req,res,next){
    if(req.session.user){
        return db.unfollowProfile(req,res,next);
    }
    else res.render('login');
});

//vote
router.get('/upvote',function(req,res,next){
    if(req.session.user){
        return db.upvote(req,res,next);
    }
    else res.render('login');
});

router.get('/downvote',function(req,res,next){
    if(req.session.user){
        return db.downvote(req,res,next);
    }
    else res.render('login');
});

// comments
router.get('/getComments',function(req,res,next){
    if(req.session.user){
        return db.getComments(req,res,next);
    }
    else res.render('login');
});

// concepts
router.get('/alltopics',function(req,res,next){
    return db.getAllTopics(req,res,next);
});

router.get('/followTopic',function(req,res,next){
    return db.followConcept(req,res,next);
});
router.get('/unfollowTopic',function(req,res,next){
    return db.unfollowConcept(req,res,next);
});


module.exports = router;
