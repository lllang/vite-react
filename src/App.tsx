import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [status, setStatus] = useState<string>('页面加载完成，准备跳转...')
  const [statusType, setStatusType] = useState<'info' | 'success' | 'warning' | 'error'>('info')
  const [btnText, setBtnText] = useState<string>('点击跳转微信')
  const [loading, setLoading] = useState<boolean>(false)
  const [envInfo, setEnvInfo] = useState<string>('环境检测中...')
  const [jumpAttempts, setJumpAttempts] = useState<number>(0)

  // 配置信息 - 这里使用你从接口返回的 urlscheme
  const config = {
    // 微信跳转scheme - 这是从后端API返回的真实值
    wechatScheme: "weixin://dl/business/?t=tLriEynor9d",
    autoJumpDelay: 1500, // 自动跳转延迟
    retryCount: 3 // 重试次数
  }

  // 环境检测
  const detectEnvironment = () => {
    const ua = navigator.userAgent.toLowerCase()
    console.log('User Agent:', ua)

    if (ua.includes('micromessenger')) {
      return { type: 'wechat', name: '微信内置浏览器' }
    } else if (ua.includes('aweme') || ua.includes('toutiao')) {
      return { type: 'douyin', name: '抖音内置浏览器' }
    } else if (ua.includes('dingtalk')) {
      return { type: 'dingtalk', name: '钉钉内置浏览器' }
    } else if (ua.includes('qq/')) {
      return { type: 'qq', name: 'QQ内置浏览器' }
    } else if (ua.includes('weibo')) {
      return { type: 'weibo', name: '微博内置浏览器' }
    } else if (ua.includes('chrome')) {
      return { type: 'chrome', name: 'Chrome浏览器' }
    } else if (ua.includes('safari')) {
      return { type: 'safari', name: 'Safari浏览器' }
    } else {
      return { type: 'unknown', name: '未知浏览器' }
    }
  }

  // 尝试跳转微信
  const attemptWechatJump = (scheme: string, method: 'location' | 'open' | 'iframe' | 'a_click' = 'location') => {
    const newAttempts = jumpAttempts + 1
    setJumpAttempts(newAttempts)
    setStatus(`尝试跳转微信 (${newAttempts}/${config.retryCount})`)
    setStatusType('info')
    setBtnText('跳转中...')
    setLoading(true)

    console.log(`跳转方法: ${method}, Scheme: ${scheme}`)

    try {
      switch (method) {
        case 'location':
          window.location.href = scheme
          break
        case 'open':
          window.open(scheme)
          break
        case 'iframe':
          {
            const iframe = document.createElement('iframe')
            iframe.style.display = 'none'
            iframe.src = scheme
            document.body.appendChild(iframe)
            setTimeout(() => {
              document.body.removeChild(iframe)
            }, 2000)
          }
          break
        case 'a_click':
          {
            const link = document.createElement('a')
            link.href = scheme
            link.style.display = 'none'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
          }
          break
      }

      // 检测跳转是否成功
      setTimeout(() => {
        setBtnText('点击跳转微信')
        setLoading(false)
        if (document.hidden || (document as any).webkitHidden) {
          setStatus('跳转成功！')
          setStatusType('success')
        } else {
          setStatus('跳转可能失败，请手动点击按钮')
          setStatusType('warning')
        }
      }, 2000)
    } catch (error) {
      console.error('跳转失败:', error)
      setStatus(`跳转失败: ${(error as Error).message}`)
      setStatusType('error')
      setBtnText('点击跳转微信')
      setLoading(false)
    }
  }

  // 手动跳转
  const manualJump = () => {
    const env = detectEnvironment()

    if (env.type === 'wechat') {
      setStatus('已在微信中，无需跳转')
      setStatusType('success')
      return
    }

    // 尝试不同的跳转方法
    const methods: Array<'location' | 'open' | 'iframe' | 'a_click'> = ['location', 'open', 'iframe', 'a_click']
    const method = methods[jumpAttempts % methods.length]

    attemptWechatJump(config.wechatScheme, method)
  }

  // 复制当前链接
  const copyCurrentUrl = () => {
    const url = window.location.href
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setStatus('链接已复制到剪贴板')
        setStatusType('success')
      })
    } else {
      // 降级方案
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setStatus('链接已复制到剪贴板')
        setStatusType('success')
      } catch (err) {
        setStatus('复制失败，请手动复制链接')
        setStatusType('error')
      }
      document.body.removeChild(textArea)
    }
  }

  // 页面加载时初始化
  useEffect(() => {
    const env = detectEnvironment()
    setEnvInfo(`环境: ${env.name} | UA: ${navigator.userAgent.substring(0, 30)}...`)

    // 自动跳转（延迟执行）
    const timer = setTimeout(() => {
      if (env.type !== 'wechat') {
        attemptWechatJump(config.wechatScheme, 'location')
      } else {
        setStatus('检测到微信环境，无需跳转')
        setStatusType('success')
      }
    }, config.autoJumpDelay)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="app-container">
      <div className="env-info">{envInfo}</div>

      <div className="container">
        <div className="logo">📱</div>
        <h1 className="title">跳转测试</h1>
        <p className="subtitle">正在为您跳转到微信小程序</p>

        <button className="jump-btn" onClick={manualJump} disabled={loading}>
          <span>{btnText}</span>
          {loading && <span className="loading"></span>}
        </button>

        <div className={`status ${statusType}`}>{status}</div>

        <div className="copy-link" onClick={copyCurrentUrl}>
          复制当前链接
        </div>

        <div className="debug-info">
          <p>调试信息：</p>
          <p>Scheme: {config.wechatScheme}</p>
          <p>尝试次数: {jumpAttempts}</p>
        </div>
      </div>
    </div>
  )
}

export default App
