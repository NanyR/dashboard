const mongoose= require('mongoose');
var Schema    = mongoose.Schema;
// const ProjectModel= require('projects')

const UserSchema= new mongoose.Schema({
  username:{
    type:String,
    unique:true,
    required:true,
    trim:true
  },
    appType:{
      type:String,
      required:true,
      trim:true
    }
  })


var User= mongoose.model('User', UserSchema);
module.exports=User;
