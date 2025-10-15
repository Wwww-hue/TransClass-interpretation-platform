import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Button, Tabs, Tag, Rate, message, Spin } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, LeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// 定义接口类型
interface Term {
  term: string;
  translation: string;
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
  terms?: Term[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 学习进度接口
interface StudyRecordProgress {
  material_id: number;
  progress: number;
  study_record_id?: number;
}

const { TabPane } = Tabs;

const MaterialDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [materialData, setMaterialData] = useState<PracticeMaterial | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [userProgress, setUserProgress] = useState(0);



  const lastUpdateTimeRef = useRef<number>(0);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const currentTimeRef = useRef<number>(0);

  // 统一的进度跟踪 ref
  const currentProgressRef = useRef(0);
  const lastSaveTimeRef = useRef<number>(0);
  const totalPlayTimeRef = useRef(0);
  const isDraggingRef = useRef(false);

  const handleBack = () => {
    const fromHome = sessionStorage.getItem('fromHome');
    const fromRecent = sessionStorage.getItem('fromRecent');
    const fromProfile = sessionStorage.getItem('fromProfile');

    sessionStorage.removeItem('fromHome');
    sessionStorage.removeItem('fromRecent');
    sessionStorage.removeItem('fromProfile');

    if (fromProfile) {
      navigate('/profile');
    } else if (fromHome) {
      navigate('/');
    } else if (fromRecent) {
      navigate('/recent');
    } else {
      navigate('/practice');
    }
  };

  const getAudioUrl = (contentUrl: string | undefined) => {
    if (!contentUrl) return '';
    if (contentUrl.startsWith('http')) return contentUrl;
    if (contentUrl.startsWith('/')) return `${import.meta.env.VITE_API_URL.replace('/api', '')}${contentUrl}`;
    return contentUrl;
  };

  const durationToSeconds = (duration: string): number => {
    if (!duration) return 0;
    const parts = duration.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return parseInt(duration) * 60;
  };

  const secondsToTimeString = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateProgress = (current: number, total: number): number => {
    if (total === 0) return 0;
    return Math.min(100, Math.round((current / total) * 100));
  };

  // 保存学习进度
  const saveStudyProgress = async (progressVal: number, playDuration: number = 0) => {
    try {
      const response = await fetch(`${API_BASE_URL}/study-records/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material_id: Number(id),
          progress: progressVal,
          is_restart: false,
          play_duration: playDuration
        })
      });

      if (!response.ok) throw new Error('保存学习进度失败');
      return await response.json();
    } catch (error) {
      console.error('保存学习进度失败:', error);
      throw error;
    }
  };

  // 加载学习进度
  const loadStudyProgress = async (materialId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/study-records/material/${materialId}/progress`);

      if (response.ok) {
        const progressData: StudyRecordProgress = await response.json();
        return progressData.progress;
      } else if (response.status === 404) {
        return 0;
      } else {
        throw new Error(`HTTP错误: ${response.status}`);
      }
    } catch (error) {
      console.error('加载学习进度失败:', error);
      return 0;
    }
  };

  // 初始化材料和进度
  useEffect(() => {
    const loadMaterialDetail = async () => {
      if (!id) {
        message.error('材料ID不存在');
        return;
      }

      try {
        setLoading(true);

        const savedProgress = await loadStudyProgress(Number(id));
        setUserProgress(savedProgress);
        currentProgressRef.current = savedProgress;

        const response = await fetch(`${API_BASE_URL}/materials/${id}`);
        if (!response.ok) throw new Error(`HTTP错误: ${response.status}`);
        const data = await response.json();
        setMaterialData(data);

        const totalSeconds = durationToSeconds(data.duration);
        const savedTime = (savedProgress / 100) * totalSeconds;
        setCurrentTime(savedTime);
        setProgress(savedProgress);
        currentTimeRef.current = savedTime;
      } catch (error) {
        console.error('加载材料详情失败:', error);
        message.error('加载材料详情失败');
      } finally {
        setLoading(false);
      }
    };

    loadMaterialDetail();
  }, [id]);

  // 播放定时器
  useEffect(() => {
    if (isPlaying && materialData && !isDraggingRef.current) {
      const totalSeconds = durationToSeconds(materialData.duration);

      lastUpdateTimeRef.current = Date.now();

      timerRef.current = window.setInterval(() => {
        if (isDraggingRef.current) {
          return;
        }

        const now = Date.now();
        const newTime = Math.min(currentTimeRef.current + 1, totalSeconds);

        if (newTime >= totalSeconds) {
          setIsPlaying(false);
          if (audioRef.current) {
            audioRef.current.pause();
          }

          const finalDuration = totalPlayTimeRef.current;
          totalPlayTimeRef.current = 0;
          saveStudyProgress(100, finalDuration);

          if (timerRef.current) {
            clearInterval(timerRef.current);
          }

          setCurrentTime(totalSeconds);
          setProgress(100);
          currentTimeRef.current = totalSeconds;
          currentProgressRef.current = 100;
          return;
        }

        const newProgress = calculateProgress(newTime, totalSeconds);

        setCurrentTime(newTime);
        setProgress(newProgress);
        currentProgressRef.current = newProgress;
        currentTimeRef.current = newTime;

        const timeSinceLastUpdate = Math.floor((now - lastUpdateTimeRef.current) / 1000);
        if (timeSinceLastUpdate > 0) {
          totalPlayTimeRef.current += timeSinceLastUpdate;
          lastUpdateTimeRef.current = now;
        }

        if (now - lastSaveTimeRef.current > 30000 || Math.abs(newProgress - userProgress) >= 5) {
          const durationToSave = totalPlayTimeRef.current;
          totalPlayTimeRef.current = 0;

          saveStudyProgress(newProgress, durationToSave)
            .then(() => {
              setUserProgress(newProgress);
              lastSaveTimeRef.current = now;
            })
            .catch(error => {
              console.error('保存失败:', error);
              totalPlayTimeRef.current += durationToSave;
            });
        }
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, materialData, userProgress, id, isDragging]);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  // 播放/暂停 - 简化逻辑
  const handlePlayPause = () => {
    if (!materialData) return;

    if (!isPlaying) {
      // 直接尝试播放，不检查准备状态
      const playPromise = audioRef.current?.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            message.info('开始播放');
          })
          .catch(error => {
            console.error('播放失败:', error);
            message.warning('音频加载中，请稍后重试');
          });
      }
    } else {
      audioRef.current?.pause();
      setIsPlaying(false);

      if (totalPlayTimeRef.current > 0) {
        const durationToSave = totalPlayTimeRef.current;
        totalPlayTimeRef.current = 0;

        saveStudyProgress(progress, durationToSave)
          .then(() => message.info('暂停播放，进度已保存'))
          .catch(() => {
            totalPlayTimeRef.current += durationToSave;
            message.info('暂停播放');
          });
      } else {
        message.info('暂停播放');
      }
    }
  };

  // 更新进度（拖动或点击）
  const updateProgress = (clientX: number) => {
    if (!materialData || !progressBarRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const width = rect.width;
    const clickPercent = Math.max(0, Math.min(1, clickX / width));

    const totalSeconds = durationToSeconds(materialData.duration);
    const newTime = totalSeconds * clickPercent;
    const newProgress = calculateProgress(newTime, totalSeconds);

    setCurrentTime(newTime);
    setProgress(newProgress);
    currentProgressRef.current = newProgress;
    currentTimeRef.current = newTime;

    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }

    if (!isDraggingRef.current) {
      saveStudyProgress(newProgress, 0).then(() => {
        setUserProgress(newProgress);
      });
    }
  };

  // 拖动处理
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    updateProgress(e.clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDraggingRef.current) {
      updateProgress(e.clientX);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
    lastUpdateTimeRef.current = Date.now();

    saveStudyProgress(currentProgressRef.current, 0).then(() => {
      setUserProgress(currentProgressRef.current);
    });
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) return;
    updateProgress(e.clientX);
  };

  // 组件卸载时保存
  useEffect(() => {
    return () => {
      if (totalPlayTimeRef.current > 0) {
        saveStudyProgress(progress, totalPlayTimeRef.current).catch(
          error => console.error('卸载时保存失败:', error)
        );
      }
    };
  }, [progress]);

  // 简化加载状态：只检查材料内容
  if (loading) {
    return (
      <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip="加载材料内容..." />
      </div>
    );
  }

  if (!materialData) {
    return (
      <div style={{ padding: '24px' }}>
        <Button type="text" icon={<LeftOutlined />} onClick={handleBack} style={{ marginBottom: '16px' }}>
          返回
        </Button>
        <Card>
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            材料不存在或已被删除
          </div>
        </Card>
      </div>
    );
  }

  const totalSeconds = durationToSeconds(materialData.duration);
  const currentTimeString = secondsToTimeString(currentTime);
  const durationString = secondsToTimeString(totalSeconds);

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <Button type="text" icon={<LeftOutlined />} onClick={handleBack} style={{ marginBottom: '16px' }}>
        返回
      </Button>

      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <Card>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>{materialData.title}</h1>
              <div style={{ fontSize: '16px', color: '#666', marginBottom: '12px' }}>{materialData.chinese_title}</div>
              <div style={{ fontSize: '14px', color: '#999' }}>
                来源：{materialData.source || '未知'}  {materialData.date}
                <span style={{ marginLeft: '16px', color: '#1890ff' }}>当前进度: {progress}%</span>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <Tag color="blue">{materialData.theme}</Tag>
              <Tag color="orange">{materialData.format}</Tag>
              <Tag color="purple">{materialData.language}</Tag>
              <Tag color="cyan">难度: <Rate disabled defaultValue={materialData.difficulty} allowHalf style={{ fontSize: '14px', marginLeft: '4px' }}/></Tag>
              <Tag color="red">时长: {materialData.duration}</Tag>
              {materialData.skills.map((skill, index) => <Tag key={index} color="geekblue">{skill}</Tag>)}
            </div>

            <Card style={{ background: '#fff', border: '1px solid #f0f0f0', marginBottom: '24px' }} bodyStyle={{padding: '20px'}}>
              <Row gutter={[16, 16]} align="middle">
                <Col>
                  <Button
                    type="primary"
                    icon={isPlaying ? <PauseCircleOutlined style={{fontSize: '24px'}}/> : <PlayCircleOutlined style={{fontSize: '24px'}}/>}
                    onClick={handlePlayPause}
                    style={{ padding: '8px', width: '48px', height: '48px', borderRadius: '50%' }}
                  />
                </Col>
                <Col flex="auto">
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#333'}}>
                    <span>{currentTimeString}</span>
                    <span>{durationString}</span>
                  </div>
                  <div
                    ref={progressBarRef}
                    style={{
                      width: '100%',
                      height: '6px',
                      background: '#f0f0f0',
                      borderRadius: '3px',
                      position: 'relative',
                      cursor: 'pointer',
                    }}
                    onClick={handleProgressClick}
                  >
                    <div style={{ width: `${progress}%`, height: '100%', background: '#1890ff', borderRadius: '3px', position: 'absolute', top: 0, left: 0 }}/>
                    <div
                      style={{
                        position: 'absolute',
                        left: `${progress}%`,
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: '#1890ff',
                        border: '2px solid #fff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        cursor: isDragging ? 'grabbing' : 'grab',
                        zIndex: 10
                      }}
                      onMouseDown={handleMouseDown}
                    />
                  </div>
                </Col>
              </Row>

              {/* 音频元素 - 完全后台加载，不阻塞界面 */}
              <audio
                ref={audioRef}
                src={getAudioUrl(materialData?.content_url)}
                preload="auto"
                onLoadedMetadata={() => {
                  if (audioRef.current && currentTimeRef.current > 0) {
                    audioRef.current.currentTime = currentTimeRef.current;
                  }

                }}
                onError={() => {
                  console.error('音频加载失败');
                }}
                style={{ display: 'none' }}
              />
            </Card>

            <Tabs defaultActiveKey="transcript">
              <TabPane tab="简介" key="introduction">
                <div style={{
                  padding: '16px',
                  background: '#f8f9fa',
                  borderRadius: '6px'
                }}>{materialData.introduction || '暂无简介'}</div>
              </TabPane>
              <TabPane tab="术语" key="terms">
                <div style={{padding: '16px'}}>
                  {materialData.terms && materialData.terms.length > 0 ? (
                    materialData.terms.map((item, index) => (
                      <div key={index} style={{display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0'}}>
                        <span style={{ fontWeight: '500' }}>{item.term}</span>
                        <span style={{ color: '#666' }}>{item.translation}</span>
                      </div>
                    ))
                  ) : (<div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>暂无术语</div>)}
                </div>
              </TabPane>
              <TabPane tab="原文与译文" key="translation">
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '6px', lineHeight: '1.6', whiteSpace: 'pre-wrap', height: '400px', overflow: 'auto' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '12px', color: '#1890ff' }}>原文：</div>
                      {materialData.transcript}
                    </div>
                  </Col>
                  <Col xs={24} md={12}>
                    <div style={{ padding: '20px', background: '#f0f8ff', borderRadius: '6px', lineHeight: '1.6', whiteSpace: 'pre-wrap', height: '400px', overflow: 'auto' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '12px', color: '#52c41a' }}>参考译文：</div>
                      {materialData.translation}
                    </div>
                  </Col>
                </Row>
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default MaterialDetail;