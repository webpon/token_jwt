const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const fs = require('fs');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// 处理跨域
app.use(cors());
// 解析cookie
app.use(cookieParser());
// 处理application/json数据，并将结果存储在req.body中
app.use(express.json());
// 处理application/x-www-form-urlencoded数据，并将结果存储在req.body中
app.use(express.urlencoded({ extended: false }));

// jwt密钥，用于加密token
const SECRET_KEY = 'your-secret-key';
function authMiddleware(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        console.log('No token provided');
        return res.status(401).send('No token provided');
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            console.log('Invalid token');
            return res.status(401).send('Invalid token');
        }

        // 将解码后的用户信息附加到请求对象上
        req.auth = decoded;
        const currentTime = Math.floor(Date.now() / 1000);
        const expiresIn = decoded.exp - currentTime;

        if (expiresIn < 10 * 60) { // 如果 token 在10分钟内过期
            const newToken = jwt.sign({ username: req.auth.username }, SECRET_KEY, { expiresIn: '1d' });
            res.cookie('token', newToken, {
                httpOnly: true,
                maxAge: 1 * 24 * 60 * 60 * 1000,
                secure: false,
                sameSite: 'strict',
            });
        }
        next();
    });
}

app.get('/index', (req, res) => {
    const html = fs.readFileSync('./client/index.html');
    res.setHeader('Content-Type', 'text/html');
    res.send(html.toString());
});

app.post('/api/login', (req, res) => {
    const user = req.body;

    if (user.username === '') {
        return res.status(400).json({
            message: '账号/密码为空',
        });
    }

    if (user.username === 'webpon' && user.password === 'admin') {
        const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '7d' });
        // 设置 HTTPOnly 的 cookie
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 天（与 JWT 的有效期相同）
            secure: false, // 如果启用 HTTPS，请将其设置为 true
            sameSite: 'strict', // 根据需求设置 SameSite 属性
        });
        res.status(200).json({
            message: '登录成功',
            token
        });
    } else {
        res.status(401).json({
            message: '账号/密码错误',
        });
    }
});

app.get('/admin/getinfo', authMiddleware, (req, res) => {
    res.status(200).json({
        message: '获取用户信息成功',
        data: req.auth.username
    });
});

const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});
