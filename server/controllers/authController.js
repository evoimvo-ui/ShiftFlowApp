const User = require('../models/User');
const Organization = require('../models/Organization');
const jwt = require('jsonwebtoken');
const keys = require('../config/keys');

exports.registerOrganization = async (req, res) => {
  try {
    const { username, password, organizationName } = req.body;

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
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Neispravno korisničko ime ili lozinka' });
    }
    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role, 
        username: user.username, 
        organizationId: user.organizationId?.toString() 
      }, 
      keys.jwtSecret, 
      { expiresIn: '1d' }
    );
    res.json({ 
      token, 
      user: { 
        username: user.username, 
        role: user.role, 
        organizationId: user.organizationId?.toString() 
      } 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
