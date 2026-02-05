import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DoctorDashboard from "./pages/DoctorDashboard";
import PatientDashboard from "./pages/PatientDashboard";

function App(){
  return(
    <BrowserRouter>
    <routes>
      <route path="/" element={<login/>}></route>
      <route path="register" element={<Register/>}></route>
      <route path="/doctor-dashboard" element={<DoctorDashboard/>}></route>
      <route path="/patient-dashboard" element={<PatientDashboard/>}></route>
    </routes>
    </BrowserRouter>
  );

}
export default App;
