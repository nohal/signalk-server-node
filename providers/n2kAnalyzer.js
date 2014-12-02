/*
 * Copyright 2014-2015 Fabian Tollenaar <fabian@starting-point.nl>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Transform = require('stream').Transform;

function N2KAnalyzer() {
  Transform.call(this, {
    objectMode: true
  });
}

require('util').inherits(N2KAnalyzer, Transform);

N2KAnalyzer.prototype._transform = function(chunk, encoding, done) {
  var data = chunk.toString();
  //    this.push(data + "\n");
  this.analyzerProcess.stdin.write(chunk.toString() + '\n');
  done();
}



N2KAnalyzer.prototype.start = function() {
  this.analyzerProcess = require('child_process').spawn('sh', ['-c', 'analyzer -json']);
  this.analyzerProcess.stderr.on('data', function(data) {
    console.error(data.toString());
  });
  this.analyzerProcess.on('close', function(code) {
    console.error('Analyzer process exited with code ' + code);
  });

  this.linereader = require('readline').createInterface(this.analyzerProcess.stdout, this.analyzerProcess.stdin);
  var that = this;
  this.linereader.on('line', function(data) {
    try {
      that.push(JSON.parse(data));
    } catch (ex) {
      console.error(ex.stack);
    }
  });

}

//We need to override end, otherwise end may be propagated before all data
//has been piped through analyzer process and we will try to write to 
//piped output after EOL
N2KAnalyzer.prototype.end = function() {}

N2KAnalyzer.prototype.stop = function() {
  _flush();
  this.analyzerProcess.kill();
}


module.exports = N2KAnalyzer;