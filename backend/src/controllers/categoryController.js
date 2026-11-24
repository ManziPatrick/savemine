const Category = require('../models/Category');
const { ALL_STAGES } = require('../data/projectStages');
const { asyncHandler } = require('../middleware/errorHandler');

const DEFAULTS = [
  'School fees',
  'Home',
  'Tax',
  'Salary',
  'Insurance',
  'Investment',
  'Loan',
  'Food',
  'Transport',
  'Utilities',
  'Healthcare',
  'Income',
  'Other',
];

function categoryKey(name) {
  return String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

async function ensureDefaults(userId) {
  const count = await Category.countDocuments({ userId });
  if (count > 0) return;
  await Category.insertMany(DEFAULTS.map((name) => ({
    userId,
    name,
    key: categoryKey(name),
  })));
}

async function ensureFarmStages(userId) {
  const wanted = ALL_STAGES.map((name) => ({ name, key: categoryKey(name) }));
  const existing = await Category.find({ userId, key: { $in: wanted.map((item) => item.key) } }).select('key').lean();
  const have = new Set(existing.map((item) => item.key));
  const missing = wanted.filter((item) => !have.has(item.key));
  if (missing.length) {
    await Category.insertMany(missing.map((item) => ({ userId, name: item.name, key: item.key })));
  }
}

const listCategories = asyncHandler(async (req, res) => {
  await ensureDefaults(req.user._id);
  await ensureFarmStages(req.user._id);
  const query = categoryKey(req.query.q);
  const filter = { userId: req.user._id };
  if (query) filter.key = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const categories = await Category.find(filter).sort({ name: 1 }).limit(200).select('name').lean();
  res.json({ success: true, data: categories.map((item) => item.name) });
});

const createCategory = asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim().replace(/\s+/g, ' ');
  const key = categoryKey(name);
  if (key.length < 2 || key.length > 40) {
    return res.status(400).json({ success: false, message: 'Name the category in 2 to 40 characters' });
  }
  const existing = await Category.findOne({ userId: req.user._id, key });
  if (existing) {
    return res.json({ success: true, data: existing.name });
  }
  const created = await Category.create({ userId: req.user._id, name, key });
  res.status(201).json({ success: true, data: created.name });
});

module.exports = { listCategories, createCategory, categoryKey };
