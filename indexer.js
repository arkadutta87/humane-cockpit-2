#!/usr/bin/env node
//console.log(process.env.PATH);
console.log('Process:Env variable stringify ---- ');
//console.log(JSON.stringify(process.env));

console.log('----------SEPERATOR ----------------------');
console.log('Working directory : ' + __dirname);

console.log('Hello I am inside Indexer  !!!!!! ');

var fs, configurationFile;
fs = require('fs');
var constants = require('./constants');

configurationFile = constants.configurationFile;

console.log('Configuration File Path ---- ' + configurationFile);

var configuration = JSON.parse(
    fs.readFileSync(configurationFile)
);

console.log('Configuration Loaded --- \n' + JSON.stringify(configuration));

var fileName = configuration.log_file;
console.log('Log FileName : ' + fileName);


//reading the file
var Promise = require('bluebird');
var readLine = require('readline');
//var Client = Promise.promisifyAll(require('node-rest-client').Client);

var es_index = require('./Utils').es_index;
//var lineReader = require('line-reader');
//var eachLine = Promise.promisify(lineReader.eachLine);

var i = 0;
var arr = [];
var blockSize = 100000;


var util = require('util')
    , stream = require('stream')
    , es = require('event-stream');

var lineNr = 0;

var s = fs.createReadStream(fileName)
    .pipe(es.split())
    .pipe(es.mapSync(function (line) {

            // pause the readstream
            s.pause();
            try{
                arr.push(JSON.parse(line.trim()));
            }catch(e){
                console.log(e);
            }

            ++i;

            if (i == blockSize) {
                es_index(arr, s);
                i = 0;
                arr = [];

            } else {
                s.resume();
            }

            //lineNr += 1;

            // process line here and call s.resume() when rdy
            // function below was for logging memory usage


            //logMemoryUsage(lineNr);

            // resume the readstream, possibly from a callback

        })
            .on('error', function (e) {
                console.log('Error while reading file. Error : ' + e);
            })
            .on('end', function () {
                es_index(arr, null);
                console.log('Read entire file.')
            })
    );


/*eachLine(fileName,function(line,last) {
 //console.log(line);
 arr.push(JSON.parse(line.trim()));
 ++i;

 if( i > 10){
 //es_index(arr);


 return false;
 }


 if (last) {
 return false;

 //return false; // stop reading
 }
 }).then(function() {
 //console.log('done');
 es_index(arr);
 }).catch(function(error){
 console.log(error);
 });*/



//console.log(configuration.username);
//console.log(configuration.password);

