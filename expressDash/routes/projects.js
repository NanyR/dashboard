const express= require('express');
const router= require('express').Router();
const Project= require('../models/projects');
const User= require('../models/user');

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
            User.findById(_id).then(user=>{
              console.log(user.projects)
            })
            res.send(project)
            }
        })

      }
    })
    // Projects.findOne({name: req.body.name}).then((project)=>{
    //   if(project){
    //     let err= new Error ("Project exists");
    //     err.status=400
    //     next(err)
    //   }else{
    //     console.log("about to add new project")
    //     let projectData={
    //     name: req.body.name,
    //     projectDescription:req.body.projectDescription ? req.body.projectDescription : ' '
    //     }
    //     Projects.create(projectData, (error, project)=>{
    //       if(error){
    //         let err= new Error ("Error creating project");
    //         next(err)
    //       }else{
    //         res.send(project)
    //       }
    //     })
    //   }
    // })
  }
)

router.get('/all',
  (req, res, next)=>{
    Projects.find().then((projects)=>{
      res.send(projects)
    })
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
