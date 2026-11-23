import ReportDesk from '../components/ReportDesk';
import { useAuth } from '../hooks/useAuth.jsx';

function Profile() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-saffron">Account</p>
        <h1 className="mt-1 font-display text-3xl text-ink">{user?.name || 'Profile'}</h1>
        <p className="mt-2 text-sm text-ink/70">{user?.email}</p>
      </div>
      <ReportDesk />
    </div>
  );
}

export default Profile;
