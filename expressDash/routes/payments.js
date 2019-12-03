const express= require('express');
const router= require('express').Router();
var cors = require('cors');
const request=require('request');
const bodyParser= require("body-parser");

// app.use(cors());
router.use(bodyParser.json());

//middleware

function makePayment(token,body){
  new Promise((resolve, reject)=>{
      var options = { method: 'POST',
      url: 'https://apis.accela.com/v4/payments',
      headers:
       { 'cache-control': 'no-cache',
         accept: 'application/json',
         'content-type': 'application/json',
         authorization: token },
      body:body,
      json: true };

      request(options, function (error, response, body) {
          if (error){
            console.log("error making payment to Accela")
            reject(error)
          }else{
              console.log(body);
              resolve(body)
          }
      })
    })
}

router.use((req, res, next)=>{
  console.log("in payments route")
  console.log(req.session.userId)
  if(req.session.token== undefined){
    let err=new Error("User could not be authenticated. User must be logged in to make payments");
    err.status=400
    next(err)
  }else{
    next()
  }
})

router.post('./payment',
  async(req, res, next)=>{
    try{
      const token=req.session.token;
      console.log(req.body)
      const payBody=req.body
      const result=await(makePayment(token,payBody));
    }catch(err){
      new Error('Error processing payment')
      next(err)
    }
  }
)


//error handler
router.use((err, req, res, next)=>{
  res.status((err.status || 500))
  res.message="Server error with payments"
  res.json({
    error:err.message
  })
})


module.exports=router
