const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

// ---------- Fonctions utilitaires (promesses) ----------
const getBooks = () => new Promise((resolve) => resolve(books));

// ---------- Routes du serveur ----------

// Inscription
public_users.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }
  if (users.find((u) => u.username === username)) {
    return res.status(409).json({ message: "User already exists" });
  }
  users.push({ username, password });
  return res.status(200).json({ message: "User successfully registered. Now you can login" });
});

// Tous les livres
public_users.get('/', async (req, res) => {
  try {
    const allBooks = await getBooks();
    return res.status(200).json(allBooks);
  } catch (err) {
    return res.status(500).json({ message: "Error retrieving books" });
  }
});

// Par ISBN
public_users.get('/isbn/:isbn', (req, res) => {
  getBooks()
    .then((allBooks) => {
      const book = allBooks[req.params.isbn];
      if (book) return res.status(200).json(book);
      return res.status(404).json({ message: "Book not found" });
    })
    .catch(() => res.status(500).json({ message: "Error retrieving book" }));
});

// Par auteur
public_users.get('/author/:author', async (req, res) => {
  try {
    const allBooks = await getBooks();
    const result = Object.keys(allBooks)
      .filter((isbn) => allBooks[isbn].author.toLowerCase() === req.params.author.toLowerCase())
      .map((isbn) => ({ isbn, ...allBooks[isbn] }));
    if (result.length > 0) return res.status(200).json(result);
    return res.status(404).json({ message: "No books found for this author" });
  } catch (err) {
    return res.status(500).json({ message: "Error retrieving books" });
  }
});

// Par titre
public_users.get('/title/:title', async (req, res) => {
  try {
    const allBooks = await getBooks();
    const result = Object.keys(allBooks)
      .filter((isbn) => allBooks[isbn].title.toLowerCase() === req.params.title.toLowerCase())
      .map((isbn) => ({ isbn, ...allBooks[isbn] }));
    if (result.length > 0) return res.status(200).json(result);
    return res.status(404).json({ message: "No books found with this title" });
  } catch (err) {
    return res.status(500).json({ message: "Error retrieving books" });
  }
});

// Critiques d'un livre
public_users.get('/review/:isbn', (req, res) => {
  const book = books[req.params.isbn];
  if (!book) return res.status(404).json({ message: "Book not found" });
  if (Object.keys(book.reviews).length === 0) {
    return res.status(200).json({ message: "No reviews found for this book." });
  }
  return res.status(200).json(book.reviews);
});

// ---------- Client Axios (Q11) ----------
const BASE = 'http://localhost:5000';

// Tous les livres (async/await)
async function getAllBooksAxios() {
  try {
    const res = await axios.get(`${BASE}/`);
    if (res.data && Object.keys(res.data).length > 0) {
      console.log('Succès :', res.data);
      return res.data;
    }
    console.log('Aucun livre trouvé.');
  } catch (err) {
    console.error('Erreur :', err.message);
  }
}

// Par ISBN (promesses)
function getByISBNAxios(isbn) {
  return axios.get(`${BASE}/isbn/${isbn}`)
    .then((res) => { console.log('Succès :', res.data); return res.data; })
    .catch((err) => {
      if (err.response && err.response.status === 404) console.log('Livre introuvable.');
      else console.error('Erreur :', err.message);
    });
}

// Par auteur (async/await)
async function getByAuthorAxios(author) {
  try {
    const res = await axios.get(`${BASE}/author/${encodeURIComponent(author)}`);
    console.log('Succès :', res.data);
    return res.data;
  } catch (err) {
    if (err.response && err.response.status === 404) console.log('Auteur introuvable.');
    else console.error('Erreur :', err.message);
  }
}

// Par titre (async/await)
async function getByTitleAxios(title) {
  try {
    const res = await axios.get(`${BASE}/title/${encodeURIComponent(title)}`);
    console.log('Succès :', res.data);
    return res.data;
  } catch (err) {
    if (err.response && err.response.status === 404) console.log('Titre introuvable.');
    else console.error('Erreur :', err.message);
  }
}

module.exports.general = public_users;
module.exports.getAllBooksAxios = getAllBooksAxios;
module.exports.getByISBNAxios = getByISBNAxios;
module.exports.getByAuthorAxios = getByAuthorAxios;
module.exports.getByTitleAxios = getByTitleAxios;