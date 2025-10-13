import React from 'react';
import './Forum.css';

const Forum: React.FC = () => {
  const latestTopics = [
    { id: 1, title: '如何提高同声传译的反应速度？', author: '译员小明', date: '01-15', replies: 24 },
    { id: 2, title: '商务谈判口译注意事项', author: '资深译员', date: '01-15', replies: 18 },
    { id: 3, title: '求助：这个专业术语怎么翻译？', author: '新手译员', date: '01-14', replies: 12 },
    { id: 4, title: '每日口译练习打卡 - Day 45', author: '坚持的小王', date: '01-14', replies: 8 }
  ];

  const featuredTopics = [
    { id: 5, title: '最新政治术语翻译整理', author: '翻译达人', date: '01-13', replies: 31 },
    { id: 6, title: '同声传译设备使用指南', author: '设备专家', date: '01-12', replies: 25 },
    { id: 7, title: '口译员职业发展路径', author: '职业导师', date: '01-11', replies: 42 },
    { id: 8, title: '国际会议口译经验分享', author: '会议译员', date: '01-10', replies: 19 }
  ];

  const categoryCards = [
    { id: 'qna', name: '提问区', description: '遇到翻译难题？在这里提问获得帮助', topicCount: 128, icon: '❓' },
    { id: 'skills', name: '技能分享', description: '分享口译技巧和学习方法', topicCount: 256, icon: '💡' },
    { id: 'materials', name: '材料分享', description: '优质口译练习材料和资源', topicCount: 189, icon: '📚' },
    { id: 'checkin', name: '打卡区', description: '坚持每日练习，互相监督', topicCount: 342, icon: '✅' }
  ];

  return (
    <div className="forum-clean">
      <div className="forum-top-sections">
        <section className="clean-section latest-section">
          <div className="section-header-clean">
            <div className="section-title">
              <div className="title-icon">🆕</div>
              <h2>最新话题</h2>
            </div>
            <a href="/forum/latest" className="view-more-clean">查看更多 →</a>
          </div>
          <div className="clean-topics-list">
            {latestTopics.map(topic => (
              <div key={topic.id} className="clean-topic-item">
                <div className="topic-content">
                  <h3 className="clean-topic-title">{topic.title}</h3>
                  <div className="clean-topic-meta">
                    <span className="author-clean">{topic.author}</span>
                    <span className="replies-clean">{topic.replies}回复</span>
                  </div>
                </div>
                <div className="topic-date-clean">{topic.date}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="clean-section featured-section">
          <div className="section-header-clean">
            <div className="section-title">
              <div className="title-icon">⭐</div>
              <h2>精选话题</h2>
            </div>
            <a href="/forum/featured" className="view-more-clean">查看更多 →</a>
          </div>
          <div className="clean-topics-list">
            {featuredTopics.map(topic => (
              <div key={topic.id} className="clean-topic-item">
                <div className="topic-content">
                  <h3 className="clean-topic-title">{topic.title}</h3>
                  <div className="clean-topic-meta">
                    <span className="author-clean">{topic.author}</span>
                    <span className="replies-clean">{topic.replies}回复</span>
                  </div>
                </div>
                <div className="topic-date-clean">{topic.date}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="categories-clean">
        <div className="categories-grid-clean">
          {categoryCards.map(category => (
            <div key={category.id} className="clean-card">
              <div className="card-header-clean">
                <div className="card-icon-clean">{category.icon}</div>
                <h3>{category.name}</h3>
              </div>
              <p className="card-desc-clean">{category.description}</p>
              <div className="card-footer-clean">
                <span className="count-clean">{category.topicCount} 个话题</span>
                <button className="btn-clean">进入</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Forum;