'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var dns = require("dns");

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect("mongodb://mongodbuser:mongodbuser1@cluster0-shard-00-00-ytel8.mongodb.net:27017,cluster0-shard-00-01-ytel8.mongodb.net:27017,cluster0-shard-00-02-ytel8.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true", { useNewUrlParser: true });
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));


app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

app.use('/public', express.static(process.cwd() + '/public'));

var Schema = mongoose.Schema;
var urlSchema = new Schema({
  url: {type: String},
  short_url: {type: String},
  myId: {type: String},
  createdAt: {
    type: Date, default: Date.now
  }
});

var Url = mongoose.model("links", urlSchema);


app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.get('/api/shorturl/new', function(req, res) {
  
});

app.post('/api/shorturl/new', function (req, res, next) {
  let urlInfo = {
    url: req.body.url,
    short_url: null
  }
  
  let id = Math.random().toString(36).substr(2, 9);
  
  // remove http(s) tmp, to validate via dns
  let urlTmp =  JSON.parse(JSON.stringify(urlInfo.url));
  urlTmp = urlTmp.replace(/(^\w+:|^)\/\//, '');
  
    
  dns.lookup(urlTmp, {}, function (err, address, family) {
    if (err) {
      res.send({"error":"invalid URL"});
      return false;
    }
    console.log(address);
    urlInfo.short_url = 'https://' + req.headers.host + '/api/shorturl/' + id;
    
    Url
    .find({
      url: req.body.url
    })
    .then(doc => {
      console.log(doc);
      if (doc[0] === undefined) {       
        let u = new Url({url: urlInfo.url, short_url: urlInfo.short_url, myId: id});
    
        Url.collection.insert([ {url: urlInfo.url, short_url: urlInfo.short_url, myId: id} ], {}, (data) => {console.log(data)});
        res.send(urlInfo);   
      } else {
        urlInfo.short_url = doc[0].short_url;
        res.send(urlInfo);
      }
    })
    .catch(err => {
      console.error(err)
    })
  });
});


app.get('/api/shorturl/:id', function (req, res, next) {
  Url
  .find({
    myId: req.params.id
  })
  .then(doc => {
    if (doc[0].short_url !== undefined) {
      res.status(301).redirect(doc[0].url)
      return true;
    }
  })
  .catch(err => {
    console.error(err)
  })
  
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});