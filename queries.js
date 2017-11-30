var promise = require('bluebird');
var Date    = require('date-and-time');

var options = {
    promiseLib : promise
};

var pgp = require('pg-promise')(options);
//var db = pgp('postgres://localhost:5432/qb');
var db = pgp('postgres://lqjspduaxlkszl:08328935716b48894a775a23f8cf72a53c26f803ed3b8e5cd6fbfcf56b0eee98@ec2-23-21-155-53.compute-1.amazonaws.com:5432/d4gp5407cde8u6')

module.exports = {
    register : registerUser,
    login : login,
    details : getDetails,
    addQuestion : addQuestion,
    deleteQuestion : deleteQuestion, 
    searchByConcepts : searchByConcepts,
    searchByPublisher :searchByPublisher,
    searchByExam : searchByExam,
    getCurrentUserQuestions : getCurrentUserQuestions,
}

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
                    res.redirect('/users/login')
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


// questions

function getDetails(req,res,next){

        var appeared = []
        var queryString = `select e.e_code from exam e,qa q,appear a where q.q_id=${req.query.qid} and q.q_id=a.q_id and a.e_id = e.e_id`
        db.any(queryString)
            .then(function(data){
                data.forEach(function(e){
                    appeared.push(e['e_code']);
                });
            })
            .catch(function(err){
                next(err);
            });

        var queryString = `select q.q_str,q.ans_str,fname,lname from qa q,users u where q.q_id=${req.query.qid} and q.pub_id=u.u_id`
        db.any(queryString)
            .then(function(data){
                res.render('answer',{data:data,user:req.session.user,appeared:appeared});
            })
            .catch(function(err){
                next(err);                
            });
}


// search functions

function searchByPublisher(req,res,next){

    var queryString = `select q.q_id,q.q_str from qa q,users u where q.pub_id = u.u_id and u.fname like '${req.query.search}';`;
    
    db.any(queryString)
        .then(function(data){
            res.render('result',{searchStr:req.query.search,data:data,user:req.session.user,searchBy:req.query.searchBy});
        })
        .catch(function(err){
            return next(err);
        })
}

function searchByConcepts(req,res,next){

    var getSimilarConcept = `select c_str from concept where c_str like '${req.query.search}%'`;
    var similarConcepts;

    db.any(getSimilarConcept)
    .then(function(data){
        similarConcepts= data;         
    })
    .catch(function(err){
        next(err);
    });

    var queryString = `select q.q_id,q.q_str from qa q, concept c,tag t where c_str like '${req.query.search}%' and t.c_id=c.c_id and t.q_id=q.q_id `;
    
    db.any(queryString)
        .then(function(data){
            res.render('result',{searchStr:req.query.search,data:data,concepts:similarConcepts,user:req.session.user,searchBy:req.query.searchBy});
       })
        .catch(function(err){
            next(err);
        });

}

function searchByExam(req,res,next){

    var queryString = `select q.q_id,q.q_str from qa q,appear a,exam e where q.q_id=a.q_id and a.e_id = e.e_id and e.e_code='${req.query.search}'`;
    db.any(queryString)
        .then(function(data){
            res.render('result',{searchStr:req.query.search,data:data,user:req.session.user,searchBy:req.query.searchBy});
        }).catch(function(err){
            next(err);
        });
}


// add question
function addQuestion(req,res,next){

    if(req.session){
        db.any(`select addQuestion(${req.session.u_id},'${req.body.q_str.trim()}','${req.body.ans_str.trim()}','${req.body.exam.trim()}','${req.body.tags.trim()}');`)
        .then(function(data){
            res.render('publish',{user:req.session.user});
        })
        .catch(function(err){
            res.send('error while publishing')
        })
    }
    else
        res.redirect('/login');

}

function getCurrentUserQuestions(req,res,next){

    db.any(`select q_id,q_str,ans_str from qa where pub_id=${req.session.u_id}`)
    .then(function(data){
        res.render('edit',{user:req.session.user,data:data});
    })
    .catch(function(err){
        res.send("error while fetching data");
    });

}

function deleteQuestion(req,res,next){

    db.any(`delete from qa where q_id=${req.query.qid}`)
    .then(function(){
        res.redirect('/edit');
    })
    .catch(function(){
        res.send("error while deleting the message");
    });

}
