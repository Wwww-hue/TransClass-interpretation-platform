import React, { useState } from 'react';
import { Card, Form, Input, Button, Tabs, message, Spin,Alert } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import './Login.css';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const showToast = (msg: string) => {
    message.error(msg);
  };

  const validateForm = () => {
    if (!isLogin) {
      if (formData.password !== formData.confirmPassword) {
        showToast('两次输入的密码不一致');
        return false;
      }
      if (formData.password.length < 6) {
        showToast('密码长度至少6位');
        return false;
      }
      if (formData.username.length < 3) {
        showToast('用户名长度至少3位');
        return false;
      }
      if (!/^[a-zA-Z0-9]+$/.test(formData.username)) {
        showToast('用户名只能包含字母和数字');
        return false;
      }
    }
    return true;
  };

  // Mock 用户数据库
  // const mockUserDatabase = [
  //   {
  //     email: 'user@example.com',
  //     password: '123456',
  //     username: 'demo_user'
  //   },
  //   {
  //     email: 'test@qq.com',
  //     password: '123456',
  //     username: 'test_user'
  //   }
  // ];

 const mockAuthAPI = async (data: any, isLogin: boolean) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const validUsers = [

        {
          email: 'test@qq.com',
          password: '123456',
          username: '测试用户',
          role: 'student'  // 学生端
        },
        {
          email: 'admin@example.com',  // 新增管理员账号
          password: 'admin123',
          username: '系统管理员',
          role: 'admin'  // 管理员端
        }
      ];

      if (isLogin) {
        const user = validUsers.find(u =>
          u.email === data.email && u.password === data.password
        );

        if (user) {
          resolve({
            success: true,
            token: 'mock_jwt_token_' + Date.now(),
            user
          });
        } else {
          reject(new Error('账号或密码错误'));
        }
      } else {
        reject(new Error('演示阶段暂不开放注册'));
      }
    }, 300);
  });
};

const handleSubmit = async () => {
  console.log('🟢 开始处理登录');

  if (!validateForm()) {
    console.log('🔴 表单验证失败');
    return;
  }

  setIsLoading(true);

  try {
    console.log('🟡 调用mockAuthAPI');

    const result: any = await mockAuthAPI(
      isLogin
        ? { email: formData.email, password: formData.password }
        : {
            username: formData.username,
            email: formData.email,
            password: formData.password
          },
      isLogin
    );

    console.log('✅ 认证成功，用户角色:', result.user.role);

    // 保存用户信息
    localStorage.setItem('auth_token', result.token);
    localStorage.setItem('user_role', result.user.role);
    localStorage.setItem('user_name', result.user.username);

    message.success(isLogin ? '登录成功！' : '注册成功！');

    // 🚀 根据角色跳转
    if (result.user.role === 'admin') {
      console.log('🔵 跳转到管理端');
      window.location.href = '/admin';
    } else {
      console.log('🔵 跳转到首页');
      window.location.href = '/';
    }

  } catch (err) {
    console.log('❌ 认证失败:', err);
    const errorMessage = err instanceof Error ? err.message : `${isLogin ? '登录' : '注册'}失败`;
    showToast(errorMessage);
    setIsLoading(false);
  }
};

  const switchMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
    form.resetFields();
  };

  if (isLoading) {
    return (
      <div className="login-page">
        <div className="login-container">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <Card className="login-card">
          <div className="login-header">
            <h1>🎤 口译学习平台</h1>
            <p>专业口译训练，成就翻译梦想</p>
          </div>

          {/* 添加测试账号提醒 */}
          <Alert
            message="演示阶段测试账号"
            description={
              <div>

                <div>📧 test@qq.com / 123456</div>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: '24px' }}
          />

          <Tabs
            activeKey={isLogin ? 'login' : 'register'}
            onChange={switchMode}
            centered
            className="login-tabs"
            items={[
              {
                key: 'login',
                label: '登录',
                children: (
                  <Form
                    form={form}
                    name="login"
                    onFinish={handleSubmit}
                    layout="vertical"
                    size="large"
                  >
                    <Form.Item
                      name="email"
                      rules={[
                        { required: true, message: '请输入邮箱' },
                        { type: 'email', message: '请输入有效的邮箱地址' }
                      ]}
                    >
                      <Input
                        prefix={<MailOutlined />}
                        placeholder="邮箱"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                      />
                    </Form.Item>

                    <Form.Item
                      name="password"
                      rules={[
                        { required: true, message: '请输入密码' },
                        { min: 6, message: '密码长度至少6位' }
                      ]}
                    >
                      <Input.Password
                        prefix={<LockOutlined />}
                        placeholder="密码"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                      />
                    </Form.Item>

                    <Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        className="login-button"
                        loading={isLoading}
                        block
                      >
                        登录
                      </Button>
                    </Form.Item>
                  </Form>
                )
              },
              {
                key: 'register',
                label: '注册',
                children: (
                  <div>
                    {/* 在注册页面也添加提醒 */}
                    <Alert
                      message="暂不开放注册"
                      description="请直接使用上方测试账号登录系统"
                      type="warning"
                      showIcon
                      style={{ marginBottom: '16px' }}
                    />
                    <Form
                      form={form}
                      name="register"
                      onFinish={handleSubmit}
                      layout="vertical"
                      size="large"
                    >
                      <Form.Item
                        name="username"
                        rules={[
                          { required: true, message: '请输入用户名' },
                          { min: 3, message: '用户名长度至少3位' },
                          { pattern: /^[a-zA-Z0-9]+$/, message: '用户名只能包含字母和数字' }
                        ]}
                      >
                        <Input
                          prefix={<UserOutlined />}
                          placeholder="用户名"
                          value={formData.username}
                          onChange={(e) => handleInputChange('username', e.target.value)}
                        />
                      </Form.Item>

                      <Form.Item
                        name="email"
                        rules={[
                          { required: true, message: '请输入邮箱' },
                          { type: 'email', message: '请输入有效的邮箱地址' }
                        ]}
                      >
                        <Input
                          prefix={<MailOutlined />}
                          placeholder="邮箱"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                        />
                      </Form.Item>

                      <Form.Item
                        name="password"
                        rules={[
                          { required: true, message: '请输入密码' },
                          { min: 6, message: '密码长度至少6位' }
                        ]}
                      >
                        <Input.Password
                          prefix={<LockOutlined />}
                          placeholder="密码"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                        />
                      </Form.Item>

                      <Form.Item
                        name="confirmPassword"
                        rules={[
                          { required: true, message: '请确认密码' },
                          {
                            validator: (_, value) => {
                              if (value && value !== formData.password) {
                                return Promise.reject(new Error('两次输入的密码不一致'));
                              }
                              return Promise.resolve();
                            },
                          },
                        ]}
                      >
                        <Input.Password
                          prefix={<LockOutlined />}
                          placeholder="确认密码"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        />
                      </Form.Item>

                      <Form.Item>
                        <Button
                          type="primary"
                          htmlType="submit"
                          className="login-button"
                          loading={isLoading}
                          block
                        >
                          注册
                        </Button>
                      </Form.Item>
                    </Form>
                  </div>
                )
              }
            ]}
          />
        </Card>
      </div>
    </div>
  );
};

export default Login;