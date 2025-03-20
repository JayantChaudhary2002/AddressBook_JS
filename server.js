const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'contacts.json');

app.use(express.json()); // Middleware to parse JSON requests

// Ensure the JSON file exists
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// API to add a new contact
app.post('/contacts', (req, res) => {
    const { firstName, lastName, address, city, state, zip, phoneNumber, email } = req.body;
    
    if (!firstName || !lastName || !address || !city || !state || !zip || !phoneNumber || !email) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const newContact = { firstName, lastName, address, city, state, zip, phoneNumber, email };
    
    const contacts = JSON.parse(fs.readFileSync(DATA_FILE));
    contacts.push(newContact);
    fs.writeFileSync(DATA_FILE, JSON.stringify(contacts, null, 2));
    
    res.status(201).json({ message: 'Contact added successfully', contact: newContact });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
