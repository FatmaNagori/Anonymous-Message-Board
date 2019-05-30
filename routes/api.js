/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var objectId=require('mongodb').ObjectID;
var Thread=require('../routes/issue.js')

var randHex = function(len) {
  var maxlen = 8,
      min = Math.pow(16,Math.min(len,maxlen)-1) ,
      max = Math.pow(16,Math.min(len,maxlen)) - 1, 
      n   = Math.floor( Math.random() * (max-min+1) ) + min,
      r   = n.toString(16);
  while ( r.length < len ) {
     r = r + randHex( len - maxlen );
  }
  return r;
};

module.exports = function (app) {
  
  app.route('/api/threads/:board')
    .get(function (req,res){
     var board=req.params.board;
     Thread.find({board:board},(err,data)=>{
       if(err){err}
       else{
         if(data==null){res.send([])}
         else{
           var result=[]; 
           var reply=[]
           data.forEach(a=>{
             if(a.replies.length!==0){a.replies.forEach(b=>{reply.push({_id:b._id,text:b.text,created_on:b.created_on})})}
             else{reply=[]}
             result.push({_id:a._id,text:a.text,created_on:a.created_on,bumped_on:a.bumped_on,replies:reply,replycount:a.replies.length})
           })
           res.json(result)
           
         }
       }
     })
   })
   .post((req,res)=>{
      var board=req.params.board;
      var id=randHex(21)+((Math.random()*100).toString().substring(3,6));
      var thread=new Thread({_id:id,
                             board:req.body.board,
                             text:req.body.text,
                             delete_password:req.body.delete_password,
                             created_on:new Date(),
                             bumped_on:[new Date()],
                             reported:false,
                             replies:[]
                            })
      thread.save((err,data)=>{
        if(err){return err}
        else{
          res.body=data
          res.redirect(`/b/${board}`)
        }
      })
      
   })

  .delete((req,res)=>{
    var board=req.params.board;
    var password=req.body.delete_password;
    var id=req.body.thread_id;
    Thread.findOne({_id:objectId(id)},(err,data)=>{
      if(err){return err}
      else{
        if(data!==null && data.delete_password==password &&  data.board==board){
            Thread.deleteOne({_id:objectId(id)},(err,data)=>{
              if(err){return err}
              else{res.send('success')}
            })
        }
        else{res.send('incorrect password')}
      }
    })
  })
  .put((req,res)=>{
      var board=req.params.board;
      var id=req.body.thread_id;
      Thread.findOne({_id:objectId(id)},(err,data)=>{
        if(err){return err}
        else{
          if(data!==null && data.board==board){
            data.reported=true
            data.save((err,doc)=>err?err:doc)
            res.send('success')
          }else(res.send('unknown_id'))
        }
      })
  })
    
    
  app.route('/api/replies/:board')
   .get(function (req,res){
    var project=req.params.project;
    var id=req.query.thread_id;
    Thread.findOne({_id:objectId(id)},(err,data)=>{
      if(err){console.log(err)}
      else{
        if(data!==null){
          var reply=[];
          if(data.replies.length!==0){data.replies.forEach(a=>{reply.push({_id:a._id,text:a.text,created_on:a.created_on})})}
          
          res.json({_id:data._id,text:data.text,created_on:data.created_on,bumped_on:data.bumped_on,replies:reply})
        }
        else{res.send('invalid thread id')}
      }
    })
  })
   .post((req,res)=>{
    var board=req.params.board;
    var id=req.body.thread_id;
    var password=req.body.delete_password;
    Thread.findOne({_id:objectId(id)},(err,data)=>{
      if(err){return err}
      else{
        if(data==null){res.send('could not find thread id')}
        else{if(data.board==board && data.delete_password==password){
             var num=data.replies.length, last_num=parseInt(data._id.toString().substring(22));
             var reply_id=data._id.toString().substring(0,22)+(last_num+num+1)
             data.replies.push({_id:reply_id,text:req.body.text,created_on:new Date(),delete_password:password,reported:false})
             data.bumped_on=new Date()
             data.save((err,doc)=>err?err:res.redirect(`/b/${board}/${id}`))
             
            }
            else{res.send(`could not send request for board : ${board} or password : ${password} `)}
            }
      }
    })
  })
  
  .delete((req,res)=>{
    var board=req.params.board;
    var thread_id=req.body.thread_id;
    var reply_id=req.body.reply_id;
    var password=req.body.delete_password;
    Thread.findOne({_id:objectId(thread_id)},(err,data)=>{
      if(err){return err}
      else{
        if(data!==null){
          var reply=data.replies.filter(a=>a._id!==reply_id && a.delete_passsword!==password)
          data.replies=reply;
          data.save((err,doc)=>{
            if(err){console.log('error');return err}
            else{res.send('success')}
          })
        }else{res.send('incorrect password')}
      }
      })
  })
  .put((req,res)=>{
    var board=req.params.board;
    var thread_id=req.body.thread_id;
    var reply_id=req.body.reply_id;
    Thread.findOne({_id:objectId(thread_id)},(err,data)=>{
      if(err){return err}
      else{
        if(data!==null){
        if(data.board==board){
        var a=data.replies.filter(a=>a._id!==reply_id);
        var b=data.replies.filter(a=>a._id==reply_id);
        if(b.length!==0){
        a.push({text:b[0].text,_id:reply_id,created_on:b[0].created_on,delete_password:b[0].delete_password,reported:true})
        data.replies=a
        data.save((err,data)=>err?err:res.send('success'))
        }else{res.send('invalid reply ID')}}else{res.send('unknown board')}}
        else{res.send('invalid thread ID')}
      }
    })
  })
};
