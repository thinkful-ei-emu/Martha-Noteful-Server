const FoldersService= {
  getAllFolders(knex) {
    return knex
      .select('*')
      .from('folders');
  },
  insertFolder(knex, newFolder){
    return knex
      .insert(newFolder)
      .into('folders')
      .returning('*')
      .then(rows => rows[0]);
  },
  getById(knex, id){
    return knex
      .from('folders')
      .select('*')
      .where('id', id)
      .first();
  },
  deleteFolder(knex, id){
    return knex('folders')
      .where('id', id)
      .delete();
  },
  updateFolder(knex, id, nowFolderFields){
    return knex('folders')
      .where('id', id)
      .update(nowFolderFields);
  }
};

module.exports = FoldersService;