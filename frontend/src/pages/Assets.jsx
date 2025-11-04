import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { PlusIcon, PencilIcon, TrashIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { assetsAPI } from '../services/api';
import AssetForm from '../components/forms/AssetForm';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

function Assets() {
  const [showForm, setShowForm] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const queryClient = useQueryClient();

  const { data: assets, isLoading, error } = useQuery(
    ['assets', filter, categoryFilter],
    () => assetsAPI.getAssets({ 
      status: filter === 'all' ? undefined : filter,
      category: categoryFilter || undefined,
      limit: 50
    })
  );

  const deleteMutation = useMutation(assetsAPI.deleteAsset, {
    onSuccess: () => {
      queryClient.invalidateQueries('assets');
      toast.success('Asset deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete asset');
    }
  });

  const handleEdit = (asset) => {
    setSelectedAsset(asset);
    setShowForm(true);
  };

  const handleDelete = async (asset) => {
    if (window.confirm(`Are you sure you want to delete ${asset.name}?`)) {
      deleteMutation.mutate(asset._id);
    }
  };

  const handleFormSuccess = () => {
    queryClient.invalidateQueries('assets');
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedAsset(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading assets: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Assets</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your assets and their values
          </p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Asset
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex space-x-2">
          {['all', 'owned', 'loaned', 'shared'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize ${
                filter === status
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Filter by category..."
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input"
          />
        </div>
      </div>

      {/* Assets List */}
      <div className="card">
        <div className="card-body">
          {(assets?.data?.data || assets?.data || []).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Name</th>
                    <th className="table-header-cell">Category</th>
                    <th className="table-header-cell">Value</th>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell">Owner</th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {(assets?.data?.data || assets?.data || []).map((asset) => (
                    <tr key={asset._id} className="table-row">
                      <td className="table-cell">
                        <div>
                          <div className="font-medium text-gray-900">
                            {asset.name}
                          </div>
                          {asset.description && (
                            <div className="text-sm text-gray-500">
                              {asset.description}
                            </div>
                          )}
                          {asset.serialNumber && (
                            <div className="text-sm text-gray-500">
                              SN: {asset.serialNumber}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="badge badge-info">
                          {asset.category}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div>
                          <div className="font-medium text-gray-900">
                            {asset.currency} {asset.value?.toLocaleString() || '0'}
                          </div>
                          {asset.depreciationRate > 0 && asset.currentValue && (
                            <div className="text-sm text-gray-500">
                              Current: {asset.currency} {asset.currentValue.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${
                          asset.status === 'owned' ? 'badge-success' :
                          asset.status === 'loaned' ? 'badge-warning' :
                          'badge-info'
                        }`}>
                          {asset.status}
                        </span>
                      </td>
                      <td className="table-cell">
                        {asset.ownerContactId ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {asset.ownerContactId.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {asset.ownerContactId.phone}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="table-cell">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(asset)}
                            className="text-primary-600 hover:text-primary-900"
                            title="Edit asset"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(asset)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete asset"
                            disabled={deleteMutation.isLoading}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No assets found</p>
              <button
                onClick={() => setShowForm(true)}
                className="btn btn-primary mt-4"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Your First Asset
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Asset Form Modal */}
      {showForm && (
        <AssetForm
          asset={selectedAsset}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}

export default Assets;
