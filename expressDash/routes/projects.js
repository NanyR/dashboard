const express= require('express');
const router= require('express').Router();
const Project= require('../models/projects');
const User= require('../models/user');
const bodyParser= require("body-parser");

// app.use(cors());
router.use(bodyParser.json());


//middleware

function updateProject(id, records){
  return new Promise( (resolve, reject)=>{
    try{
        const _id=id;
        Project.findById(_id).then((project)=>{
          if(!project){
            next(new Error('Could not find project'));
          }else{
            console.log("found project!")
            let diffRecs=records.filter(rec=> project.records.indexOf(rec) < 0)
            project.records=[...project.records, ... diffRecs];
            project.save((err)=>{
              if(err){
                reject(new Error("Could not update project"))
              }else{
                console.log("Project updated")
              }
            })
            resolve(project.records)
          }
        })
      }catch(err){
        reject(err)
    }
  })
}

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


router.post('/new',
  (req, res, next)=>{
    console.log(req.body)
    const _id= req.session.userId;
    User.findById(_id).then((user)=>{
      if(!user){
        next(new Error("Cannot find user "+ req.session.user))
      }else{
        let projectData={
        name: req.body.name,
        projectDescription:req.body.projectDescription ? req.body.projectDescription : ' ',
        projectForUser:_id
        }
        console.log(projectData);
        Project.create(projectData, (error, project)=>{
          if(error){
            let err= new Error ("Error creating project");
            next(err)
          }else{
               res.send(project)
            }
        })
      }
    })
  }
)

router.get('/all',
  (req, res, next)=>{
    Projects.find().then((project)=>{
      res.send(projects)
    })
  }
)

router.post('/update',
  async(req, res, next)=>{
    let id=req.body.projectId;
    let records=req.body.records;
    let updates= await(updateProject(id, records));
    res.send(updates)
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
