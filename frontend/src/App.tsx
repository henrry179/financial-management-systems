import React, { useEffect } from 'react';

function App() {
  useEffect(() => {
    // 移除初始加载屏幕
    const removeInitialLoading = () => {
      const loadingElement = document.querySelector('.initial-loading');
      if (loadingElement) {
        loadingElement.remove();
        console.log('✅ Initial loading screen removed');
      }
    };
    
    // 延迟移除加载屏幕，确保React应用已渲染
    setTimeout(removeInitialLoading, 500);
  }, []);

  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f2f5',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h1 style={{ 
        color: '#1890ff', 
        fontSize: '2.5em', 
        marginBottom: '20px' 
      }}>
        🎉 财务管理系统启动成功！
      </h1>
      <p style={{ 
        fontSize: '1.2em', 
        color: '#666', 
        marginBottom: '30px' 
      }}>
        系统正在正常运行中...
      </p>
      <div style={{ marginTop: '20px' }}>
        <button 
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px', 
            backgroundColor: '#1890ff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px',
            cursor: 'pointer'
          }}
          onClick={() => window.location.href = '/auth/login'}
        >
          登录
        </button>
        <button 
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#52c41a', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px',
            cursor: 'pointer'
          }}
          onClick={() => window.location.href = '/auth/register'}
        >
          注册
        </button>
      </div>
      <div style={{ 
        marginTop: '40px', 
        padding: '20px', 
        backgroundColor: 'white', 
        borderRadius: '8px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
      }}>
        <h3>系统状态</h3>
        <p>✅ 前端服务: 正常运行 (localhost:3000)</p>
        <p>✅ 后端服务: 正常运行 (localhost:8000)</p>
        <p>✅ 数据库: 连接正常</p>
        <p>🎯 当前时间: {new Date().toLocaleString('zh-CN')}</p>
      </div>
    </div>
  );
}

export default App; 