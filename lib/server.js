'use strict';

var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    redis = require('connect-redis');

app.use(cookieParser());

var models = require('../models');
/* istanbul ignore next */
if (process.env.NODE_ENV !== 'production') {
    var SequelizeStore = require('connect-session-sequelize')(session.Store);
    var sessionStore = new SequelizeStore({
        db: models.sequelize
    });
    sessionStore.sync();
    app.use(session({
        secret: 'Shhhhh!',
        store: sessionStore,
        saveUninitialized: false,
        resave: false
    }));
} else {
    var RedisStore = redis(session);
    app.use(session({
      secret: 'Shhhhh!',
      resave: false,
      saveUninitialized: true,
      store: new RedisStore()
    }));
}

/* istanbul ignore next */
if (process.env.NODE_ENV === 'development') {
    var webpackDevMiddleware = require("webpack-dev-middleware");
    var webpack = require("webpack");
    var webpackConfig = require("../webpack.config");

    var compiler = webpack(webpackConfig);

    app.use(webpackDevMiddleware(compiler, {
        publicPath: "/", // Same as `output.publicPath` in most cases.
        stats: {
            colors: true,
            hash: false,
            timings: true,
            chunks: false,
            chunkModules: false,
            modules: false
        }
    }));
}


app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));

app.set('views', './views');
app.set('view engine', 'pug');

app.use(function(request, response, next) {
  if (request.session.flash_message) {
    response.locals.flash_message = request.session.flash_message;
    delete request.session.flash_message;
    request.session.save(function() {
      next();
    });
  } else {
    next();
  }
});

app.get("/", function(request, response) {
  response.render('index');
});

// app.get('/:name', function(request, response) {
//   response.render('name', { name: request.params.name });
// });

// app.get('/tasks', function(request, response) {
//   models.Task.findAll()
//     .then(function(tasks) {
//       var highlightTaskId = request.session.newTaskId;
//       delete request.session.newTaskId;
//       request.session.save(function() {
//           response.render('tasks/tasks', {
//               tasks: tasks,
//               highlightTaskId: highlightTaskId
//           });
//       })
//     });
// });
//
// app.get('/tasks/:task_id', function(request, response) {
//   console.log(request.session);
//   models.Task.findById(request.params.task_id)
//     .then(function(task) {
//       response.render('tasks/task', { task: task });
//     });
// });
//
// function redirectToTask(response, task) {
//   response.redirect('/tasks/' + task.id);
// }
//
// app.post('/tasks/:task_id', function(request, response) {
//   models.Task.findById(request.params.task_id)
//     .then(function(task) {
//       task.name = request.body.todo;
//       return task.save();
//     }).then(function (task) {
//       request.session.flash_message = "Updated successfully!";
//       redirectToTask(response, task);
//     });
// });
//
// app.post('/tasks', function(request, response) {
//   models.Task.create({ name: request.body.todo })
//     .then(function(task) {
//       request.session.flash_message = "Added task " + task.name + " successfully!";
//       request.session.newTaskId = task.id;
//       request.session.save(function() {
//         response.redirect("/tasks");
//       });
//     });
// });



app.get('/users/register', function(request, response) {
  response.end('/users/register');
});

//check if session.loggedIn exists. If it exists set locals.loggedIn to true.
//if not true, set locals.loggedIn to false.

app.get('/users/login', function(request, response) {
  if(request.session.loggedIn){
    response.locals.loggedIn = true;
  } else{response.locals.loggedIn = false}
  response.render('index');
});

//destroy session so that sessions.loggedIn will no longer exist.
app.post('/users/logout', function(request, response){
  request.session.destroy(function() {
  response.render('index');
});
})


app.post('/users/register', function(request, response){

      //get data from form and ?reset fields?
      var newUser = request.body.name;
      var newPassword = request.body.password;
      var newConfirmPassword = request.body.confirmPassword;


      //if password entered correctly, check to see if user already exists
      //if not, create new user

      if(newUser && newPassword === newConfirmPassword){
          // check for unique user name
          models.User.findOne({where: {name: newUser}, attributes:['name']})
            .then(function(user){
              if(user){response.send('name already in use');}
              if(!user){
                models.User.create({ name: newUser, password: newPassword})
                  .then(function(createdUser){
                    response.send('new user ' + createdUser.name + " created");
                  });
              }
            })
        }else{response.send('user not created, try again.');}
});


app.post('/users/login', function(request,response){
  //get form data from request
  var givenName = request.body.name;
  var givenPassword = request.body.password;

  //find user in db and compare password.
  //if user not in database do something.
  //if user in database but pw doesn't match do something.
  //if user in database and pw matches, create session.loggedIn and redirect.

  models.User.findOne({
    where: {name: givenName},
    attributes: ['name', 'password']
  }
  ).then(function(user){
      if(user){
        if(user.password == givenPassword){
            request.session.loggedIn = true;
            request.session.save(function(){
              response.redirect('/users/login');
          });
          //response.send('password matched');
        }
        else{response.send('not match');}
      }
      else{response.send('not a user');}

    })
});

// allow other modules to use the server
module.exports = app;
