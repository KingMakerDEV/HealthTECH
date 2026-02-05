import { useState } from "react";
import { registerUser } from "../api/authApi";

function Register(){

  const [form, setForm] = useState({
    role: "doctor",
    name: "",
    email: "",
    password: "",
    specialist: "",
    designation: "",
    age: ""
  });

  const handleChange = (e)=>{
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async ()=>{

    try{

      const res = await registerUser(form);

      alert(res.data.message);

    }catch{
      alert("Registration failed");
    }

  };

  return(

    <div className="flex justify-center items-center h-screen">

      <div className="bg-white p-6 shadow w-96">

        <h2 className="text-xl mb-4">Register</h2>

        <input name="name" placeholder="Name"
        onChange={handleChange}
        className="w-full p-2 border mb-2" />

        <input name="email" placeholder="Email"
        onChange={handleChange}
        className="w-full p-2 border mb-2" />

        <input name="password" placeholder="Password"
        onChange={handleChange}
        className="w-full p-2 border mb-2" />

        <button
        onClick={handleSubmit}
        className="bg-green-500 text-white w-full p-2">
        Register
        </button>

      </div>

    </div>

  );

}

export default Register;
