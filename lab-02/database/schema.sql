-- Create book table
CREATE TABLE IF NOT EXISTS book (
  id INTEGER PRIMARY KEY,
  title TEXT,
  author TEXT,
  price INTEGER,
  pages INTEGER
);

-- Insert 10 sample books
INSERT INTO book (id, title, author, price, pages) VALUES
  (1, 'The Great Gatsby', 'F. Scott Fitzgerald', 399, 180),
  (2, 'To Kill a Mockingbird', 'Harper Lee', 499, 281),
  (3, '1984', 'George Orwell', 299, 328),
  (4, 'Pride and Prejudice', 'Jane Austen', 349, 279),
  (5, 'The Hobbit', 'J.R.R. Tolkien', 599, 310),
  (6, 'The Catcher in the Rye', 'J.D. Salinger', 450, 214),
  (7, 'Crime and Punishment', 'Fyodor Dostoevsky', 650, 671),
  (8, 'The Alchemist', 'Paulo Coelho', 299, 208),
  (9, 'Brave New World', 'Aldous Huxley', 399, 268),
  (10, 'The Little Prince', 'Antoine de Saint-Exupery', 250, 96);
