const express = require('express')
const app = express()
const jwt = require('jsonwebtoken')
const fs = require('fs')
const cors = require('cors')
app.use(cors())

app.use(express.urlencoded({ extended: false }))  //用于解析前端发送过来的urlencoded请求 

const secretKey = 'falanter abc'  //随便定义一个加密字符串
app.get('/index', function (req, res) {
    const html = fs.readFileSync('./client/index.html')
    res.setHeader('Content-Type', 'text/html')
    res.send(html.toString())
})

app.post('/api/login', function (req, res) {  //接收前端传来的post请求
    const user = req.body
    if (user.username === '') {  //如果传入值为空则返回登录失败
        return res.send({
            status: 400,
            message: '登录失败',
        })
    }
    res.send({  
        // 传回前端的信息
        status: 200,
        message: '登录成功',
        token: jwt.sign({ username: user.username }, secretKey, { expiresIn: '30s' })
        // 3个参数：用户信息，加密秘钥，配置对象(可配置token有效期，秒s，小时h)
    })
})
app.get('/admin/getinfo', function (req, res) {
    let token = req.headers.authorization;
    // 解密
    let payload = jwt.verify(token, secretKey)
    console.log(payload)
    // console.log(req.user)  //前端传来的token通过express-jwt解密后的结果
    res.send({
        status: 200,
        message: '获取用户信息成功',
        data: payload.username
    })
})

app.listen(8000, () => {  //监听本地8000端口
    console.log('localhost:8000')
})