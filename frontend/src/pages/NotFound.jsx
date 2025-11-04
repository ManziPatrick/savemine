import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
          <h2 className="text-2xl font-semibold text-gray-900 mt-4">
            Page not found
          </h2>
          <p className="text-gray-600 mt-2">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            to="/dashboard"
            className="btn btn-primary btn-lg w-full"
          >
            Go to Dashboard
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="btn btn-secondary w-full"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFound;


