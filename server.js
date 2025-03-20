const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'contacts.json');

app.use(express.json()); // Middleware to parse JSON requests

// Load data or initialize empty address books
let addressBooks = {};
if (fs.existsSync(DATA_FILE)) {
    addressBooks = JSON.parse(fs.readFileSync(DATA_FILE));
} else {
    fs.writeFileSync(DATA_FILE, JSON.stringify({}));
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

// Create a new Address Book
app.post('/addressBooks/:bookName', (req, res) => {
    const { bookName } = req.params;
    if (addressBooks[bookName]) {
        return res.status(400).json({ error: `Address Book '${bookName}' already exists` });
    }
    addressBooks[bookName] = [];
    fs.writeFileSync(DATA_FILE, JSON.stringify(addressBooks, null, 2));
    res.status(201).json({ message: `Address Book '${bookName}' created successfully` });
});

// Add a new contact to an Address Book
app.post('/addressBooks/:bookName/contacts', (req, res) => {
    const { bookName } = req.params;
    if (!addressBooks[bookName]) {
        return res.status(404).json({ error: `Address Book '${bookName}' not found` });
    }

    const { firstName, lastName, address, city, state, zip, phoneNumber, email } = req.body;
    
    // Validate inputs
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

    // Check for duplicate entry (same name)
    const isDuplicate = addressBooks[bookName].some(contact => contact.firstName === firstName && contact.lastName === lastName);
    if (isDuplicate) {
        return res.status(400).json({ error: 'Duplicate contact entry found in Address Book' });
    }

    const newContact = { firstName, lastName, address, city, state, zip, phoneNumber, email };
    addressBooks[bookName].push(newContact);
    fs.writeFileSync(DATA_FILE, JSON.stringify(addressBooks, null, 2));

    res.status(201).json({ message: 'Contact added successfully', contact: newContact });
});

// Get all contacts from an Address Book
app.get('/addressBooks/:bookName/contacts', (req, res) => {
    const { bookName } = req.params;
    if (!addressBooks[bookName]) {
        return res.status(404).json({ error: `Address Book '${bookName}' not found` });
    }
    res.json(addressBooks[bookName]);
});

// Edit an existing contact
app.put('/addressBooks/:bookName/contacts/:name', (req, res) => {
    const { bookName, name } = req.params;
    if (!addressBooks[bookName]) {
        return res.status(404).json({ error: `Address Book '${bookName}' not found` });
    }

    const contact = addressBooks[bookName].find(contact => contact.firstName === name);
    if (!contact) {
        return res.status(404).json({ error: `Contact '${name}' not found` });
    }

    Object.assign(contact, req.body);
    fs.writeFileSync(DATA_FILE, JSON.stringify(addressBooks, null, 2));

    res.json({ message: 'Contact updated successfully', contact });
});

// Delete a contact
app.delete('/addressBooks/:bookName/contacts/:name', (req, res) => {
    const { bookName, name } = req.params;
    if (!addressBooks[bookName]) {
        return res.status(404).json({ error: `Address Book '${bookName}' not found` });
    }

    addressBooks[bookName] = addressBooks[bookName].filter(contact => contact.firstName !== name);
    fs.writeFileSync(DATA_FILE, JSON.stringify(addressBooks, null, 2));

    res.json({ message: `Contact '${name}' deleted successfully` });
});

// Search contacts by city or state
app.get('/addressBooks/:bookName/contacts/search', (req, res) => {
    const { bookName } = req.params;
    const { city, state } = req.query;

    if (!addressBooks[bookName]) {
        return res.status(404).json({ error: `Address Book '${bookName}' not found` });
    }

    let filteredContacts = addressBooks[bookName];

    if (city) {
        filteredContacts = filteredContacts.filter(contact => contact.city.toLowerCase() === city.toLowerCase().trim());
    }
    if (state) {
        filteredContacts = filteredContacts.filter(contact => contact.state.toLowerCase() === state.toLowerCase().trim());
    }

    res.json(filteredContacts);
});

// Get contact count by city or state
app.get('/addressBooks/:bookName/contacts/countByLocation', (req, res) => {
    const { bookName } = req.params;
    const { city, state } = req.query;

    if (!addressBooks[bookName]) {
        return res.status(404).json({ error: `Address Book '${bookName}' not found` });
    }

    let contacts = addressBooks[bookName];

    if (city) {
        contacts = contacts.filter(contact => contact.city.toLowerCase() === city.toLowerCase().trim());
    }
    if (state) {
        contacts = contacts.filter(contact => contact.state.toLowerCase() === state.toLowerCase().trim());
    }

    res.json({ message: "Contact count by location", city: city || "N/A", state: state || "N/A", count: contacts.length });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
