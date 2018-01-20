var promise = require('bluebird');
var Date    = require('date-and-time');

var options = {
    promiseLib : promise
};

var pgp = require('pg-promise')(options);
var db = pgp('postgres://localhost:5432/questionbank');

module.exports = {
    register : registerUser,
    login : login,

    home : home,

    search : search,
    
    addQuestion : addQuestion,
    deleteQuestion : deleteQuestion,
    getAnswers : getAnswers,
    addAnswer : addAnswer,
    
    getCurrentUserQuestions : getCurrentUserQuestions,
    getAllTopics : getAllTopics,
    
    followConcept : followConcept,
    unfollowConcept : unfollowConcept,

    previewUser : previewUser,
    followProfile : followProfile,
    unfollowProfile : unfollowProfile,
}


//  - [ ] sanitization of data

// user functions
function registerUser(req,res,next){

    db.any(`select count(*) from users where email='${req.body.email}'`)
        .then(function(data){
            if(data['0']['count']!='0'){
                res.render('signin',{failed:true});
            }
            else{
                db.any(`insert into users(fname,lname,email,password) values ('${req.body.fname}','${req.body.lname}','${req.body.email}','${req.body.password}')`)
                .then(function(data){
                    res.redirect('/users/login');
                })
                .catch(function(err){
                    return next(err);
                });
            }
        })
        .catch(function(err){
            return next(err);
        });
    
}
    
function login(req,res,next){

    var queryString =  `select u_id,fname,password from users where email='${req.body.email}'`

    db.any(queryString)
    .then(function(data){
        if(data.length == 1 && req.body.password == data['0']['password'] ){
            
            req.session.u_id = data['0']['u_id'];
            req.session.user = data['0']['fname'];

            res.redirect('/');
        }
        else{
            res.render('login',{failed:true});
        }
    })
    .catch(function(err){
        return next(err);
    });

}

function home(req,res,next){

    db.any(`select c_str from concept , intrested_in where user_id=${req.session.u_id} and concept=c_id limit 10`)
    .then(function(interest){
       
        db.any(`select fname,lname from users,follows where user_id='${req.session.u_id}' and u_id=follows;`)
        .then(function(data){
            res.render('home',{ user : req.session.user , interests : interest , following : data });
        })
        .catch(function(err){
            next(err);
        });

    })
    .catch(function(err){
        res.send(err);
    });

}

// ask question
function addQuestion(req,res,next){

    if(req.session.user){

        db.any(`select addQuestion(${req.session.u_id},'${req.body.q_str.trim()}','${req.body.tags.trim()}');`)
        .then(function(data){
            res.render('publish',{user:req.session.user,added:true});
        })
        .catch(function(err){
            res.send('error while publishing <br/>'+err)
        })
    }
    else
        res.redirect('/login');
}

// answer question
function addAnswer(req,res,next){

    var query = `insert into answers (q_id,ans_str,ans_date,ans_auth) values (${req.body.q_id},'${req.body.ans_str.trim()}',now(),${req.session.u_id})`;
    db.any(query)
    .then(function(data){
        req.query.q_id = req.body.q_id;
        return getAnswers(req,res,next);
    })
    .catch(function(err){
        next(err)
    });
}


function getAnswers(req,res,next){

    var query=`select ans_id,ans_str,u_id,fname,lname from answers a,users where a.q_id=${req.query.q_id} and ans_auth=u_id order by ans_date;`;
    db.any(query)
    .then(function(answer){
        db.any(`select q_id,q_str,q_auth,pub_date from questions where q_id=${req.query.q_id}`)
        .then(function(question){
            res.render('answer',{user:req.session.user,answers:answer,question:question}); 
        })
        .catch(function(err){
            next(err)
        });
       
    })
    .catch(function(err){
        next(err);
    });

}



// search functions

function search(req,res,next){

    var getSimilarConcept = `select c_id,c_str,case when c_id in (select concept from intrested_in where user_id=${req.session.u_id}) then 1 else 0 end from concept where c_str like '%${req.query.search}%'`;
    var getSimilarUsers = `select u_id,fname,lname from users where fname like '${req.query.search}';`;
    var getSimilarQuestions = `select q.q_id, q.q_str from questions q where q_str like '%${req.query.search}%';`;

    db.any(getSimilarConcept)
    .then(function(concept){
        
        db.any(getSimilarUsers)
        .then(function(profile){
        
            db.any(getSimilarQuestions)
            .then(function(question){
                res.render('result',{user:req.session.user,searchStr:req.query.search,concepts:concept,profiles:profile,questions:question});
            })
            .catch(function(err){
                next(err);
            });

        })
        .catch(function(err){
            next(err);
        });
    })
    .catch(function(err){
        next(err);
    });

}

function getCurrentUserQuestions(req,res,next){

    db.any(`select q_id,q_str from questions where q_auth=${req.session.u_id}`)
    .then(function(data){
        res.render('edit',{user:req.session.user,data:data});
    })
    .catch(function(err){
        res.send("error while fetching data <br/>"+err);
    });

}

function deleteQuestion(req,res,next){

    db.any(`delete from questions where q_id=${req.query.qid}`)
    .then(function(data){
        res.redirect('/edit');
    })
    .catch(function(err){
        res.send("error while deleting the question <br/>"+err);
    });

}

function getAllTopics(req,res,next){
    db.any(`select c_id,c_str,case when c_id in (select concept from intrested_in where user_id=${req.session.u_id}) then 1 else 0 end from concept`)
    .then(function(data){
        console.log(data.length)
        res.render('topics',{user:req.session.user , data:data})
    })
    .catch(function(err){
        res.send(err);
    });
}

function followConcept(req,res,next){
    db.any(`insert into intrested_in values ('${req.query.t}','${req.session.u_id}')`)
    .then(function(data){
        res.redirect('/alltopics');    
    })
    .catch(function(err){
        res.send('error while following concept <br/>'+err);
    });
}

function unfollowConcept(req,res,next){
    db.any(`delete from intrested_in where user_id=${req.session.u_id} and concept=${req.query.t}`)
    .then(function(data){
        res.redirect('/alltopics');    
    })
    .catch(function(err){
        res.send('error while unfollowing concept <br/>'+err);
    });
}

function previewUser(req,res,next){
    
    db.any(`select u_id,fname,lname,case when exists (select * from follows where user_id=${req.session.u_id} and follows='${req.query.id}')then '1' else '0' end from users where u_id ='${req.query.id}'`)
    .then(function(users){
        res.render('user',{user:req.session.user,profile:users[0]});
    })
    .catch(function(err){
        next(err);
    });
}

function followProfile(req,res,next){

    db.any(`insert into follows values (${req.session.u_id},${req.query.id})`)
    .then(function(data){
        previewUser(req,res,next);
    })
    .catch(function(err){
        next(err);
    });

}

function unfollowProfile(req,res,next){

    db.any(`delete from follows where user_id=${req.session.u_id} and follows=${req.query.id} and not exists (select * from follows where user_id='${req.session.u_id}' and follows='${req.query.id}');`)
    .then(function(data){
        previewUser(req,res,next);
    })
    .catch(function(err){
        next(err);
    });

}