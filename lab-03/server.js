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
  res.status(200).send("Welcome to the Book Management API (Lab 3)");
});

// 1. GET /books - list books with search, sort, price filter and paging
app.get("/books", async (req, res) => {
  try {
    const {
      search_q = "",
      order_by = "id",
      order = "ASC",
      limit = 10,
      offset = 0,
      min_price = 0,
      max_price = 1000000,
    } = req.query;
    
    // only these columns may be used for sorting
    const allowedColumns = ["id", "title", "author", "price", "pages"];
    const sortColumn = allowedColumns.includes(order_by) ? order_by : "id";
    const sortOrder = order.toUpperCase() === "DESC" ? "DESC" : "ASC";
    
    const limitNum = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
    const offsetNum = Math.max(parseInt(offset) || 0, 0);
      const minPrice = Number(min_price);
    const maxPrice = Number(max_price);
    if (Number.isNaN(minPrice) || Number.isNaN(maxPrice)) {
      return res
        .status(400)
        .json({ message: "min_price and max_price must be numbers" });
    }

    const getBooksQuery = `
      SELECT * FROM book
      WHERE title LIKE ?
        AND price BETWEEN ? AND ?
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ? OFFSET ?;
    `;

    const books = await db.all(getBooksQuery, [
      `%${search_q}%`,
      minPrice,
      maxPrice,
      limitNum,
      offsetNum,
    ]);

    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// ---------- helpers ----------

// checks the book data sent in POST and PUT bodies; returns an error message or null
const validateBook = (body) => {
  const { title, author, price, pages } = body || {};

  if (typeof title !== "string" || title.trim() === "") {
    return "title is required";
  }
  if (typeof author !== "string" || author.trim() === "") {
    return "author is required";
  }
  if (
    price === undefined ||
    price === null ||
    price === "" ||
    Number.isNaN(Number(price))
  ) {
    return "price is required and must be a number";
  }
  if (Number(price) < 0) {
    return "price cannot be negative";
  }
  if (pages !== undefined && pages !== null && Number.isNaN(Number(pages))) {
    return "pages must be a number";
  }
  return null;
};

// an id must be made only of digits
const isValidId = (id) => /^\d+$/.test(id);

// ---------- routes ----------

// 2. GET /books/:bookId - get one book
app.get("/books/:bookId", async (req, res) => {
  try {
    const { bookId } = req.params;
    if (!isValidId(bookId)) {
      return res.status(400).json({ message: "bookId must be a number" });
    }

    const book = await db.get("SELECT * FROM book WHERE id = ?;", [bookId]);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. POST /books - add a new book
app.post("/books", async (req, res) => {
  try {
    const errorMessage = validateBook(req.body);
    if (errorMessage) {
      return res.status(400).json({ message: errorMessage });
    }

    const { title, author, price, pages } = req.body;
    const result = await db.run(
      "INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?);",
      [
        title.trim(),
        author.trim(),
        Number(price),
        pages === undefined || pages === null ? null : Number(pages),
      ]
    );

    res
      .status(201)
      .json({ message: "Book added successfully", bookId: result.lastID });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 4. PUT /books/:bookId - update a book
app.put("/books/:bookId", async (req, res) => {
  try {
    const { bookId } = req.params;
    if (!isValidId(bookId)) {
      return res.status(400).json({ message: "bookId must be a number" });
    }

    const errorMessage = validateBook(req.body);
    if (errorMessage) {
      return res.status(400).json({ message: errorMessage });
    }

    const existingBook = await db.get("SELECT * FROM book WHERE id = ?;", [
      bookId,
    ]);
    if (!existingBook) {
      return res.status(404).json({ message: "Book not found" });
    }

    const { title, author, price, pages } = req.body;
    await db.run(
      "UPDATE book SET title = ?, author = ?, price = ?, pages = ? WHERE id = ?;",
      [
        title.trim(),
        author.trim(),
        Number(price),
        pages === undefined || pages === null ? null : Number(pages),
        bookId,
      ]
    );

    res.status(200).json({ message: "Book updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 5. DELETE /books/:bookId - delete a book
app.delete("/books/:bookId", async (req, res) => {
  try {
    const { bookId } = req.params;
    if (!isValidId(bookId)) {
      return res.status(400).json({ message: "bookId must be a number" });
    }

    const existingBook = await db.get("SELECT * FROM book WHERE id = ?;", [
      bookId,
    ]);
    if (!existingBook) {
      return res.status(404).json({ message: "Book not found" });
    }

    await db.run("DELETE FROM book WHERE id = ?;", [bookId]);

    res.status(200).json({ message: "Book deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// any other URL
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

// broken JSON in the request body, and any other unexpected error
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON in request body" });
  }
  res.status(500).json({ message: err.message });
});

module.exports = app;