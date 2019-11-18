const express= require('express');
const router= require('express').Router();
const cors = require('cors');
const request=require('request');
const session=require("express-session");
const keys= require('../config/keys.js');
const User= require('../models/user');
const Project= require('../models/projects');

router.use(cors({
    origin:['http://localhost:3000'],
    methods:['GET','POST'],
    credentials: true // enable set cookie
}));

//my middleware

function getForm(body){
  return new Promise((resolve, reject)=>{
    let form = {
      client_id: body.agency ? keys.dev.AUTH_CLIENT_ID_AGENCY : keys.dev.AUTH_CLIENT_ID,
      client_secret:body.agency ? keys.dev.AUTH_CLIENT_SECRET_AGENCY : keys.dev.AUTH_CLIENT_SECRET,
      grant_type:'password',
      username:body.user,
      password: body.password,
      scope:'records inspections documents users addresses reports',
      agency_name:keys.dev.ACCELA_AGENCY_NAME,
      environment:keys.dev.ACCELA_ENV,
    }
    if(!body.agency){
      form.id_provider='citizen'
    }
    resolve(form);
    reject(new Error(err))
  })
}

function getToken(form){
  return new Promise( (resolve, reject)=>{
    request.post('https://auth.accela.com/oauth2/token',{
      form: form
    },
    (err, response, bodyResp)=>{
          const status= response.statusCode;
          if(status==200){
            let body=JSON.parse(response.body);
            let token= body.access_token;
            session.token=token;
            console.log(token)
            resolve (token);
          }else {
            let error=new Error ('Error getting token from accela');
            error.status=status
            reject(error);
        }
    })
  })
}

function findOrCreateUser(data){
  console.log('inside create user')
  return new Promise((resolve, reject)=>{
    User.findOne({username:data.user}).then((currentUser)=>{
      if(currentUser){
        console.log('exisiting user');
        resolve(currentUser)
      }else{
        console.log('new user')
        let userData={
        username: data.user,
        appType: data.agency ? 'agency' : 'citizen'
        }
        User.create(userData, (error, user)=>{
          if(error){
            reject (error)
          }else{
            console.log('user created');
            resolve(user)
          }
        })
      }
    })
  })
}

function getUserProjects(id){
  return new Promise((resolve, reject)=>{
    Project.find({projectForUser: id}).then((projects)=>{
      if(!projects){
        console.log("no projects found for this user")
        resolve()
      }else{
        console.log(projects)
        resolve(projects);
      }
    })
  })
}


//login route

router.post('/accela',
  async(req,res, next)=>{
    try{
      if(req.body.user && req.body.password){
        let form=await(getForm(req.body));
        const token=await(getToken(form));
        req.session.token=token;
          try{
            const userInfo= await(findOrCreateUser(req.body));
            req.session.user=userInfo.username
            req.session.userId=userInfo.id
            req.session.appType=userInfo.appType
            let _id=userInfo.id
            const userProjects=await(getUserProjects(_id));
            res.send({userInfo, userProjects})
          }catch(err){
            console.log(err.message)
            next(err)
          }
      }else{
        let err= new Error('Need username and password to login');
        err.status=400;
        next(err)
      }
    } catch(err){
      err.message='Server error authenticating user'
      next(err)
    }
})

//error handler
router.use((err, req, res, next)=>{

  res.status((err.status || 500))
  res.json({
    error:err.message
  })
})

module.exports=router;
