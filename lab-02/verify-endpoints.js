const http = require("http");
const path = require("path");
const sqlite = require("sqlite");
const sqlite3 = require("sqlite3");

const PORT = 3005;
process.env.PORT = PORT;

// Import server (which calls initializeDBAndServer)
const app = require("./server");

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "127.0.0.1",
      port: PORT,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          // keep as string
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed,
        });
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function verifyDatabaseDirectly() {
  const dbPath = path.join(__dirname, "database", "books.db");
  const db = await sqlite.open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  const countRow = await db.get("SELECT COUNT(*) AS total FROM book;");
  const books = await db.all("SELECT * FROM book ORDER BY id;");
  await db.close();
  return { total: countRow.total, books };
}

async function runTests() {
  // Wait a short moment for server to listen
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log("=== STARTING API AND DATABASE VERIFICATION ===");
  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName, details = "") {
    totalTests++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${testName} - Details: ${details}`);
    }
  }

  try {
    // 1. Initial DB check
    const initialDB = await verifyDatabaseDirectly();
    assert(initialDB.total === 10, "Initial Database Verification: Exactly 10 books exist in books.db", `Found ${initialDB.total}`);

    // 2. Health check GET /
    const homeRes = await request("GET", "/");
    assert(homeRes.statusCode === 200, "GET / returns 200 OK");

    // 3. GET /books/
    const allBooksRes = await request("GET", "/books/");
    assert(allBooksRes.statusCode === 200, "GET /books/ returns 200 OK");
    assert(Array.isArray(allBooksRes.data) && allBooksRes.data.length === 10, "GET /books/ returns array of 10 books", `Count: ${allBooksRes.data?.length}`);

    // 4. GET /books/1/
    const book1Res = await request("GET", "/books/1/");
    assert(book1Res.statusCode === 200, "GET /books/1/ returns 200 OK");
    assert(book1Res.data.title === "The Great Gatsby", "GET /books/1/ returns correct book title 'The Great Gatsby'", JSON.stringify(book1Res.data));

    // 5. GET /books/999/ (Not Found)
    const notFoundBookRes = await request("GET", "/books/999/");
    assert(notFoundBookRes.statusCode === 404, "GET /books/999/ returns 404 Not Found");

    // 6. POST /books/ with missing fields (Bad Request)
    const badPostRes = await request("POST", "/books/", { title: "Incomplete Book" });
    assert(badPostRes.statusCode === 400, "POST /books/ with missing fields returns 400 Bad Request");

    // 7. POST /books/ (Create a new book)
    const newBook = {
      title: "Clean Code",
      author: "Robert C. Martin",
      price: 799,
      pages: 464,
    };
    const postRes = await request("POST", "/books/", newBook);
    assert(postRes.statusCode === 201, "POST /books/ returns 201 Created");
    assert(postRes.data.bookId === 11, "POST /books/ returns generated bookId: 11", JSON.stringify(postRes.data));

    // 8. Verify DB was actually modified by POST
    const afterPostDB = await verifyDatabaseDirectly();
    assert(afterPostDB.total === 11, "Database verification: Total books increased to 11 after POST", `Total: ${afterPostDB.total}`);

    // 9. GET /books/11/ to verify the newly added book
    const get11Res = await request("GET", "/books/11/");
    assert(get11Res.statusCode === 200 && get11Res.data.title === "Clean Code", "GET /books/11/ retrieves the newly created book");

    // 10. PUT /books/11/ with missing fields (Bad Request)
    const badPutRes = await request("PUT", "/books/11/", { title: "Only Title" });
    assert(badPutRes.statusCode === 400, "PUT /books/11/ with missing fields returns 400 Bad Request");

    // 11. PUT /books/999/ (Not Found)
    const notFoundPutRes = await request("PUT", "/books/999/", newBook);
    assert(notFoundPutRes.statusCode === 404, "PUT /books/999/ returns 404 Not Found");

    // 12. PUT /books/11/ (Update book)
    const updatedBook = {
      title: "Clean Code: Refactored Edition",
      author: "Robert C. Martin",
      price: 899,
      pages: 480,
    };
    const putRes = await request("PUT", "/books/11/", updatedBook);
    assert(putRes.statusCode === 200, "PUT /books/11/ returns 200 OK");

    // 13. Verify DB was actually modified by PUT
    const getUpdatedRes = await request("GET", "/books/11/");
    assert(
      getUpdatedRes.data.title === "Clean Code: Refactored Edition" && getUpdatedRes.data.price === 899,
      "Database verification: Book 11 fields updated in books.db after PUT",
      JSON.stringify(getUpdatedRes.data)
    );

    // 14. DELETE /books/999/ (Not Found)
    const notFoundDeleteRes = await request("DELETE", "/books/999/");
    assert(notFoundDeleteRes.statusCode === 404, "DELETE /books/999/ returns 404 Not Found");

    // 15. DELETE /books/11/ (Delete book)
    const deleteRes = await request("DELETE", "/books/11/");
    assert(deleteRes.statusCode === 200, "DELETE /books/11/ returns 200 OK");

    // 16. Verify DB was actually modified by DELETE
    const afterDeleteDB = await verifyDatabaseDirectly();
    assert(afterDeleteDB.total === 10, "Database verification: Total books reduced back to 10 after DELETE", `Total: ${afterDeleteDB.total}`);

    // 17. GET /books/11/ after delete should return 404
    const getDeletedRes = await request("GET", "/books/11/");
    assert(getDeletedRes.statusCode === 404, "GET /books/11/ after deletion returns 404 Not Found");

    // 18. Catch-all unknown endpoint 404
    const unknownRes = await request("GET", "/non-existent-route/");
    assert(unknownRes.statusCode === 404, "GET /non-existent-route/ returns 404 Not Found");

    console.log(`\n=== TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED ===`);

    process.exit(passedTests === totalTests ? 0 : 1);
  } catch (err) {
    console.error("Test execution error:", err);
    process.exit(1);
  }
}

runTests();

