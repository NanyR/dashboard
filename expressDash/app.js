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

function getMainInfo(token, record, query){
  return new Promise((resolve, reject)=>{
        var options = { method: 'GET',
        url: `https://apis.accela.com/v4/records/${record}/${query}`,
        headers: {'cache-control': 'no-cache', authorization: token } };
        request(options,
          (error, response, body)=> {
          let info=JSON.parse(response.body).result;
          resolve({[query]: info});
          reject(error);
        });
  })
}


// function getRecordCustomForm(record,token){
//   return new Promise((resolve, reject)=>{
//     (request.get(`https://apis.accela.com/v4/records/${record}/customForms`,
//       {"headers":{"authorization":token, "cache-control": "no-cache"}},
//       (err, response, bodyResp)=>{
//         const status= response.statusCode;
//         resolve(JSON.parse(response.body));
//         reject(err);
//       }
//     ))
//   })
// }

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


function scheduleInspection(body, token){
  console.log('inside function')
  return new Promise((resolve, reject)=>{
    var options={
      method:'POST',
      url:`https://apis.accela.com/v4/inspections/schedule`,
      headers:{
        'cache-control': 'no-cache',
        authorization:token,
      },
      body:body
    };
      request(options,
        (err, response, bodyResp)=>{
          let status=response.statusCode;
          console.log(status);
          console.log(response);
          resolve(respose);
          reject(err)
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

app.post('/authenticate',
    async(req, res)=> {
      try{
          if(req.session.token== undefined){
            console.log("no token")
          const token=await(getToken(req.body.user, req.body.password));
          console.log(token)
          req.session.token=token;}

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

app.post(['/main', '/record'],
  async(req, res)=>{
    try{
      let token= req.session.token;
      let record= req.body.record
      const recInfo = await(Promise.all([getMainInfo(token, record,'addresses'), getMainInfo(token, record, 'contacts'), getMainInfo(token, record, 'owners')]))
      .then((data)=>{
        return(data)
        })
      .catch((err)=>{
        return(err)
      })
      res.send(recInfo);
    }
    catch(err){
      res.send(err)
    }
})

app.post('/processingstatusdetails',
  async(req, res)=>{
    try{
      let token= req.session.token;
      let record= req.body.record
      const workflowTasks = await(getMainInfo(token, record,'workflowTasks'))
      res.send(workflowTasks);
    }
    catch(err){
      res.send(err)
    }
})

app.post('/documentTypes',
  async(req, res)=>{
    try{
      let token= req.session.token;
      let record= req.body.record
      const documentTypes = await(getMainInfo(token, record,'documentCategories'))
      res.send(documentTypes);
    }
    catch(err){
      res.send(err)
    }
})

app.post('/documents',
  async(req, res)=>{
    try{
      let token= req.session.token;
      let record= req.body.record
      const documents = await(Promise.all([getMainInfo(token, record,'documents'), getMainInfo(token, record, 'documentCategories')]));
      res.send(documents);
    }
    catch(err){
      res.send(err)
    }
})


app.post('/fees',
  async(req, res)=>{
    try{
      let token= req.session.token;
      let record= req.body.record
      const fees = await(getMainInfo(token, record,'fees'))
      res.send(fees);
    }
    catch(err){
      res.send(err)
    }
})


app.post('/inspections',
  async(req, res)=>{
    try{
      let token= req.session.token;
      let record= req.body.record
      const inspections = await(Promise.all([getMainInfo(token, record,'inspections'), getMainInfo(token, record, 'inspectionTypes')]));
      res.send(inspections);
    }
    catch(err){
      res.send(err)
    }
})

app.post('/inspectionRequest',
  async(req, res)=>{
    try{
      let token= req.session.token;
      const inspReq= await(scheduleInspection(req.body, token))
      console.log(inspReq)
      res.send(inspReq)
    }
    catch(err){
      res.send(err)
    }
  }
)

app.post('/recordCustomForm',
async(req, res)=>{
  try{
    let token= req.session.token;
    let record= req.body.record
    const customForms = await(getMainInfo(token, record,'customForms'))
    res.send(customForms);
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
