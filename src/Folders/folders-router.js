const path = require('path');
const express = require('express');
const xss = require('xss');
const FoldersService = require('./folders-service');

const foldersRouter = express.Router();
const jsonParser = express.json();

const serializeFolder = folder => ({
  id: folder.id,
  title: xss(folder.title),
});

foldersRouter
  .route('/')
  .get((req, res, next) => {
    FoldersService.getAllFolders(req.app.get('db'))
      .then(folders => {
        res.json(folders);
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { title } = req.body;
    const newFolder = { title };

    if(title === null){
      return res.status(400).json({
        error: {message: 'Missing title'}
      });
    }

    FoldersService.insertFolder(
      req.app.get('db'),
      newFolder
    )
      .then(folder => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${folder.id}`))
          .json(folder);
      })
      .catch(next);
  });

foldersRouter
  .route('/:folder_id')
  .all((req, res, next) => {
    FoldersService.getById(
      req.app.get('db'),
      req.params.folder_id
    )
      .then(folder => {
        if(!folder){
          return res.status(404).json({
            error: {message: 'Folder does not exist'}
          });
        }
        res.folder = folder;
        next();
      })
      .catch(next); 
  })
  .get((req, res) =>{
    return res.json(serializeFolder(res.folder));
  })
  .delete((res, req, next)=> {
    FoldersService.deleteFolder(
      req.app.get('db'),
      req.req.params.folder_id
    )
      .then(()=> {
        res.res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const { title } =req.body;
    const newFolder = { title };
    const numberOfValues = Object.values(newFolder).filter(Boolean).length;
    if(numberOfValues === 0){
      return res.status(400).json({
        error: {message: 'Request body must contain a title'}
      });
    }
    FoldersService.updateFolder(
      req.app.get('db'), 
      req.params.folder_id, 
      newFolder
    )
      .then(()=> {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = foldersRouter;