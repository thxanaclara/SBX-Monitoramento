import { Routes, Route } from "react-router-dom";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import AdGenerator from "@/pages/AdGenerator";
import Users from "@/pages/Users";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/produtos" element={<ProtectedRoute><Products /></ProtectedRoute>} />
      <Route path="/produtos/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
      <Route path="/anuncios" element={<ProtectedRoute><AdGenerator /></ProtectedRoute>} />
      <Route path="/usuarios" element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
    </Routes>
  );
}
