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

// Load Address Books from File
let addressBooks = JSON.parse(fs.readFileSync(DATA_FILE));

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
    if (!addressBooks[bookName]) {
        return res.status(404).json({ error: `Address Book '${bookName}' not found` });
    }

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

    // Check for duplicate contact by name
    const isDuplicate = addressBooks[bookName].some(contact => 
        contact.firstName.toLowerCase() === firstName.toLowerCase() &&
        contact.lastName.toLowerCase() === lastName.toLowerCase()
    );

    if (isDuplicate) {
        return res.status(400).json({ error: 'Duplicate entry: Contact with the same name already exists' });
    }

    const newContact = { firstName, lastName, address, city, state, zip, phoneNumber, email };
    addressBooks[bookName].push(newContact);
    fs.writeFileSync(DATA_FILE, JSON.stringify(addressBooks, null, 2));

    res.status(201).json({ message: 'Contact added successfully', contact: newContact });
});

// API to find and edit an existing contact by name
app.put('/addressBooks/:bookName/contacts/:name', (req, res) => {
    const { bookName, name } = req.params;
    if (!addressBooks[bookName]) {
        return res.status(404).json({ error: `Address Book '${bookName}' not found` });
    }

    const contacts = addressBooks[bookName];
    const contactIndex = contacts.findIndex(contact => 
        contact.firstName.toLowerCase() === name.toLowerCase()
    );

    if (contactIndex === -1) {
        return res.status(404).json({ error: `Contact '${name}' not found` });
    }

    Object.assign(contacts[contactIndex], req.body);
    fs.writeFileSync(DATA_FILE, JSON.stringify(addressBooks, null, 2));

    res.json({ message: 'Contact updated successfully', contact: contacts[contactIndex] });
});

// API to delete a contact by name
app.delete('/addressBooks/:bookName/contacts/:name', (req, res) => {
    const { bookName, name } = req.params;
    if (!addressBooks[bookName]) {
        return res.status(404).json({ error: `Address Book '${bookName}' not found` });
    }

    addressBooks[bookName] = addressBooks[bookName].filter(contact =>
        contact.firstName.toLowerCase() !== name.toLowerCase()
    );

    fs.writeFileSync(DATA_FILE, JSON.stringify(addressBooks, null, 2));
    res.json({ message: `Contact '${name}' deleted successfully` });
});

// API to get the number of contacts in an address book
app.get('/addressBooks/:bookName/count', (req, res) => {
    const { bookName } = req.params;
    if (!addressBooks[bookName]) {
        return res.status(404).json({ error: `Address Book '${bookName}' not found` });
    }
    res.json({ message: `Total Contacts: ${addressBooks[bookName].length}` });
});

// API to view persons by city or state
app.get('/addressBooks/:bookName/contacts/view', (req, res) => {
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

    if (contacts.length === 0) {
        return res.json({ message: `No contacts found for city: ${city || ''}, state: ${state || ''}` });
    }

    res.json({ message: "Contacts found", contacts });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
