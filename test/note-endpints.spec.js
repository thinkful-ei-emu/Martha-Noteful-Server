require('dotenv').config();
const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')

const { makeNotesArray } = require('./notes.fixtures')
const { makeFoldersArray } = require('./folders.fixtures')

describe('Noteful Endpoints', function() {
  let db;
  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  });
  after('disconnect from db', () => db.destroy())
  before('clean the table', () => db.raw('TRUNCATE notes, folders RESTART IDENTITY CASCADE'))
  afterEach('cleanup',() => db.raw('TRUNCATE notes, folders RESTART IDENTITY CASCADE'))

  describe(`GET /api/notes`, () => {
    context(`Given no notes`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get('/api/notes')
          .expect(200, [])
      })
    })

    context('Given there are notes in the database', () => {
      const testFolders = makeFoldersArray();
      const testNotes = makeNotesArray();

      beforeEach('insert notes', () => {
        return db
          .into('folders')
          .insert(testFolders)
          .then(() => {
            return db
              .into('notes')
              .insert(testNotes)
          })
      })

      it('responds with 200 and all of the notes', () => {
        return supertest(app)
          .get('/api/notes')
          .expect(200, testNotes)
      })
    })
  });

  describe(`GET /api/notes/:note_id`, () => {
    context(`Given note does not exist`, () => {
      it(`responds with 404`, () => {
        return supertest(app)
          .get(`/api/notes/5`)
          .expect(404, { error: { message: `Note does not exist` } })
      })
    })

    context('Given there are notes in the database', () => {
      const testFolders = makeFoldersArray();
      const testNotes = makeNotesArray();

      beforeEach('insert notes', () => {
        return db
          .into('folders')
          .insert(testFolders)
          .then(() => {
            return db
              .into('notes')
              .insert(testNotes)
          });
      });

      it('responds with 200 and the specified notes', () => {
        const noteId = 1;
        const expectedNote = testNotes[noteId - 1]
        return supertest(app)
          .get(`/api/notes/${noteId}`)
          .expect(200, expectedNote)
      });
    });
  });

  describe(`POST /api/notes`, () => {
    const testFolders = makeFoldersArray();
    beforeEach('insert folders', () => {
      return db
        .into('folders')
        .insert(testFolders) 
    });

    it(`creates an note, responding with 201 and the new note`, () => {
      const newNote = {
        title: 'Test new note',
        content: 'Test new note content...',
        folder_id: 1
      };
      return supertest(app)
        .post('/api/notes')
        .send(newNote)
        .expect(201)
        .expect(res => {
          expect(res.headers.location).to.eql(`/api/notes/${res.body.id}`)
        })
        .then(res =>
          supertest(app)
            .get(`/api/notes/${res.body.id}`)
            .expect(res.body)
        )
    })

    const requiredFields = ['title', 'content', 'folder_id']

    requiredFields.forEach(field => {
      const newNote = {
        title: 'Test new note',
        content: 'Test new note content...',
        folder_id: 1
      }

      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        newNote[field] = null;

        return supertest(app)
          .post('/api/notes')
          .send(newNote)
          .expect(400, {
            error: { message: `Missing ${field}` }
          })
      })
    })
  });

  describe(`DELETE /api/notes/:note_id`, () => {
    context('Given there are notes in the database', () => {
      const testFolders = makeFoldersArray();
      const testNotes = makeNotesArray()

      beforeEach('insert notes', () => {
        return db
          .into('folders')
          .insert(testFolders)
          .then(() => {
            return db
              .into('notes')
              .insert(testNotes)
          });
      });

      it('responds with 204 and removes the notes', () => {
        const idToRemove = 1
        const expectedNotes = testNotes.filter(note => note.id !== idToRemove)
        return supertest(app)
          .delete(`/api/notes/${idToRemove}`)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/notes`)
              .expect(expectedNotes)
          )
      })
    context(`Given no notes`, () => {
      it(`responds with 404`, () => {
        return supertest(app)
          .delete(`/api/notes/5`)
          .expect(404, { error: { message: `Note does not exist` } })
      })
    })
    })
  });

  describe(`PATCH /api/notes/:note_id`, () => {
    context(`Given no notes`, () => {
      it(`responds with 404`, () => {
        return supertest(app)
          .delete(`/api/notes/5`)
          .expect(404, { error: { message: `Note does not exist` } })
      })
    })

    context('Given there are notes in the database', () => {
      const testFolders = makeFoldersArray();
      const testNotes = makeNotesArray();

      beforeEach('insert notes', () => {
        return db
          .into('folders')
          .insert(testFolders)
          .then(() => {
            return db
              .into('notes')
              .insert(testNotes)
          });
      });

      it('responds with 204 and updates the notes', () => {
        const idToUpdate = 2
        const updateNote = {
          title: 'updated note title',
          content: 'updated note content',
        }
        const expectedNote = {
          ...testNotes[idToUpdate - 1],
          ...updateNote
        }
        return supertest(app)
          .patch(`/api/notes/${idToUpdate}`)
          .send(updateNote)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/notes/${idToUpdate}`)
              .expect(expectedNote)
          )
      })

      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 2
        return supertest(app)
          .patch(`/api/notes/${idToUpdate}`)
          .send({ irrelevantField: 'foo' })
          .expect(400, {
            error: {
              message: `Request body must contain title, content, or folder_id`
            }
          })
      })

      it(`responds with 204 when updating only a subset of fields`, () => {
        const idToUpdate = 2
        const updateNote = {
          title: 'updated note title',
        }
        const expectedNote = {
          ...testNotes[idToUpdate - 1],
          ...updateNote
        }

        return supertest(app)
          .patch(`/api/notes/${idToUpdate}`)
          .send({
            ...updateNote,
            fieldToIgnore: 'should not be in GET response'
          })
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/notes/${idToUpdate}`)
              .expect(expectedNote)
          )
      })
    })
  });
});