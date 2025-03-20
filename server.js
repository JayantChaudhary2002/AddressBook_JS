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

// Read contacts from file
function readContacts() {
    return JSON.parse(fs.readFileSync(DATA_FILE));
}

// Write contacts to file
function writeContacts(contacts) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(contacts, null, 2));
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

    const contacts = readContacts();
    
    // Check for duplicate entry
    if (contacts.some(contact => contact.firstName === firstName && contact.lastName === lastName)) {
        return res.status(400).json({ error: 'Duplicate entry: Contact with the same name already exists' });
    }

    const newContact = { firstName, lastName, address, city, state, zip, phoneNumber, email };
    contacts.push(newContact);
    writeContacts(contacts);
    
    res.status(201).json({ message: 'Contact added successfully', contact: newContact });
});

// API to get sorted contacts
app.get('/contacts/sorted', (req, res) => {
    const contacts = readContacts().sort((a, b) => a.firstName.localeCompare(b.firstName));
    console.log("Sorted Contacts:", contacts);
    res.json(contacts);
});

// API to search for contacts by city or state
app.get('/contacts/search', (req, res) => {
    const { city, state } = req.query;
    const contacts = readContacts().filter(contact => 
        (city && contact.city === city) || (state && contact.state === state)
    );
    res.json(contacts.length ? contacts : { message: 'No contacts found' });
});

// API to delete a contact by name
app.delete('/contacts/:firstName', (req, res) => {
    let contacts = readContacts();
    const initialLength = contacts.length;
    contacts = contacts.filter(contact => contact.firstName !== req.params.firstName);
    if (contacts.length === initialLength) {
        return res.status(404).json({ error: 'Contact not found' });
    }
    writeContacts(contacts);
    res.json({ message: 'Contact deleted successfully' });
});

// API to get the number of contacts by city or state
app.get('/contacts/count', (req, res) => {
    const contacts = readContacts();
    const cityCount = contacts.reduce((acc, contact) => {
        acc[contact.city] = (acc[contact.city] || 0) + 1;
        return acc;
    }, {});
    const stateCount = contacts.reduce((acc, contact) => {
        acc[contact.state] = (acc[contact.state] || 0) + 1;
        return acc;
    }, {});
    res.json({ cityCount, stateCount });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
