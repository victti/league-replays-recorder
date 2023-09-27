const express    = require('express');
const bodyParser = require('body-parser');
const consign    = require('consign');
const http = require('http');

module.exports = () => {
    const app = express();

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    consign({cwd: 'api'})
     .then('data')
     .then('controllers')
     .then('routes')
     .into(app)

    return http.createServer(options, app);
}