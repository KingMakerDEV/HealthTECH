import {usetState} from "react";
import {loginUser} from "../api/authApi";
import { useNavigate} from "react-router-dom";

function Login(){
        const navigate=useNavigate();

        const [form ,setform]=useState({
            role:"doctor",
            email:"",
            password:""
        });
        const handleChange=(e)=>{
            setform({
                ...form,
                [e.target.name]: e.target.value
            });
        };
        const handleSubmit=async()=>{
            try{
                const res=await loginUser(form);
                const data=res.data;
                localStorage.setItem("user_id",data.user);
                localStorage.setItem("role",data.role);
                if(data.role=="doctor"){
                    navigate("/doctor-dashboard");
                }else{
                    navigate("/patient-dashboard");
                }
            }catch(err){
                alert("login failed");  
            }
        }  

    return(
      <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-6 rounded shadow w-80">

        <h2 className="text-xl mb-4">Login</h2>

        <select
          name="role"
          onChange={handleChange}
          className="w-full p-2 border mb-3"
        >
          <option value="doctor">Doctor</option>
          <option value="patient">Patient</option>
        </select>

        <input
          name="email"
          placeholder="Email"
          onChange={handleChange}
          className="w-full p-2 border mb-3"
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          onChange={handleChange}
          className="w-full p-2 border mb-3"
        />

        <button
          onClick={handleSubmit}
          className="w-full bg-blue-500 text-white p-2"
        >
          Login
        </button>

      </div>
    </div>
    );
}