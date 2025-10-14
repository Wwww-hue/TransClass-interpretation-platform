import React, { useState } from 'react';
import {
  Layout,
  Menu,
  Card,
  Form,
  Input,
  Button,
  Upload,
  message,
  Table,
  Tag,
  Row,
  Col,
  Select,
  InputNumber,
  Space,
} from 'antd';
import {
  UploadOutlined,
  FileAddOutlined,
  UnorderedListOutlined,
  PlusOutlined,
  MinusCircleOutlined
} from '@ant-design/icons';
import type { UploadFile } from 'antd';
import{  useEffect } from 'react'; // 添加 useEffect
import { useNavigate } from 'react-router-dom'; // 添加这行
const { Header, Sider, Content } = Layout;
const { Option } = Select;
const { TextArea } = Input;
const API_BASE_URL = import.meta.env.VITE_API_URL;
interface Term {
  term: string;
  translation: string;
}

interface MaterialForm {
  title: string;
  chinese_title: string;
  theme: string;
  type: string;
  practice_type: string;
  difficulty: number;
  duration: string;
  date: string;
  format: string;
  language: string;
  skills: string[];
  source: string;
  introduction: string;
  transcript: string;
  translation: string;
  terms: Term[];
}
const AdminDashboard: React.FC = () => {
  const navigate = useNavigate(); // 添加这行
  const [currentMenu, setCurrentMenu] = useState('upload');
  const [uploading, setUploading] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userRole = localStorage.getItem('user_role');

    if (!token) {
      navigate('/login');
      return;
    }

    if (userRole !== 'admin') {
      message.error('无权访问管理后台');
      navigate('/');
      return;
    }
  }, [navigate]);

  // 模拟已上传的材料数据
  const [materials, setMaterials] = useState([
    {
      id: 1,
      title: '商务英语谈判',
      theme: '经济',
      type: '访谈',
      practice_type: '对话',
      status: '已发布',
      uploadTime: '2024-01-15'
    },
    {
      id: 2,
      title: '科技产品发布会',
      theme: '科技',
      type: '演讲',
      practice_type: '视听',
      status: '草稿',
      uploadTime: '2024-01-14'
    }
  ]);

// 修改 Upload 组件
  const uploadProps = {
    beforeUpload: () => {
      // 阻止自动上传
      return false;
    },
    onChange: (info:{ fileList:UploadFile[] }) => {
      setFileList(info.fileList);
    },
    onRemove: () => {
      setFileList([]);
    },
    fileList: fileList,
    accept: 'audio/*,video/*,.mp3,.wav,.m4a,.mp4,.mov,.avi',
    maxCount: 1
  };
const getMediaDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const media = file.type.startsWith('audio/') ? new Audio() : document.createElement('video');

    media.src = url;
    media.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(media.duration);
    };

    media.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('无法读取媒体文件时长'));
    };

    // 设置超时，避免某些文件无法加载
    setTimeout(() => {
      if (media.duration === Infinity || isNaN(media.duration)) {
        URL.revokeObjectURL(url);
        reject(new Error('媒体文件时长读取超时'));
      }
    }, 5000);
  });
};

const onFinish = async (values: MaterialForm) => {
    setUploading(true);
    try {
      console.log('开始上传材料:', values);
      console.log('文件列表:', fileList);

      // 创建 FormData
      const formData = new FormData();

      // 添加所有文本字段
      formData.append('title', values.title);
      formData.append('chinese_title', values.chinese_title || '');
      formData.append('theme', values.theme);
      formData.append('type', values.type);
      formData.append('practice_type', values.practice_type);
      formData.append('difficulty', values.difficulty.toString());
      formData.append('duration', values.duration);
      formData.append('date', values.date);
      formData.append('format', values.format);
      formData.append('language', values.language);
      formData.append('skills', JSON.stringify(values.skills || []));
      formData.append('source', values.source || '');
      formData.append('introduction', values.introduction || '');
      formData.append('transcript', values.transcript);
      formData.append('translation', values.translation);
      formData.append('terms', JSON.stringify(values.terms || []));

      // 处理文件上传 - 使用 fileList 状态
      if (fileList.length > 0 && fileList[0].originFileObj) {
        const file = fileList[0].originFileObj;
        formData.append('file', file);
        console.log('上传文件:', file.name, file.type, file.size);
      } else {
        console.log('没有选择文件');
      }

      // 发送到后端API
      const response = await fetch(`${API_BASE_URL}/materials/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '上传失败');
      }

      const result = await response.json();
      console.log('上传成功:', result);

      // 更新本地材料列表
      const newMaterial = {
        id: result.id,
        title: result.title,
        theme: result.theme,
        type: result.type,
        practice_type: result.practice_type,
        status: '已发布',
        uploadTime: result.created_at.split('T')[0],
        content_url: result.content_url // 确保包含文件URL
      };

      setMaterials(prev => [newMaterial, ...prev]);
      form.resetFields();
      setFileList([]); // 清空文件列表
      message.success('材料上传成功！');

    } catch (error) {
      console.error('上传失败:', error);
      message.error((error as Error).message || '上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const columns = [
    {
      title: '材料标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '主题',
      dataIndex: 'theme',
      key: 'theme',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '练习类型',
      dataIndex: 'practice_type',
      key: 'practice_type',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === '已发布' ? 'green' : 'orange'}>
          {status}
        </Tag>
      ),
    },
    {
      title: '上传时间',
      dataIndex: 'uploadTime',
      key: 'uploadTime',
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <div>
          <Button type="link" size="small">编辑</Button>
          <Button type="link" size="small" danger>删除</Button>
        </div>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 侧边栏 */}
      <Sider theme="light">
        <div style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <h3 style={{ margin: 0, color: '#1890ff' }}>口译平台管理端</h3>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[currentMenu]}
          onClick={({ key }) => setCurrentMenu(key)}
          items={[
            {
              key: 'upload',
              icon: <FileAddOutlined />,
              label: '上传材料',
            },
            {
              key: 'manage',
              icon: <UnorderedListOutlined />,
              label: '材料管理',
            },
          ]}
        />
      </Sider>

      <Layout>
        {/* 顶部导航 */}
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <h2 style={{ margin: 0 }}>
            {currentMenu === 'upload' ? '上传学习材料' : '材料管理'}
          </h2>
          {/* 移除了退出登录按钮 */}
        </Header>

        {/* 主要内容 */}
        <Content style={{ margin: '24px' }}>
          {currentMenu === 'upload' ? (
            <Card title="上传新材料">
              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                size="large"
                initialValues={{
                  terms: [{}] // 默认提供一个空的术语输入框
                }}
              >
                 <Form.Item
  label="音频/视频文件"
  rules={[{ required: true, message: '请选择文件' }]}
>
  <Upload
    {...uploadProps}
    beforeUpload={() => {
      // 阻止自动上传
      return false;
    }}
    onChange={({ fileList }) => {
      setFileList(fileList);

      // 当选择文件时，自动读取时长
      if (fileList.length > 0 && fileList[0].originFileObj) {
        const file = fileList[0].originFileObj;
        getMediaDuration(file).then(duration => {
          if (duration) {
            // 自动填充时长字段
            const minutes = Math.floor(duration / 60);
            const seconds = Math.floor(duration % 60);
            const durationString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            form.setFieldsValue({
              duration: durationString
            });

            // 根据文件类型自动设置格式
            if (file.type.startsWith('audio/')) {
              form.setFieldsValue({ format: '音频' });
            } else if (file.type.startsWith('video/')) {
              form.setFieldsValue({ format: '视频' });
            }

            message.success(`已自动读取时长: ${durationString}`);
          }
        }).catch(error => {
          console.error('读取媒体文件时长失败:', error);
          message.warning('无法读取文件时长，请手动输入');
        });
      }
    }}
  >
    <Button icon={<UploadOutlined />}>
      选择文件
    </Button>
  </Upload>
  <div style={{ marginTop: 8, color: '#666', fontSize: 12 }}>
    支持 MP3, WAV, M4A, MP4, MOV, AVI 等格式，最大 100MB
  </div>
</Form.Item>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="材料标题"
                      name="title"
                      rules={[{ required: true, message: '请输入材料标题' }]}
                    >
                      <Input placeholder="例如：商务英语谈判" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="中文标题"
                      name="chinese_title"
                    >
                      <Input placeholder="例如：Business English Negotiation" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={6}>
                    <Form.Item
                      label="主题"
                      name="theme"
                      rules={[{ required: true, message: '请选择主题' }]}
                    >
                      <Select placeholder="选择主题">
                        <Option value="经济">经济</Option>
                        <Option value="科技">科技</Option>
                        <Option value="文化">文化</Option>
                        <Option value="政治">政治</Option>
                        <Option value="教育">教育</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item
                      label="类型"
                      name="type"
                      rules={[{ required: true, message: '请选择类型' }]}
                    >
                      <Select placeholder="选择类型">
                        <Option value="访谈">访谈</Option>
                        <Option value="演讲">演讲</Option>
                        <Option value="新闻">新闻</Option>
                        <Option value="对话">对话</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item
                      label="练习类型"
                      name="practice_type"
                      rules={[{ required: true, message: '请选择练习类型' }]}
                    >
                      <Select placeholder="选择练习类型">
                        <Option value="对话">对话</Option>
                        <Option value="篇章">篇章</Option>
                        <Option value="视听">视听</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item
                      label="难度"
                      name="difficulty"
                      rules={[{ required: true, message: '请设置难度' }]}
                    >
                      <InputNumber
                        min={1}
                        max={5}
                        step={0.5}
                        placeholder="1-5分"
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item
                      label="语言"
                      name="language"
                      rules={[{ required: true, message: '请选择语言' }]}
                    >
                      <Select placeholder="选择语言">
                        <Option value="英语">英语</Option>
                        <Option value="汉语">汉语</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      label="格式"
                      name="format"
                      rules={[{ required: true, message: '请选择格式' }]}
                    >
                      <Select placeholder="选择格式">
                        <Option value="音频">音频</Option>
                        <Option value="视频">视频</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      label="时长"
                      name="duration"
                    >
                      <Input placeholder="例如：8:30" />
                    </Form.Item>
                  </Col>
                </Row>
                 {/* 新增日期和来源行 */}
<Row gutter={16}>
  <Col span={12}>
    <Form.Item
      label="日期"
      name="date"
      rules={[{ required: true, message: '请选择日期' }]}
    >
      <Input type="date" />
    </Form.Item>
  </Col>
  <Col span={12}>
    <Form.Item
      label="来源"
      name="source"
    >
      <Input placeholder="例如：商务英语教材、TED Talks、央视新闻等" />
    </Form.Item>
  </Col>
</Row>

{/* 技能标签单独一行 */}
<Row gutter={16}>
  <Col span={24}>
    <Form.Item
      label="技能标签"
      name="skills"
    >
      <Select
        mode="tags"
        placeholder="选择或输入技能标签"
        style={{ width: '100%' }}
        tokenSeparators={[',']}
        options={[
          { value: '关键词', label: '关键词' },
          { value: '逻辑关系', label: '逻辑关系' },
          { value: '数字', label: '数字' },
          { value: '笔记', label: '笔记' }
        ]}
      />
    </Form.Item>
  </Col>
</Row>


                {/* 术语表 */}
                <Form.Item label="术语表">
                  <Form.List name="terms">
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map(({ key, name, ...restField }) => (
                          <Space
                            key={key}
                            style={{ display: 'flex', marginBottom: 8 }}
                            align="baseline"
                          >
                            <Form.Item
                              {...restField}
                              name={[name, 'term']}
                              rules={[
                                { required: false, message: '请输入术语' }
                              ]}
                            >
                              <Input placeholder="术语（如：IPO）" style={{ width: 200 }} />
                            </Form.Item>
                            <Form.Item
                              {...restField}
                              name={[name, 'translation']}
                              rules={[
                                { required: false, message: '请输入翻译' }
                              ]}
                            >
                              <Input placeholder="翻译（如：首次公开募股）" style={{ width: 300 }} />
                            </Form.Item>
                            <MinusCircleOutlined onClick={() => remove(name)} />
                          </Space>
                        ))}
                        <Form.Item>
                          <Button
                            type="dashed"
                            onClick={() => add()}
                            block
                            icon={<PlusOutlined />}
                          >
                            添加术语
                          </Button>
                        </Form.Item>
                      </>
                    )}
                  </Form.List>
                  <div style={{ color: '#666', fontSize: 12, marginTop: 8 }}>
                    可添加材料中出现的专业术语及其翻译（可选）
                  </div>
                </Form.Item>

                <Form.Item
                  label="原文内容"
                  name="transcript"
                  rules={[{ required: true, message: '请输入原文内容' }]}
                >
                  <TextArea
                    rows={4}
                    placeholder="输入原文内容..."
                  />
                </Form.Item>

                <Form.Item
                  label="参考译文"
                  name="translation"
                  rules={[{ required: true, message: '请输入参考译文' }]}
                >
                  <TextArea
                    rows={4}
                    placeholder="输入参考译文..."
                  />
                </Form.Item>

                <Form.Item
                  label="材料简介"
                  name="introduction"
                >
                  <TextArea
                    rows={2}
                    placeholder="输入材料简介..."
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={uploading}
                    size="large"
                  >
                    上传材料
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          ) : (
            <Card title="材料管理">
              <Table
                columns={columns}
                dataSource={materials}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            </Card>
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminDashboard;