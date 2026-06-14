const User = require('../models/User');
const Organization = require('../models/Organization');
const jwt = require('jsonwebtoken');
const keys = require('../config/keys');
const { sendVerificationEmail } = require('../utils/emailService');

exports.registerOrganization = async (req, res) => {
  try {
    const { username, password, organizationName, role, email } = req.body;

    // Provjeri da li korisnik već postoji
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Korisničko ime je već zauzeto.' });
    }

    if (role === 'worker') {
      // 1. Pronađi organizaciju po imenu
      const organization = await Organization.findOne({ name: organizationName });
      if (!organization) {
        return res.status(404).json({ message: 'Organizacija sa tim nazivom nije pronađena. Provjerite da li ste tačno upisali naziv koji je admin koristio.' });
      }

      // 2. Kreiraj radnika
      const user = new User({
        username,
        password,
        role: 'worker',
        organizationId: organization._id,
        isVerified: true // Radnici ne trebaju verifikaciju
      });
      await user.save();

      // 3. Pokušaj povezati sa postojećim Worker dokumentom (ako postoji sa istim imenom)
      const Worker = require('../models/Worker');
      await Worker.findOneAndUpdate(
        { name: new RegExp('^' + username + '$', 'i'), organizationId: organization._id },
        { username: username }
      );

      return res.status(201).json({ message: 'Uspješno ste se registrovali kao radnik u organizaciji ' + organizationName });
    }

    // Originalna logika za admina/owner-a
    // 1. Kreiraj admin korisnika
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpiry = new Date(Date.now() + 15 * 60 * 1000);

    const user = new User({
      username,
      email,
      password,
      role: role || 'admin',
      isVerified: false,
      verificationCode,
      verificationCodeExpiry
    });
    await user.save();

    // 2. Kreiraj organizaciju
    const slug = organizationName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    const organization = new Organization({
      name: organizationName,
      slug,
      ownerId: user._id
    });
    await organization.save();

    // 3. Poveži korisnika sa organizacijom
    user.organizationId = organization._id;
    await user.save();

    // 4. Pošalji verifikacioni email
    if (email) {
      await sendVerificationEmail(email, verificationCode);
    }

    res.status(201).json({ 
      message: 'Organizacija i administrator uspješno registrovani. Molimo verifikujte svoj email.',
      requireVerification: true,
      email
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
     
     const user = await User.findOne({
       email,
       verificationCode: code,
       verificationCodeExpiry: { $gt: new Date() }
     });

    if (!user) {
      return res.status(400).json({ message: 'Neispravan ili istekao kod za verifikaciju.' });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpiry = undefined;
    await user.save();

    res.json({ message: 'Email uspješno verifikovan! Sada se možete prijaviti.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Korisnik sa tim emailom nije pronađen.' });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpiry = new Date(Date.now() + 15 * 60 * 1000);

    user.verificationCode = verificationCode;
    user.verificationCodeExpiry = verificationCodeExpiry;
    await user.save();

    await sendVerificationEmail(email, verificationCode);

    res.json({ message: 'Novi kod je poslat na vaš email.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username }).populate('organizationId');
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Neispravno korisničko ime ili lozinka' });
    }

    // Blokiraj login ako nije verifikovan (samo za admin/manager)
    if ((user.role === 'admin' || user.role === 'manager') && user.isVerified === false) {
      return res.status(403).json({ message: 'Molimo verifikujte svoj email prije prijave.' });
    }

    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role, 
        username: user.username, 
        organizationId: user.organizationId?._id?.toString() 
      }, 
      keys.jwtSecret, 
      { expiresIn: '1d' }
    );
    res.json({ 
      token, 
      user: { 
        _id: user._id,
        username: user.username, 
        role: user.role, 
        organizationId: user.organizationId?._id?.toString(),
        organizationName: user.organizationId?.name,
        mustChangePassword: user.mustChangePassword,
        tosAcceptedAt: user.tosAcceptedAt,
        tosVersion: user.tosVersion
      } 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user || !(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ message: 'Trenutna lozinka nije ispravna' });
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    res.json({ message: 'Lozinka uspješno promijenjena' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('organizationId');
    if (!user) return res.status(404).json({ message: 'Korisnik nije pronađen' });
    
    res.json({
      _id: user._id,
      username: user.username,
      role: user.role,
      organizationId: user.organizationId?._id?.toString(),
      organizationName: user.organizationId?.name,
      mustChangePassword: user.mustChangePassword,
      tosAcceptedAt: user.tosAcceptedAt,
      tosVersion: user.tosVersion
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.acceptTos = async (req, res) => {
  try {
    const { tosVersion = '1.0' } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Korisnik nije pronađen' });

    user.tosAcceptedAt = new Date();
    user.tosVersion = tosVersion;
    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      role: user.role,
      organizationId: user.organizationId?._id?.toString(),
      organizationName: user.organizationId?.name,
      mustChangePassword: user.mustChangePassword,
      tosAcceptedAt: user.tosAcceptedAt,
      tosVersion: user.tosVersion
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteUserAccount = async (req, res) => {
  try {
    const { username } = req.params;
    // Dozvoli brisanje samo ako je admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Samo administrator može brisati naloge' });
    }

    const userToDelete = await User.findOne({ username });
    if (!userToDelete) {
      return res.status(404).json({ message: 'Korisnički nalog nije pronađen' });
    }

    // Ne dozvoli brisanje samog sebe
    if (userToDelete._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Ne možete obrisati sopstveni nalog' });
    }

    await User.findByIdAndDelete(userToDelete._id);
    res.json({ message: 'Korisnički nalog uspešno obrisan' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
