const mongoose= require('mongoose');
const UserSchema= new mongoose.Schema({
  username:{
    type:String,
    unique:true,
    required:true,
    trim:true
    }
    appType:{
      type:String,
      required:true,
      trim:true
    }
  )

const User= mongoose.model('User', UserSchema);
module.exports=User;
