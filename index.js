import express from 'express'
import pg from 'pg'
import axios from 'axios'
import bodyParser from 'body-parser'


const app = express();
const port = 3000;

//middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// DB connection
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "bookshelf",
  password: "sreeman@db",
  port: 5432,
});

db.connect();

// home page 
app.get("/",async (req,res)=>{
  try {
    const sort= req.query.sort || "newest";
    const search = req.query.search || "";

    let query=`
    SELECT books.*,authors.name AS author_name
    FROM books
    JOIN authors ON books.author_id = authors.id
  `;

   let values = [];

    if (search) {
      query += " WHERE books.title ILIKE $1";
      values.push(`%${search}%`);
    }

    if (sort === "rating") {
      query += " ORDER BY rating DESC";
    } else {
      query += " ORDER BY created_at DESC";
    }

    const result = await db.query(query, values);
    res.render("index.ejs",{
      books : result.rows,
      sort: sort,
      search
    });
  } catch (err) {
    console.error(err);
    res.send("Error fetching books");
    
  }
});

// for new book adding form
app.get("/add",async(req,res)=>{
 res.render("add.ejs", { sort: "newest" ,search: ""});
});

// add new book 
app.post("/add", async (req, res) => {
  try {
    const { title, author, isbn, rating, review } = req.body;
    console.log("ISBN received:", isbn);
    // to validate ISBN
    try {
      await axios.get(`https://openlibrary.org/isbn/${isbn}.json`);
    } catch (apiError ) {
      return res.render("add.ejs", {
        sort: "newest",
        error: "Invalid ISBN. Book not found in Open Library."
      });
    }
    console.log("API call successful");
    // Check if author exists
    let authorResult = await db.query(
      "SELECT * FROM authors WHERE name = $1",
      [author]
    );

    let authorId;

    if (authorResult.rows.length === 0) {
      const newAuthor = await db.query(
        "INSERT INTO authors (name) VALUES ($1) RETURNING id",
        [author]
      );
      authorId = newAuthor.rows[0].id;
    } else {
      authorId = authorResult.rows[0].id;
    }

    // Insert Book
    await db.query(
      "INSERT INTO books(title, isbn, rating, review, author_id) VALUES($1,$2,$3,$4,$5)",
      [title, isbn, rating, review, authorId]
    );

    res.redirect("/");

  } catch (err) {
    console.log(err);
    if (err.code === "23505") {
    return res.render("add.ejs", {
      sort: "newest",
      error: "This book already exists in your shelf."
    });
  }
    res.send("Error Adding Book");
  }
});

// To edit specific book
app.get("/edit/:id",async (req,res)=>{
  try {
    const id=req.params.id;
    const edit =await db.query(`
      SELECT books.*, authors.name AS author_name
      FROM books
      JOIN authors ON books.author_id = authors.id
       WHERE books.id = $1`,
      [id]);
    res.render("edit.ejs", { book: edit.rows[0], sort: "newest", search: "" });
    
  } catch (error) {
    console.log(error);
    res.send("Error loading edit page");
  }

});
app.post("/edit/:id",async (req,res)=>{
  try {
    const id=req.params.id;
    const{title,author,isbn,rating,review}=req.body;
  //  check author
  let authorResult=await db.query("SELECT * FROM authors WHERE name = $1",[author]);
  let authorId;
  if (authorResult.rows.length === 0) {
    const newAuthor = await db.query("INSERT INTO authors(name) VALUES($1) RETURNING id",[author]);
    authorId = newAuthor.rows[0].id;
  } else {
    authorId = authorResult.rows[0].id;
  }
  await db.query(`
    UPDATE books
    SET title =$1,
    isbn = $2,
    rating = $3,
    review =$4,
    author_id=$5
    WHERE id = $6
    `,[title, isbn, rating, review, authorId, id]);
     res.redirect("/");

  } catch (error) {
  console.log(error);
  res.send("Error updating book");
  }
});

// delete Book 
app.post("/delete/:id",async (req,res)=>{
  try {
    const id= req.params.id;
    const result=await db.query("DELETE FROM books WHERE id = $1",[id]);
    res.redirect("/");
  } catch (error) {
    console.log(error)
  }

});















app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});