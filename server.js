const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'contacts.json');

app.use(express.json()); // Middleware to parse JSON requests

// Ensure the JSON file exists
if (!fs.existsSync(DATA_FILE)) {
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

// API to create a new Address Book
app.post('/addressBooks/:bookName', (req, res) => {
    const { bookName } = req.params;
    const addressBooks = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

    if (addressBooks[bookName]) {
        return res.status(400).json({ error: `Address Book '${bookName}' already exists` });
    }

    addressBooks[bookName] = [];
    fs.writeFileSync(DATA_FILE, JSON.stringify(addressBooks, null, 2));

    res.status(201).json({ message: `Address Book '${bookName}' created successfully` });
});

// API to add a new contact
app.post('/addressBooks/:bookName/contacts', (req, res) => {
    const { bookName } = req.params;
    const { firstName, lastName, address, city, state, zip, phoneNumber, email } = req.body;

    const addressBooks = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

    if (!addressBooks[bookName]) {
        return res.status(404).json({ error: `Address Book '${bookName}' not found` });
    }

    // Validate input
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

    // Check for duplicate contact
    const existingContact = addressBooks[bookName].find(contact => 
        contact.firstName === firstName && contact.lastName === lastName
    );
    if (existingContact) {
        return res.status(400).json({ error: 'Duplicate entry: Contact with same name already exists' });
    }

    const newContact = { firstName, lastName, address, city, state, zip, phoneNumber, email };
    addressBooks[bookName].push(newContact);
    fs.writeFileSync(DATA_FILE, JSON.stringify(addressBooks, null, 2));

    res.status(201).json({ message: 'Contact added successfully', contact: newContact });
});

// API to search contacts by City or State
app.get('/addressBooks/:bookName/contacts/search', (req, res) => {
    const { bookName } = req.params;
    const { city, state } = req.query;
    const addressBooks = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

    if (!addressBooks[bookName]) {
        return res.status(404).json({ error: `Address Book '${bookName}' not found` });
    }

    let filteredContacts = addressBooks[bookName];

    if (city) {
        filteredContacts = filteredContacts.filter(contact => contact.city.toLowerCase() === city.toLowerCase());
    }

    if (state) {
        filteredContacts = filteredContacts.filter(contact => contact.state.toLowerCase() === state.toLowerCase());
    }

    if (filteredContacts.length === 0) {
        return res.status(404).json({ message: `No contacts found in city: ${city || ''} state: ${state || ''}` });
    }

    res.json({ message: `Contacts found`, contacts: filteredContacts });
});

// API to update an existing contact by name
app.put('/addressBooks/:bookName/contacts/:firstName', (req, res) => {
    const { bookName, firstName } = req.params;
    const updatedContact = req.body;
    const addressBooks = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

    if (!addressBooks[bookName]) {
        return res.status(404).json({ error: `Address Book '${bookName}' not found` });
    }

    const index = addressBooks[bookName].findIndex(contact => contact.firstName === firstName);
    if (index === -1) {
        return res.status(404).json({ error: `Contact '${firstName}' not found in Address Book '${bookName}'` });
    }

    addressBooks[bookName][index] = { ...addressBooks[bookName][index], ...updatedContact };
    fs.writeFileSync(DATA_FILE, JSON.stringify(addressBooks, null, 2));

    res.json({ message: `Contact '${firstName}' updated successfully`, contact: addressBooks[bookName][index] });
});

// API to delete a contact by name
app.delete('/addressBooks/:bookName/contacts/:firstName', (req, res) => {
    const { bookName, firstName } = req.params;
    const addressBooks = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

    if (!addressBooks[bookName]) {
        return res.status(404).json({ error: `Address Book '${bookName}' not found` });
    }

    const initialLength = addressBooks[bookName].length;
    addressBooks[bookName] = addressBooks[bookName].filter(contact => contact.firstName !== firstName);

    if (addressBooks[bookName].length === initialLength) {
        return res.status(404).json({ error: `Contact '${firstName}' not found in Address Book '${bookName}'` });
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(addressBooks, null, 2));

    res.json({ message: `Contact '${firstName}' deleted successfully` });
});

// API to get the total number of contacts in an Address Book
app.get('/addressBooks/:bookName/contacts/count', (req, res) => {
    const { bookName } = req.params;
    const addressBooks = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

    if (!addressBooks[bookName]) {
        return res.status(404).json({ error: `Address Book '${bookName}' not found` });
    }

    res.json({ message: `Total contacts in '${bookName}': ${addressBooks[bookName].length}` });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
