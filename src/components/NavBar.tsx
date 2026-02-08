import { NavLink } from "react-router-dom";
import { AuthContext } from "../App";
import { useContext } from "react";

function NavBar() {
  const { isAuth, setAuthState } = useContext(AuthContext);

  const logoutHandler = () => {
    localStorage.removeItem("accessToken");
    setAuthState({
      isAuth: false,
      roleState: '',
    });
  };

  return (
    <div className="bg-purple-700 text-white p-4 shadow-md">
      <nav className="flex gap-8 items-center justify-center">
        <NavLink to="/" className="hover:text-yellow-300 font-semibold">Home</NavLink>
        <NavLink to="/about" className="hover:text-yellow-300 font-semibold">About Us</NavLink>
        {isAuth ? (
          <>
            <NavLink to="/profile" className="hover:text-yellow-300 font-semibold">Profile</NavLink>
            <NavLink to="/questionset/list" className="hover:text-yellow-300 font-semibold">QuestionSet</NavLink>
            <button onClick={logoutHandler} className="bg-yellow-400 text-purple-900 px-3 py-1 rounded hover:bg-yellow-300 font-semibold">Logout</button>
          </>
        ) : (
          <>
            <NavLink to="/register" className="hover:text-yellow-300 font-semibold">Register</NavLink>
            <NavLink to="/login" className="hover:text-yellow-300 font-semibold">Login</NavLink>
          </>
        )}
      </nav>
    </div>
  );
      }
      
      export default NavBar;
