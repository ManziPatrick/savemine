const Project = require('../models/Project');
const Expense = require('../models/Expense');
const Business = require('../models/Business');
const { asyncHandler } = require('../middleware/errorHandler');
const { getPaginationParams, getSortParams, createPaginatedResponse } = require('../utils/pagination');

/**
 * @desc    Get all projects for user
 * @route   GET /projects
 * @access  Private
 */
const getProjects = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const sort = getSortParams(req.query, ['startDate', 'name', 'createdAt']);

  const filter = { userId: req.user._id, isActive: true };

  if (req.query.status) filter.status = req.query.status;
  if (req.query.projectType) filter.projectType = req.query.projectType;
  if (req.query.businessId) {
    if (!/^[a-f\d]{24}$/i.test(String(req.query.businessId))) {
      return res.status(400).json({ success: false, message: 'Choose a business' });
    }
    filter.businessId = req.query.businessId;
  }

  const projects = await Project.find(filter)
    .populate('businessId', 'name')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Project.countDocuments(filter);
  const ids = projects.map((project) => project._id);
  const linked = ids.length
    ? await Expense.find({
      userId: req.user._id,
      isActive: true,
      projectId: { $in: ids }
    }).select('projectId title amount expenseDate category subcategory vendor').lean()
    : [];
  const byProject = {};
  linked.forEach((row) => {
    const key = String(row.projectId);
    if (!byProject[key]) byProject[key] = [];
    byProject[key].push(row);
  });
  const rows = projects.map((project) => {
    const json = project.toJSON();
    json.linkedExpenses = byProject[String(project._id)] || [];
    json.officeSpent = json.totalExpenses + json.linkedExpenses.reduce((sum, row) => sum + (row.amount || 0), 0);
    return json;
  });

  res.json(createPaginatedResponse(rows, page, limit, total));
});

/**
 * @desc    Get single project
 * @route   GET /projects/:id
 * @access  Private
 */
const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  res.json({
    success: true,
    data: project
  });
});

/**
 * @desc    Create new project
 * @route   POST /projects
 * @access  Private
 */
const createProject = asyncHandler(async (req, res) => {
  const {
    name, projectType, description, location, locationMode, businessId, partners,
    startDate, expectedEndDate, status, plannedBudget, currency,
    expenses, incomes, tags, notes
  } = req.body;

  const where = locationMode === 'online' ? 'online' : 'place';
  let linkedBusiness = null;
  if (businessId) {
    linkedBusiness = await Business.findOne({ _id: businessId, userId: req.user._id, isActive: true });
    if (!linkedBusiness) {
      return res.status(400).json({ success: false, message: 'Choose one of your businesses' });
    }
  }

  const projectData = {
    userId: req.user._id,
    name,
    projectType: projectType || 'general',
    description: description || '',
    locationMode: where,
    location: where === 'online' ? 'Online' : (location || ''),
    businessId: linkedBusiness ? linkedBusiness._id : null,
    partners: Array.isArray(partners) ? partners.map((name) => String(name).trim()).filter(Boolean).slice(0, 20) : [],
    startDate: new Date(startDate || new Date()),
    expectedEndDate: expectedEndDate ? new Date(expectedEndDate) : null,
    status: status || 'planning',
    plannedBudget: plannedBudget || 0,
    currency: currency || 'FRW',
    expenses: Array.isArray(expenses) ? expenses : [],
    incomes: Array.isArray(incomes) ? incomes : [],
    tags: tags || [],
    notes: notes || ''
  };

  const project = await Project.create(projectData);

  res.status(201).json({
    success: true,
    data: project
  });
});

/**
 * @desc    Update project
 * @route   PUT /projects/:id
 * @access  Private
 */
const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  const updateData = { ...req.body };
  if (updateData.locationMode === 'online') {
    updateData.locationMode = 'online';
    updateData.location = 'Online';
  } else if (updateData.locationMode) {
    updateData.locationMode = 'place';
  }
  if (Array.isArray(updateData.partners)) {
    updateData.partners = updateData.partners.map((name) => String(name).trim()).filter(Boolean).slice(0, 20);
  }
  if (updateData.businessId) {
    const linkedBusiness = await Business.findOne({ _id: updateData.businessId, userId: req.user._id, isActive: true });
    if (!linkedBusiness) {
      return res.status(400).json({ success: false, message: 'Choose one of your businesses' });
    }
    updateData.businessId = linkedBusiness._id;
  } else if (updateData.businessId === '' || updateData.businessId === null) {
    updateData.businessId = null;
  }
  if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
  if (updateData.expectedEndDate) updateData.expectedEndDate = new Date(updateData.expectedEndDate);
  delete updateData.userId;

  const updatedProject = await Project.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    data: updatedProject
  });
});

/**
 * @desc    Delete project (soft delete)
 * @route   DELETE /projects/:id
 * @access  Private
 */
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  project.isActive = false;
  await project.save();

  res.json({
    success: true,
    message: 'Project deleted successfully'
  });
});

/**
 * @desc    Add an expense (money spent with a reason)
 * @route   POST /projects/:id/expenses
 * @access  Private
 */
const addExpense = asyncHandler(async (req, res) => {
  const project = await Project.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  const { category, reason, amount, date, vendor, notes } = req.body;
  if (!category || !reason || amount == null) {
    return res.status(400).json({
      success: false,
      message: 'category, reason and amount are required'
    });
  }

  const numericAmount = parseFloat(amount);
  if (!Number.isFinite(numericAmount) || numericAmount < 0) {
    return res.status(400).json({
      success: false,
      message: 'amount must be a valid non-negative number'
    });
  }

  const updatedProject = await project.addExpense({
    category,
    reason,
    amount: numericAmount,
    date: date ? new Date(date) : new Date(),
    vendor: vendor || '',
    notes: notes || ''
  });

  res.status(201).json({
    success: true,
    data: updatedProject
  });
});

/**
 * @desc    Remove an expense
 * @route   DELETE /projects/:id/expenses/:expenseId
 * @access  Private
 */
const removeExpense = asyncHandler(async (req, res) => {
  const project = await Project.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

  const expense = project.expenses.id(req.params.expenseId);
  if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });

  expense.deleteOne();
  await project.save();

  res.json({ success: true, data: project });
});

/**
 * @desc    Add income (outcome/revenue from the project)
 * @route   POST /projects/:id/incomes
 * @access  Private
 */
const addIncome = asyncHandler(async (req, res) => {
  const project = await Project.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  const { date, title, amount, quantity, unit, customer, notes, category } = req.body;
  if (!title || amount == null) {
    return res.status(400).json({
      success: false,
      message: 'title and amount are required'
    });
  }

  const numericAmount = parseFloat(amount);
  if (!Number.isFinite(numericAmount) || numericAmount < 0) {
    return res.status(400).json({
      success: false,
      message: 'amount must be a valid non-negative number'
    });
  }

  // Add income and mark project as active once it has activity (single save)
  project.incomes.push({
    date: date ? new Date(date) : new Date(),
    title,
    category: category || 'income',
    amount: numericAmount,
    quantity: parseFloat(quantity) || 0,
    unit: unit || '',
    customer: customer || '',
    notes: notes || ''
  });

  if (project.status === 'planning') {
    project.status = 'active';
  }

  const updatedProject = await project.save();

  res.status(201).json({
    success: true,
    data: updatedProject
  });
});

/**
 * @desc    Remove income
 * @route   DELETE /projects/:id/incomes/:incomeId
 * @access  Private
 */
const removeIncome = asyncHandler(async (req, res) => {
  const project = await Project.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

  const income = project.incomes.id(req.params.incomeId);
  if (!income) return res.status(404).json({ success: false, message: 'Income not found' });

  income.deleteOne();
  await project.save();

  res.json({ success: true, data: project });
});

/**
 * @desc    Get project statistics (with profit calculation)
 * @route   GET /projects/stats
 * @access  Private
 */
const getProjectStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const projects = await Project.find({ userId, isActive: true });
  const linked = await Expense.aggregate([
    { $match: { userId, isActive: true, projectId: { $ne: null } } },
    { $group: { _id: '$projectId', total: { $sum: '$amount' } } }
  ]);
  const extraByProject = new Map(linked.map((row) => [String(row._id), row.total]));
  const spentOf = (project) => project.totalExpenses + (extraByProject.get(String(project._id)) || 0);

  const overview = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => ['planning', 'active'].includes(p.status)).length,
    completedProjects: projects.filter(p => ['completed'].includes(p.status)).length,
    totalExpenses: projects.reduce((sum, p) => sum + spentOf(p), 0),
    totalIncome: projects.reduce((sum, p) => sum + p.totalIncome, 0),
    totalProfit: projects.reduce((sum, p) => sum + (p.totalIncome - spentOf(p)), 0),
    totalPlannedBudget: projects.reduce((sum, p) => sum + (p.plannedBudget || 0), 0)
  };

  const byStatus = {};
  projects.forEach(p => {
    byStatus[p.status] = byStatus[p.status] || { count: 0, expenses: 0, income: 0, profit: 0 };
    byStatus[p.status].count += 1;
    byStatus[p.status].expenses += spentOf(p);
    byStatus[p.status].income += p.totalIncome;
    byStatus[p.status].profit += p.totalIncome - spentOf(p);
  });

  const byType = {};
  projects.forEach(p => {
    byType[p.projectType] = byType[p.projectType] || { count: 0, expenses: 0, income: 0, profit: 0 };
    byType[p.projectType].count += 1;
    byType[p.projectType].expenses += spentOf(p);
    byType[p.projectType].income += p.totalIncome;
    byType[p.projectType].profit += p.totalIncome - spentOf(p);
  });

  res.json({
    success: true,
    data: {
      overview,
      byStatus: Object.keys(byStatus).map(k => ({ status: k, ...byStatus[k] })),
      byType: Object.keys(byType).map(k => ({ projectType: k, ...byType[k] }))
    }
  });
});

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addExpense,
  removeExpense,
  addIncome,
  removeIncome,
  getProjectStats
};
