const express= require("express");
const bodyParser= require("body-parser");
var cors = require('cors');
const request=require('request');
const axios= require("axios");
var cookieParser = require('cookie-parser');
const session=require("express-session");
const keys= require('./config/keys.js');
const app=express();
//
// app.use(cors());
app.use(bodyParser.json());

app.use(cookieParser());
app.use(session({
  secret:'andes',
  resave:true,
  saveUninitialized: true,
  cookie:{
    maxAge:82800000
  }
}))

app.use(cors({
    origin:['http://localhost:3000'],
    methods:['GET','POST'],
    credentials: true // enable set cookie
}));

app.all('*',  (req, res, next) => {
  if(req.session.page_views){
  req.session.page_views++;
  console.log("You visited this page " + req.session.page_views + " times");
  // console.log("You visited this page " + req.session.token + " times");
  } else {
  req.session.page_views = 1;
  console.log("Welcome to this page for the first time!");
  }
  next(); // pass control to the next handler
});


function getToken(username, password){
  console.log(username);
  console.log(password);
  return new Promise( (resolve, reject)=>{
    request.post('https://auth.accela.com/oauth2/token',{
      form:{
        client_id: keys.dev.AUTH_CLIENT_ID,
        client_secret:keys.dev.AUTH_CLIENT_SECRET,
        grant_type:'password',
        // username:username,
        username:'acauser3',
        password: 'accelainc',
        scope:'records inspections documents users addresses reports',
        agency_name:'VOM',
        environment:'SUPP',
        id_provider:'citizen'
      }
    },
    (err, response, bodyResp)=>{
          const status= response.statusCode;
          if(status==200){
            let body=JSON.parse(response.body);
            let token= body.access_token;
            session.token=token;
            resolve (token);
          }else {
          reject(err);}
    })
    }
  )
}

function getUserInfo(token){
  return new Promise ((resolve, reject)=>{(request.get('https://apis.accela.com/v4/citizenaccess/profile', {"headers":{"authorization":token, "cache-control": "no-cache"}},
    (err, response, bodyResp)=>{
        const status= response.statusCode;
        resolve(JSON.parse(response.body));
        reject(err);
    }
    ))})
}

function getUserRecords(token){
  return new Promise((resolve,reject)=>{
                (request.get('https://apis.accela.com/v4/records/mine',
                    {"headers":{"authorization":token, "cache-control": "no-cache"}},
                    (err, response, bodyResp)=>{
                      const status=response.statusCode;
                      resolve(JSON.parse(response.body));
                      reject(err);
                    }))
              })
}


function getRecordCustomForm(record,token){
  return new Promise((resolve, reject)=>{
    (request.get(`https://apis.accela.com/v4/records/${record}/customForms`,
      {"headers":{"authorization":token, "cache-control": "no-cache"}},
      (err, response, bodyResp)=>{
        const status= response.statusCode;
        resolve(JSON.parse(response.body));
        reject(err);
      }
    ))
  })
}

function updateCustomForm(record, fields, token){
  return new Promise((resolve, reject)=>{
      var options = { method: 'PUT',
        url: `https://apis.accela.com/v4/records/${record}/customForms`,
        headers: {'cache-control': 'no-cache',
        authorization:token,
        accept: 'application/json' },
        body:[ fields ],
        json: true };
      request(options,(err, response, bodyResp)=>{
      const status= response.statusCode;
      resolve(response.body)
      reject(err)
    })
  })
}

function getInspections(record, token){
  console.log(record)
  return new Promise((resolve, reject)=>{
    var options = { method: 'GET',
    url: `https://apis.accela.com/v4/records/${record}/inspections`,
    headers:{'cache-control': 'no-cache',authorization: token}
    };
    request(options, (error, response, body)=> {
    resolve(body);
    reject(error);
      })
  })
}

function getFees(record, token){
  console.log(record)
  return new Promise((resolve, reject)=>{
    var options = { method: 'GET',
    url: `https://apis.accela.com/v4/records/${record}/fees`,
    headers:{'cache-control': 'no-cache',authorization: token}
    };
    request(options, (error, response, body)=> {
    resolve(body);
    reject(error);
      })
  })
}



//routes

app.post('/records/inspections',
  async(req, res)=>{
    try{
    const inspections = await(getInspections(req.body.recordId, req.session.token));
    res.send(inspections);
    }
    catch(err){
      res.send(err)
    }
  })

  app.post('/records/fees',
    async(req, res)=>{
      try{
      const inspections = await(getFees(req.body.recordId, req.session.token));
      res.send(inspections);
      }
      catch(err){
        res.send(err)
      }
    })

app.post('/authenticate',
    async(req, res)=> {
      try{
        console.log(req.body)
        const token=await(getToken(req.body.user, req.body.password));
        console.log(token)
        req.session.token=token;
        const group=await(Promise.all([getUserInfo(session.token), getUserRecords(session.token)])).then((data)=>{
        console.log(req.session)
        return(data)
        })
      .catch((err)=>{
        return(err)
      })
        res.send(group);
      }
      catch(err){
        res.send(err)
      }
  })


//recordsInfo

app.post('/recordCustomForm',
async(req, res)=>{
  try{
    // console.log(`Record id: ${req.body.recordId}`)
    const asiInfo= await(getRecordCustomForm(req.body.recordId, req.session.token));
    // console.log(asiInfo);
    res.send(asiInfo);
  }
  catch(err){
    res.send(err)
  }
})

app.post('/updateCustomForm',
  async(req, res)=>{
    try{
      const success= await(updateCustomForm(req.body.record, req.body.fields, req.session.token));
      res.send(success)
    }
    catch(err){
      res.send(err)
    }
  })


// oauth logut
app.get('/logout', (req, res)=>{
  console.log(req.sessionID)
  if(req.session){
    req.session.destroy((err)=>{
      if(err){
        res.send(err)
      }else{
        res.send("successfully logged out");
      }
    })
  }
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
