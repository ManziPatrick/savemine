import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  BanknotesIcon,
  CircleStackIcon,
  BuildingOfficeIcon,
  BellIcon,
  GiftIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  WalletIcon,
  ChatBubbleLeftRightIcon,
  CameraIcon,
  DocumentTextIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';

const groups = [
  {
    label: 'Today',
    items: [
      { name: 'Home', href: '/dashboard', icon: HomeIcon },
      { name: 'Record', href: '/capture', icon: CameraIcon },
    ],
  },
  {
    label: 'Money',
    items: [
      { name: 'Wallet', href: '/petty-cash', icon: WalletIcon },
      { name: 'Savings', href: '/savings', icon: CircleStackIcon },
      { name: 'Transactions', href: '/transactions', icon: BanknotesIcon },
      { name: 'Expenses', href: '/expenses', icon: ChartBarIcon },
    ],
  },
  {
    label: 'Office',
    items: [
      { name: 'Contracts', href: '/contracts', icon: DocumentTextIcon },
      { name: 'Business', href: '/business', icon: BuildingOfficeIcon },
      { name: 'Projects', href: '/projects', icon: FolderIcon },
      { name: 'Loans', href: '/loans', icon: CurrencyDollarIcon },
      { name: 'Contacts', href: '/contacts', icon: UserGroupIcon },
    ],
  },
  {
    label: 'More',
    items: [
      { name: 'Investments', href: '/investments', icon: ArrowTrendingUpIcon },
      { name: 'Assets', href: '/assets', icon: BuildingOfficeIcon },
      { name: 'Gifts', href: '/gifts', icon: GiftIcon },
      { name: 'Reminders', href: '/reminders', icon: BellIcon },
      { name: 'Assistant', href: '/assistant', icon: ChatBubbleLeftRightIcon },
    ],
  },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function NavList({ onNavigate }) {
  return (
    <nav className="flex flex-1 flex-col">
      <ul className="space-y-6">
        {groups.map((group) => (
          <li key={group.label}>
            <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-paper/40">
              {group.label}
            </p>
            <ul className="mt-2 space-y-1">
              {group.items.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      classNames(
                        isActive
                          ? 'bg-white/10 text-white'
                          : 'text-paper/75 hover:bg-white/5 hover:text-white',
                        'group flex items-center gap-x-3 rounded-xl px-2.5 py-2 text-sm font-medium'
                      )
                    }
                  >
                    <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Brand() {
  return (
    <div className="px-1">
      <p className="font-display text-2xl text-white">SaveMine</p>
      <p className="mt-1 text-xs text-paper/50">Private office & wallet</p>
    </div>
  );
}

function Sidebar({ open, setOpen }) {
  return (
    <>
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-ink/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                  <button type="button" className="-m-2.5 p-2.5" onClick={() => setOpen(false)}>
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </button>
                </div>
                <div className="flex grow flex-col gap-y-6 overflow-y-auto bg-ink px-5 pb-6 pt-6">
                  <Brand />
                  <NavList onNavigate={() => setOpen(false)} />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-6 overflow-y-auto bg-ink px-5 py-6">
          <Brand />
          <NavList />
        </div>
      </div>
    </>
  );
}

export default Sidebar;
