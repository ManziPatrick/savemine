import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, ArrowDownTrayIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { contactsAPI } from '../services/api';
import ExportButtons from '../components/ExportButtons';
import { buildContactSections } from '../utils/exportSections';
import ContactForm from '../components/forms/ContactForm';
import ImportContactsForm from '../components/forms/ImportContactsForm';
import BulkSMSForm from '../components/forms/BulkSMSForm';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

function Contacts() {
  const [showForm, setShowForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [showBulkSMS, setShowBulkSMS] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const queryClient = useQueryClient();

  const { data: contacts, isLoading, error } = useQuery(
    ['contacts', filter, searchTerm, currentPage, pageSize],
    () => contactsAPI.getContacts({ 
      type: filter === 'all' ? undefined : filter,
      search: searchTerm || undefined,
      page: currentPage,
      limit: pageSize
    })
  );

  const deleteMutation = useMutation(contactsAPI.deleteContact, {
    onSuccess: () => {
      queryClient.invalidateQueries('contacts');
      toast.success('Contact deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete contact');
    }
  });

  const handleEdit = (contact) => {
    setSelectedContact(contact);
    setShowForm(true);
  };

  const handleDelete = async (contact) => {
    if (window.confirm(`Are you sure you want to delete ${contact.name}?`)) {
      deleteMutation.mutate(contact._id);
    }
  };

  const handleFormSuccess = () => {
    queryClient.invalidateQueries('contacts');
    setCurrentPage(1); // Reset to first page
  };

  // Reset pagination when filters change
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handleSearchChange = (newSearchTerm) => {
    setSearchTerm(newSearchTerm);
    setCurrentPage(1);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedContact(null);
  };

  const handleCloseImportForm = () => {
    setShowImportForm(false);
  };

  const handleCloseBulkSMS = () => {
    setShowBulkSMS(false);
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
        <p className="text-red-600">Error loading contacts: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Contacts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your business contacts and debtors
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportButtons
            filename="contacts"
            title="Contacts Report"
            sections={buildContactSections(contacts?.data?.data || contacts?.data || [])}
          />
          <button 
            onClick={() => setShowImportForm(true)}
            className="btn btn-secondary"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Import
          </button>
          <button 
            onClick={() => setShowBulkSMS(true)}
            className="btn btn-secondary"
            disabled={!Array.isArray(contacts?.data?.data || contacts?.data) || !(contacts?.data?.data || contacts?.data || []).length}
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
            Bulk SMS
          </button>
          <button 
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Contact
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex flex-wrap gap-2">
          {['all', 'debtor', 'creditor', 'partner'].map((type) => (
            <button
              key={type}
              onClick={() => handleFilterChange(type)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize ${
                filter === type
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="input"
          />
        </div>
      </div>

      {/* Contacts Statistics */}
      {contacts?.data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-primary-600">
                {contacts?.data?.pagination?.totalItems || (contacts?.data?.data || contacts?.data || []).length || 0}
              </div>
              <div className="text-sm text-gray-500">Total Contacts</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-green-600">
                {Array.isArray(contacts?.data?.data || contacts?.data) ? (contacts?.data?.data || contacts?.data || []).filter(c => c.type === 'debtor').length : 0}
              </div>
              <div className="text-sm text-gray-500">Debtors</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Array.isArray(contacts?.data?.data || contacts?.data) ? (contacts?.data?.data || contacts?.data || []).filter(c => c.type === 'creditor').length : 0}
              </div>
              <div className="text-sm text-gray-500">Creditors</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Array.isArray(contacts?.data?.data || contacts?.data) ? (contacts?.data?.data || contacts?.data || []).filter(c => c.type === 'partner').length : 0}
              </div>
              <div className="text-sm text-gray-500">Partners</div>
            </div>
          </div>
        </div>
      )}

      {/* Contacts List */}
      <div className="card">
        <div className="card-body">
          {Array.isArray(contacts?.data?.data || contacts?.data) && (contacts?.data?.data || contacts?.data || []).length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Name</th>
                      <th className="table-header-cell">Phone</th>
                      <th className="table-header-cell">Type</th>
                      <th className="table-header-cell">Email</th>
                      <th className="table-header-cell">Organization</th>
                      <th className="table-header-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {(contacts?.data?.data || contacts?.data || []).map((contact) => (
                      <tr key={contact._id} className="table-row">
                        <td className="table-cell">
                          <div className="font-medium text-gray-900">
                            {contact.name}
                          </div>
                          {contact.address && (
                            <div className="text-sm text-gray-500">
                              {contact.address}
                            </div>
                          )}
                        </td>
                        <td className="table-cell">
                          <div className="font-mono text-sm">
                            {contact.phone}
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className={`badge ${
                            contact.type === 'debtor' ? 'badge-danger' :
                            contact.type === 'creditor' ? 'badge-success' :
                            'badge-info'
                          }`}>
                            {contact.type}
                          </span>
                        </td>
                        <td className="table-cell">{contact.email || '-'}</td>
                        <td className="table-cell">{contact.organization || '-'}</td>
                        <td className="table-cell">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(contact)}
                              className="text-primary-600 hover:text-primary-900"
                              title="Edit contact"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(contact)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete contact"
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

              {/* Pagination */}
              {contacts?.data?.pagination?.totalPages > 1 && (
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 mt-6">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, contacts?.data?.pagination?.totalItems || 0)} of {contacts?.data?.pagination?.totalItems || 0} contacts
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="input text-sm"
                    >
                      <option value={25}>25 per page</option>
                      <option value={50}>50 per page</option>
                      <option value={100}>100 per page</option>
                      <option value={200}>200 per page</option>
                    </select>
                  </div>

                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      First
                    </button>
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: Math.min(5, contacts?.data?.pagination?.totalPages || 1) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min((contacts?.data?.pagination?.totalPages || 1) - 4, currentPage - 2)) + i;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 text-sm border rounded-md ${
                            currentPage === pageNum
                              ? 'bg-primary-600 text-white'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === (contacts?.data?.pagination?.totalPages || 1)}
                      className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                    <button
                      onClick={() => setCurrentPage(contacts?.data?.pagination?.totalPages || 1)}
                      disabled={currentPage === (contacts?.data?.pagination?.totalPages || 1)}
                      className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Last
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No contacts found</p>
              <button
                onClick={() => setShowForm(true)}
                className="btn btn-primary mt-4"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Your First Contact
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contact Form Modal */}
      {showForm && (
        <ContactForm
          contact={selectedContact}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Import Contacts Modal */}
      {showImportForm && (
        <ImportContactsForm
          onClose={handleCloseImportForm}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Bulk SMS Modal */}
      {showBulkSMS && (
        <BulkSMSForm
          onClose={handleCloseBulkSMS}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}

export default Contacts;
