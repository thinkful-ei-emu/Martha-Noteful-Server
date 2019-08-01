require('dotenv').config();
const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');

const { makeNotesArray } = require('./notes.fixtures');
const { makeFoldersArray } = require('./folders.fixtures');

describe('Folder Endpoints', function () {
  let db;
  before('make knex instance', ()=> {
    db = knex({
      client: 'pg', 
      connection: process.env.TEST_DB_URL
    });
    app.set('db', db);
  });
  after('disconnect from db', () => db.destroy())
  before('clean the table', () => db.raw('TRUNCATE notes, folders RESTART IDENTITY CASCADE'))
  afterEach('cleanup',() => db.raw('TRUNCATE notes, folders RESTART IDENTITY CASCADE'))

  describe('GET /', ()=> {
    context('Given no folders', () => {
      it('should respond with 200 with empty array', ()=> {
        return supertest(app)
          .get('/api/folders')
          .expect(200)
          .then(res => {
            expect(res.body).to.eql([]);
          });
      });

      context('Given there are folders', () => {
        const testFolders = makeFoldersArray();
        const testNotes = makeNotesArray();

        beforeEach('add notes and folders', ()=> {
          return db
            .into('folders')
            .insert(testFolders)
            .then(()=> {
              return db
                .into('notes')
                .insert(testNotes);
            });
        });
        it('should respond 200 with all folders', ()=> {
          return supertest(app)
            .get('/api/folders')
            .expect(200)
            .then(res => {
              expect(res.body).to.eql(testFolders);
            });
        });
      });
    });
  });

  describe(`GET /api/folders/:id`, () => {
    context(`Given folder does not exist`, () => {
      it(`responds with 404`, () => {
        return supertest(app)
          .get(`/api/folders/5`)
          .expect(404, { error: { message: `Folder does not exist` } })
      })
    })

    context('Given there are folders in the database', () => {
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

      it('responds with 200 and the specified folder', () => {
        const folderId = 1;
        const expectedFolder = testFolders[folderId - 1]
        return supertest(app)
          .get(`/api/folders/${folderId}`)
          .expect(200, expectedFolder)
      });
    });
  });

  describe(`POST /api/folders`, () => {
    it(`creates a folder, responding with 201 and the new folder`, () => {
      const newFolder = {
        title: 'Test new note'
      };
      return supertest(app)
        .post('/api/folders')
        .send(newFolder)
        .expect(201)
        .expect(res => {
          expect(res.headers.location).to.eql(`/api/folders/${res.body.id}`)
        });
    });

      it(`responds with 400 and an error message when the title is missing`, () => {
        const newFolder = {
          title: null,
        }
        return supertest(app)
          .post('/api/folders')
          .send(newFolder)
          .expect(400, {
            error: { message: `Missing title` }
          })
      })
  });

  describe(`DELETE /api/folders/:id`, () => {
    context(`Given no folders`, () => {
      it(`responds with 404`, () => {
        return supertest(app)
          .delete(`/api/folders/5`)
          .expect(404, { error: { message: `Folder does not exist` } })
      })
    })

    context('Given there are folders in the database', () => {
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
          })
      })

      it('responds with 204 and removes the folders', () => {
        const idToRemove = 2;
        const expectedFolders = testFolders.filter(folder => folder.id !== idToRemove);
        return supertest(app)
          .delete(`/api/folders/${idToRemove}`)
          .expect(204)
          .then(() =>{
            return supertest(app)
              .get('/api/folders')
              .expect(expectedFolders)
          })
      })
    })
  });

  describe(`PATCH /api/folders/:id`, () => {
    context(`Given no folders`, () => {
      it(`responds with 404`, () => {
        return supertest(app)
          .delete(`/api/folders/5`)
          .expect(404, { error: { message: `Folder does not exist` } })
      })
    })

    context('Given there are folders in the database', () => {
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

      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 2
        return supertest(app)
          .patch(`/api/folders/${idToUpdate}`)
          .send({ irrelevantField: 'foo' })
          .expect(400, {
            error: {
              message: `Request body must contain a title`
            }
          })
      })

      it(`responds with 204 when updating field`, () => {
        const idToUpdate = 2
        const updateFolder = {
          title: 'updated folder title',
        }
        const expectedFolder = {
          ...testFolders[idToUpdate - 1],
          ...updateFolder
        }

        return supertest(app)
          .patch(`/api/folders/${idToUpdate}`)
          .send({
            ...updateFolder,
            fieldToIgnore: 'should not be in GET response'
          })
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/folders/${idToUpdate}`)
              .expect(expectedFolder)
          )
      })
    })
  });
});
