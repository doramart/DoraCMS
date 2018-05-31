/**
 * Created by yuexing on 2017/11/16.
 * 常用的加密解密方法
 */
import CryptoJS from "crypto-js";

// import  {salt_aes_key as AESkey,salt_md5_key as MD5key}  from '../../../configs/settings';
const AESkey = "doracms_";
const MD5key = "dora";
export default {
	AES: {
		encrypt: (message) => {//加密
			return CryptoJS.AES.encrypt(message, AESkey, {
				mode: CryptoJS.mode.CBC,
				padding: CryptoJS.pad.Pkcs7
			}).toString();
		},
		decrypt: (encrypt) => {//解密
			return CryptoJS.AES.decrypt(encrypt, AESkey, {
				mode: CryptoJS.mode.CBC,
				padding: CryptoJS.pad.Pkcs7
			}).toString(CryptoJS.enc.Utf8);
		}
	},
	Base64: {
		stringify: (message) => {
			let base64Str = new Buffer(message).toString('base64');
			return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Base64.parse(base64Str));
		}
	},
	SHA: {
		SHA1: (message) => {
			return CryptoJS.SHA1(message).toString();
		}
	},
	MD5: (str) => {
		return CryptoJS.MD5(MD5key + str).toString();
	}
};


