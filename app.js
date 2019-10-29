const express = require("express");
const app = express();
const PORT = 8888;
const __domain = "http://localhost:" + PORT + "/";

const nedb = require("nedb");
const bodyParser = require("body-parser");
const generator = require("./string-generator");
const requestIp = require("request-ip");

const createShortUrlMiddleware = require("./middleware/createShortUrl.middleware");

app.use(express.static("views"));
app.use("/public", express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(requestIp.mw());

const db = new nedb("./database/linkDB");
db.loadDatabase();

//show all shorten url
app.get("/get/short-link-storage", (request, response) => {
  db.find({}, (err, data) => {
    if (err) throw err;
    response.send(data);
  });
});

//go to origin url
app.get("/:shortUrl", (request, response) => {
  const shortUrl = __domain + request.params.shortUrl;
  db.find({ shortenUrl: shortUrl }, (err, data) => {
    if (err) throw err;
    if (data[0] == undefined) {
      response.end();
      return;
    }
    response.redirect(data[0].url);
  });
});

app.post(
  "/post/short-link-generator",
  createShortUrlMiddleware.preventGenerateUrlMultiTime,
  createShortUrlMiddleware.checkTheCorrectOfUrl,
  //add url to database
  (request, response) => {
    const url = request._url;
    const shortenUrl = __domain + generator(6);
    db.insert({ url, shortenUrl }, (err, newData) => {
      if (err) throw err;
    });

    response.send({ shortenUrl });
  }
);

app.listen(PORT, (err, res) => {
  if (err) throw err;
  console.log("server listening port: " + PORT);
});
