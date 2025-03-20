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

// Validation functions
function isValidName(name) {
    return /^[A-Z][a-zA-Z]{2,}$/.test(name);
}

function isValidAddress(address) {
    return /^.{4,}$/.test(address);
}

function isValidZip(zip) {
    return /^\d{5,6}$/.test(zip);
}

function isValidPhone(phone) {
    return /^\d{10}$/.test(phone);
}

function isValidEmail(email) {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

// API to add a new contact
app.post('/contacts', (req, res) => {
    const { firstName, lastName, address, city, state, zip, phoneNumber, email } = req.body;
    
    if (!isValidName(firstName) || !isValidName(lastName)) {
        return res.status(400).json({ error: 'First and Last Name must start with a capital letter and have at least 3 characters' });
    }
    if (!isValidAddress(address) || !isValidAddress(city) || !isValidAddress(state)) {
        return res.status(400).json({ error: 'Address, City, and State must have at least 4 characters' });
    }
    if (!isValidZip(zip)) {
        return res.status(400).json({ error: 'Invalid Zip Code (must be 5 or 6 digits)' });
    }
    if (!isValidPhone(phoneNumber)) {
        return res.status(400).json({ error: 'Invalid Phone Number (must be 10 digits)' });
    }
    if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid Email Format' });
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
