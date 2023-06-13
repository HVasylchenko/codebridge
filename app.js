const express = require("express");
const bodyParser = require("body-parser");
const { Sequelize, DataTypes } = require("sequelize");
const config = require('./config.json')

const DBName = config.development.database;
const DBUserName = config.development.username;
const DBPassword = config.development.password;
const DBHost = config.development.host;
const DBDialect = config.development.dialect;

const app = express();
const port = 80;

// Configure database connection
const sequelize = new Sequelize(DBName, DBUserName, DBPassword, {
  host: DBHost,
  dialect: DBDialect,
});

// Define the Dog model
const Dog = sequelize.define(
  "Dog",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tail_length: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    weight: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  { timestamps: false }
);

// Initialize the database
async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }

  await sequelize.sync({ force: true });
  await Dog.bulkCreate([
    { name: "Neo", color: "red & amber", tail_length: 22, weight: 32 },
    { name: "Jessy", color: "black & white", tail_length: 7, weight: 14 },
  ]);
}
initializeDatabase();

// Ping endpoint
app.get("/ping", (req, res) => {
  res.send("Dogshouseservice.Version1.0.1");
});

// Dogs endpoint with sorting and pagination
app.get("/dogs", async (req, res) => {
  try {
    const {
      attribute = "name",
      order = "asc",
      pageNumber = 1,
      limit = 10,
    } = req.query;

    const dogs = await Dog.findAll({
      order: [[attribute, order.toUpperCase()]],
      offset: (pageNumber - 1) * limit,
      limit: parseInt(limit),
    });

    res.json(dogs);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Create dog endpoint
app.post("/dog", bodyParser.json(), async (req, res) => {
  try {
    const { name, color, tail_length, weight } = req.body;

    const dog = await Dog.create({ name, color, tail_length, weight });
    // console.log("dog:", dog)

    res.send("Dog created successfully");
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      res.status(400).send("Dog with the same name already exists");
    } else if (error.name === "SequelizeValidationError") {
      res.status(400).send("Invalid input data");
    } else {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
