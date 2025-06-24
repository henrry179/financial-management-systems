const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000/api/v1';

async function testLogin() {
  console.log('🧪 开始测试登录功能...\n');

  try {
    // 测试1: 健康检查
    console.log('1️⃣ 测试健康检查...');
    const healthResponse = await axios.get('http://localhost:8000/health');
    console.log('✅ 健康检查通过:', healthResponse.data.status);
    console.log('');

    // 测试2: 登录API端点
    console.log('2️⃣ 测试登录API端点...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@financial.com',
      password: 'admin123456'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ 登录成功!');
    console.log('用户信息:', loginResponse.data.data.user);
    console.log('Token类型:', typeof loginResponse.data.data.tokens.accessToken);
    console.log('');

    // 测试3: 无效凭据
    console.log('3️⃣ 测试无效凭据...');
    try {
      await axios.post(`${API_BASE_URL}/auth/login`, {
        email: 'invalid@test.com',
        password: 'wrongpassword'
      });
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ 无效凭据正确处理');
      } else {
        console.log('❌ 无效凭据处理异常:', error.response?.data);
      }
    }
    console.log('');

    // 测试4: 前端访问
    console.log('4️⃣ 测试前端访问...');
    const frontendResponse = await axios.get('http://localhost:3000');
    if (frontendResponse.status === 200) {
      console.log('✅ 前端服务正常');
    } else {
      console.log('❌ 前端服务异常');
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testLogin(); 