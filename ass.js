const mongoose = require("mongoose");

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/onlineLibrary", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

// Author Schema
const authorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  birth_year: { type: Number, required: true },
  nationality: String,
  books: [{ type: mongoose.Schema.Types.ObjectId, ref: "Book" }],
});
const Author = mongoose.model("Author", authorSchema);

// Book Schema
const bookSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  published_year: Number,
  genre: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: "Author", required: true },
});
const Book = mongoose.model("Book", bookSchema);

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  borrowed_books: [{ type: mongoose.Schema.Types.ObjectId, ref: "Transaction" }],
});
const User = mongoose.model("User", userSchema);

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  borrow_date: { type: Date, default: Date.now },
  return_date: { type: Date, default: null },
});
const Transaction = mongoose.model("Transaction", transactionSchema);

// Express App Setup
const express = require("express");
const app = express();
app.use(express.json());

// Borrow a Book
app.post("/borrow", async (req, res) => {
  const { userId, bookId } = req.body;
  
  const bookExists = await Book.findById(bookId);
  if (!bookExists) return res.status(404).send("Book not found");

  const transaction = new Transaction({ book: bookId, user: userId });
  await transaction.save();

  await User.findByIdAndUpdate(userId, { $push: { borrowed_books: transaction._id } });

  res.status(200).send("Book borrowed successfully");
});

// Return a Book
app.post("/return", async (req, res) => {
  const { userId, bookId } = req.body;

  const transaction = await Transaction.findOne({ book: bookId, user: userId, return_date: null });
  if (!transaction) return res.status(400).send("No active transaction found");

  transaction.return_date = new Date();
  await transaction.save();

  res.status(200).send("Book returned successfully");
});

// List Books by an Author
app.get("/books/:authorId", async (req, res) => {
  const books = await Book.find({ author: req.params.authorId });
  res.status(200).json(books);
});

// List Books Borrowed by a User
app.get("/borrowed/:userId", async (req, res) => {
  const transactions = await Transaction.find({ user: req.params.userId }).populate("book");
  res.status(200).json(transactions);
});

// Start Server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
