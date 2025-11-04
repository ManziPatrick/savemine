import { useAuth } from '../hooks/useAuth.jsx';

function Profile() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account settings
        </p>
      </div>

      <div className="card">
        <div className="card-body">
          <p className="text-center text-gray-500 py-12">
            Profile management coming soon...
          </p>
        </div>
      </div>
    </div>
  );
}

export default Profile;
