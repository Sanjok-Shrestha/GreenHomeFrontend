import axios from "axios";
import { useState } from "react";

function RegisterForm() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const finalData = {
      name,
      email,
      password,
    };

    axios
      .post("http://localhost:3000/users/create", finalData)
      .then((response) => {
        alert("User registered successfully!");
      })
      .catch((error) => {
        console.log("error => ", error);
        const errors = error?.response?.data?.message || "An error occurred";
        alert(errors);
      });
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2 text-purple-700 text-center">Register Form</h1>
        <p className="mb-6 text-center text-gray-600">Register to Continue</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block mb-1 font-medium text-gray-700">Name:</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              value={name}
              onChange={handleNameChange}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label htmlFor="email" className="block mb-1 font-medium text-gray-700">Email:</label>
            <input
              type="email"
              name="search_email"
              placeholder="Enter your email"
              value={email}
              onChange={handleEmailChange}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block mb-1 font-medium text-gray-700">Password:</label>
            <input
              type="password"
              name="search_password"
              placeholder="Enter your password"
              value={password}
              onChange={handlePasswordChange}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button type="submit" className="w-full bg-purple-700 text-white py-2 rounded font-semibold hover:bg-purple-800 transition">Register</button>
        </form>
      </div>
    </div>
  );
}
export default RegisterForm;