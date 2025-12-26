/**
 * Webhook 测试服务器
 * 用于接收和验证 DoraCMS 发送的 Webhook 请求
 * 
 * 使用方法:
 * 1. node scripts/webhook-test-server.js
 * 2. 在 DoraCMS 中创建 Webhook，URL 设置为 http://localhost:3000/webhook
 * 3. 触发事件，查看控制台输出
 */

const express = require('express');
const crypto = require('crypto');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// 保存原始请求体用于签名验证
app.use(
  bodyParser.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  })
);

// Webhook 接收端点
app.post('/webhook', (req, res) => {
  console.log('\n' + '='.repeat(60));
  console.log('📨 收到 Webhook 请求');
  console.log('='.repeat(60));
  console.log('⏰ 时间:', new Date().toISOString());

  // 打印请求头
  console.log('\n📋 请求头:');
  const headers = {
    'X-Webhook-Event': req.get('X-Webhook-Event'),
    'X-Webhook-ID': req.get('X-Webhook-ID'),
    'X-Webhook-Signature': req.get('X-Webhook-Signature'),
    'X-Webhook-Timestamp': req.get('X-Webhook-Timestamp'),
    'X-Webhook-Delivery': req.get('X-Webhook-Delivery'),
    'Content-Type': req.get('Content-Type'),
  };

  Object.entries(headers).forEach(([key, value]) => {
    if (value) {
      console.log(`  ${key}: ${value}`);
    }
  });

  // 打印请求体
  console.log('\n📦 请求体:');
  console.log(JSON.stringify(req.body, null, 2));

  // 验证签名
  const signature = req.get('X-Webhook-Signature');
  const timestamp = req.get('X-Webhook-Timestamp');

  // 从环境变量或命令行参数获取 secret
  const secret = process.env.WEBHOOK_SECRET || process.argv[2];

  if (signature && timestamp && secret) {
    console.log('\n🔐 验证签名:');
    console.log(`  Secret: ${secret.substring(0, 10)}...`);

    const signString = `${timestamp}.${req.rawBody}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(signString).digest('hex');

    const isValid = signature === expectedSignature;

    if (isValid) {
      console.log('  结果: ✅ 签名验证通过');
    } else {
      console.log('  结果: ❌ 签名验证失败');
      console.log(`  期望签名: ${expectedSignature}`);
      console.log(`  实际签名: ${signature}`);
    }
  } else if (signature && timestamp) {
    console.log('\n⚠️  未提供 Secret，跳过签名验证');
    console.log('   提示: 使用 WEBHOOK_SECRET=your_secret node webhook-test-server.js');
  }

  // 验证时间戳（防止重放攻击）
  if (timestamp) {
    const now = Date.now();
    const requestTime = parseInt(timestamp, 10);
    const timeDiff = Math.abs(now - requestTime);
    const tolerance = 5 * 60 * 1000; // 5分钟

    console.log('\n⏱️  时间戳验证:');
    console.log(`  请求时间: ${new Date(requestTime).toISOString()}`);
    console.log(`  当前时间: ${new Date(now).toISOString()}`);
    console.log(`  时间差: ${(timeDiff / 1000).toFixed(2)} 秒`);

    if (timeDiff > tolerance) {
      console.log(`  结果: ⚠️  时间差超过容差范围 (${tolerance / 1000} 秒)`);
    } else {
      console.log('  结果: ✅ 时间戳有效');
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ 响应: 200 OK');
  console.log('='.repeat(60) + '\n');

  // 返回成功响应
  res.status(200).json({
    success: true,
    message: 'Webhook received successfully',
    receivedAt: new Date().toISOString(),
    event: req.get('X-Webhook-Event'),
    deliveryId: req.get('X-Webhook-Delivery'),
  });
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 根路径
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Webhook 测试服务器</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
          h1 { color: #333; }
          .info { background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0; }
          code { background: #e0e0e0; padding: 2px 5px; border-radius: 3px; }
          .endpoint { color: #0066cc; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>🎯 Webhook 测试服务器</h1>
        <div class="info">
          <p><strong>状态:</strong> 运行中 ✅</p>
          <p><strong>端口:</strong> ${PORT}</p>
          <p><strong>Webhook 端点:</strong> <code class="endpoint">POST http://localhost:${PORT}/webhook</code></p>
          <p><strong>健康检查:</strong> <code>GET http://localhost:${PORT}/health</code></p>
        </div>
        <h2>使用方法</h2>
        <ol>
          <li>在 DoraCMS 管理后台创建 Webhook</li>
          <li>URL 设置为: <code>http://localhost:${PORT}/webhook</code></li>
          <li>选择要监听的事件</li>
          <li>触发事件，查看控制台输出</li>
        </ol>
        <h2>测试命令</h2>
        <pre><code>curl -X POST http://localhost:${PORT}/webhook \\
  -H "Content-Type: application/json" \\
  -H "X-Webhook-Event: test.event" \\
  -H "X-Webhook-ID: test-webhook-id" \\
  -H "X-Webhook-Timestamp: ${Date.now()}" \\
  -d '{"test": true, "message": "Hello Webhook!"}'</code></pre>
      </body>
    </html>
  `);
});

// 启动服务器
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Webhook 测试服务器已启动');
  console.log('='.repeat(60));
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`📝 Webhook 端点: http://localhost:${PORT}/webhook`);
  console.log(`💚 健康检查: http://localhost:${PORT}/health`);

  if (process.env.WEBHOOK_SECRET || process.argv[2]) {
    const secret = process.env.WEBHOOK_SECRET || process.argv[2];
    console.log(`🔐 签名验证: 已启用 (Secret: ${secret.substring(0, 10)}...)`);
  } else {
    console.log('⚠️  签名验证: 未启用');
    console.log('   提示: 使用 WEBHOOK_SECRET=your_secret node webhook-test-server.js');
  }

  console.log('='.repeat(60));
  console.log('\n⏳ 等待接收 Webhook 请求...\n');
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n\n👋 正在关闭服务器...');
  process.exit(0);
});
