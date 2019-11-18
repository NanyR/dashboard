const express= require('express');
const router= require('express').Router();
var cors = require('cors');
const request=require('request');
const bodyParser= require("body-parser");

// app.use(cors());
router.use(bodyParser.json());


router.use((req, res, next)=>{
  console.log("in projects route")
  console.log(req.session.userId)
  if(req.session.token== undefined){
    let err=new Error("User could not be authenticated");
    err.status=400
    next(err)
  }else{
    next()
  }
})

function getMyRecords(query, appType, token){
  return new Promise((resolve, reject)=>{
    var options = { method: 'GET',
    url: 'https://apis.accela.com/v4/records/mine',
    qs: query,
    headers: {
      'cache-control': 'no-cache',
       authorization:token}}

    request(options, (error, response, body) =>{
      if (error) {
        let err= new Error('Was not able to get records from accela');
        reject(err)
      }else{
        console.log(response.statusCode);
        console.log(JSON.parse(response.body))
        resolve(body)
      }
    })
  }
)}

router.post('/search',
  async(req, resp, next)=>{
    const token=req.session.token;
    const appType=req.session.appType;
    const query= req.body.body;
    console.log(query)
    const result= await(getMyRecords(query, appType, token));
    res.send(result)
  }
)


//error handler
router.use((err, req, res, next)=>{
  res.status((err.status || 500))
  res.message="Server error with projects"
  res.json({
    error:err.message
  })
})


module.exports=router
