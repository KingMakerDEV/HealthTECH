import React, { useState } from "react";
import { loginUser } from "../api/authApi";

function Login() {
  const [formData, setFormData] = useState({
    role: "doctor",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await loginUser(formData);
    console.log(result);
    alert(result.message || result.error);
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <form onSubmit={handleSubmit} className="bg-white p-6 shadow-md rounded">
        <h2 className="text-xl mb-4">Login</h2>

        <input name="email" placeholder="Email" onChange={handleChange} className="border p-2 mb-2 w-full" />
        <input name="password" placeholder="Password" type="password" onChange={handleChange} className="border p-2 mb-2 w-full" />

        <button className="bg-green-500 text-white p-2 w-full">
          Login
        </button>
      </form>
    </div>
  );
}

export default Login;
