const mongoose= require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name:{
    type:String,
    unique:true,
    required:true,
    trim:true
  },
  records:[]
})

const Project = mongoose.model('Project', ProjectSchema);
module.exports=Project;
