// Mengimpor modul Express.js
const express = require('express');

const expressLayouts = require('express-ejs-layouts'); // Mengimpor modul express-ejs-layouts

const { loadContact, findContact, addContact, cekDuplikat, deleteContact, updateContacts } = require('./utils/contacts');

const { body, validationResult, check } = require('express-validator');

const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');

// Menginisialisasi aplikasi Express
const app = express();

// Menentukan port yang akan digunakan
const port = 3000;

// Mengatur EJS sebagai template engine
app.set('view engine', 'ejs');

// built-in middleware
app.use(express.static('public'));

// Menggunakan express-ejs-layouts sebagai middleware
app.use(expressLayouts);

// Menggunakan express.urlencoded() dengan opsi extended yang eksplisit
app.use(express.urlencoded({ extended: true }));

// Konfigurasi Flash
app.use(cookieParser('secret'));
app.use(
    session({
        cookie: { maxAge: 6000},
        secret: 'secret',
        resave: true,
        saveUninitialized: true,
    })
);
app.use(flash());


// application level midleware
app.use((req, res, next) => {
    console.log('Time: ', Date.now());
    next();
})

// Menggunakan middleware untuk menyajikan file statis dari direktori saat ini
app.use(express.static(__dirname));

// Penanganan rute untuk halaman utama
app.get('/', (req, res) => {
    res.render('halaman utama', {
        layout: 'layout/main-layout',
        namaWeb: "Rafi'ul Huda",
        title: 'halaman utama',
        // titleh1: 'Halo, ini adalah halaman utama!',
        message: 'Saat ini Saya sedang Mengikuti coding Training backend di sinarmas land'
    });
});

// Penanganan rute untuk halaman about
app.get('/about', (req, res) => {
    res.render('about', { 
        layout: 'layout/main-layout',
        title: "About"
     });
});

// Penanganan rute untuk halaman contact
app.get('/contact', (req, res) => {
    // const contact = [
    //     {
    //         nama: "Rafi'ul Huda",
    //         mobile: "081283288739",
    //         email: "rafiulhuda@gmail.com"
    //     },
    //     {
    //         nama: "Rafiul",
    //         mobile: "081283288789",
    //         email: "rafiul@gmail.com"
    //     },
    //     {
    //         nama: "Raya Adinda Jayadi Ahmad",
    //         mobile: "081283288773",
    //         email: "rayaAdinda01@gmail.com"
    //     }
    // ];
    const contacts = loadContact(); 
    
    // // Memeriksa apakah ada data kontak
    // if (contact.length === 0) {
    //     // Jika tidak ada, menampilkan pesan bahwa belum ada kontak yang tersedia
    //     res.render('contact', {
    //         title: 'Kontak',
    //         message: 'Maaf, Belum ada daftar kontak yang tersedia.'
    //     });
    // } else {
        // Jika ada, menampilkan data kontak di halaman kontak
        res.render('contact', {
            title: 'Kontak',
            contacts,
            msg: req.flash('msg'),
            layout: 'layout/main-layout',
        });
    }
);

// Halaman form tambah data contct
app.get('/contact/add', (req, res) => {
    res.render('add-contact', {
        title: 'Form Tambah Data Contact',
        layout: 'layout/main-layout'
    })
});

// proses data contact
app.post('/contact', [
    body('nama').custom((value) => {
        const duplikat = cekDuplikat(value);
        if(duplikat){
            throw new Error('Nama contact sudah digunakan!')
        }
        return true;
    }),
    check('email', 'Email tidak valid!').isEmail(),
    check('mobile', 'Nomor Handphone tidak valid!').isMobilePhone('id-ID')
], (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        // return res.status(400).json({ errors: errors.array() });
        res.render('add-contact', {
            title: 'Form Tambah Data Contact',
            layout: 'layout/main-layout',
            errors: errors.array(),
        })
    }else{
        addContact(req.body);
        // Kirimkan flash message
        req.flash('msg', 'Data Contact Anda Berhasil ditambahkan!');
        res.redirect('/contact');
    }
})


// proses delete contact
app.get('/contact/delete/:nama', (req, res) =>{
    const contact = findContact(req.params.nama)

    // jika contact tidak ada
    if(!contact){
        res.status(404);
        res.status('<h1>404</h1>');
    }else{
        deleteContact(req.params.nama);
        req.flash('msg', 'Data Contact Anda Berhasil dihapuskan!');
        res.redirect('/contact');
    }
}) 

// Halaman form ubah data contct
app.get('/contact/edit/:nama', (req, res) => {
    const contact = findContact(req.params.nama);

    res.render('edit-contact', {
        title: 'Form Ubah Data Contact',
        layout: 'layout/main-layout',
        contact,
    })
});

// proses ubah data
app.post('/contact/update', [
    body('nama').custom((value, { req}) => {
        const duplikat = cekDuplikat(value);
        if(value !== req.body.oldNama && duplikat){
            throw new Error('Nama contact sudah digunakan!')
        }
        return true;
    }),
    check('email', 'Email tidak valid!').isEmail(),
    body('mobile').custom((value) => {
        const duplikat = cekDuplikat(value);
        if(duplikat){
            throw new Error('Nomor contact sudah digunakan!')
        }
        return true;
    }),
    check('mobile', 'Nomor Handphone tidak valid!').isMobilePhone('id-ID')
], (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        // return res.status(400).json({ errors: errors.array() });
        res.render('edit-contact', {
            title: 'Form Ubah Data Contact',
            layout: 'layout/main-layout',
            errors: errors.array(),
            contact: req.body,
        })
    }else{
        updateContacts(req.body);
        // Kirimkan flash message
        req.flash('msg', 'Data Contact Anda Berhasil diubah!');
        res.redirect('/contact');
    }
})

// halaman detail contact
app.get('/contact/:nama', (req, res) => {
    const contact = findContact(req.params.nama); 
    
    // // Memeriksa apakah ada data kontak
    // if (contact.length === 0) {
    //     // Jika tidak ada, menampilkan pesan bahwa belum ada kontak yang tersedia
    //     res.render('detail', {
    //         title: 'Halaman detail kontak',
    //         message: 'Maaf, Belum ada daftar kontak yang tersedia.'
    //     });
    // } else {
        // Jika ada, menampilkan data kontak di halaman kontak
        res.render('detail', {
            title: 'Halaman detail kontak',
            contact,
            layout: 'layout/main-layout',
        });
    }
);

// Penanganan rute dinamis untuk produk dengan parameter 'id' dan query 'category'
app.get('/product/:id', (req, res) => {
    res.send(`Product id: ${req.params.id} <br> Category id: ${req.query.Kategori}`);
});

// Penanganan rute untuk permintaan yang tidak cocok dengan rute lainnya (404 Not Found)
app.use('/', (req, res) => {
    res.status(404);
    res.send('page not found: 404');
});

// Server mendengarkan permintaan pada port yang telah ditentukan
app.listen(port, () => {
    // Pesan ini akan dicetak saat server berjalan
    console.log(`Server berjalan di http://localhost:${port}/`);
});