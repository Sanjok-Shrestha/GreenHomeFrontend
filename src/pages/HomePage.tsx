import type { FC } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../App";

const HomePage: FC = () => {
  const { isAuth } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-700">GreenHome Nepal</h1>
          <div className="space-x-4">
            {isAuth && (
              <>
                <button
                  onClick={() => navigate("/post-waste")}
                  className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800"
                >
                  Post Waste
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Header Section */}
      <header className="bg-gradient-to-r from-green-700 to-green-600 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold mb-4">Welcome to GreenHome</h2>
          <p className="text-lg">
            A digital platform that helps households recycle waste efficiently
            and earn rewards while protecting the environment.
          </p>
        </div>
      </header>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8 text-gray-800">System Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-700">
            <h3 className="text-xl font-semibold text-green-700 mb-2">📋 Waste Posting</h3>
            <p className="text-gray-600">Online waste posting and price estimation</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-700">
            <h3 className="text-xl font-semibold text-green-700 mb-2">🚚 Pickup Scheduling</h3>
            <p className="text-gray-600">Pickup scheduling with verified collectors</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-700">
            <h3 className="text-xl font-semibold text-green-700 mb-2">📍 Real-time Tracking</h3>
            <p className="text-gray-600">Real-time tracking of waste collection</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-700">
            <h3 className="text-xl font-semibold text-green-700 mb-2">🎁 Rewards</h3>
            <p className="text-gray-600">Rewards and digital recycling certificates</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-700">
            <h3 className="text-xl font-semibold text-green-700 mb-2">⚙️ Admin Control</h3>
            <p className="text-gray-600">Admin-controlled pricing and monitoring</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-700">
            <h3 className="text-xl font-semibold text-green-700 mb-2">🌍 Sustainability</h3>
            <p className="text-gray-600">Contributing to a sustainable environment</p>
          </div>
        </div>
      </section>

      {/* Action Buttons Section */}
      {!isAuth && (
        <section className="bg-white shadow-md py-12">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Get Started Today</h2>
            <div className="space-x-4">
              <Link to="/login">
                <button className="px-6 py-3 bg-green-700 text-white rounded font-semibold hover:bg-green-800">
                  Login
                </button>
              </Link>
              <Link to="/register">
                <button className="px-6 py-3 bg-gray-700 text-white rounded font-semibold hover:bg-gray-800">
                  Register
                </button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-800 text-white text-center py-6 mt-12">
        <p>© 2026 GreenHome Nepal | Sustainable Waste Management | Making the world greener</p>
      </footer>
    </div>
  );
};
export default HomePage;
