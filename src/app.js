require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');

const corsOptions = {
  origin: 'https://polar-depths-46444.herokuapp.com',
  optionsSuccessStatus: 200
};

const { NODE_ENV } = require('./config');
const foldersRouter = require('./Folders/folders-router');
const notesRouter = require('./Notes/notes-router');

const app = express();

const morganOptions = (NODE_ENV === 'production')
  ? 'common' 
  : 'dev';

app.use(morgan(morganOptions));
app.use(helmet());
app.use(cors(corsOptions));

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
