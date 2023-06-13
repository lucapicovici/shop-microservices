const fs = require('fs');

module.exports = {
  setIP: setIP,
  logIP: logIP,
};

function setIP(requestParams, context, ee, next) {
  let ipAddresses = [];

  // Load IP addresses from a text file
  const data = fs.readFileSync('ip-addresses.txt', 'utf-8');
  ipAddresses = data
    .trim()
    .split('\n')
    .map((line) => line.trim());

  // Assign a unique IP address to each virtual user
  const randomIndex = Math.floor(Math.random() * ipAddresses.length);
  const ipAddress = ipAddresses[randomIndex];
  context.vars.ipAddress = ipAddress;

  // Create the headers object if it's undefined
  requestParams.headers = requestParams.headers || {};

  // Set the IP address as a custom request header
  requestParams.headers['X-Forwarded-For'] = ipAddress;

  return next();
}

function logIP(requestParams, response, context, ee, next) {
  let resHeaders = response.req.res.rawHeaders;
  let xBackendServer = resHeaders[resHeaders.length - 1];

  const headers = parseHeaders(response.req.socket._httpMessage._header);
  const xForwardedFor = headers['x-forwarded-for'];

  console.log(`User ${xForwardedFor} to backend ${xBackendServer}`);

  next();
}

function parseHeaders(headersString) {
  const headers = {};

  const lines = headersString.split('\r\n');
  lines.forEach((line) => {
    const [key, value] = line.split(':');
    if (key && value) {
      headers[key.trim().toLowerCase()] = value.trim();
    }
  });

  return headers;
}
