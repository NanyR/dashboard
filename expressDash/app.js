const express= require("express");
const bodyParser= require("body-parser");
// returns express application
const app=express();

app.use(bodyParser({extended:false}));

// CALLBACKS
function authenticateAccelaUser(username, password){
  return new Promise ((resolve, reject)=>{
    if(data.data.status === 200){
      token="something"
      resolve({username});
    }else{
      reject("error with request");
    }
  })
}

// MIDDLEWARE
function asyncHandler(cb){
  return async(requ, res, next)=>{
    try{
      await cb(req, res, next);
    }catch(err){
      console.log(err)
    }
  }
}


app.post('/authenticate',(req, resp)=>{
  //this must return a promise in order to continue with .then
  authenticateAccelaUser()
  .then()
  .then()
  .catch(err)
})



app.listen(3000);
