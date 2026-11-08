# Lab 3: REST API, query parameters, validation, debugging

Name: N PRANITHA · Registration Number: 252U1R9110 · Section: 111

Live link: PASTE-YOUR-RENDER-URL-HERE

## How to run

1. Install the packages: `npm install`
2. Start the server: `npm start`
3. Open `http://localhost:3000` in the browser.

No environment variables are required. `PORT` is optional and defaults to 3000. The SQLite database file is `database/books.db`.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /books | List books (supports search, sort, price filter and paging) |
| GET | /books/:bookId | Get one book by id |
| POST | /books | Add a new book (title, author and numeric price are required) |
| PUT | /books/:bookId | Update an existing book |
| DELETE | /books/:bookId | Delete a book |

## Query parameters for GET /books

| Parameter | Default | Meaning |
|-----------|---------|---------|
| search_q | (empty) | Partial match on the book title |
| order_by | id | Column to sort by: id, title, author, price or pages |
| order | ASC | ASC or DESC |
| limit | 10 | Number of books to return (1 to 100) |
| offset | 0 | Number of books to skip |
| min_price | 0 | Minimum price |
| max_price | 1000000 | Maximum price |

## Status codes

| Code | When |
|------|------|
| 200 | Successful read, update or delete |
| 201 | Book created |
| 400 | Bad input (missing title or author, price not a number, bad id, bad JSON) |
| 404 | Book id does not exist, or unknown URL |
| 500 | Unexpected server error |

All errors use the format `{ "message": "..." }`.

## Postman test list

| # | Request | Expected status |
|---|---------|-----------------|
| 1 | GET /books | 200 |
| 2 | GET /books?search_q=the | 200 |
| 3 | GET /books?order_by=price&order=DESC | 200 |
| 4 | GET /books?limit=3&offset=3 | 200 |
| 5 | GET /books?min_price=300&max_price=450 | 200 |
| 6 | GET /books/1 | 200 |
| 7 | POST /books with a valid body | 201 |
| 8 | PUT /books/1 with a valid body | 200 |
| 9 | DELETE /books/(the new id) | 200 |
| 10 | GET /books/9999 | 404 |
| 11 | GET /books/abc | 400 |
| 12 | POST /books without a title | 400 |
| 13 | POST /books with price "abc" | 400 |
| 14 | PUT /books/9999 | 404 |
| 15 | DELETE /books/9999 | 404 |
| 16 | GET /books?min_price=abc | 400 |
| 17 | GET /nothing | 404 |
| 18 | POST /books with broken JSON | 400 |

## Screenshots

(Screenshots will be added after testing.)

## Notes

- Problem: write the problems you faced here, in your own words.
- Solution: write how you solved each one.