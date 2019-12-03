const express= require('express');
const router= require('express').Router();
var cors = require('cors');
const request=require('request');
const bodyParser= require("body-parser");

// app.use(cors());
router.use(bodyParser.json());


router.use((req, res, next)=>{
  console.log("in records route")
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
        resolve(JSON.parse(response.body))
      }
    })
  }
)}


function getRecordInfo(token, record, query){
  return new Promise((resolve, reject)=>{
    var options = { method: 'GET',
    url: `https://apis.accela.com/v4/records/${record}/${query}`,
    headers: {
       'cache-control': 'no-cache',
       authorization:token }}

    request(options,  (error, response, body)=> {
      if (error){

        reject(new Error(`Issue getting ${query} for ${record}`))
      }else{
        console.log(response.statusCode)

        resolve(JSON.parse(response.body));
      }
    });
  })
}



//search records by parameters

router.post('/search',
  async(req, res, next)=>{
    const token=req.session.token;
    const appType=req.session.appType;
    const query= req.body;
    const result= await(getMyRecords(query, appType, token));
    res.send(result)
  }
)

//get all my records
router.post('/index',
  async(req, res, next)=>{
    const token=req.session.token;
    const appType=req.session.appType;
    const result= await(getMyRecords("", appType, token));
    res.send(result)
  }
)

//get info on an array of records
router.post('/getRecordsInfo',
  async(req, res, next)=>{
    try{
      const token= req.session.token;
      let records= req.body.records;
      // console.log(records)
      const feesPromises=await(records.map((rec)=>getRecordInfo(token, rec, 'fees')))
      const wfPromises=await(records.map((rec)=>getRecordInfo(token, rec, 'workflowTasks')))
      const inspPromises=await(records.map((rec)=>getRecordInfo(token, rec, 'inspections')))
      const fees= await(Promise.all(feesPromises))
      const wf=await(Promise.all(wfPromises))
      const insp=await(Promise.all(inspPromises))

      res.send({fees, wf, insp})
    }catch(err){
      next( new Error('error gettins info for all records'))
    }
  }
)


//error handler
router.use((err, req, res, next)=>{
  res.status((err.status || 500))
  res.message="Server error with records"
  res.json({
    error:err.message
  })
})


module.exports=router
