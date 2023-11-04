const express = require('express');
const path = require('path');
const fs = require('fs');
const exphbs = require('express-handlebars');

const app = express();
const PORT = 5000;

const hbs = exphbs.create({
  extname: '.hbs',
  helpers: {
      classify: (value) => {
          return value && value.trim() !== "" ? value : "UNKNOWN";
      },
      eq: (v1, v2) => {
          return v1 === v2;
      }
  }
});

app.engine('.hbs', hbs.engine);
app.set('view engine', 'hbs');

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

let cachedData = null;

fs.readFile(path.join(__dirname, 'CarSales.json'), 'utf-8', (err, data) => {
    if (err) {
        console.error('Error loading JSON data:', err);
        return;
    }
    
    try {
        cachedData = JSON.parse(data);
        console.log('JSON data is loaded and cached!');
    } catch (parseErr) {
        console.error('Error parsing JSON data:', parseErr);
    }
});

app.get('/', (req, res) => {
    res.render('index', { title: 'Express' });
});

app.get('/alldata', (req, res) => {
    if (!cachedData) {
        return res.render('error', { message: 'Error loading JSON data.' });
    }
    res.render('alldata', { data: cachedData });
});

app.get('/data/invoiceNo/:index', (req, res) => {
    const index = parseInt(req.params.index, 10);
    if (!cachedData || isNaN(index) || index < 0 || index >= cachedData.length) {
        return res.render('error', { message: 'Invalid index provided or data not loaded.' });
    }
    const item = cachedData[index];
    res.render('invoiceDetail', { item });
});

app.get('/search/invoiceID', (req, res) => {
    res.render('searchInvoice');
});

app.post('/search/invoiceID', (req, res) => {
    const { invoiceID } = req.body;
    if (!cachedData) {
        return res.render('error', { message: 'Error loading JSON data.' });
    }
    const result = cachedData.find(item => item.InvoiceNo === invoiceID);
    if (result) {
        res.render('invoiceDetail', { item: result });
    } else {
        res.render('error', { message: `No data found for InvoiceNo: ${invoiceID}` });
    }
});

app.get('/search/manufacturer', (req, res) => {
    res.render('manufacturerSearch');
});

app.post('/search/manufacturer', (req, res) => {
    const { manufacturer } = req.body;
    if (!manufacturer || !cachedData) {
        return res.render('error', { message: 'Invalid input or error loading JSON data.' });
    }
    const sanitizedManufacturer = manufacturer.trim().toLowerCase();
    const matchedRecords = cachedData.filter(item => item.Manufacturer.toLowerCase().includes(sanitizedManufacturer));
    if (matchedRecords.length > 0) {
      res.render('ManufacturerDetail', { records: matchedRecords, searchQuery: manufacturer });  
    } else {
        res.render('error', { message: `No sales records found for Manufacturer: ${manufacturer}` });
    }
});
app.get('/filteredData', (req, res) => {
  console.log("Accessing /filteredData route");  // Add this log
  if (!cachedData) {
      return res.render('error', { message: 'Error loading JSON data.' });
  }
  const filteredData = cachedData.filter(item => item.class && item.class.trim() !== "");
  res.render('filteredData', { data: filteredData });
});



app.get('*', (req, res) => {
    res.render('error', { title: 'Error', message: 'Wrong Route' });
});

app.listen(PORT, () => {
    console.log(`Example app listening at http://localhost:${PORT}`);
});
