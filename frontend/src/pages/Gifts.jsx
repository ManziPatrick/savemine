import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { PlusIcon, PencilIcon, TrashIcon, GiftIcon, HeartIcon, HandThumbUpIcon } from '@heroicons/react/24/outline';
import { giftsAPI, contactsAPI } from '../services/api';
import GiftForm from '../components/forms/GiftForm';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

function Gifts() {
  const [showForm, setShowForm] = useState(false);
  const [selectedGift, setSelectedGift] = useState(null);
  const [filter, setFilter] = useState('all');
  const [giftTypeFilter, setGiftTypeFilter] = useState('');
  const [occasionFilter, setOccasionFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const queryClient = useQueryClient();

  const { data: gifts, isLoading, error } = useQuery(
    ['gifts', filter, giftTypeFilter, occasionFilter, currentPage, pageSize],
    () => giftsAPI.getGifts({ 
      giftType: giftTypeFilter || undefined,
      occasion: occasionFilter || undefined,
      page: currentPage,
      limit: pageSize
    })
  );

  const { data: giftStats } = useQuery(
    'giftStats',
    giftsAPI.getGiftStats
  );

  const deleteMutation = useMutation(giftsAPI.deleteGift, {
    onSuccess: () => {
      queryClient.invalidateQueries('gifts');
      queryClient.invalidateQueries('giftStats');
      toast.success('Gift deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete gift');
    }
  });

  const handleEdit = (gift) => {
    setSelectedGift(gift);
    setShowForm(true);
  };

  const handleDelete = async (gift) => {
    if (window.confirm(`Are you sure you want to delete "${gift.title}"?`)) {
      deleteMutation.mutate(gift._id);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedGift(null);
    setCurrentPage(1);
    queryClient.invalidateQueries('gifts');
    queryClient.invalidateQueries('giftStats');
  };

  const getGiftTypeIcon = (type) => {
    switch (type) {
      case 'given': return <HeartIcon className="h-5 w-5 text-red-500" />;
      case 'received': return <GiftIcon className="h-5 w-5 text-green-500" />;
      case 'charity': return <HandThumbUpIcon className="h-5 w-5 text-blue-500" />;
      default: return <GiftIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getGiftTypeBadge = (type) => {
    const types = {
      given: 'Given',
      received: 'Received',
      charity: 'Charity',
      donation: 'Donation',
      reward: 'Reward',
      incentive: 'Incentive'
    };
    return types[type] || type;
  };

  const getOccasionBadge = (occasion) => {
    const occasions = {
      birthday: 'Birthday',
      wedding: 'Wedding',
      graduation: 'Graduation',
      holiday: 'Holiday',
      anniversary: 'Anniversary',
      funeral: 'Funeral',
      celebration: 'Celebration',
      thank_you: 'Thank You',
      other: 'Other',
      none: 'General'
    };
    return occasions[occasion] || occasion;
  };

  const formatCurrency = (amount, currency = 'FRW') => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-center text-red-600">Error loading gifts: {error.message}</div>;

  const giftsList = gifts?.data?.data || gifts?.data || [];
  const stats = giftStats?.data?.data || {};
  console.log("stats",stats)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gifts & Donations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track gifts given, received, and charitable donations
          </p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Gift
        </button>
      </div>

      {/* Gift Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-primary-600">
                {stats.overview?.totalGifts || 0}
              </div>
              <div className="text-sm text-gray-500">Total Gifts</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-red-600">
                {stats.overview?.totalAmountGiven || 0}
              </div>
              <div className="text-sm text-gray-500">Amount Given (FRW)</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.overview?.totalAmountReceived || 0}
              </div>
              <div className="text-sm text-gray-500">Amount Received (FRW)</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency((stats.overview?.totalAmountGiven || 0) + (stats.overview?.overview?.totalAmountReceived || 0))}
              </div>
              <div className="text-sm text-gray-500">Total Value</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex space-x-2">
          {['', 'given', 'received', 'charity', 'donation'].map((type) => (
            <button
              key={type}
              onClick={() => setGiftTypeFilter(type)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize ${
                giftTypeFilter === type
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {type || 'All Types'}
            </button>
          ))}
        </div>
        
        <div className="flex space-x-2">
          {['', 'birthday', 'wedding', 'holiday', 'thank_you'].map((occasion) => (
            <button
              key={occasion}
              onClick={() => setOccasionFilter(occasion)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize ${
                occasionFilter === occasion
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {occasion || 'All Occasions'}
            </button>
          ))}
        </div>
      </div>

      {/* Gifts List */}
      <div className="card">
        <div className="card-body">
          {giftsList.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Type</th>
                      <th className="table-header-cell">Title</th>
                      <th className="table-header-cell">Recipient/Donor</th>
                      <th className="table-header-cell">Amount</th>
                      <th className="table-header-cell">Occasion</th>
                      <th className="table-header-cell">Date</th>
                      <th className="table-header-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {giftsList.map((gift) => (
                      <tr key={gift._id} className="table-row">
                        <td className="table-cell">
                          <div className="flex items-center">
                            {getGiftTypeIcon(gift.giftType)}
                            <span className="ml-2 badge badge-info">
                              {getGiftTypeBadge(gift.giftType)}
                            </span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div>
                            <div className="font-medium text-gray-900">
                              {gift.title}
                            </div>
                            {gift.description && (
                              <div className="text-sm text-gray-500">
                                {gift.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="table-cell">
                          {gift.contactId ? (
                            <div>
                              <div className="font-medium text-gray-900">
                                {gift.contactId.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {gift.contactId.phone}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="table-cell">
                          <div className="font-medium text-gray-900">
                            {formatCurrency(gift.amount, gift.currency)}
                          </div>
                          {gift.quantity > 1 && (
                            <div className="text-sm text-gray-500">
                              Qty: {gift.quantity}
                            </div>
                          )}
                        </td>
                        <td className="table-cell">
                          <span className="badge badge-secondary">
                            {getOccasionBadge(gift.occasion)}
                          </span>
                        </td>
                        <td className="table-cell">
                          {formatDate(gift.giftDate)}
                        </td>
                        <td className="table-cell">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(gift)}
                              className="text-primary-600 hover:text-primary-900"
                              title="Edit gift"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(gift)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete gift"
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

              {/* Pagination */}
              {gifts?.data?.pagination?.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, gifts?.data?.pagination?.totalItems || 0)} of {gifts?.data?.pagination?.totalItems || 0} gifts
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-500">
                      Page {currentPage} of {gifts?.data?.pagination?.totalPages || 1}
                    </span>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === (gifts?.data?.pagination?.totalPages || 1)}
                      className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <GiftIcon className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No gifts found</h3>
              <p className="text-gray-500 mb-4">
                Start by adding your first gift or donation.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="btn btn-primary"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add First Gift
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Gift Form */}
      {showForm && (
        <GiftForm
          gift={selectedGift}
          onClose={() => {
            setShowForm(false);
            setSelectedGift(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}

export default Gifts;
