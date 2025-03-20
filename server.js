const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'contacts.json');

app.use(express.json()); // Middleware to parse JSON requests

// Ensure the JSON file exists
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ addressBooks: {} }));
}

// Load Address Books
function loadAddressBooks() {
    return JSON.parse(fs.readFileSync(DATA_FILE));
}

// Save Address Books
function saveAddressBooks(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
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
    const data = loadAddressBooks();
    
    if (data.addressBooks[bookName]) {
        return res.status(400).json({ error: `Address Book '${bookName}' already exists` });
    }
    
    data.addressBooks[bookName] = [];
    saveAddressBooks(data);
    res.status(201).json({ message: `Address Book '${bookName}' created successfully` });
});

// Add a contact to an Address Book
app.post('/addressBooks/:bookName/contacts', (req, res) => {
    const { bookName } = req.params;
    const { firstName, lastName, address, city, state, zip, phoneNumber, email } = req.body;
    const data = loadAddressBooks();
    
    if (!data.addressBooks[bookName]) {
        return res.status(404).json({ error: `Address Book '${bookName}' not found` });
    }
    
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
    data.addressBooks[bookName].push(newContact);
    saveAddressBooks(data);
    
    res.status(201).json({ message: `Contact added to Address Book '${bookName}' successfully`, contact: newContact });
});

// Edit an existing contact by name
app.put('/addressBooks/:bookName/contacts/:name', (req, res) => {
    const { bookName, name } = req.params;
    const updatedContact = req.body;
    const data = loadAddressBooks();
    
    if (!data.addressBooks[bookName]) {
        return res.status(404).json({ error: `Address Book '${bookName}' not found` });
    }
    
    let contacts = data.addressBooks[bookName];
    let contactIndex = contacts.findIndex(contact => contact.firstName === name);
    
    if (contactIndex === -1) {
        return res.status(404).json({ error: `Contact '${name}' not found in Address Book '${bookName}'` });
    }
    
    const existingContact = contacts[contactIndex];
    const updatedData = { ...existingContact, ...updatedContact };
    
    contacts[contactIndex] = updatedData;
    saveAddressBooks(data);
    
    res.status(200).json({ message: `Contact '${name}' updated successfully`, contact: updatedData });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});