// src/pages/RecentMaterials.tsx
import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Rate, Button, Row, Col, Input, Select, message } from 'antd';
import { LeftOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Search } = Input;

interface PracticeMaterial {
  id: number;
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
  source?: string;
  created_at: string;
}

const RecentMaterials: React.FC = () => {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<PracticeMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  // 加载最新材料
  const loadRecentMaterials = async (search?: string) => {
    try {
      setLoading(true);
      let url = '/api/materials/recent/updates';
      if (search) {
        url += `?search=${encodeURIComponent(search)}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP错误: ${response.status}`);

      const data = await response.json();
      setMaterials(data);
    } catch (error) {
      console.error('加载最新材料失败:', error);
      message.error('加载最新材料失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecentMaterials();
  }, []);

  const handleSearch = (value: string) => {
    setSearchText(value);
    loadRecentMaterials(value);
  };

  const formatTimeAgo = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return '刚刚';
    if (diffInHours < 24) return `${diffInHours}小时前`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}天前`;
  };

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* 返回按钮和标题 */}
      <div style={{ marginBottom: '24px' }}>
        <Button
          type="text"
          icon={<LeftOutlined />}
          onClick={() => navigate('/')}
          style={{ marginBottom: '16px' }}
        >
          返回首页
        </Button>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>最新更新</h1>
        <p style={{ color: '#666', margin: '8px 0 0 0' }}>查看最近7天内上传的所有练习材料</p>
      </div>

      {/* 搜索栏 */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={12}>
            <Search
              placeholder="搜索最新材料..."
              enterButton={<SearchOutlined />}
              style={{ width: '100%' }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={handleSearch}
            />
          </Col>
          <Col xs={24} md={12} style={{ textAlign: 'right', color: '#666' }}>
            共 {materials.length} 个最新材料
          </Col>
        </Row>
      </Card>

      {/* 材料列表 */}
      <Card>
        <List
          loading={loading}
          dataSource={materials}
          renderItem={item => (
            <List.Item
              style={{
                padding: '16px',
                border: '1px solid #f0f0f0',
                marginBottom: '12px',
                borderRadius: '8px',
                background: '#fff',
                cursor: 'pointer'
              }}
             onClick={() => {
  sessionStorage.setItem('fromRecent', 'true');
  navigate(`/material/${item.id}`);
}}
            >
              <List.Item.Meta
                title={
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      {item.chinese_title}
                    </div>
                  </div>
                }
                description={
                  <div>
                    <div style={{ marginBottom: '8px' }}>
                      <Tag color="blue">{item.theme}</Tag>
                      <Tag color="green">{item.type}</Tag>
                      <Tag color="orange">{item.format}</Tag>
                      <Tag color="purple">{item.language}</Tag>
                      <Tag color="cyan">
                        难度: <Rate disabled defaultValue={item.difficulty} allowHalf style={{ fontSize: '12px', marginLeft: '4px' }} />
                      </Tag>
                      <Tag color="red">时长: {item.duration}</Tag>
                    </div>
                    <div style={{ color: '#999', fontSize: '12px' }}>
                      <span>上传时间: {formatTimeAgo(item.created_at)}</span>
                      {item.source && <span style={{ marginLeft: '12px' }}>来源: {item.source}</span>}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
          locale={{ emptyText: '暂无最新材料' }}
        />
      </Card>
    </div>
  );
};

export default RecentMaterials;