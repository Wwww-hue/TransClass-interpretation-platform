import React, { useState, useEffect } from 'react';
import { Layout as AntLayout, Menu, Button, Drawer, Dropdown, Avatar, Tag } from 'antd';
import {
  MenuOutlined,
  HomeOutlined,
  PlayCircleOutlined,
  MessageOutlined,
  UserOutlined,
  LogoutOutlined,
  FileAddOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = AntLayout;

interface LayoutProps {
  children: React.ReactNode;
}


const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // 检查用户角色
  useEffect(() => {
    const userRole = localStorage.getItem('user_role');
    setIsAdmin(userRole === 'admin');
  }, []);

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '主页',
    },
    {
      key: '/practice',
      icon: <PlayCircleOutlined />,
      label: '口译训练',
    },
    {
      key: '/forum',
      icon: <MessageOutlined />,
      label: '口译论坛',
    },
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: '我的',
    },
  ];

  // 如果是管理员，在移动端菜单中添加上传选项
  const mobileMenuItems = isAdmin
    ? [
        ...menuItems,
        {
          type: 'divider' as const,
        },
        {
          key: '/admin',
          icon: <FileAddOutlined />,
          label: '材料上传',
        }
      ]
    : menuItems;

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/profile'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_name');
        window.location.href = '/auth';
      },
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
    setMobileMenuVisible(false);
  };

  const handleAdminUpload = () => {
    navigate('/admin');
    setMobileMenuVisible(false);
  };

  return (
    <AntLayout style={{ minHeight: '100vh', overflow: 'hidden' }}>
      {/* 桌面端侧边栏 - 固定定位 */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="desktop-sider"
        style={{
          background: '#fff',
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1000,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="logo" style={{
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #f0f0f0',
            flexShrink: 0
          }}>
            <h2 style={{ margin: 0, color: '#1890ff' }}>
              {collapsed ? '🎤' : '口译学习平台'}
            </h2>
          </div>

          {/* 主要菜单项 */}
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ borderRight: 0, flex: 1 }}
          />

          {/* 管理员专属上传区域 - 固定在底部 */}
          {isAdmin && (
            <div style={{
              padding: '8px',
              borderTop: '1px solid #f0f0f0',
              background: '#fafafa',
              flexShrink: 0
            }}>
              <Button
                type="primary"
                icon={<FileAddOutlined />}
                onClick={handleAdminUpload}
                style={{
                  width: '100%',
                  background: '#1890ff',
                  borderColor: '#1890ff',
                  fontWeight: 'bold'
                }}
              >
                {collapsed ? '' : '材料上传'}
              </Button>
              {!collapsed && (
                <div style={{
                  fontSize: '12px',
                  color: '#666',
                  textAlign: 'center',
                  marginTop: '4px'
                }}>
                  管理端功能
                </div>
              )}
            </div>
          )}
        </div>
      </Sider>

      {/* 右侧内容区域 - 根据侧边栏宽度调整 */}
      <AntLayout style={{
        marginLeft: collapsed ? 80 : 200,
        transition: 'margin-left 0.2s',
        minHeight: '100vh'
      }}>
        {/* 头部 - 固定定位 */}
        <Header style={{
          background: '#fff',
          padding: '0 16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'fixed',
          top: 0,
          right: 0,
          left: collapsed ? 80 : 200,
          zIndex: 999,
          transition: 'left 0.2s'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="desktop-menu-trigger"
            />
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h1 style={{ margin: 0, fontSize: '20px', color: '#1890ff' }}>
              专业口译训练平台
            </h1>
          </div>

          {/* 用户区域 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isAdmin && (
              <Tag color="blue" style={{ margin: 0 }}>
                管理员
              </Tag>
            )}
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '6px',
                transition: 'background-color 0.3s'
              }}>
                <Avatar
                  size="small"
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#1890ff' }}
                />
                <span style={{ color: '#000' }}>
                  {localStorage.getItem('user_name') || '用户'}
                </span>
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* 内容区域 - 独立滚动 */}
        <Content style={{
          marginTop: '64px',
          padding: '24px',
          background: '#f0f2f5',
          minHeight: 'calc(100vh - 64px)',
          overflow: 'auto',
        }}>
          {children}
        </Content>
      </AntLayout>

      {/* 移动端抽屉菜单 */}
      <Drawer
        title="菜单"
        placement="left"
        onClose={() => setMobileMenuVisible(false)}
        open={mobileMenuVisible}
        width={250}
      >
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={mobileMenuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Drawer>

      {/* 移动端菜单触发按钮 */}
      <Button
        type="primary"
        icon={<MenuOutlined />}
        onClick={() => setMobileMenuVisible(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 1001,
          display: 'none'
        }}
        className="mobile-menu-trigger"
      />
    </AntLayout>
  );
};

export default Layout;