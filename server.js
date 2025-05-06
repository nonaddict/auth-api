const express = require('express');
const admin = require('firebase-admin');
const path = require('path');
const app = express();
app.use(express.json());
const cors = require('cors');
app.use(cors());

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_CREDENTIALS))
});

const db = admin.firestore();
const usersCollection = db.collection('users');

// Route to create a new user(i made the status code 200 because if it is not the request doesnt come through)
app.post('/signup', async (req, res) => {
  const { username, password,score } = req.body;
  
  try {
    const userDoc = await usersCollection.doc(username).get();
    
    if (userDoc.exists) {
      return res.status(200).json({ success: false, message: 'User already exists' });
    }

    // Add the new user to Firestore
   await usersCollection.doc(username).set({ username, password, score });
    res.status(201).json({ success: true, message: 'User created successfully' });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Route login 
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const userDoc = await usersCollection.doc(username).get();

    if (!userDoc.exists) {
      return res.status(200).json({ success: false, message: 'User not found' });
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
app.get('/getScores', async (req, res) => {
  try {
    const usersSnapshot = await usersCollection.get();
    const usersArray = [];

    usersSnapshot.forEach(doc => {
      const { username, score } = doc.data(); 
      usersArray.push({ username, score });
    });

    res.status(200).json({ success: true, users: usersArray });
  } catch (err) {
    res.status(500).json({ success: false, message: "internal server error" });
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
app.put('/updateScore', async (req, res) => {
  const { username, score } = req.body; // Extract username and score from the request body

  if (!username || score === undefined) {
    return res.status(400).json({ success: false, message: 'Username and score are required' });
  }

  try {
    
    const userDoc = await usersCollection.doc(username).get();

    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

   
    await usersCollection.doc(username).update({
      score: score
    });

    return res.status(200).json({ success: true, message: 'Score updated successfully' });
  } catch (err) {
    console.error('Error updating score:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});
app.get('/user/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const userDoc = await usersCollection.doc(username).get();

    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, user: userDoc.data() });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
