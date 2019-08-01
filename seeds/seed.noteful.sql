TRUNCATE folders, notes RESTART IDENTITY CASCADE;

INSERT INTO folders (title)
VALUES
('Important'), 
('Fun'), 
('Interesting');

INSERT INTO notes (title, content, folder_id)
VALUES
('First note', 'Content 1', '1'),
('Second note', 'Content 2', '1'),
('Third note', 'Content 3', '2'),
('Fourth note', 'Content 4', '3');