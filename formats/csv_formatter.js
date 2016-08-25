var Siren = function() {
  this.name = 'csv';
  this.mediaTypes = ['text/csv'];
  this.extension = '.csv.js';
  this.subdirectory = '/csv';
};

Siren.prototype.format = function(filename, locals, cb) {
  var template = require(filename);
  cb(null, template(locals));
};

module.exports = new Siren();
