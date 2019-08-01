const path = require('path');
const express = require('express');
const xss = require('xss');
const NotesService = require('./notes-service');

const notesRouter = express.Router();
const jsonParser = express.json();

const serializeNote = note => ({
  id: note.id,
  title: xss(note.title),
  content: xss(note.content),
  date_modified: note.date_modified,
  folder_id: note.folder_id
});

notesRouter
  .route('/')
  .get((req, res, next) => {
    NotesService.getAllNotes(req.app.get('db'))
      .then(notes => {
        res.json(notes);
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { title, date_modified, content, folder_id } = req.body;
    const newNote = { title, content, folder_id };

    for (const [key, value] of Object.entries(newNote)){
      if(value === null){
        return res.status(400).json({
          error: {message: `Missing ${key}`}
        });
      }
    }

    newNote.date_modified = date_modified;

    NotesService.insertNotes(
      req.app.get('db'),
      newNote
    )
      .then(note =>{
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${note.id}`))
          .json(note);
      })
      .catch(next);
  });

notesRouter
  .route('/:note_id')
  .all((req, res, next) => {
    NotesService.getById(
      req.app.get('db'),
      req.params.note_id
    )
      .then(note => {
        if(!note){
          return res.status(404).json({
            error: {message: 'Note does not exist'}
          });
        }
        res.note = note;
        next();
      })
      .catch(next); 
  })
  .get((req, res) =>{
    res.json(serializeNote(res.note));
  })
  .delete((res, req, next)=> {
    NotesService.deleteNotes(
      req.app.get('db'),
      req.params.note_id
    )
      .then(()=> {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const { title, content, folder_id } = req.body;
    const updateInfo = { title, content, folder_id};
    const numOfVal = Object.values(updateInfo).filter(Boolean).length;

    if(numOfVal === 0 ){
      return res.status(400).json({
        error: {message: 'Request body must contain title, content, or folder_id'}
      });
    }
    NotesService.updateNote(
      req.app.get('db'), 
      req.params.note_id, 
      updateInfo
    )
      .then(()=> {
        return res.status(204).end();
      })
      .catch(next);
  });

module.exports = notesRouter;