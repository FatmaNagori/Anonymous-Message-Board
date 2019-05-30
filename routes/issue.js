var mongoose=require('mongoose');
mongoose.connect(process.env.DB,{useNewUrlParser:true,useFindAndModify:false})
var Schema=mongoose.Schema;
var threadSchema=new Schema({board:String,text:String,created_on:Date,bumped_on:Date,reported:Boolean,delete_password:String,replies:Array});
var Thread=mongoose.model('thread',threadSchema);

module.exports=Thread;
