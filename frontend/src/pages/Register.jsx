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

    try {

      const result = await registerUser(formData);

      console.log(result);

      alert(result.message || result.error);

    }
    catch (error) {

      console.log(error);
      alert("Server error");

    }

  };

  return (

    <div className="flex justify-center items-center h-screen">

      <form onSubmit={handleSubmit} className="bg-white p-6 shadow-md rounded">

        <h2 className="text-xl mb-4">Register</h2>

        {/* ROLE SELECT */}
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="border p-2 mb-2 w-full"
        >
          <option value="doctor">Doctor</option>
          <option value="patient">Patient</option>
        </select>

        {/* NAME */}
        <input
          name="name"
          placeholder="Name"
          onChange={handleChange}
          className="border p-2 mb-2 w-full"
        />

        {/* EMAIL */}
        <input
          name="email"
          placeholder="Email"
          onChange={handleChange}
          className="border p-2 mb-2 w-full"
        />

        {/* PASSWORD */}
        <input
          name="password"
          type="password"
          placeholder="Password"
          onChange={handleChange}
          className="border p-2 mb-2 w-full"
        />

        {/* DOCTOR FIELDS */}
        {formData.role === "doctor" && (
          <>
            <input
              name="speciality"
              placeholder="Speciality"
              onChange={handleChange}
              className="border p-2 mb-2 w-full"
            />

            <input
              name="designation"
              placeholder="Designation"
              onChange={handleChange}
              className="border p-2 mb-2 w-full"
            />
          </>
        )}

        {/* PATIENT FIELD */}
        {formData.role === "patient" && (
          <input
            name="age"
            placeholder="Age"
            onChange={handleChange}
            className="border p-2 mb-2 w-full"
          />
        )}

        <button className="bg-blue-500 text-white p-2 w-full">

          Register

        </button>

      </form>

    </div>

  );

}

export default Register;
