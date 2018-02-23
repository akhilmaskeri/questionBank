var promise = require('bluebird');
var Date    = require('date-and-time');

var options = {
    promiseLib : promise
};

var pgp = require('pg-promise')(options);
var db = pgp('postgres://localhost:5432/questionbank');


module.exports = {

    register : register,
    login : login,
    deleteUser : deleteUser,

    addQuestion : addQuestion,
    deleteQuestion : deleteQuestion,
    voteQuestion : voteQuestion,
    unvoteQuestion : unvoteQuestion,

    addAnswer : addAnswer,
    deleteAnswer : deleteAnswer,
    voteAnswer : voteAnswer,
    unvoteAnswer : unvoteAnswer,

    followProfile : followProfile,
    unfollowProfile : unfollowProfile,

    followConcept : followConcept,
    unfollowConcept : unfollowConcept,
};

/* user */
function register(req,res){

    var check_for_already_existing= `select count(*) from users where email='${req.body.email}'`;
    var insert_user = `insert into users(fname,lname,email,password) values ('${req.body.fname}','${req.body.lname}','${req.body.email}','${req.body.password}')`;

    db.any(check_for_already_existing)
    .then(function(data){

        if(data['0']['count']!='0'){
            res.send("account already existing");
        }
        else{
            db.any(insert_user)
            .then(function(data){
                res.send("account succesfully registered");
            })
            .catch(function(err){
                res.send(err);
            });
        }
    })
    .catch(function(err){
        res.send(err);
    });
    
}

function login(req,res){

    var check_user_exists =  `select u_id,fname,password from users where email='${req.body.email}'`

    db.any(check_user_exists)
    .then(function(data){

        if(data.length == 1 && req.body.password == data['0']['password'] ){            
            req.session.u_id = data['0']['u_id'];
            req.session.user = data['0']['fname'];
            res.send("true");
        }
        else{
            res.send("false");
        }
    })
    .catch(function(err){
        return next(err);
    });
}

function deleteUser(req,res){

    var delete_user = `delete from users where u_id = ${req.session.u_id}`;
    db.any(delete_user)
    .then(function(data){
        req.session.destroy(function(err){ res.send(err) });
        res.send('successfully deleted');
    })
    .catch(function(err){
        res.send('failed');
    });

}

/* questions */
function addQuestion(req,res){

    db.any(`select addQuestion(${req.session.u_id},'${req.body.q_str.trim()}','${req.body.tags.trim()}');`)
    .then(function(data){
        res.send("Question successfully added");
    })
    .catch(function(err){
        res.send('failed to add question '+err);
    });

}

function deleteQuestion(req,res){

    // delete only if the q_auth = req.session.u_id
    var check_if_user_is_authorized = `select * from questions where q_id = ${req.body.q_id} and q_auth = ${req.session.u_id}`;
    db.any(check_if_user_is_authorized)
    .then(function(data){
        
        if(data.length > 0){

            var delete_question = `delete from questions where q_id = ${req.body.q_id} and q_auth = ${req.session.u_id}`;
            db.any(delete_question)
            .then(function(data){
                res.send("successfully deleted");
            })
            .catch(function(err){
                res.send("failed to delete question "+err);
            });

        }
        
        // if the user has no such q_id to delete
        res.send("unauthorized to delete the question")

    })
    .catch(function(err){
        res.send("unauthorized to delete question");
    });

}

/* TODO : update question */

function voteQuestion(req,res){
    
    var query="";

    if(req.query.q_id != null){
        query = `insert into vote (target_q,value,vote_by) values (${req.query.q_id},cast(${req.query.value} as bit),${req.session.u_id})`;
    }
    
    db.any(query)
    .then(function(data){
        res.send(data);
    })
    .catch(function(err){
        res.send("unable to vote "+query+" "+err);
    });
}

function unvoteAnswer(req,res){

    var query = "";

    if(req.query.q_id != null){
        query = `delete from vote where vote_by = ${req.session.u_id} and target_q = ${req.query.q_id}`;
    }

    db.any(query)
    .then(function(data){
        res.send(data);
    })
    .catch(function(err){
        res.send("unable to un vote "+err);
    });

}

/* answers */
function addAnswer(req,res){

    var query = `insert into answers (q_id,ans_str,ans_date,ans_auth) values (${req.body.q_id},'${req.body.ans_str.trim()}',now(),${req.session.u_id})`;
    db.any(query)
    .then(function(data){
        res.send("successfully added answer");
    })
    .catch(function(err){
        res.send("failed to add answer");
    });

}

function deleteAnswer(req,res){

    var  check_if_user_is_authorized = `select * from answers where ans_auth = ${req.session.u_id} and ans_id = ${req.body.ans_id} `;

    db.query(check_if_user_is_authorized)
    .then(function(data){
        if(data.length > 0 ){

            var delete_answer = `delete from answers where ans_id = ${req.body.ans_id}`;
            db.any(delete_answer)
            .then(function(data){
                res.send("successfully deleted ");
            })
            .catch(function(err){
                res.send("failed to delete the answer "+err);
            })    
        }   
        else{
            res.send("unauthorized to delete answer "+err)
        }

    })
    .catch(function(err){
        res.send("unauthorized to delete answer; you havent answered this question")
    });

}


function voteAnswer(req,res){
    
    var query="";

    if(req.query.ans_id != null){
        query = `insert into vote (target_ans,value,vote_by) values (${req.query.ans_id},cast(${req.query.value} as bit),${req.session.u_id})`;
    }
    
    db.any(query)
    .then(function(data){
        res.send(data);
    })
    .catch(function(err){
        res.send("unable to vote "+err);
    });
}

function unvoteAnswer(req,res){

    var query = "";

    if(req.query.ans_id != null){
        query = `delete from vote where vote_by = ${req.session.u_id} and target_ans = ${req.query.ans_id}`;
    }

    db.any(query)
    .then(function(data){
        res.send(data);
    })
    .catch(function(err){
        res.send("unable to un vote "+err);
    });

}



/* profile */

function followProfile(req,res,next){

    db.any(`insert into follows values (${req.session.u_id},${req.query.id})`)
    .then(function(data){
        return data;
    })
    .catch(function(err){
        next(err);
    });

}

function unfollowProfile(req,res,next){

    db.any(`delete from follows where user_id=${req.session.u_id} and follows=${req.query.id} and not exists (select * from follows where user_id='${req.session.u_id}' and follows='${req.query.id}');`)
    .then(function(data){
        return data;
    })
    .catch(function(err){
        next(err);
    });

}

function followConcept(req,res){
    db.any(`insert into intrested_in values ('${req.query.t}','${req.session.u_id}')`)
    .then(function(data){
        return data;
    })
    .catch(function(err){
        res.send('error while following concept '+err);
    });
}

function unfollowConcept(req,res){
    db.any(`delete from intrested_in where user_id=${req.session.u_id} and concept=${req.query.t}`)
    .then(function(data){
        return data;
    })
    .catch(function(err){
        res.send('error while unfollowing concept '+err);  
    });
}

function search(req,res,next){

    
    
    

    db.any(getSimilarConcept)
    .then(function(concept){
        
        db.any(getSimilarUsers)
        .then(function(profile){
        
            db.any(getSimilarQuestions)
            .then(function(question){
                res.send(question);
            })
            .catch(function(err){
                next(err);
            });

        })
        .catch(function(err){
            next(err);
        });
    })
    

}

function searchConcepts(req,res){
    var getSimilarConcept = `select c_id,c_str,case when c_id in (select concept from intrested_in where user_id=${req.session.u_id}) then 1 else 0 end from concept where c_str like '%${req.query.search}%'`;

    db.any(getSimilarConcept)
    .then(function(concept){
        return concept;
    })
    .catch(function(err){
        return err;
    });
}

function searchUsers(req,res){

    var getSimilarUsers = `select u_id,fname,lname from users where fname like '${req.query.search}';`;

    db.any(getSimilarUsers)
    .then(function(users){
        return users;
    })
    .catch(function(err){
        return err;
    });
}

function searchQuestions(req,res){

    var getSimilarQuestions = `select q.q_id, q.q_str from questions q where q_str like '%${req.query.search}%';`;

    db.any(getSimilarQuestions)
    .then(function(questions){
        return questions;
    })
    .catch(function(err){
        return err;
    });

}