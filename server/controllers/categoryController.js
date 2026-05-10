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
    const updatedCategory = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedCategory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Kategorija obrisana' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
