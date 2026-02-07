import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DoctorDashboard from "./pages/DoctorDashboard";
import PatientDashboard from "./pages/PatientDashboard";

function App(){
  return(
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Login/>}></Route>
      <Route path="/register" element={<Register/>}></Route>
      <Route path="/doctor-dashboard" element={<DoctorDashboard/>}></Route>
      <Route path="/patient-dashboard" element={<PatientDashboard/>}></Route>
    </Routes>
    </BrowserRouter>
  );

}
export default App;
