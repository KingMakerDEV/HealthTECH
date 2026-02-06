import React, { useState } from "react";
import { registerUser } from "../api/authApi";

function Register() {
  const [formData, setFormData] = useState({
    role: "doctor",
    name: "",
    email: "",
    password: "",
    speciality: "",
    designation: "",
    age: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await registerUser(formData);
    console.log(result);
    alert(result.message || result.error);
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <form onSubmit={handleSubmit} className="bg-white p-6 shadow-md rounded">
        <h2 className="text-xl mb-4">Register</h2>

        <input name="name" placeholder="Name" onChange={handleChange} className="border p-2 mb-2 w-full" />
        <input name="email" placeholder="Email" onChange={handleChange} className="border p-2 mb-2 w-full" />
        <input name="password" placeholder="Password" type="password" onChange={handleChange} className="border p-2 mb-2 w-full" />

        <button className="bg-blue-500 text-white p-2 w-full">
          Register
        </button>
      </form>
    </div>
  );
}

export default Register;
