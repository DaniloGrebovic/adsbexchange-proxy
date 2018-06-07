'use strict';

// Imports.
const https = require('https');
const express = require('express');
const url = require('url');
const cors = require('cors')

// App Namespace.
let AdsbexChange = {};

// Constants
AdsbexChange.SERVER_PORT = 3000;
AdsbexChange.PROTOCOL = (process.env.NODE_ENV === 'prod') ? 'https' : 'http';

/**
 * A simple logging function for consistency.
 * @param {string} msg
 */
AdsbexChange.log = function (msg) {
  let time = new Date();
  console.log('[' + time.toString() + '] ' + msg);
};

/**
 * Constructs New Url
 * @param {string} protocol
 * @param {string} host
 * @param {string} path
 * @param {string} query
 * @return {string} new url.
 */
AdsbexChange.constructURL = function (protocol, host, path, query) {
  return url.format({
    'protocol': protocol, 'host': host, 'pathname': path, 'query': query
  });
};

/**
 * Builds the callback function for handling Instagram response.
 * @param {object} request
 * @param {object} response
 * @return {function} callback
 */
AdsbexChange.buildAdsbexchangeHandlerCallback = function (request, response) {
  return function (serverResponse) {
    serverResponse.setEncoding('utf8');
    let body = '';
    serverResponse.on('data', function (chunk) {
      body += chunk;
    });
    serverResponse.on('end', function () {
      try {
        let json = JSON.parse(body);
        response.jsonp(json)
      } catch (error) {
        response.status(404).send('Invalid Flight').end();
      }
    }.bind(this));
  };
};

/**
 * Fetches content from Adsbexchange API.
 * @param {string} user
 * @param {object} request
 * @param {object} response
 */
AdsbexChange.fetchFromAdsbexchange = function (request, response) {
  https.get(
    this.constructURL(
      'https', 'public-api.adsbexchange.com', '/VirtualRadar/AircraftList.json', request.query),
    this.buildAdsbexchangeHandlerCallback(request, response).bind(this));
};

/**
 * Processing Request
 * @param {object} request
 * @param {object} response
 */
AdsbexChange.processRequest = function (request, response) {
  this.log('Processing Flight');
  this.fetchFromAdsbexchange(request, response);
};

/**
 * Sends no content as response.
 * @param {object} request
 * @param {object} response
 */
AdsbexChange.noContent = function (request, response) {
  response.status(204).end();
};

AdsbexChange.setUpRoutes = function () {
  this.log('Setting up routes.');
  this.app.get('/favicon.ico', this.noContent);
  this.app.get('/apple-touch-icon.png', this.noContent);
  this.app.get('/adsbexchange/', this.processRequest.bind(this));
};

/**
 * Run server.
 */
AdsbexChange.serve = function () {
  this.log('Starting server.');
  this.app.listen(process.env.PORT || this.SERVER_PORT);
};

/**
 * Init Method.
 */
AdsbexChange.init = function () {
  this.log('Initializing.');
  this.app = express();
  this.app.use(cors());
  this.setUpRoutes();
  this.serve();
};

// Init.
AdsbexChange.init();