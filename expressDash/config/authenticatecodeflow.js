const express= require("express");
const bodyParser= require("body-parser");
var cors = require('cors');
const request=require('request');
const axios= require("axios");
const session=require("express-session");
const keys= require('./config/keys.js');
const app=express();

app.use(cors());
app.use(bodyParser.json());


// app.use(session( {
//   secret: 'hello',
//   resave: true,
//   saveUninitialized: false
// }));


// MIDDLEWARE
// function asyncHandler(cb){
//   return async(requ, res, next)=>{
//     try{
//       await cb(req, res, next);
//     }catch(err){
//       console.log(err)
//     }
//   }
// }

function getToken(code){
  return new Promise( (resolve, reject)=>{
    request.post('https://auth.accela.com/oauth2/token',{
      form:{
        response_type:'code',
        client_id: keys.dev.AUTH_CLIENT_ID,
        client_secret:keys.dev.AUTH_CLIENT_SECRET,
        grant_type:'authorization_code',
        code: code,
        redirect_uri:'http://localhost:3001/redirect',
      }
    },
    (err, response, body)=>{
        try{
          const status= response.statusCode;
          console.log(status);
          let body=JSON.parse(response.body);
          let token= body.access_token;
          console.log(token)
          resolve (token);
        }
        catch(err){
          reject (err)
        }
    })
    }
  )
}

function getUserInfo(token){
  console.log("inside getUserInfo")
  return new Promise (request.get('https://apis.accela.com/v4/citizenaccess/profile', {"headers":{"authorization":token, "cache-control": "no-cache"}},
  (err, response, body)=>{
    try{
      const status= response.statusCode;
      console.log(status);
      console.log(response.body);
      resolve(response);
    }
    catch(err){
      reject(err);
    }
  }
))
}


//routes

app.get('/login',
      (req, res)=> {
     res.redirect(`https://auth.accela.com/oauth2/authorize?client_id=${keys.dev.AUTH_CLIENT_ID}&agency_name=${keys.dev.ACCELA_AGENCY_NAME}&environment=${keys.dev.ACCELA_ENV}&redirect_uri=http%3a%2f%2flocalhost%3a3001%2fredirect&scope=records%20inspections%20documents%20users%20addresses%20reports&response=code`);
  })

 app.get('/redirect',
    async (req, res, next)=>{
    try{
      const authToken= await(getToken(req.query.code))
      console.log("test")
      const user= await(getUserInfo(authToken));
      console.log("user")
      res.send(user)
    }
    catch(err){
        res.send("There was an error getting profile info")
    }
  }

 )




// oauth logut
app.get('/logout', (req, res)=>{
  console.log('Logging out');
  req.logout();
  console.log(req.session.user)
  res.redirect('http://localhost:3000/');
})


//
// app.post('/authenticate',(req, resp)=>{
//   //this must return a promise in order to continue with .then
//   authenticateAccelaUser()
//   .then()
//   .then()
//   .catch(err)
// })



app.listen(3001,()=>{
  console.log("Listening on port 3001");
});
