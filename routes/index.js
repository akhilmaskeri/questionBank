var express = require('express');
var router = express.Router();

var db = require('../queries')

router.post('/register',function(req,res){

    // req.body.fname
    // req.body.lname
    // req.body.email
    // req.body.password

    return db.register(req,res);


});

router.post('/login', function(req,res){

    // req.body.email
    // req.body.password

    return db.login(req,res);

} );

router.get('/logout',function(req,res){

    // only on login
    if(req.session.u_id){
        req.session.destroy(function(err){
            if(err)
                res.send(err);
            else res.send("successfully session distroyed");
        });
    }

});

router.post('/deleteUser',function(req,res){

    if(req.session.u_id){
        // on successful deletion of user
        // distroy the session
        db.deleteUser(req,res);
    }
    else
        res.send("403 unauthorized");

});

/* questions */
router.post('/addQuestion',function(req,res){

    // req.body.q_str
    // req.body.tags

    if(req.session.u_id){
        db.addQuestion(req,res);
    }
    else
        res.send("403 unauthorized");
});

router.post('/deleteQuestion',function(req,res){

    // req.body.q_id

    if(req.session.u_id){
        db.deleteQuestion(req,res);
    }
    else
        res.send("403 unauthorized");

});


/* answer */
router.post('/addAnswer',function(req,res){

    // req.body.q_id
    // req.body.ans_str

    if(req.session.u_id){
        db.addAnswer(req,res);
    }
    else
        res.send("403 unauthorized");

});

router.post('/deleteAnswer',function(req,res){

    // req.body.ans_id

    if(req.session.u_id){
        db.deleteAnswer(req,res);
    }
    else
        res.send("403 unauthorized");

});


/* vote */

router.get('/upvote',function(req,res){

    // req.query.q_id
    // req.query.ans_id
    // req.query.value

    if(req.session.u_id){

        if(req.query.q_id)
            db.voteQuestion(req,res);
        else if(req.query.ans_id)
            db.voteAnswer(req,res);

    }
    else
        res.send("403 unauthorized");

});

router.get('/unvote',function(req,res){

    // req.query.q_id 
    // req.query.ans_id

    if(req.session.u_id){

        if(req.query.q_id){
            db.unvoteQuestion(req,res);
        }
        else if(req.query.ans_id)
            db.unvoteAnswer(req,res);
    }    
    else
        res.send("403 unauthorized");

});

router.get('/followProfile',function(req,res){

    // req.query.id

    if(req.session.u_id){
        db.followProfile(req,res);
    }
    else
        res.send("403 unauthorized");

});

router.get('/unfollowProfile',function(req,res){

    // req.query.id

    if(req.session.u_id){
        db.unfollowProfile(req,res);
    }
    else
        res.send("403 unauthorized");

});

/* concept */

router.get('/followConcept',function(req,res){

    // req.query.t
    if(req.session.u_id){
        db.followConcept(req,res);
    }
    else
        res.send("403 unautorized");

});

router.get('/unfollowConcept',function(req,res){

    // req.query.t
    if(req.session.u_id){
        db.unfollowConcept(req,res);
    }
    else
        res.send("403 unautorized");

});


module.exports = router;
