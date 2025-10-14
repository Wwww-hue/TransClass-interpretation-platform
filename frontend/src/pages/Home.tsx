import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Input, List, Button, Tag, message, Spin } from 'antd';
import { SearchOutlined, MessageOutlined, FileTextOutlined, EyeOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Search } = Input;
const API_BASE_URL = import.meta.env.VITE_API_URL
// 定义接口类型
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

// 定义学习记录接口类型
interface StudyRecordResponse {
  id: number;
  user_id: number;
  material_id: number;
  progress: number;
  started_at: string;
  last_studied_at: string;
  material: PracticeMaterial;
}

// 修改：用户统计接口类型，只保留学习时长
interface UserStats {
  total_study_hours: number;
}

// 新增：每日一句接口类型
interface DailySentence {
  content: string;
  translation: string;
  source: string;
  sentence_date: string;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [recentMaterials, setRecentMaterials] = useState<PracticeMaterial[]>([]);
  const [studyRecords, setStudyRecords] = useState<StudyRecordResponse[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({ total_study_hours: 0 });
  const [dailySentence, setDailySentence] = useState<DailySentence | null>(null); // 新增：每日一句状态
  const [loading, setLoading] = useState(false);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [sentenceLoading, setSentenceLoading] = useState(false); // 新增：每日一句加载状态
useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate('/login');
      return;
    }
  }, [navigate]);
  // 加载最近更新的材料
  useEffect(() => {
    const loadRecentMaterials = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/materials/recent/updates`);

        if (!response.ok) {
          throw new Error(`HTTP错误: ${response.status}`);
        }

        const data = await response.json();
        setRecentMaterials(data);
      } catch (error) {
        console.error('加载最近更新失败:', error);
        message.error('加载最新材料失败');
      } finally {
        setLoading(false);
      }
    };

    loadRecentMaterials();
  }, []);

  // 加载用户学习记录
  useEffect(() => {
    const loadStudyRecords = async () => {
      try {
        setRecordsLoading(true);
        const response = await fetch(`${API_BASE_URL}/study-records/`);

        if (!response.ok) {
          throw new Error(`HTTP错误: ${response.status}`);
        }

        const data = await response.json();
        setStudyRecords(data);
      } catch (error) {
        console.error('加载学习记录失败:', error);
        message.error('加载学习记录失败');
      } finally {
        setRecordsLoading(false);
      }
    };

    loadStudyRecords();

    // 添加页面可见性监听
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadStudyRecords();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 修改：加载用户统计
  useEffect(() => {
    const loadUserStats = async () => {
      try {
        setStatsLoading(true);
        const response = await fetch(`${API_BASE_URL}/study-records/user-stats`);

        if (!response.ok) {
          throw new Error(`HTTP错误: ${response.status}`);
        }

        const data = await response.json();
        setUserStats(data);
        console.log('📊 用户统计数据:', data);
      } catch (error) {
        console.error('加载用户统计失败:', error);
        setUserStats({ total_study_hours: 0 });
      } finally {
        setStatsLoading(false);
      }
    };

    loadUserStats();

    // 统计数据也监听页面可见性变化
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadUserStats();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 新增：加载每日一句
  useEffect(() => {
    const loadDailySentence = async () => {
      try {
        setSentenceLoading(true);
        const response = await fetch(`${API_BASE_URL}/daily-sentence/`);

        if (!response.ok) {
          throw new Error(`HTTP错误: ${response.status}`);
        }

        const data = await response.json();
        setDailySentence(data);
        console.log('📖 每日一句数据:', data);
      } catch (error) {
        console.error('加载每日一句失败:', error);
        // 出错时使用默认句子
        setDailySentence({
          content: "The limits of my language mean the limits of my world.",
          translation: "我的语言的界限意味着我的世界的界限。",
          source: "Ludwig Wittgenstein",
          sentence_date: new Date().toISOString().split('T')[0]
        });
      } finally {
        setSentenceLoading(false);
      }
    };

    loadDailySentence();
  }, []);

  // 格式化时间显示
  const formatTimeAgo = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return '刚刚';
    } else if (diffInHours < 24) {
      return `${diffInHours}小时前`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}天前`;
    }
  };

  // 格式化学习时间显示
  const formatStudyTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes}分钟前`;
    } else if (diffInHours < 24) {
      return `${diffInHours}小时前`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}天前`;
    }
  };

  // 计算累计学习时长 - 使用真实数据
  const calculateTotalStudyHours = () => {
    return userStats.total_study_hours;
  };

  // 获取练习类型名称
  const getPracticeTypeName = (type: string) => {
    const names: { [key: string]: string } = {
      '对话': '对话',
      '篇章': '篇章',
      '视听': '视听'
    };
    return names[type] || type;
  };

  const handleCardClick = async (practiceType: string) => {
    try {
      sessionStorage.setItem('fromHome', 'true');
      const response = await fetch(`${API_BASE_URL}/materials/practice-type/${practiceType}`);

      if (response.status === 404) {
        message.error(`暂无${getPracticeTypeName(practiceType)}练习材料`);
        sessionStorage.removeItem('fromHome');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }

      const material = await response.json();
      navigate(`/material/${material.id}`);
    } catch (error) {
      console.error('获取材料失败:', error);
      message.error('获取练习材料失败');
      sessionStorage.removeItem('fromHome');
    }
  };

  const trainingCards = [
    {
      icon: <MessageOutlined />,
      title: '对话',
      color: '#1890ff',
      practiceType: '对话',
      onClick: () => handleCardClick('对话')
    },
    {
      icon: <FileTextOutlined />,
      title: '篇章',
      color: '#52c41a',
      practiceType: '篇章',
      onClick: () => handleCardClick('篇章')
    },
    {
      icon: <EyeOutlined />,
      title: '视听',
      color: '#faad14',
      practiceType: '视听',
      onClick: () => handleCardClick('视听')
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* 顶部搜索栏 */}
      <Row justify="start" style={{ marginBottom: '24px' }}>
        <Col>
          <Search
            placeholder="搜索课程、资料..."
            enterButton={<SearchOutlined />}
            style={{ width: 300 }}
          />
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* 左侧主要内容区域 */}
        <Col xs={24} lg={16}>
          {/* 最新更新 */}
          <Card
            title="最新更新"
            style={{ marginBottom: '24px' }}
            extra={<a onClick={() => {
              sessionStorage.setItem('fromRecent', 'true');
              navigate('/recent');
            }}>查看更多</a>}
          >
            <List
              loading={loading}
              dataSource={recentMaterials.slice(0, 5)}
              renderItem={item => (
                <List.Item
                  style={{ padding: '12px 16px', cursor: 'pointer' }}
                  onClick={() => {
                    sessionStorage.setItem('fromHome', 'true');
                    navigate(`/material/${item.id}`);
                  }}
                >
                  <List.Item.Meta
                    title={
                      <div style={{ fontSize: '14px', fontWeight: '500' }}>
                        {item.title}
                      </div>
                    }
                    description={
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        <Tag
                          color="blue"
                          style={{ fontSize: '10px', marginRight: '6px' }}
                        >
                          {item.type}
                        </Tag>
                        <Tag
                          color="green"
                          style={{ fontSize: '10px', marginRight: '6px' }}
                        >
                          {item.theme}
                        </Tag>
                        <span style={{ marginLeft: '4px' }}>
                          {formatTimeAgo(item.created_at)}
                        </span>
                      </div>
                    }
                  />
                </List.Item>
              )}
              pagination={false}
              locale={{ emptyText: '暂无最新材料' }}
            />
          </Card>

          {/* 三个训练卡片 */}
          <Row gutter={[16, 16]}>
            {trainingCards.map((card, index) => (
              <Col xs={24} sm={8} key={index}>
                <Card
                  hoverable
                  onClick={card.onClick}
                  style={{
                    textAlign: 'center',
                    border: `2px solid ${card.color}`,
                    height: '160px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                  bodyStyle={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%'
                  }}
                >
                  <div style={{ fontSize: '36px', color: card.color, marginBottom: '12px' }}>
                    {card.icon}
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '20px' }}>
                    {card.title}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Col>

        {/* 右侧侧边栏 */}
        <Col xs={24} lg={8}>
          {/* 我的学习 - 使用真实数据 */}
          <Card
            title="我的学习"
            style={{ marginBottom: '24px' }}
          >
            {/* 累计学习时长 - 使用真实数据 */}
            <div style={{ textAlign: 'center', marginBottom: '16px', padding: '12px', background: '#f0f8ff', borderRadius: '6px' }}>
              <Statistic
                title="累计学习时长"
                value={calculateTotalStudyHours()}
                suffix="小时"
                valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                loading={statsLoading}
              />
            </div>

            {/* 学习记录列表 - 使用真实数据 */}
            <List
              dataSource={studyRecords.slice(0, 3)} // 只显示3条
              loading={recordsLoading}
              size="small"
              renderItem={record => (
                <List.Item
                  style={{ padding: '8px 0', cursor: 'pointer' }}
                  onClick={() => {
                    sessionStorage.setItem('fromHome', 'true');
                    navigate(`/material/${record.material_id}`);
                  }}
                >
                  <List.Item.Meta
                    title={
                      <div style={{
                        fontSize: '13px',
                        fontWeight: 'normal',
                        marginBottom: '2px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1
                        }}>
                          {record.material.title}
                        </span>
                        <Tag
                          color={record.progress === 100 ? 'success' : 'processing'}
                          style={{
                            fontSize: '10px',
                            marginLeft: '8px',
                            flexShrink: 0
                          }}
                        >
                          {record.progress}%
                        </Tag>
                      </div>
                    }
                    description={
                      <div style={{ fontSize: '11px', color: '#666' }}>
                        <span>最后学习: {formatStudyTime(record.last_studied_at)}</span>
                      </div>
                    }
                  />
                </List.Item>
              )}
              pagination={false}
              locale={{ emptyText: '暂无学习记录' }}
            />

            {/* 更多按钮 */}
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <Button
                type="link"
                size="small"
                icon={<RightOutlined />}
                onClick={() => navigate('/profile')}
                style={{ padding: 0, fontSize: '12px' }}
              >
                更多记录
              </Button>
            </div>
          </Card>

          {/* 每日一句 */}
          <Card title="每日一句">
            {sentenceLoading ? (
              <div style={{ padding: '16px', textAlign: 'center' }}>
                <Spin size="small" />
              </div>
            ) : dailySentence ? (
              <div style={{ padding: '16px', background: '#f0f8ff', borderRadius: '8px' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', lineHeight: '1.4' }}>
                  "{dailySentence.content}"
                </div>
                <div style={{ color: '#666', marginBottom: '8px', fontSize: '14px', lineHeight: '1.4' }}>
                  {dailySentence.translation}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    {dailySentence.sentence_date}
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '12px', color: '#999' }}>
                    —— {dailySentence.source}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '16px', textAlign: 'center', color: '#999' }}>
                暂无每日一句
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Home;