/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var expect=chai.expect;
var server = require('../server');
var Thread=require('../routes/issue.js');

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

var create=function(done,text,cb){
  var id=randHex(21)+((Math.random()*100).toString().substring(3,6));
  var reply_id=id.toString().substring(0,21)+(parseInt(id.toString().substring(21))+1).toString()
  var schema=new Thread({_id:id,board:'apitest',text:text,delete_password:'1234',reported:false,replies:[{_id:reply_id,reported:false}],created_on:new Date(),bumped_on:new Date})
  schema.save((err,data)=>{
    if(err){return err}
    else{
      if(cb){cb(data._id)
         done();   }
    }
  })
  }

var threadDelete=function(done,filter){
  Thread.findOneAndDelete(filter,(err,data)=>{
    if(err){console.log(err);done();}
    else{done()}
  })
} 

chai.use(chaiHttp);

suite('Functional Tests', function() {

  suite('API ROUTING FOR /api/threads/:board', function() {
    
    suite('POST', function() {
      after(function(done){
        threadDelete(done,{text:'hello'})
      })
      test('post thread',function(done){
        chai.request(server)
          .post('/api/threads/apitest')
          .send({text:'hello',password:'1234'})
          .end(function(err,res){
             assert.equal(res.status,200)
             expect(res).to.redirect;
             done();
          })
      }) 
      
      
    });  
    
    suite('GET', function() {
      var text='a';
      var thread_id;
      before(function(done){
        create(done,text,function(id){
          thread_id=id;
          return;
        })
      })
      after(function(done){
        threadDelete(done,{_id:thread_id})
      })
      test('get thread',function(done){
        chai.request(server)
           .get('/api/threads/apitest')
           .end(function(err,res){
              assert.equal(res.status,200)
              assert.isArray(res.body)
              assert.property(res.body[0],'_id')
              assert.property(res.body[0],'text')
              assert.property(res.body[0],'replies')
              assert.property(res.body[0],'created_on')
              assert.property(res.body[0],'bumped_on')
              done();
           })
      })
    });
    
    suite('DELETE', function() {
      var text='d';
      var thread_id;
      before(function(done){
        create(done,text,function(id){
          thread_id=id;
          return;
        })  
      })
      test('delete thread',function(done){
        chai.request(server)
        .delete('/api/threads/apitest')
        .send({thread_id:thread_id,delete_password:'1234'})
        .end(function(err,res){
          assert.equal(res.status,200)
          assert.equal(res.text,'success')
          done();
        })
      }) 
    });
    
    suite('PUT', function() {
      var text='e';
      var thread_id;
      before(function(done){
        create(done,text,function(id){
          thread_id=id;
          return;
        })
      })
      after(function(done){
        threadDelete(done,{_id:thread_id})
      })
      test('report thread',function(done){
        chai.request(server)
         .put('/api/threads/apitest')
         .send({thread_id:thread_id})
         .end(function(err,res){
           assert.equal(res.status,200)
           assert.equal(res.text,'success')
           done();
        })
      })
      
    });
    

  });
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    suite('POST', function() {
      var text='f';
      var thread_id;
      before(function(done){
        create(done,text,function(id){
          thread_id=id;
          return;
        })
      })
      after(function(done){
        threadDelete(done,{_id:thread_id})
      })
      test('post reply',function(done){
        chai.request(server)
         .post('/api/replies/apitest')
         .send({thread_id:thread_id,text:text,delete_password:'1234'})
         .end(function(err,res){
           assert.equal(res.status,200)
           expect(res).to.redirect;
           done();
        }) 
      })   
    });
    
    suite('GET', function() {
      var text='g';
      var thread_id;
       before(function(done){
        create(done,text,function(id){
          thread_id=id;
          return;
        })
      })
      after(function(done){
        threadDelete(done,{_id:thread_id})
      })
      
      test('get replies',function(done){
        chai.request(server)
         .get('/api/replies/apitest')
         .query({thread_id:thread_id.toString()})
         .end(function(err,res){
           assert.equal(res.status,200)
           assert.equal(res.body._id,thread_id)
           assert.property(res.body,'text')
           assert.property(res.body,'created_on')
           assert.property(res.body,'bumped_on')
           assert.property(res.body,'replies')
           done();
        })
      })
    });
    
    suite('PUT', function() {
      var text='h';
      var thread_id;
       before(function(done){
        create(done,text,function(id){
          thread_id=id;
          return;
        })
      })
      after(function(done){
        threadDelete(done,{_id:thread_id})
      })
      var reply_id;
      test('report reply',function(done){
        reply_id=thread_id.toString().substring(0,21)+(parseInt(thread_id.toString().substring(21))+1).toString()
        chai.request(server)
         .put('/api/replies/apitest')
         .send({thread_id:thread_id,reply_id:reply_id})
         .end(function(err,res){
          
           assert.equal(res.status,200)
           assert.equal(res.text,'success')
           done();
        })
      })      
    });
    
    suite('DELETE', function() {
      var text='i'
      var thread_id;
      var reply_id;
       before(function(done){
        create(done,text,function(id){
          thread_id=id;
          return;
        })
      }) 
      after(function(done){
        threadDelete(done,{_id:thread_id})
      })
      test('delete reply',function(done){
        reply_id=thread_id.toString().substring(0,21)+(parseInt(thread_id.toString().substring(21))+1).toString()
        chai.request(server)
         .delete('/api/replies/apitest')
         .send({thread_id:thread_id,reply_id:reply_id,delete_password:'1234'})
         .end(function(err,res){
           assert.equal(res.status,200)
           assert.equal(res.text,'success')
           done();
        })
      })
    });
    
  });

});
