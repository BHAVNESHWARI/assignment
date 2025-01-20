const express = require("express");
const fs = require("fs");
const app = express();
const PORT = 3000;

// Middleware to parse JSON
app.use(express.json());

// Helper function to read data from db.json
const readData = () => {
  const data = fs.readFileSync("db.json", "utf8");
  return JSON.parse(data);
};

// Helper function to write data to db.json
const writeData = (data) => {
  fs.writeFileSync("db.json", JSON.stringify(data, null, 2));
};

// Get all todos
app.get("/todos", (req, res) => {
  const data = readData();
  res.json(data.todos);
});

// Add a new todo
app.post("/todos", (req, res) => {
  const newTodo = req.body;
  const data = readData();
  newTodo.id = data.todos.length + 1; // Assign an ID
  data.todos.push(newTodo);
  writeData(data);
  res.status(201).json({ message: "Todo added successfully", todo: newTodo });
});

// Update status of even ID todos
app.put("/todos/update-even-status", (req, res) => {
  const data = readData();
  data.todos.forEach((todo) => {
    if (todo.id % 2 === 0 && todo.status === false) {
      todo.status = true;
    }
  });
  writeData(data);
  res.json({ message: "Updated even ID todos with status false to true" });
});

// Delete todos with status true
app.delete("/todos/delete-true-status", (req, res) => {
  const data = readData();
  const filteredTodos = data.todos.filter((todo) => !todo.status);
  data.todos = filteredTodos;
  writeData(data);
  res.json({ message: "Deleted todos with status true" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
