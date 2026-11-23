import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { assetsAPI, contactsAPI, projectsAPI } from '../../services/api';
import LinkPicker from '../LinkPicker';
import CategoryPicker from '../CategoryPicker';
import SlideOver from '../SlideOver';
import LoadingSpinner from '../LoadingSpinner';
import toast from 'react-hot-toast';

function AssetForm({ asset, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const isEditing = !!asset;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      value: '',
      currency: 'FRW',
      category: '',
      status: 'owned',
      projectId: '',
      ownerContactId: '',
      purchaseDate: '',
      depreciationRate: 0,
      location: '',
      serialNumber: '',
      notes: '',
      tags: []
    }
  });

  useEffect(() => {
    if (asset) {
      setValue('name', asset.name || '');
      setValue('description', asset.description || '');
      setValue('value', asset.value || '');
      setValue('currency', asset.currency || 'FRW');
      setValue('category', asset.category || '');
      setValue('status', asset.status || 'owned');
      setValue('projectId', asset.projectId?._id || asset.projectId || '');
      setValue('ownerContactId', asset.ownerContactId?._id || '');
      setValue('purchaseDate', asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : '');
      setValue('depreciationRate', asset.depreciationRate || 0);
      setValue('location', asset.location || '');
      setValue('serialNumber', asset.serialNumber || '');
      setValue('notes', asset.notes || '');
      setValue('tags', asset.tags || []);
    }
  }, [asset, setValue]);

  useEffect(() => {
    const fetchContacts = async () => {
      setLoadingContacts(true);
      try {
        const [contactResponse, projectResponse] = await Promise.all([
          contactsAPI.getContacts({ limit: 100 }),
          projectsAPI.getProjects({ limit: 100 }),
        ]);
        setContacts(contactResponse.data.data || []);
        setProjects(projectResponse.data.data || []);
      } catch (error) {
        toast.error('Failed to load contacts');
      } finally {
        setLoadingContacts(false);
      }
    };

    fetchContacts();
  }, []);

  const projectId = watch('projectId');

  const createProject = async (name) => {
    try {
      const response = await projectsAPI.createProject({
        name,
        projectType: 'general',
        status: 'active',
        currency: 'FRW',
      });
      const project = response.data.data;
      setProjects((prev) => [...prev, project]);
      return { id: project._id, name: project.name };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not create that project');
      throw error;
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = { ...data, projectId: data.projectId || null };
      if (isEditing) {
        await assetsAPI.updateAsset(asset._id, payload);
        toast.success('Asset updated successfully');
      } else {
        await assetsAPI.createAsset(payload);
        toast.success('Asset created successfully');
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save asset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SlideOver title={isEditing ? 'Edit asset' : 'Add an asset'} subtitle="Assign it, then keep adding expenses" onClose={onClose}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="form-group">
            <label className="label">Name *</label>
            <input
              {...register('name', {
                required: 'Name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' }
              })}
              type="text"
              className={`input ${errors.name ? 'input-error' : ''}`}
              placeholder="Enter asset name"
            />
            {errors.name && (
              <p className="error-message">{errors.name.message}</p>
            )}
          </div>

          <div className="form-group">
            <label className="label">Description</label>
            <input
              {...register('description')}
              type="text"
              className="input"
              placeholder="Brief description of the asset"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="label">Value *</label>
              <input
                {...register('value', {
                  required: 'Value is required',
                  min: { value: 0, message: 'Value must be positive' }
                })}
                type="number"
                step="0.01"
                className={`input ${errors.value ? 'input-error' : ''}`}
                placeholder="0.00"
              />
              {errors.value && (
                <p className="error-message">{errors.value.message}</p>
              )}
            </div>

            <div className="form-group">
              <label className="label">Currency</label>
              <select
                {...register('currency')}
                className="input"
              >
                <option value="FRW">FRW</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="label">Category *</label>
              <CategoryPicker
                id="asset-category"
                value={watch('category')}
                onChange={(name) => setValue('category', name, { shouldValidate: true })}
              />
              <input type="hidden" {...register('category', { required: 'Category is required' })} />
              {errors.category && (
                <p className="error-message">{errors.category.message}</p>
              )}
            </div>

            <div className="form-group">
              <label className="label">Status</label>
              <select
                {...register('status')}
                className="input"
              >
                <option value="owned">Owned</option>
                <option value="loaned">Loaned</option>
                <option value="shared">Shared</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="label">Project</label>
            <LinkPicker
              id="asset-project"
              items={projects.map((project) => ({ id: project._id, name: project.name }))}
              value={projectId || ''}
              onChange={(id) => setValue('projectId', id)}
              onCreate={createProject}
              emptyLabel="No project yet"
              placeholder="Search a project, or create one"
            />
            <p className="mt-1 text-sm text-ink/60">Move it to another project whenever you need, and add expenses afterward.</p>
          </div>

          <div className="form-group">
            <label className="label">Owner Contact</label>
            <select
              {...register('ownerContactId')}
              className="input"
              disabled={loadingContacts}
            >
              <option value="">Select contact (optional)</option>
              {contacts.map((contact) => (
                <option key={contact._id} value={contact._id}>
                  {contact.name} ({contact.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="label">Purchase Date</label>
              <input
                {...register('purchaseDate')}
                type="date"
                className="input"
              />
            </div>

            <div className="form-group">
              <label className="label">Depreciation Rate (%)</label>
              <input
                {...register('depreciationRate', {
                  min: { value: 0, message: 'Depreciation rate must be positive' },
                  max: { value: 100, message: 'Depreciation rate cannot exceed 100%' }
                })}
                type="number"
                step="0.01"
                min="0"
                max="100"
                className={`input ${errors.depreciationRate ? 'input-error' : ''}`}
                placeholder="0"
              />
              {errors.depreciationRate && (
                <p className="error-message">{errors.depreciationRate.message}</p>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="label">Location</label>
              <input
                {...register('location')}
                type="text"
                className="input"
                placeholder="Where is the asset located?"
              />
            </div>

            <div className="form-group">
              <label className="label">Serial Number</label>
              <input
                {...register('serialNumber')}
                type="text"
                className="input"
                placeholder="Serial number (if applicable)"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Notes</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="input"
              placeholder="Additional notes about this asset"
            />
          </div>

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
                  {isEditing ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                isEditing ? 'Update Asset' : 'Create Asset'
              )}
            </button>
          </div>
        </form>
    </SlideOver>
  );
}

export default AssetForm;


