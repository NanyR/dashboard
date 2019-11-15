const mongoose= require('mongoose');
var Schema= mongoose.Schema;

const ProjectSchema = new mongoose.Schema({
  name:{
    type:String,
    unique:true,
    required:true
  },
  records:[],
  projectDescription:String,
  projectForUser: { type: Schema.Types.ObjectId, ref: 'User' }
})

const Project = mongoose.model('Project', ProjectSchema);
module.exports=Project;
