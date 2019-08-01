function makeNotesArray(){
  return [
    {
      'id': 1, 
      'title': 'Title 1',
      'content': 'Content 1',
      'date_modified': '2019-07-24T22:35:49.504Z',
      'folder_id': 1
    },
    {
      'id': 2, 
      'title': 'Title 2',
      'content': 'Content 2',
      'date_modified': '2019-08-24T22:35:49.504Z',
      'folder_id': 1
    },
    {
      'id': 3, 
      'title': 'Title 3',
      'content': 'Content 3',
      'date_modified': '2019-09-24T22:35:49.504Z',
      'folder_id': 2
    }
  ];
}


module.exports = {
  makeNotesArray,
};