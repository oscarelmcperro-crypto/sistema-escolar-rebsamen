const nodemailer = require('nodemailer');
const nodemailer = require('nodemailer');

const transportador = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS       
    }
});

module.exports = transportador;
