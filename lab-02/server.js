const express = require("express");
const path = require("path");
const sqlite = require("sqlite");
const { open } = sqlite;
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "database", "books.db");
let db = null;

const PORT = process.env.PORT || 3000;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// Root route for server health check
app.get("/", (req, res) => {
  res.status(200).send("Welcome to the Book Management API (Lab 2)");
});

// 1. GET /books/ - Retrieve all books
app.get("/books/", async (req, res) => {
  try {
    const getBooksQuery = `
      SELECT
        *
      FROM
        book
      ORDER BY
        id;
    `;
    const booksArray = await db.all(getBooksQuery);
    res.status(200).json(booksArray);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. GET /books/:bookId/ - Retrieve a particular book
app.get("/books/:bookId/", async (req, res) => {
  try {
    const { bookId } = req.params;
    const getBookQuery = `
      SELECT
        *
      FROM
        book
      WHERE
        id = ?;
    `;
    const book = await db.get(getBookQuery, [bookId]);

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. POST /books/ - Insert a new book
app.post("/books/", async (req, res) => {
  try {
    const { title, author, price, pages } = req.body;

    if (!title || !author || price === undefined || pages === undefined) {
      return res.status(400).json({
        error: "Missing required fields: title, author, price, and pages are required",
      });
    }

    const addBookQuery = `
      INSERT INTO
        book (title, author, price, pages)
      VALUES
        (?, ?, ?, ?);
    `;
    const result = await db.run(addBookQuery, [title, author, price, pages]);

    res.status(201).json({
      message: "Book Added Successfully",
      bookId: result.lastID,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. PUT /books/:bookId/ - Update an existing book
app.put("/books/:bookId/", async (req, res) => {
  try {
    const { bookId } = req.params;
    const { title, author, price, pages } = req.body;

    if (!title || !author || price === undefined || pages === undefined) {
      return res.status(400).json({
        error: "Missing required fields: title, author, price, and pages are required",
      });
    }

    const checkBookQuery = `
      SELECT
        *
      FROM
        book
      WHERE
        id = ?;
    `;
    const existingBook = await db.get(checkBookQuery, [bookId]);

    if (!existingBook) {
      return res.status(404).json({ error: "Book not found" });
    }

    const updateBookQuery = `
      UPDATE
        book
      SET
        title = ?,
        author = ?,
        price = ?,
        pages = ?
      WHERE
        id = ?;
    `;
    await db.run(updateBookQuery, [title, author, price, pages, bookId]);

    res.status(200).json({
      message: "Book Updated Successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. DELETE /books/:bookId/ - Delete an existing book
app.delete("/books/:bookId/", async (req, res) => {
  try {
    const { bookId } = req.params;

    const checkBookQuery = `
      SELECT
        *
      FROM
        book
      WHERE
        id = ?;
    `;
    const existingBook = await db.get(checkBookQuery, [bookId]);

    if (!existingBook) {
      return res.status(404).json({ error: "Book not found" });
    }

    const deleteBookQuery = `
      DELETE FROM
        book
      WHERE
        id = ?;
    `;
    await db.run(deleteBookQuery, [bookId]);

    res.status(200).json({
      message: "Book Deleted Successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Catch-all 404 for unknown endpoints
app.use((req, res) => {
  res.status(404).json({ error: "404 - Endpoint not found" });
});

module.exports = app;
