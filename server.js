const express = require('express');
const admin = require('firebase-admin');
const path = require('path');
const app = express();
app.use(express.json());
const cors = require('cors');
app.use(cors());

// Initialize Firebase Admin SDK using environment variable
admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_CREDENTIALS))
});

const db = admin.firestore();
const usersCollection = db.collection('users');

// Route to create a new user
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const userDoc = await usersCollection.doc(username).get();
    
    if (userDoc.exists) {
      return res.status(200).json({ success: false, message: 'User already exists' });
    }

    // Add the new user to Firestore
    await usersCollection.doc(username).set({ password });
    res.status(201).json({ success: true, message: 'User created successfully' });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Route to validate login credentials
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const userDoc = await usersCollection.doc(username).get();

    if (!userDoc.exists) {
      return res.status(200).json({ success: "null", message: 'User not found' });
    }

    const data = userDoc.data();

    if (data.password === password) {
      res.status(200).json({ success: true, message: 'Login successful' });
    } else {
      res.status(200).json({ success: false, message: 'Incorrect password' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Test Route
app.get('/', (req, res) => {
  try {
    res.status(200).json({ success: true, message: "hello world" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
