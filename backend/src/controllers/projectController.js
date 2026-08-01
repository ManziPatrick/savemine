const Project = require('../models/Project');
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

  const projects = await Project.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Project.countDocuments(filter);

  res.json(createPaginatedResponse(projects, page, limit, total));
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
    name, projectType, description, location,
    startDate, expectedEndDate, status, plannedBudget, currency,
    expenses, incomes, tags, notes
  } = req.body;

  const projectData = {
    userId: req.user._id,
    name,
    projectType: projectType || 'general',
    description: description || '',
    location: location || '',
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

  const { date, title, amount, quantity, unit, customer, notes } = req.body;
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

  const overview = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => ['planning', 'active'].includes(p.status)).length,
    completedProjects: projects.filter(p => ['completed'].includes(p.status)).length,
    totalExpenses: projects.reduce((sum, p) => sum + p.totalExpenses, 0),
    totalIncome: projects.reduce((sum, p) => sum + p.totalIncome, 0),
    totalProfit: projects.reduce((sum, p) => sum + p.profit, 0),
    totalPlannedBudget: projects.reduce((sum, p) => sum + (p.plannedBudget || 0), 0)
  };

  const byStatus = {};
  projects.forEach(p => {
    byStatus[p.status] = byStatus[p.status] || { count: 0, expenses: 0, income: 0, profit: 0 };
    byStatus[p.status].count += 1;
    byStatus[p.status].expenses += p.totalExpenses;
    byStatus[p.status].income += p.totalIncome;
    byStatus[p.status].profit += p.profit;
  });

  const byType = {};
  projects.forEach(p => {
    byType[p.projectType] = byType[p.projectType] || { count: 0, expenses: 0, income: 0, profit: 0 };
    byType[p.projectType].count += 1;
    byType[p.projectType].expenses += p.totalExpenses;
    byType[p.projectType].income += p.totalIncome;
    byType[p.projectType].profit += p.profit;
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
