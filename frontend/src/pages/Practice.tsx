import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Input, List, Button, Tag, Select, Slider, Rate, message } from 'antd';
import { SearchOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
interface FilterParams {
  theme?: string;
  type?: string;
  skill?: string;
  language?: string;
  format?: string;
  difficulty_min?: number;
  difficulty_max?: number;
  duration_min?: number;
  duration_max?: number;
  date_start?: string;
  date_end?: string;
  search?: string;
}

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
  content_url?: string;
  introduction?: string;
  transcript: string;
  translation: string;
  terms?: Array<{ term: string; translation: string }>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
const { Search } = Input;
const { Option } = Select;

const Practice: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFilters, setSelectedFilters] = useState({
    theme: '',
    type: '',
    skill: '',
    language: '',
    format: '',
    difficultyRange: [1, 5] as [number, number],
    durationRange: [1, 60] as [number, number],
    dateRange: ['', ''] as [string, string]
  });

  const [practiceMaterials, setPracticeMaterials] = useState<PracticeMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  // 筛选选项
  const filterOptions = {
    themes: ['环境', '时政', '经济', '科技', '文教'],
    types: ['演讲', '访谈', '会议', '新闻', '影视'],
    skills: ['关键词', '逻辑关系', '数字', '笔记'],
    languages: ['汉语', '英语'],
    formats: ['音频', '视频']
  };

  // 直接在组件中调用API
const loadMaterials = async (filters: FilterParams = {}) => {
  setLoading(true);
  try {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const url = `/api/materials/?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
    }

    const responseText = await response.text();

    if (!responseText || responseText.trim() === '') {
      throw new Error('后端返回了空响应');
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error('数据格式错误');
    }

    if (Array.isArray(data)) {
      setPracticeMaterials(data);
    } else {
      setPracticeMaterials([]);
    }

  } catch (error) {
    message.error('加载材料失败');
    setPracticeMaterials([]);
  } finally {
    setLoading(false);
  }
};

// 初始加载
useEffect(() => {
  loadMaterials();
}, []);

  const handleFilterChange = (key: string, value: any) => {
    setSelectedFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 应用筛选
 const handleApplyFilters = () => {
  const filters: FilterParams = {
    theme: selectedFilters.theme || undefined,
    type: selectedFilters.type || undefined,
    skill: selectedFilters.skill || undefined,
    language: selectedFilters.language || undefined,
    format: selectedFilters.format || undefined,
    difficulty_min: selectedFilters.difficultyRange[0],
    difficulty_max: selectedFilters.difficultyRange[1],
    duration_min: selectedFilters.durationRange[0],
    duration_max: selectedFilters.durationRange[1],
    date_start: selectedFilters.dateRange[0] || undefined,
    date_end: selectedFilters.dateRange[1] || undefined,
    search: searchText || undefined
  };

  loadMaterials(filters);
};

  // 重置筛选
  const handleResetFilters = () => {
    setSelectedFilters({
      theme: '',
      type: '',
      skill: '',
      language: '',
      format: '',
      difficultyRange: [1, 5],
      durationRange: [1, 60],
      dateRange: ['', '']
    });
    setSearchText('');
    loadMaterials();
  };

  // 搜索处理
  const handleSearch = (value: string) => {
    setSearchText(value);
    if (value) {
      loadMaterials({ search: value });
    } else {
      loadMaterials();
    }
  };

  const handleStartPractice = (material: PracticeMaterial) => {
    navigate(`/material/${material.id}`);
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* 顶部搜索栏 */}
      <Row justify="start" style={{ marginBottom: '24px' }}>
        <Col>
          <Search
            placeholder="搜索练习材料..."
            enterButton={<SearchOutlined />}
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={handleSearch}
          />
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* 左侧筛选栏 */}
        <Col xs={24} lg={6}>
          <Card
            title="筛选条件"
            style={{ marginBottom: '24px' }}
            bodyStyle={{ padding: '16px' }}
          >
            {/* 主题筛选 */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '14px' }}>主题</div>
              <Select
                style={{ width: '100%' }}
                placeholder="选择主题"
                value={selectedFilters.theme || undefined}
                onChange={(value) => handleFilterChange('theme', value)}
                allowClear
              >
                {filterOptions.themes.map(theme => (
                  <Option key={theme} value={theme}>{theme}</Option>
                ))}
              </Select>
            </div>

            {/* 口译类型筛选 */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '14px' }}>口译类型</div>
              <Select
                style={{ width: '100%' }}
                placeholder="选择口译类型"
                value={selectedFilters.type || undefined}
                onChange={(value) => handleFilterChange('type', value)}
                allowClear
              >
                {filterOptions.types.map(type => (
                  <Option key={type} value={type}>{type}</Option>
                ))}
              </Select>
            </div>

            {/* 材料类型筛选 */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '14px' }}>材料类型</div>
              <Select
                style={{ width: '100%' }}
                placeholder="选择材料类型"
                value={selectedFilters.format || undefined}
                onChange={(value) => handleFilterChange('format', value)}
                allowClear
              >
                {filterOptions.formats.map(format => (
                  <Option key={format} value={format}>{format}</Option>
                ))}
              </Select>
            </div>

            {/* 技能筛选 */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '14px' }}>技能</div>
              <Select
                style={{ width: '100%' }}
                placeholder="选择技能"
                value={selectedFilters.skill || undefined}
                onChange={(value) => handleFilterChange('skill', value)}
                allowClear
              >
                {filterOptions.skills.map(skill => (
                  <Option key={skill} value={skill}>{skill}</Option>
                ))}
              </Select>
            </div>

            {/* 源语言筛选 */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '14px' }}>源语言</div>
              <Select
                style={{ width: '100%' }}
                placeholder="选择源语言"
                value={selectedFilters.language || undefined}
                onChange={(value) => handleFilterChange('language', value)}
                allowClear
              >
                {filterOptions.languages.map(language => (
                  <Option key={language} value={language}>{language}</Option>
                ))}
              </Select>
            </div>

            {/* 难度范围筛选 */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '14px' }}>
                难度范围: {selectedFilters.difficultyRange[0]}星 - {selectedFilters.difficultyRange[1]}星
              </div>
              <Slider
                range
                min={1}
                max={5}
                value={selectedFilters.difficultyRange}
                onChange={(value) => handleFilterChange('difficultyRange', value)}
                step={0.5}
              />
            </div>

            {/* 时长范围筛选 */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '14px' }}>
                时长范围: {selectedFilters.durationRange[0]} - {selectedFilters.durationRange[1]} 分钟
              </div>
              <Slider
                range
                min={1}
                max={60}
                value={selectedFilters.durationRange}
                onChange={(value) => handleFilterChange('durationRange', value)}
              />
            </div>

            {/* 发布时间范围筛选 */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '14px' }}>发布时间范围</div>
              <Row gutter={8}>
                <Col span={12}>
                  <Input
                    placeholder="开始日期"
                    type="date"
                    value={selectedFilters.dateRange[0]}
                    onChange={(e) => handleFilterChange('dateRange', [e.target.value, selectedFilters.dateRange[1]])}
                  />
                </Col>
                <Col span={12}>
                  <Input
                    placeholder="结束日期"
                    type="date"
                    value={selectedFilters.dateRange[1]}
                    onChange={(e) => handleFilterChange('dateRange', [selectedFilters.dateRange[0], e.target.value])}
                  />
                </Col>
              </Row>
            </div>

            {/* 按钮组 */}
            <Row gutter={8}>
              <Col span={12}>
                <Button
                  type="primary"
                  block
                  onClick={handleApplyFilters}
                  loading={loading}
                >
                  应用筛选
                </Button>
              </Col>
              <Col span={12}>
                <Button
                  type="default"
                  block
                  onClick={handleResetFilters}
                >
                  重置筛选
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 右侧内容区域 */}
        <Col xs={24} lg={18}>
          <Card
            title="练习材料"
            extra={
              <span style={{ fontSize: '14px', color: '#666' }}>
                共 {practiceMaterials.length} 个材料
              </span>
            }
          >
            {practiceMaterials.length === 0 && !loading ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#999'
              }}>
                暂无材料数据
              </div>
            ) : (
              <List
                dataSource={practiceMaterials}
                loading={loading}
                renderItem={item => (
                  <List.Item
                    style={{
                      padding: '16px',
                      border: '1px solid #f0f0f0',
                      marginBottom: '12px',
                      borderRadius: '8px',
                      background: '#fff'
                    }}
                    actions={[
                      <Button
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        onClick={() => handleStartPractice(item)}
                      >
                        开始练习
                      </Button>
                    ]}
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
                          <Row gutter={[16, 8]} style={{ marginBottom: '8px' }}>
                            <Col>
                              <Tag color="blue">{item.theme}</Tag>
                              <Tag color="green">{item.type}</Tag>
                              <Tag color="orange">{item.format}</Tag>
                              <Tag color="purple">{item.language}</Tag>
                            </Col>
                          </Row>
                          <Row gutter={[16, 8]} align="middle">
                            <Col>
                              <span style={{ marginRight: '16px' }}>
                                难度: <Rate
    disabled
    defaultValue={item.difficulty}
    allowHalf  // 添加这个属性支持半星
    style={{ fontSize: '14px' }}
  />
                              </span>
                              <span style={{ marginRight: '16px' }}>
                                时长: {item.duration}
                              </span>
                              <span style={{ marginRight: '16px' }}>
                                发布时间: {item.date}
                              </span>
                            </Col>
                          </Row>
                          <div style={{ marginTop: '8px' }}>
                            {item.skills && item.skills.map((skill:string, index:number) => (
                              <Tag key={index} color="cyan" style={{ marginRight: '4px', marginBottom: '4px' }}>
                                {skill}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
                pagination={{
                  pageSize: 5,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                }}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Practice;