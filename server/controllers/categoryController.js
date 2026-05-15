const Category = require('../models/Category');

exports.getCategories = async (req, res) => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) return res.json([]);
    const categories = await Category.find({ organizationId: orgId });
    res.json(categories);
  } catch (err) {
    console.error('GetCategories Error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const categoryData = { ...req.body, organizationId: req.user.organizationId };
    const category = new Category(categoryData);
    const newCategory = await category.save();
    res.status(201).json(newCategory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const updatedCategory = await Category.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      req.body,
      { new: true }
    );
    if (!updatedCategory) {
      return res.status(404).json({ message: 'Kategorija nije pronađena ili nemate pristup.' });
    }
    res.json(updatedCategory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const deleted = await Category.findOneAndDelete({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!deleted) {
      return res.status(404).json({ message: 'Kategorija nije pronađena ili nemate pristup.' });
    }
    res.json({ message: 'Kategorija obrisana' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
