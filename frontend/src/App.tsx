import React from 'react';
import { Routes, Route } from 'react-router-dom';
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
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/material/:id" element={<MaterialDetail />} />
            <Route path="/recent" element={<RecentMaterials />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Layout>
      } />
    </Routes>
  );
};

export default App;