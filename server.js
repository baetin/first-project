const express = require('express');
const app = express();
app.use(express.urlencoded({extended: true}))
const MongoClient = require('mongodb').MongoClient;
app.set('view engine', 'ejs');
app.use('/public', express.static('public'))
const methodOverride = require('method-override')
app.use(methodOverride('_method'))
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
require('dotenv').config()

app.use(session({secret : '비밀코드', resave : true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session()); 

var db;
MongoClient.connect(process.env.DB_URL,{ useUnifiedTopology: true }, function(에러, client){
  if (에러) return console.log(에러);
  db = client.db('todoapp');

  
  app.listen(process.env.PORT, function(){
    console.log('listening on 5000')
  });
})


app.get('/pet', function(요청, 응답){
  res.send('펫용품을 사시오')
})

app.get('/beauty', function(요청, 응답){
  응답.send('뷰티용품을 사시오')
})

app.get('/',function(요청, 응답){
  응답.render('index.ejs')
})

app.get('/write', function(요청, 응답){
  응답.render('write.ejs')
})

app.post('/add', function (요청, 응답) {
  db.collection('counter').findOne({name : '게시물갯수'}, function(에러, 결과){
    var 총게시물갯수 = 결과.totalPost

    db.collection('post').insertOne({ _id : 총게시물갯수 + 1, subject : 요청.body.title, day : 요청.body.date }, function (에러, 결과) {
      db.collection('counter').updateOne({name:'게시물갯수'},{ $inc: {totalPost:1} },function(에러, 결과){
	if(에러){return console.log(에러)}
        응답.send('전송완료');
      })
    })

  })
})

app.get('/list', function(요청, 응답){
  db.collection('post').find().toArray(function(에러, 결과){
    console.log(결과)
    응답.render('list.ejs', { posts : 결과 })
  })
})

app.delete('/delete', function(요청, 응답){
  요청.body._id = parseInt(요청.body._id)
  db.collection('post').deleteOne(요청.body, function(에러, 결과){
    console.log('삭제완료')
  })
  응답.send('삭제완료')
  응답.status(200).send({ message : "성공했습니다"})
});

app.get('/detail/:id', function(요청, 응답){
  db.collection('post').findOne({ _id : parseInt(요청.params.id) }, function(에러, 결과){
    응답.render('detail.ejs', {data : 결과} )
  })
});

app.get('/edit/:id', function(요청, 응답){
  db.collection('post').findOne({ _id : parseInt(요청.params.id) }, function(에러, 결과){
    응답.render('edit.ejs', { post : 결과 })
  })
  
})

app.put('/edit', function(요청, 응답){ 
  db.collection('post').updateOne( { _id : parseInt(요청.body.id) }, {$set : 
    { subject : 요청.body.title , day : 요청.body.date }}, 
    function(에러, 결과){ 
      console.log('수정완료') 
      응답.redirect('/list') 
  }); 
});  

app.get('/login', function(요청, 응답){
  응답.render('login.ejs')
})

app.post('/login', passport.authenticate('local', {failureRedirect : '.fail'}),
 function(요청,응답){
  응답.redirect('/')
})

passport.use(new LocalStrategy({
  usernameField: 'id',
  passwordField: 'pw',
  session: true,
  passReqToCallback: false,
}, function (입력한아이디, 입력한비번, done) {
  //console.log(입력한아이디, 입력한비번);
  db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
    if (에러) return done(에러)

    if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })
    if (입력한비번 == 결과.pw) {
      return done(null, 결과)
    } else {
      return done(null, false, { message: '비번틀렸어요' })
    }
  })
}));

passport.serializeUser(function (user, done) {
  done(null, user.id)
});

passport.deserializeUser(function (아이디, done) {
  db.collection('login').findOne({ id: 아이디 }, function (에러, 결과) {
    done(null, 결과)
  })
}); 

app.get('/mypage', 로그인했니, function (요청, 응답) {
  console.log(요청.user);
  응답.render('mypage.ejs', { 사용자: 요청.user })
}) 

function 로그인했니(요청, 응답, next) { 
  if (요청.user) { 
    next() 
  } 
  else { 
    응답.send('로그인안하셨는데요?') 
  } 
} 



app.get('/search', (요청, 응답)=>{
  console.log(요청.query);
  db.collection('post').find({제목 : 요청.query.value}).toArray((에러, 결과)=>{
    console.log(결과)

  })
})

app.use('/shop', require('./routes/shop.js'))

