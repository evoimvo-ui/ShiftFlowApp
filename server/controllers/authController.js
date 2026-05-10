const User = require('../models/User');
const Organization = require('../models/Organization');
const jwt = require('jsonwebtoken');
const keys = require('../config/keys');

exports.registerOrganization = async (req, res) => {
  try {
    const { username, password, organizationName, role } = req.body;

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
        organizationId: organization._id
      });
      await user.save();

      return res.status(201).json({ message: 'Uspješno ste se registrovali kao radnik u organizaciji ' + organizationName });
    }

    // Originalna logika za admina
    // 1. Kreiraj admin korisnika
    const user = new User({
      username,
      password,
      role: 'admin'
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

    res.status(201).json({ message: 'Organizacija i administrator uspešno registrovani' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username }).populate('organizationId');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Neispravno korisničko ime ili lozinka' });
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
        username: user.username, 
        role: user.role, 
        organizationId: user.organizationId?._id?.toString(),
        organizationName: user.organizationId?.name
      } 
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
