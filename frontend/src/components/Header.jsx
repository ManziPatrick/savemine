import { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import {
  Bars3Icon,
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  ArrowDownTrayIcon,
  TableCellsIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth.jsx';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import buildAllExportSections from '../utils/exportAll';

function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleExportAll = async (format) => {
    if (exporting) return;
    setExporting(true);
    try {
      const sections = await buildAllExportSections();
      if (!sections.length) {
        toast.error('Nothing to export yet — add some data first');
        return;
      }
      if (format === 'pdf') {
        exportToPDF('fincontroller_full_report', 'Complete Financial Report', sections);
      } else {
        exportToCSV('fincontroller_all_data', sections);
      }
      toast.success('Export started — check your downloads');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Mobile menu button */}
          <button
            type="button"
            className="lg:hidden rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
            onClick={onMenuClick}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          {/* Logo - hidden on mobile */}
          <div className="hidden lg:flex lg:items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              FinController
            </h1>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Export All dropdown */}
            <Menu as="div" className="relative">
              <Menu.Button
                title="Export all your data"
                className="inline-flex items-center rounded-md px-2 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                <span className="ml-1.5 hidden md:inline">
                  {exporting ? 'Exporting…' : 'Export'}
                </span>
              </Menu.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-20 mt-2 w-64 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Download everything
                  </div>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => handleExportAll('csv')}
                        disabled={exporting}
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } flex w-full items-center px-4 py-2 text-sm text-gray-700 disabled:opacity-50`}
                      >
                        <TableCellsIcon className="mr-3 h-4 w-4 text-green-600" />
                        <span>
                          Spreadsheet (Excel/CSV)
                          <span className="block text-xs text-gray-400">All modules in one file</span>
                        </span>
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => handleExportAll('pdf')}
                        disabled={exporting}
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } flex w-full items-center px-4 py-2 text-sm text-gray-700 disabled:opacity-50`}
                      >
                        <DocumentTextIcon className="mr-3 h-4 w-4 text-red-500" />
                        <span>
                          PDF Report
                          <span className="block text-xs text-gray-400">Print-ready full report</span>
                        </span>
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>

            {/* Notifications */}
            <button
              type="button"
              className="rounded-full p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <BellIcon className="h-6 w-6" />
            </button>

            {/* Profile dropdown */}
            <Menu as="div" className="relative">
              <Menu.Button className="flex max-w-xs items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                <span className="sr-only">Open user menu</span>
                <UserCircleIcon className="h-8 w-8 text-gray-400" />
                <span className="ml-2 hidden text-sm font-medium text-gray-700 md:block">
                  {user?.name}
                </span>
              </Menu.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => navigate('/profile')}
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                      >
                        <Cog6ToothIcon className="mr-3 h-4 w-4" />
                        Profile Settings
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                      >
                        <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
                        Sign out
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
