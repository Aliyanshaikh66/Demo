const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdf = require('pdfkit'); // For generating PDFs

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use('/idcards', express.static('idcards'));
app.use('/certificates', express.static('certificates'));
app.use(express.static('public')); // Serve static files from public directory

mongoose.connect('mongodb://localhost:27017/internshipDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Importing Models
const Internship = require('./models/internship'); // Your internship schema
const Admin = require('./models/admin'); // Your admin schema

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

// Route for submitting the application form
app.post('/submit-form', upload.single('resume'), (req, res) => {
  const newApplication = new Internship({
    fullName: req.body.fullName,
    email: req.body.email,
    phone: req.body.phone,
    internship: req.body.internship,
    resume: req.file.filename,
    coverLetter: req.body.coverLetter
  });

  newApplication.save()
    .then((application) => {
      // Generate ID Card for the applicant
      generateIDCard(application, () => {
        res.send('Application submitted successfully! Your ID card has been generated.');
      });
    })
    .catch(err => res.status(400).send('Error: ' + err));
});

// Generate ID Card
function generateIDCard(application, callback) {
  const doc = new pdf();
  const filePath = `./idcards/${application._id}_ID_Card.pdf`;

  doc.pipe(fs.createWriteStream(filePath));
  doc.fontSize(20).text(`ID Card for ${application.fullName}`);
  doc.text(`Internship: ${application.internship}`);
  doc.text(`Phone: ${application.phone}`);
  doc.text(`Email: ${application.email}`);
  doc.text(`ID: ${application._id}`);
  doc.end();

  application.idCardGenerated = true;
  application.save().then(callback);
}

// Admin Panel to view applications
app.get('/admin', (req, res) => {
  Internship.find({}, (err, applications) => {
    if (!err) {
      res.json(applications);
    } else {
      res.status(400).send('Error: ' + err);
    }
  });
});

// Approve application
app.post('/admin/approve/:id', (req, res) => {
  Internship.findById(req.params.id, (err, application) => {
    if (!err) {
      application.status = 'Approved';
      application.save()
        .then(() => {
          // Generate Certificate
          generateCertificate(application, () => {
            res.send('Internship approved and certificate generated!');
          });
        })
        .catch(err => res.status(400).send('Error: ' + err));
    } else {
      res.status(400).send('Error: ' + err);
    }
  });
});

// Generate Certificate
function generateCertificate(application, callback) {
  const doc = new pdf();
  const filePath = `./certificates/${application._id}_Certificate.pdf`;

  doc.pipe(fs.createWriteStream(filePath));
  doc.fontSize(20).text(`Certificate of Completion`);
  doc.text(`This certifies that ${application.fullName} has completed the internship in ${application.internship}.`);
  doc.end();

  application.certificateIssued = true;
  application.save().then(callback);
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
