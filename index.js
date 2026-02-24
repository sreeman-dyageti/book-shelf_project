import express from 'express'
import pg from 'pg'
import axiox from 'axios'
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

// text
app.get("/",async (req,res)=>{
  try {
    const sort= req.query.sort || "newest";
    let query=`
    SELECT books.*,authors.name AS author_name
    FROM books
    JOIN authors ON books.author_id = authors.id
  `;
    if (sort === "rating") {
      query +="ORDER BY rating DESC;"
      
    } else {
      query +="ORDER BY created_at DESC;"
    }

  const result = await db.query(query);
    res.render("index.ejs",{
      books : result.rows,
      sort: sort
    });
  } catch (err) {
    console.error(err);
    res.send("Error fetching books");
    
  }


});


app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});