const app = require("./app");
const dotenv = require("dotenv");
const connectionDatabase = require("./db/database");

dotenv.config({
  path: "./.env",
});

connectionDatabase()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at port ${process.env.PORT || 8000}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection failed!!!", err);
  });


  