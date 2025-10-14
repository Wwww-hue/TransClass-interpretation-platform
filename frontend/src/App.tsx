import React from 'react';
import { Routes, Route } from 'react-router-dom'; // 添加这行导入
import Layout from './components/Layout';
import Home from './pages/Home';
import Practice from './pages/Practice';
import Forum from './pages/Forum';
import Profile from './pages/Profile';
import Login from './pages/Login';
import MaterialDetail from "./pages/MaterialDetail";
import RecentMaterials from "./pages/RecentMaterials";
import AdminDashboard from "./pages/AdminDashboard";
const App: React.FC = () => {
  const token = localStorage.getItem('auth_token');

  if (!token) {
    return <Login onLoginSuccess={() => window.location.reload()} />;  
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/forum" element={<Forum />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Home />} />
        <Route path="/material/:id" element={<MaterialDetail />} />
        <Route path="/recent" element={<RecentMaterials />} />
      </Routes>
    </Layout>
  );
};

export default App;