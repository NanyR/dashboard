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

function getToken(){
  return new Promise( (resolve, reject)=>{
    request.post('https://auth.accela.com/oauth2/token',{
      form:{
        client_id: keys.dev.AUTH_CLIENT_ID,
        client_secret:keys.dev.AUTH_CLIENT_SECRET,
        grant_type:'password',
        username:'lwacht@septechconsulting.com',
        password: 'accela55',
        scope:'records inspections documents users addresses reports',
        agency_name:'MCPHD',
        environment:'SUPP',
        id_provider:'citizen'
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
  return new Promise ((reject, resolve)=>{(request.get('https://apis.accela.com/v4/citizenaccess/profile', {"headers":{"authorization":token, "cache-control": "no-cache"}},
    (err, response, body)=>{
        const status= response.statusCode;
        console.log(status);
        console.log(response.body);
        resolve(response);
        reject(err);
    }
    ))})
}


//routes

app.get('/login',
    async(req, res)=> {
        const token= await(getToken());
        const user= await(getUserInfo(token));
        res.send(user);
  })

 app.get('/redirect',
    async (req, res, next)=>{
    try{
      const authToken= await(getToken())
      console.log("test")
      // const user= await(getUserInfo(authToken));
      // console.log("user")
      res.send(authToken)
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
