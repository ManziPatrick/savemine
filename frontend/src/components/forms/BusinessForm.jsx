import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { businessesAPI, projectsAPI } from '../../services/api';
import SlideOver from '../SlideOver';
import LoadingSpinner from '../LoadingSpinner';
import toast from 'react-hot-toast';

function BusinessForm({ business, knownProjects = [], onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState(knownProjects);
  const [projectIds, setProjectIds] = useState([]);
  const [formData, setFormData] = useState({
    businessType: 'animal_farming',
    name: '',
    description: '',
    locationMode: 'place',
    location: '',
    startDate: new Date().toISOString().split('T')[0],
    status: 'active',
    initialInvestment: '',
    monthlyRevenue: '',
    monthlyExpenses: '',
    animals: [],
    milestones: [],
    goals: [],
    tags: [],
    notes: ''
  });

  const [newAnimal, setNewAnimal] = useState({
    type: 'cow',
    breed: '',
    age: '',
    gender: 'unknown',
    purchaseDate: '',
    purchasePrice: '',
    currentValue: '',
    healthStatus: 'healthy',
    notes: ''
  });

  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    targetDate: '',
    priority: 'medium'
  });

  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetValue: '',
    targetDate: '',
    unit: '',
    status: 'active'
  });

  useEffect(() => {
    if (business) {
      setFormData({
        businessType: business.businessType || 'animal_farming',
        name: business.name || '',
        description: business.description || '',
        locationMode: business.locationMode || (business.location === 'Online' ? 'online' : 'place'),
        location: business.location === 'Online' ? '' : (business.location || ''),
        startDate: business.startDate ? new Date(business.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        status: business.status || 'active',
        initialInvestment: business.initialInvestment || '',
        monthlyRevenue: business.monthlyRevenue || '',
        monthlyExpenses: business.monthlyExpenses || '',
        animals: business.animals || [],
        milestones: business.milestones || [],
        goals: business.goals || [],
        tags: business.tags || [],
        notes: business.notes || ''
      });
    }
  }, [business]);

  useEffect(() => {
    const list = knownProjects.length ? knownProjects : null;
    if (!list) return;
    setProjects(list);
    if (business?._id) {
      setProjectIds(list
        .filter((project) => String(project.businessId?._id || project.businessId) === String(business._id))
        .map((project) => project._id));
    }
  }, [knownProjects, business]);

  useEffect(() => {
    if (knownProjects.length) return undefined;
    let gone = false;
    projectsAPI.getProjects({ limit: 100 }).then((response) => {
      if (gone) return;
      const list = response.data?.data || [];
      setProjects(list);
      if (business?._id) {
        setProjectIds(list
          .filter((project) => String(project.businessId?._id || project.businessId) === String(business._id))
          .map((project) => project._id));
      }
    }).catch(() => {});
    return () => { gone = true; };
  }, [business, knownProjects.length]);

  const toggleProject = (id) => {
    setProjectIds((current) => (
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Please fill in the business name');
      return;
    }

    setLoading(true);
    try {
      const businessFields = { ...formData };
      delete businessFields.initialInvestment;
      const businessData = {
        ...businessFields,
        monthlyRevenue: parseFloat(formData.monthlyRevenue) || 0,
        monthlyExpenses: parseFloat(formData.monthlyExpenses) || 0,
        animals: formData.animals.map(animal => ({
          ...animal,
          age: parseInt(animal.age) || 0,
          purchasePrice: parseFloat(animal.purchasePrice) || 0,
          currentValue: parseFloat(animal.currentValue) || 0
        })),
        tags: formData.tags.filter(tag => tag.trim())
      };

      let savedId = business?._id;
      if (business) {
        await businessesAPI.updateBusiness(business._id, businessData);
      } else {
        const created = await businessesAPI.createBusiness(businessData);
        savedId = created.data?.data?._id || created.data?._id;
      }
      if (savedId) {
        await businessesAPI.setProjects(savedId, projectIds);
      }
      toast.success(business ? 'Business updated successfully' : 'Business added successfully');

      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save business');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addAnimal = () => {
    if (!newAnimal.type || !newAnimal.breed) {
      toast.error('Please fill in animal type and breed');
      return;
    }

    setFormData(prev => ({
      ...prev,
      animals: [...prev.animals, { ...newAnimal }]
    }));

    setNewAnimal({
      type: 'cow',
      breed: '',
      age: '',
      gender: 'unknown',
      purchaseDate: '',
      purchasePrice: '',
      currentValue: '',
      healthStatus: 'healthy',
      notes: ''
    });
  };

  const removeAnimal = (index) => {
    setFormData(prev => ({
      ...prev,
      animals: prev.animals.filter((_, i) => i !== index)
    }));
  };

  const addMilestone = () => {
    if (!newMilestone.title) {
      toast.error('Please fill in milestone title');
      return;
    }

    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, { ...newMilestone, status: 'pending' }]
    }));

    setNewMilestone({
      title: '',
      description: '',
      targetDate: '',
      priority: 'medium'
    });
  };

  const removeMilestone = (index) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }));
  };

  const addGoal = () => {
    if (!newGoal.title) {
      toast.error('Please fill in goal title');
      return;
    }

    setFormData(prev => ({
      ...prev,
      goals: [...prev.goals, { ...newGoal, currentValue: 0 }]
    }));

    setNewGoal({
      title: '',
      description: '',
      targetValue: '',
      targetDate: '',
      unit: '',
      status: 'active'
    });
  };

  const removeGoal = (index) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index)
    }));
  };

  const addTag = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const newTag = e.target.value.trim();
      if (!formData.tags.includes(newTag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
      }
      e.target.value = '';
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const getBusinessTypeIcon = (type) => {
    switch (type) {
      case 'animal_farming': return '🐄';
      case 'agriculture': return '🌾';
      case 'trading': return '🏪';
      case 'services': return '🔧';
      case 'manufacturing': return '🏭';
      case 'retail': return '🛒';
      default: return '💼';
    }
  };

  const getBusinessTypeName = (type) => {
    const types = {
      animal_farming: 'Animal Farming',
      agriculture: 'Agriculture',
      trading: 'Trading',
      services: 'Services',
      manufacturing: 'Manufacturing',
      retail: 'Retail',
      other: 'Other'
    };
    return types[type] || type;
  };

  return (
    <SlideOver title={business ? 'Edit business' : 'Add a business'} subtitle="Business" onClose={onClose}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-2">
                  Business Type *
                </label>
                <select
                  id="businessType"
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="animal_farming">🐄 Animal Farming</option>
                  <option value="agriculture">🌾 Agriculture</option>
                  <option value="trading">🏪 Trading</option>
                  <option value="services">🔧 Services</option>
                  <option value="manufacturing">🏭 Manufacturing</option>
                  <option value="retail">🛒 Retail</option>
                  <option value="other">💼 Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Kigali Dairy Farm"
                  required
                />
              </div>
            </div>

            <div>
              <p className="mb-1 text-sm font-medium text-gray-700">Choose projects</p>
              <p className="mb-2 text-sm text-gray-500">Tick every project that belongs to this business. Their income and spending are added together.</p>
              {projects.length === 0 ? (
                <p className="text-sm text-gray-500">None loaded yet. Open Projects in the menu, create one, then come back and tick it here.</p>
              ) : (
                <div className="max-h-56 space-y-2 overflow-y-auto">
                  {projects.map((project) => {
                    const ownerId = String(project.businessId?._id || project.businessId || '');
                    const elsewhere = ownerId && ownerId !== String(business?._id || '');
                    return (
                      <label key={project._id} className="flex items-start gap-3 rounded-xl border border-line bg-paper px-3 py-2">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={projectIds.includes(project._id)}
                          onChange={() => toggleProject(project._id)}
                        />
                        <span>
                          <span className="block font-medium text-ink">{project.name}</span>
                          {elsewhere && (
                            <span className="block text-xs text-ink/50">Moves from {project.businessId?.name || 'another business'}</span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Description and Location */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Describe your business..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <div className="flex gap-2">
                  <button type="button" className={`btn ${formData.locationMode === 'online' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFormData((prev) => ({ ...prev, locationMode: 'online', location: '' }))}>Online</button>
                  <button type="button" className={`btn ${formData.locationMode === 'place' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFormData((prev) => ({ ...prev, locationMode: 'place' }))}>A place</button>
                </div>
                {formData.locationMode === 'place' && (
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="mt-2 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Kigali, the market, the office"
                  />
                )}
              </div>

              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Financial Information */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Financial Information</h3>
              <p className="mb-3 text-sm text-ink/60">Money spent on this business is recorded as an expense and taken from the wallet or a savings jar.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="monthlyRevenue" className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Revenue (FRW)
                  </label>
                  <input
                    type="number"
                    id="monthlyRevenue"
                    name="monthlyRevenue"
                    value={formData.monthlyRevenue}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label htmlFor="monthlyExpenses" className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Expenses (FRW)
                  </label>
                  <input
                    type="number"
                    id="monthlyExpenses"
                    name="monthlyExpenses"
                    value={formData.monthlyExpenses}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* Animals (for animal farming) */}
            {formData.businessType === 'animal_farming' && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Animals</h3>
                
                {/* Add New Animal */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Animal</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={newAnimal.type}
                        onChange={(e) => setNewAnimal(prev => ({ ...prev, type: e.target.value }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="cow">🐄 Cow</option>
                        <option value="goat">🐐 Goat</option>
                        <option value="sheep">🐑 Sheep</option>
                        <option value="pig">🐷 Pig</option>
                        <option value="chicken">🐔 Chicken</option>
                        <option value="duck">🦆 Duck</option>
                        <option value="rabbit">🐰 Rabbit</option>
                        <option value="fish">🐟 Fish</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
                      <input
                        type="text"
                        value={newAnimal.breed}
                        onChange={(e) => setNewAnimal(prev => ({ ...prev, breed: e.target.value }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="e.g., Holstein, Friesian"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Age (months)</label>
                      <input
                        type="number"
                        value={newAnimal.age}
                        onChange={(e) => setNewAnimal(prev => ({ ...prev, age: e.target.value }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                      <select
                        value={newAnimal.gender}
                        onChange={(e) => setNewAnimal(prev => ({ ...prev, gender: e.target.value }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="unknown">Unknown</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price (FRW)</label>
                      <input
                        type="number"
                        value={newAnimal.purchasePrice}
                        onChange={(e) => setNewAnimal(prev => ({ ...prev, purchasePrice: e.target.value }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Value (FRW)</label>
                      <input
                        type="number"
                        value={newAnimal.currentValue}
                        onChange={(e) => setNewAnimal(prev => ({ ...prev, currentValue: e.target.value }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={addAnimal}
                      className="btn btn-primary btn-sm"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Animal
                    </button>
                  </div>
                </div>

                {/* Animals List */}
                {formData.animals.length > 0 && (
                  <div className="space-y-2">
                    {formData.animals.map((animal, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">
                            {animal.type === 'cow' ? '🐄' : 
                             animal.type === 'goat' ? '🐐' :
                             animal.type === 'sheep' ? '🐑' :
                             animal.type === 'pig' ? '🐷' :
                             animal.type === 'chicken' ? '🐔' :
                             animal.type === 'duck' ? '🦆' :
                             animal.type === 'rabbit' ? '🐰' :
                             animal.type === 'fish' ? '🐟' : '🐾'}
                          </span>
                          <div>
                            <div className="font-medium text-gray-900">
                              {animal.breed} ({animal.type})
                            </div>
                            <div className="text-sm text-gray-500">
                              Age: {animal.age} months • {animal.gender} • FRW {animal.currentValue?.toLocaleString() || '0'}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAnimal(index)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Milestones */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Milestones</h3>
              
              {/* Add New Milestone */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Milestone</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={newMilestone.title}
                      onChange={(e) => setNewMilestone(prev => ({ ...prev, title: e.target.value }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="e.g., First harvest, Reach 100 customers"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
                    <input
                      type="date"
                      value={newMilestone.targetDate}
                      onChange={(e) => setNewMilestone(prev => ({ ...prev, targetDate: e.target.value }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newMilestone.description}
                    onChange={(e) => setNewMilestone(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Describe this milestone..."
                  />
                </div>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={addMilestone}
                    className="btn btn-primary btn-sm"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Milestone
                  </button>
                </div>
              </div>

              {/* Milestones List */}
              {formData.milestones.length > 0 && (
                <div className="space-y-2">
                  {formData.milestones.map((milestone, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{milestone.title}</div>
                        <div className="text-sm text-gray-500">
                          {milestone.description} • Target: {milestone.targetDate}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMilestone(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-primary-400 hover:bg-primary-200 hover:text-primary-500 focus:outline-none focus:bg-primary-500 focus:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add a tag and press Enter"
                onKeyPress={addTag}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Additional notes about your business..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Saving...
                  </div>
                ) : (
                  business ? 'Update Business' : 'Add Business'
                )}
              </button>
            </div>
          </form>
    </SlideOver>
  );
}

export default BusinessForm;

