import React, { useState, useEffect } from 'react';
import './Profile.css';
import { useNavigate } from 'react-router-dom';

// 定义接口类型
interface StudyRecord {
  id: number;
  user_id: number;
  material_id: number;
  progress: number;
  started_at: string;
  last_studied_at: string;
  material: {
    id: number;
    title: string;
    chinese_title: string;
    practice_type: string;
    theme: string;
    duration: string;
  };
}

interface UserStats {
  total_study_hours: number;
  training_days: number;
}

const Profile: React.FC = () => {
  const [studyRecords, setStudyRecords] = useState<StudyRecord[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({ total_study_hours: 0, training_days: 0 });
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5; // 每页固定5个
  const navigate = useNavigate();

  // 计算分页数据
  const getCurrentPageRecords = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return studyRecords.slice(startIndex, endIndex);
  };

  // 计算总页数
  const totalPages = Math.ceil(studyRecords.length / pageSize);

  // 加载学习记录
  useEffect(() => {
    const loadStudyRecords = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/study-records/');

        if (!response.ok) {
          throw new Error(`HTTP错误: ${response.status}`);
        }

        const data = await response.json();
        setStudyRecords(data);
        console.log('📚 学习记录数据:', data);
      } catch (error) {
        console.error('加载学习记录失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStudyRecords();
  }, []);

  // 加载用户统计
  useEffect(() => {
    const loadUserStats = async () => {
      try {
        setStatsLoading(true);
        const response = await fetch('/api/study-records/user-stats');

        if (!response.ok) {
          throw new Error(`HTTP错误: ${response.status}`);
        }

        const data = await response.json();
        setUserStats(data);
        console.log('📊 用户统计数据:', data);
      } catch (error) {
        console.error('加载用户统计失败:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    loadUserStats();
  }, []);

  // 格式化学习时间显示
  const formatStudyTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const studyDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const diffInMs = today.getTime() - studyDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      // 当天显示相对时间
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      if (diffInHours < 1) {
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        return `${diffInMinutes}分钟前`;
      } else {
        return `${diffInHours}小时前`;
      }
    } else if (diffInDays === 1) {
      return '昨天';
    } else if (diffInDays === 2) {
      return '前天';
    } else if (diffInDays <= 7) {
      return `${diffInDays}天前`;
    } else {
      // 超过一周显示具体日期
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    }
  };

  // 获取时长显示
  const getDurationDisplay = (duration: string) => {
    if (!duration) return '未知时长';

    // 如果已经是 "分钟" 格式，直接显示
    if (duration.includes('分钟')) {
      return duration;
    }

    // 如果是 "X:XX" 格式，转换为分钟显示
    if (duration.includes(':')) {
      const parts = duration.split(':');
      if (parts.length === 2) {
        const minutes = parseInt(parts[0]);
        const seconds = parseInt(parts[1]);
        if (seconds > 0) {
          return `${minutes}分${seconds}秒`;
        }
        return `${minutes}分钟`;
      }
    }

    // 默认显示
    return duration;
  };

  // 分页按钮点击处理
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 渲染分页器
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];

    // 上一页按钮
    pages.push(
      <button
        key="prev"
        className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
        onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        上一页
      </button>
    );

    // 页码按钮
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          className={`pagination-btn ${currentPage === i ? 'active' : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }

    // 下一页按钮
    pages.push(
      <button
        key="next"
        className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
        onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        下一页
      </button>
    );

    return pages;
  };

  return (
    <div className="profile-clean">
      <div className="profile-layout">
        {/* 左侧内容 */}
        <section className="left-content">
          {/* 用户信息 */}
          <div className="user-info-section">
            <div className="user-avatar">
              <div className="avatar-placeholder">
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                  <circle cx="30" cy="30" r="30" fill="#1890ff"/>
                  <path d="M30 15C25.03 15 21 19.03 21 24C21 28.97 25.03 33 30 33C34.97 33 39 28.97 39 24C39 19.03 34.97 15 30 15ZM30 45C22.27 45 15.52 49.58 13 56H47C44.48 49.58 37.73 45 30 45Z" fill="white"/>
                </svg>
              </div>
              <div className="user-details">
                <h2 className="username">译员用户</h2>
                <p className="user-bio">专注口译学习与提升</p>
              </div>
            </div>
          </div>

          {/* 学习记录 */}
          <div className="study-section">
            <div className="section-header">
              <h2>学习记录</h2>
              {studyRecords.length > 0 && (
                <div className="pagination-info">
                  共 {studyRecords.length} 条记录，第 {currentPage} / {totalPages} 页
                </div>
              )}
            </div>

            {/* 学习记录列表 */}
            {loading ? (
              <div className="loading-state">加载中...</div>
            ) : studyRecords.length > 0 ? (
              <>
                <div className="study-records-list">
                  {getCurrentPageRecords().map((record) => (
                    <div
                      key={record.id}
                      className="study-record-item"
                      onClick={() => {
                        sessionStorage.setItem('fromProfile', 'true');
                        navigate(`/material/${record.material_id}`);
                      }}
                    >
                      <div className="record-content">
                        <div className="material-title">{record.material.title}</div>
                        <div className="record-meta">
                          <span className="last-study">最后学习: {formatStudyTime(record.last_studied_at)}</span>
                          <span className="material-duration">
                            {getDurationDisplay(record.material.duration)}
                          </span>
                        </div>
                      </div>
                      <div className="progress-tag">
                        <span className={`progress ${record.progress === 100 ? 'completed' : 'in-progress'}`}>
                          {record.progress}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 分页器 */}
                {totalPages > 1 && (
                  <div className="pagination-container">
                    {renderPagination()}
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">
                暂无学习记录，开始您的第一堂口译练习吧！
              </div>
            )}
          </div>
        </section>

        {/* 右侧内容 */}
        <aside className="right-sidebar">
          {/* 统计信息模块 */}
          <div className="stats-module">
            <h3>学习统计</h3>
            {statsLoading ? (
              <div className="loading-state">加载中...</div>
            ) : (
              <div className="stats-cards">
                <div className="stat-item">
                  <div className="stat-value">{userStats.total_study_hours}</div>
                  <div className="stat-name">累计训练时长(小时)</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{userStats.training_days}</div>
                  <div className="stat-name">累计训练天数</div>
                </div>
              </div>
            )}
          </div>

          {/* 笔记模块 */}
          <div className="notes-module">
            <h3>笔记</h3>
            <div className="notes-content">
              <div className="notes-list">
                <div className="note-item">
                  <div className="note-title">商务谈判常用表达整理</div>
                  <div className="note-date">1月15日</div>
                </div>
                <div className="note-item">
                  <div className="note-title">数字口译技巧总结</div>
                  <div className="note-date">1月14日</div>
                </div>
                <div className="note-item">
                  <div className="note-title">政治术语翻译要点</div>
                  <div className="note-date">1月13日</div>
                </div>
              </div>
              <button className="new-note-btn">新建笔记</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Profile;