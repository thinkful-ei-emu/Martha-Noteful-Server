require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { NODE_ENV } = require('./config');
const foldersRouter = require('./Folders/folders-router');
const notesRouter = require('./Notes/notes-router');

const app = express();

app.use(helmet());
app.use(cors());
app.use(function(req, res, next) { 
  res.header('Access-Control-Allow-Origin', '*'); 
  res.header('Access-Control-Allow-Credentials', true); 
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS'); 
  res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json'); 
  next(); 
});

app.use('/api/folders', foldersRouter);
app.use('/api/notes', notesRouter);

app.use(function errorHandler(error, req, res, next) { //eslint-disable-line no-unused-vars
  let response;
  if(NODE_ENV === 'production'){
    response = { error: {message: 'server error'} };
  } else {
    // eslint-disable-next-line no-console
    console.error(error);
    response = { message: error.message, error };
  }
  res.status(500).json(response);
});

module.exports = app;
