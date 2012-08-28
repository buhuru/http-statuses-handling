/**
 * Module dependencies.
 */

var express = require('express'),
  routes = require('./routes').routes;

var app = module.exports = express.createServer();

// Configuration
app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function() {
  app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));
});

app.configure('production', function() {
  app.use(express.errorHandler());
});

// Routes
for (var route in routes) {
  var routestr = routes[route].routestr;
  var routehandler = routes[route].routehandler;

  app.get(routestr, routehandler);
}


app.listen(4000, function() {
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});