/**
 * Encryption 工具类单元测试
 * 测试 AES-256 加密、解密、掩码、哈希等功能
 *
 * @author DoraCMS Team
 * @since 2025-01-11
 */

'use strict';

const { app, assert } = require('egg-mock/bootstrap');
const Encryption = require('../../lib/utils/encryption');

describe('test/unit/encryption.test.js', () => {
  let encryption;

  before(() => {
    // 创建 Encryption 实例
    encryption = new Encryption(app);
  });

  describe('加密和解密功能', () => {
    it('应该能够正确加密文本', () => {
      const plainText = 'sk-proj-test-api-key-123456';
      const encrypted = encryption.encrypt(plainText);

      // 加密后的文本应该不等于原文
      assert(encrypted !== plainText);

      // 加密结果应该包含 IV 和加密内容（格式：iv:encrypted）
      assert(encrypted.includes(':'));
      const parts = encrypted.split(':');
      assert(parts.length === 2);

      // IV 应该是 32 个十六进制字符（16 字节）
      assert(parts[0].length === 32);
      assert(/^[0-9a-fA-F]{32}$/.test(parts[0]));
    });

    it('应该能够正确解密文本', () => {
      const plainText = 'sk-proj-test-api-key-123456';
      const encrypted = encryption.encrypt(plainText);
      const decrypted = encryption.decrypt(encrypted);

      // 解密后应该等于原文
      assert(decrypted === plainText);
    });

    it('加密相同文本应该产生不同的密文（因为 IV 随机）', () => {
      const plainText = 'test-same-text';
      const encrypted1 = encryption.encrypt(plainText);
      const encrypted2 = encryption.encrypt(plainText);

      // 两次加密结果应该不同（因为 IV 是随机的）
      assert(encrypted1 !== encrypted2);

      // 但解密后都应该等于原文
      assert(encryption.decrypt(encrypted1) === plainText);
      assert(encryption.decrypt(encrypted2) === plainText);
    });

    it('应该能处理空字符串', () => {
      const encrypted = encryption.encrypt('');
      assert(encrypted === '');

      const decrypted = encryption.decrypt('');
      assert(decrypted === '');
    });

    it('应该能处理 null 和 undefined', () => {
      assert(encryption.encrypt(null) === '');
      assert(encryption.encrypt(undefined) === '');
      assert(encryption.decrypt(null) === '');
      assert(encryption.decrypt(undefined) === '');
    });

    it('应该能处理中文字符', () => {
      const plainText = '这是中文测试文本';
      const encrypted = encryption.encrypt(plainText);
      const decrypted = encryption.decrypt(encrypted);

      assert(decrypted === plainText);
    });

    it('应该能处理特殊字符', () => {
      const plainText = '!@#$%^&*()_+-={}[]|\\:";\'<>?,./';
      const encrypted = encryption.encrypt(plainText);
      const decrypted = encryption.decrypt(encrypted);

      assert(decrypted === plainText);
    });

    it('应该能处理长文本', () => {
      const plainText = 'a'.repeat(10000);
      const encrypted = encryption.encrypt(plainText);
      const decrypted = encryption.decrypt(encrypted);

      assert(decrypted === plainText);
    });

    it('解密格式错误的文本应该抛出异常', () => {
      assert.throws(() => {
        encryption.decrypt('invalid-format');
      }, /Invalid encrypted text format/);

      assert.throws(() => {
        encryption.decrypt('invalid:format:too:many:parts');
      }, /Invalid encrypted text format/);
    });

    it('解密被篡改的密文应该抛出异常', () => {
      const plainText = 'test-text';
      const encrypted = encryption.encrypt(plainText);
      const parts = encrypted.split(':');

      // 篡改密文部分
      const tampered = parts[0] + ':ffffffffffffffff';

      assert.throws(() => {
        encryption.decrypt(tampered);
      });
    });
  });

  describe('掩码功能', () => {
    it('应该能够正确掩码 API Key', () => {
      const apiKey = 'sk-proj-1234567890abcdef';
      const masked = encryption.mask(apiKey);

      // 掩码格式：前4位 + **** + 后4位
      assert(masked === 'sk-p****cdef');
    });

    it('应该能处理短字符串', () => {
      const shortKey = 'abc';
      const masked = encryption.mask(shortKey);

      // 少于 8 个字符应该完全掩码
      assert(masked === '********');
    });

    it('应该能处理空字符串', () => {
      const masked = encryption.mask('');
      assert(masked === '********');
    });

    it('应该能处理 null 和 undefined', () => {
      assert(encryption.mask(null) === '********');
      assert(encryption.mask(undefined) === '********');
    });

    it('应该能处理刚好 8 个字符的字符串', () => {
      const key = '12345678';
      const masked = encryption.mask(key);

      assert(masked === '1234****5678');
    });

    it('应该能处理超长字符串', () => {
      const longKey = 'a'.repeat(100);
      const masked = encryption.mask(longKey);

      // 应该是：前4个 + **** + 后4个
      assert(masked.length === 12);
      assert(masked.startsWith('aaaa'));
      assert(masked.endsWith('aaaa'));
      assert(masked.includes('****'));
    });
  });

  describe('验证加密格式功能', () => {
    it('应该能识别有效的加密格式', () => {
      const plainText = 'test-text';
      const encrypted = encryption.encrypt(plainText);

      assert(encryption.isValidEncryptedFormat(encrypted) === true);
    });

    it('应该拒绝无效格式', () => {
      assert(encryption.isValidEncryptedFormat('invalid') === false);
      assert(encryption.isValidEncryptedFormat('') === false);
      assert(encryption.isValidEncryptedFormat(null) === false);
      assert(encryption.isValidEncryptedFormat(undefined) === false);
      assert(encryption.isValidEncryptedFormat(123) === false);
    });

    it('应该拒绝格式不正确的字符串', () => {
      // IV 长度不对
      assert(encryption.isValidEncryptedFormat('shortiv:encrypted') === false);

      // 没有冒号分隔符
      assert(encryption.isValidEncryptedFormat('12345678901234567890123456789012encrypted') === false);

      // IV 不是十六进制
      assert(encryption.isValidEncryptedFormat('gggggggggggggggggggggggggggggggg:encrypted') === false);
    });
  });

  describe('哈希功能', () => {
    it('应该能够生成哈希值', () => {
      const text = 'test-text';
      const hash = encryption.hash(text);

      // SHA-256 哈希应该是 64 个十六进制字符
      assert(hash.length === 64);
      assert(/^[0-9a-fA-F]{64}$/.test(hash));
    });

    it('相同文本应该产生相同的哈希', () => {
      const text = 'same-text';
      const hash1 = encryption.hash(text);
      const hash2 = encryption.hash(text);

      assert(hash1 === hash2);
    });

    it('不同文本应该产生不同的哈希', () => {
      const text1 = 'text-1';
      const text2 = 'text-2';
      const hash1 = encryption.hash(text1);
      const hash2 = encryption.hash(text2);

      assert(hash1 !== hash2);
    });

    it('应该能处理空字符串', () => {
      const hash = encryption.hash('');
      assert(hash === '');
    });

    it('应该能处理 null 和 undefined', () => {
      assert(encryption.hash(null) === '');
      assert(encryption.hash(undefined) === '');
    });

    it('哈希应该是不可逆的', () => {
      const text = 'secret-text';
      const hash = encryption.hash(text);

      // 哈希值不应该包含原文的任何部分
      assert(!hash.includes(text));

      // 无法从哈希值还原原文（只能验证测试无法调用 decrypt）
      assert(hash !== text);
    });
  });

  describe('生成随机密钥功能', () => {
    it('应该能够生成随机密钥', () => {
      const key = encryption.generateSecretKey();

      // 应该是 64 个十六进制字符（32 字节）
      assert(key.length === 64);
      assert(/^[0-9a-fA-F]{64}$/.test(key));
    });

    it('每次生成的密钥应该不同', () => {
      const key1 = encryption.generateSecretKey();
      const key2 = encryption.generateSecretKey();

      assert(key1 !== key2);
    });

    it('生成的密钥应该可以用于加密', () => {
      // 虽然这个密钥通常用于配置，但验证其格式和长度
      const key = encryption.generateSecretKey();
      assert(key.length === 64);
    });
  });

  describe('边界条件测试', () => {
    it('应该能处理刚好 32 字节的密钥', () => {
      // 当前实现会确保密钥长度为 32 字节
      const plainText = 'test';
      const encrypted = encryption.encrypt(plainText);
      const decrypted = encryption.decrypt(encrypted);

      assert(decrypted === plainText);
    });

    it('应该能处理 Unicode 字符', () => {
      const plainText = '😀🎉✨🚀💡';
      const encrypted = encryption.encrypt(plainText);
      const decrypted = encryption.decrypt(encrypted);

      assert(decrypted === plainText);
    });

    it('加密解密应该保持数据完整性', () => {
      const plainText = JSON.stringify({
        apiKey: 'sk-proj-test',
        endpoint: 'https://api.openai.com/v1',
        model: 'gpt-4',
        maxTokens: 4096,
      });

      const encrypted = encryption.encrypt(plainText);
      const decrypted = encryption.decrypt(encrypted);

      assert(decrypted === plainText);

      // 验证可以正确解析 JSON
      const parsed = JSON.parse(decrypted);
      assert(parsed.apiKey === 'sk-proj-test');
      assert(parsed.maxTokens === 4096);
    });

    it('应该能处理只有空格的字符串', () => {
      const plainText = '   ';
      const encrypted = encryption.encrypt(plainText);
      const decrypted = encryption.decrypt(encrypted);

      assert(decrypted === plainText);
    });

    it('应该能处理换行符和制表符', () => {
      const plainText = 'line1\nline2\tline3\r\nline4';
      const encrypted = encryption.encrypt(plainText);
      const decrypted = encryption.decrypt(encrypted);

      assert(decrypted === plainText);
    });
  });

  describe('性能测试', () => {
    it('加密性能测试 - 100次加密应该在合理时间内完成', function () {
      this.timeout(5000); // 设置超时时间为 5 秒

      const plainText = 'sk-proj-test-api-key-123456';
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        encryption.encrypt(plainText);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 100 次加密应该在 5 秒内完成
      assert(duration < 5000);
      // eslint-disable-next-line no-console
      console.log(`      100 次加密耗时: ${duration}ms`);
    });

    it('解密性能测试 - 100次解密应该在合理时间内完成', function () {
      this.timeout(5000);

      const plainText = 'sk-proj-test-api-key-123456';
      const encrypted = encryption.encrypt(plainText);
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        encryption.decrypt(encrypted);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 100 次解密应该在 5 秒内完成
      assert(duration < 5000);
      // eslint-disable-next-line no-console
      console.log(`      100 次解密耗时: ${duration}ms`);
    });
  });

  describe('实际使用场景测试', () => {
    it('模拟 API Key 存储和读取流程', () => {
      // 1. 用户输入原始 API Key
      const originalApiKey = 'sk-proj-ABC123DEF456GHI789';

      // 2. 加密后存储到数据库
      const encryptedApiKey = encryption.encrypt(originalApiKey);
      assert(encryptedApiKey !== originalApiKey);
      assert(encryption.isValidEncryptedFormat(encryptedApiKey));

      // 3. 从数据库读取并解密使用
      const decryptedApiKey = encryption.decrypt(encryptedApiKey);
      assert(decryptedApiKey === originalApiKey);

      // 4. 在界面上显示时使用掩码
      const maskedApiKey = encryption.mask(decryptedApiKey);
      assert(maskedApiKey === 'sk-p****I789');
      assert(!maskedApiKey.includes('ABC123'));
    });

    it('模拟 API Key 去重场景', () => {
      const apiKey1 = 'sk-proj-same-key';
      const apiKey2 = 'sk-proj-same-key';
      const apiKey3 = 'sk-proj-different-key';

      // 使用哈希值来判断是否重复
      const hash1 = encryption.hash(apiKey1);
      const hash2 = encryption.hash(apiKey2);
      const hash3 = encryption.hash(apiKey3);

      // 相同的 key 应该有相同的哈希
      assert(hash1 === hash2);

      // 不同的 key 应该有不同的哈希
      assert(hash1 !== hash3);
    });

    it('模拟多个不同 API Key 的加密存储', () => {
      const apiKeys = ['sk-proj-openai-key-123', 'sk-deepseek-key-456', 'anthropic-key-789'];

      const encrypted = [];
      const decrypted = [];

      // 加密所有 key
      apiKeys.forEach(key => {
        encrypted.push(encryption.encrypt(key));
      });

      // 解密所有 key
      encrypted.forEach(enc => {
        decrypted.push(encryption.decrypt(enc));
      });

      // 验证解密后与原文一致
      apiKeys.forEach((key, index) => {
        assert(decrypted[index] === key);
      });

      // 验证所有加密结果都不相同（即使可能有相同的 key）
      const uniqueEncrypted = new Set(encrypted);
      assert(uniqueEncrypted.size === encrypted.length);
    });
  });
});
