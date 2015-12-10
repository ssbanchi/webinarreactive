/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// start server on the specified port and binding host
app.listen(8080, '0.0.0.0', function() {

	// print a message when the server starts listening
  console.log("server starting on " + 8080);
});

//Example 1 - reactive sum
app.get('/TestReactiveSum', function(req, res){
  console.log("test sum reactive");
  return res.redirect("/ExSum/index.html");
});

//Example 2 - reactive circles
app.get('/TestReactiveCircles', function(req, res){
  console.log("test circles reactive");
  return res.redirect("/ExCircles/index.html");
});

//Example 3 - reactive drag-n-drop
app.get('/TestReactiveDragAndDrop', function(req, res){
  console.log("test drag and drop reactive");
  return res.redirect("/ExDdrag-n-drop/index.html");
});

//Example 4 - reactive drag-n-drop
app.get('/TestReactiveMousePosition', function(req, res){
  console.log("test mouse position reactive");
  return res.redirect("/ExMouse-position/index.html");
});

//Example 5 - reactive search
app.get('/TestReactiveSearch', function(req, res){
  console.log("test search reactive");
  return res.redirect("/ExType-to-search/index.html");
});

