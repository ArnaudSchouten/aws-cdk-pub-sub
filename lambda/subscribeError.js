const aws = require("aws-sdk");

exports.handler = function (event) {
  event.fout = 'Dit gaat vreselijk fout';
  eventText = JSON.stringify(event, null, 2);
  throw new Error(eventText);    
};