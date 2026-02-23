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
app.get('/',(req,res)=>{
    res.send("working");

});
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});