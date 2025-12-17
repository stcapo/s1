/**
 * 小型网店信息系统 - 前端应用
 * Small Online Store Information System - Frontend App
 * 
 * 所有用户界面文字均为简体中文
 * All UI text is in Simplified Chinese
 */

import { useState, useEffect, useCallback } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import axios from 'axios'

// ============ API 配置 ============
const api = axios.create({
    baseURL: '/api',
    timeout: 10000
})

// ============ 状态管理 (Simple Context) ============
import { createContext, useContext } from 'react'

const CartContext = createContext()

const useCart = () => useContext(CartContext)

const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([])
    const [user, setUser] = useState(null)

    // 从 localStorage 恢复状态
    useEffect(() => {
        const savedCart = localStorage.getItem('cart')
        const savedUser = localStorage.getItem('user')
        if (savedCart) setCart(JSON.parse(savedCart))
        if (savedUser) setUser(JSON.parse(savedUser))
    }, [])

    // 保存到 localStorage
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart))
    }, [cart])

    const addToCart = (product, quantity = 1) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id)
            if (existing) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                )
            }
            return [...prev, { ...product, quantity }]
        })
    }

    const removeFromCart = (productId) => {
        setCart(prev => prev.filter(item => item.id !== productId))
    }

    const updateQuantity = (productId, quantity) => {
        if (quantity < 1) return removeFromCart(productId)
        setCart(prev => prev.map(item =>
            item.id === productId ? { ...item, quantity } : item
        ))
    }

    const clearCart = () => setCart([])

    const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

    const login = (userData, token) => {
        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
        localStorage.setItem('token', token)
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem('user')
        localStorage.removeItem('token')
    }

    return (
        <CartContext.Provider value={{
            cart, addToCart, removeFromCart, updateQuantity, clearCart,
            cartTotal, cartCount, user, login, logout
        }}>
            {children}
        </CartContext.Provider>
    )
}

// ============ 组件: 导航栏 ============
const Navbar = () => {
    const { cartCount, user, logout } = useCart()
    const navigate = useNavigate()

    return (
        <nav className="bg-white shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2">
                        <span className="text-2xl">🛒</span>
                        <span className="text-xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
                            网上商城
                        </span>
                    </Link>

                    {/* 导航链接 */}
                    <div className="hidden md:flex items-center space-x-6">
                        <Link to="/" className="nav-link">首页</Link>
                        <Link to="/category/35" className="nav-link">分类</Link>
                    </div>

                    {/* 右侧操作 */}
                    <div className="flex items-center space-x-4">
                        {/* 购物车 */}
                        <Link to="/cart" className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        {/* 用户 */}
                        {user ? (
                            <div className="flex items-center space-x-4">
                                <Link to="/orders" className="text-gray-600 hover:text-red-500 text-sm">
                                    我的订单
                                </Link>
                                <Link to="/profile" className="text-gray-600 hover:text-red-500 text-sm">
                                    个人中心
                                </Link>
                                {user.role === 'merchant' && (
                                    <Link to="/merchant" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                                        🏪 商家后台
                                    </Link>
                                )}
                                {user.role === 'admin' && (
                                    <Link to="/admin" className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                                        👑 管理后台
                                    </Link>
                                )}
                                <span className="text-gray-600">您好, {user.name}</span>
                                <button onClick={logout} className="text-gray-500 hover:text-red-500 text-sm">
                                    退出
                                </button>
                            </div>
                        ) : (
                            <Link to="/login" className="btn-primary text-sm">
                                登录
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}

// ============ 组件: 商品卡片 ============
const ProductCard = ({ product }) => {
    const { addToCart } = useCart()
    const [adding, setAdding] = useState(false)

    const handleAddToCart = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setAdding(true)
        addToCart(product)
        setTimeout(() => setAdding(false), 500)
    }

    const discount = product.original_price
        ? Math.round((1 - product.price / product.original_price) * 100)
        : 0

    return (
        <Link to={`/product/${product.id}`} className="product-card block">
            {/* 图片 */}
            <div className="relative aspect-square bg-gray-100">
                <img
                    src={product.image_url || '/placeholder.svg'}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f3f4f6" width="100" height="100"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="14">暂无图片</text></svg>'
                    }}
                />
                {discount > 0 && (
                    <span className="absolute top-2 left-2 tag tag-sale">
                        -{discount}%
                    </span>
                )}
            </div>

            {/* 信息 */}
            <div className="p-4">
                <h3 className="font-medium text-gray-800 line-clamp-2 h-12 mb-2">
                    {product.name}
                </h3>

                <div className="flex items-baseline mb-3">
                    <span className="price-tag">¥{product.price}</span>
                    {product.original_price && (
                        <span className="original-price">¥{product.original_price}</span>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">
                        已售 {product.sales_count || 0}
                    </span>
                    <button
                        onClick={handleAddToCart}
                        disabled={adding}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${adding
                            ? 'bg-green-500 text-white'
                            : 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white'
                            }`}
                    >
                        {adding ? '✓ 已添加' : '加入购物车'}
                    </button>
                </div>
            </div>
        </Link>
    )
}

// ============ 页面: 首页 ============
const HomePage = () => {
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState(null)
    const [searching, setSearching] = useState(false)
    const [responseTime, setResponseTime] = useState(null)

    // 加载商品和分类
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productsRes, categoriesRes] = await Promise.all([
                    api.get('/products'),
                    api.get('/categories')
                ])
                setProducts(productsRes.data.products || [])
                setCategories(categoriesRes.data || [])
                setResponseTime(productsRes.data.responseTime)
            } catch (err) {
                console.error('加载数据失败:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    // 搜索防抖
    const debounce = (fn, delay) => {
        let timer
        return (...args) => {
            clearTimeout(timer)
            timer = setTimeout(() => fn(...args), delay)
        }
    }

    const performSearch = useCallback(
        debounce(async (query) => {
            if (!query.trim()) {
                setSearchResults(null)
                setSearching(false)
                return
            }
            setSearching(true)
            try {
                const res = await api.get(`/products?q=${encodeURIComponent(query)}`)
                setSearchResults(res.data.products || [])
                setResponseTime(res.data.responseTime)
            } catch (err) {
                console.error('搜索失败:', err)
            } finally {
                setSearching(false)
            }
        }, 300),
        []
    )

    const handleSearch = (e) => {
        const query = e.target.value
        setSearchQuery(query)
        performSearch(query)
    }

    const displayProducts = searchResults !== null ? searchResults : products

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 text-white py-16">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        欢迎来到网上商城
                    </h1>
                    <p className="text-lg opacity-90 mb-8">
                        高品质商品，超值优惠，快速配送
                    </p>

                    {/* 搜索框 */}
                    <div className="max-w-2xl mx-auto relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearch}
                            placeholder="搜索您想要的商品..."
                            className="search-input text-gray-800"
                        />
                        <svg
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {searching && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <div className="loading-spinner w-5 h-5 border-2"></div>
                            </div>
                        )}
                    </div>

                    {/* 性能指标 */}
                    {responseTime && (
                        <p className="mt-4 text-sm opacity-75">
                            响应时间: {responseTime} {searchResults !== null && `(${searchResults.length} 个结果)`}
                        </p>
                    )}
                </div>
            </section>

            {/* 分类导航 */}
            <section className="bg-white py-6 border-b">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex space-x-6 overflow-x-auto pb-2">
                        {categories.map(cat => (
                            <Link
                                key={cat.id}
                                to={`/category/${cat.id}`}
                                className="whitespace-nowrap px-4 py-2 rounded-full bg-gray-100 hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                                {cat.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* 商品列表 */}
            <section className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {searchResults !== null ? '搜索结果' : '热门商品'}
                    </h2>
                    {searchResults !== null && (
                        <button
                            onClick={() => { setSearchQuery(''); setSearchResults(null); }}
                            className="text-gray-500 hover:text-red-500"
                        >
                            清除搜索
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="loading-spinner"></div>
                    </div>
                ) : displayProducts.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <p className="text-5xl mb-4">😕</p>
                        <p>暂无商品</p>
                    </div>
                ) : (
                    <div className="product-grid">
                        {displayProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}

// ============ 页面: 购物车 ============
const CartPage = () => {
    const { cart, updateQuantity, removeFromCart, cartTotal, clearCart, user } = useCart()
    const navigate = useNavigate()
    const [submitting, setSubmitting] = useState(false)

    const handleCheckout = async () => {
        if (!user) {
            navigate('/login')
            return
        }

        if (cart.length === 0) return

        setSubmitting(true)
        try {
            const items = cart.map(item => ({
                productId: item.id,
                quantity: item.quantity
            }))

            await api.post('/orders', {
                userId: user.id,
                items,
                paymentMethod: 'online'
            })

            alert('订单提交成功！')
            clearCart()
        } catch (err) {
            alert(err.response?.data?.error || '订单提交失败')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">购物车</h1>

                {cart.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center">
                        <p className="text-5xl mb-4">🛒</p>
                        <p className="text-gray-500 mb-4">购物车是空的</p>
                        <Link to="/" className="btn-primary inline-block">
                            去购物
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* 商品列表 */}
                        {cart.map(item => (
                            <div key={item.id} className="bg-white rounded-xl p-4 flex items-center gap-4">
                                <img
                                    src={item.image_url || '/placeholder.svg'}
                                    alt={item.name}
                                    className="w-20 h-20 object-cover rounded-lg"
                                />
                                <div className="flex-1">
                                    <h3 className="font-medium text-gray-800">{item.name}</h3>
                                    <p className="text-red-500 font-bold">¥{item.price}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                        className="w-8 h-8 bg-gray-100 rounded-full hover:bg-gray-200"
                                    >
                                        -
                                    </button>
                                    <span className="w-8 text-center">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        className="w-8 h-8 bg-gray-100 rounded-full hover:bg-gray-200"
                                    >
                                        +
                                    </button>
                                </div>
                                <p className="w-24 text-right font-bold">
                                    ¥{(item.price * item.quantity).toFixed(2)}
                                </p>
                                <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="text-gray-400 hover:text-red-500"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}

                        {/* 结算区 */}
                        <div className="bg-white rounded-xl p-6 mt-6">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-gray-600">商品总计</span>
                                <span className="text-2xl font-bold text-red-500">¥{cartTotal.toFixed(2)}</span>
                            </div>
                            <button
                                onClick={handleCheckout}
                                disabled={submitting}
                                className="w-full btn-primary py-3 text-lg"
                            >
                                {submitting ? '提交中...' : '立即结算'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// ============ 页面: 登录 ============
const LoginPage = () => {
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { login } = useCart()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            if (isLogin) {
                const res = await api.post('/auth/login', { email, password })
                login(res.data.user, res.data.token)
                navigate('/')
            } else {
                await api.post('/auth/register', { email, password, name })
                setIsLogin(true)
                setError('')
                alert('注册成功，请登录')
            }
        } catch (err) {
            setError(err.response?.data?.error || '操作失败')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
                <h1 className="text-2xl font-bold text-center mb-6">
                    {isLogin ? '登录账户' : '注册新账户'}
                </h1>

                {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="input-field"
                                placeholder="请输入您的姓名"
                                required={!isLogin}
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-field"
                            placeholder="请输入邮箱地址"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field"
                            placeholder="请输入密码"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary py-3"
                    >
                        {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
                    </button>
                </form>

                <p className="text-center mt-6 text-gray-600">
                    {isLogin ? '还没有账户？' : '已有账户？'}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-red-500 font-medium ml-1 hover:underline"
                    >
                        {isLogin ? '立即注册' : '立即登录'}
                    </button>
                </p>
            </div>
        </div>
    )
}

// ============ 页面: 商品详情 ============

const ProductDetailPage = () => {
    const { id } = useParams()
    const { addToCart } = useCart()
    const [product, setProduct] = useState(null)
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [quantity, setQuantity] = useState(1)
    const [adding, setAdding] = useState(false)

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await api.get(`/products/${id}`)
                setProduct(res.data.product)
                setReviews(res.data.reviews || [])
            } catch (err) {
                console.error('加载商品失败:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchProduct()
    }, [id])

    const handleAddToCart = () => {
        if (!product) return
        setAdding(true)
        addToCart(product, quantity)
        setTimeout(() => setAdding(false), 800)
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="loading-spinner"></div>
            </div>
        )
    }

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-5xl mb-4">😕</p>
                    <p className="text-gray-500">商品不存在</p>
                    <Link to="/" className="btn-primary inline-block mt-4">返回首页</Link>
                </div>
            </div>
        )
    }

    const discount = product.original_price
        ? Math.round((1 - product.price / product.original_price) * 100)
        : 0

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                {/* 面包屑 */}
                <nav className="mb-6 text-sm">
                    <Link to="/" className="text-gray-500 hover:text-red-500">首页</Link>
                    <span className="mx-2 text-gray-400">/</span>
                    <span className="text-gray-800">{product.name}</span>
                </nav>

                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="grid md:grid-cols-2 gap-8 p-6">
                        {/* 商品图片 */}
                        <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                            <img
                                src={product.image_url || '/placeholder.svg'}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f3f4f6" width="100" height="100"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="12">暂无图片</text></svg>'
                                }}
                            />
                        </div>

                        {/* 商品信息 */}
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-bold text-gray-800 mb-2">{product.name}</h1>

                            {product.category_name && (
                                <span className="text-sm text-gray-500 mb-4">分类: {product.category_name}</span>
                            )}

                            <div className="flex items-baseline gap-3 mb-4">
                                <span className="text-3xl font-bold text-red-500">¥{product.price}</span>
                                {product.original_price && (
                                    <>
                                        <span className="text-lg text-gray-400 line-through">¥{product.original_price}</span>
                                        <span className="px-2 py-1 bg-red-100 text-red-500 text-sm rounded">-{discount}%</span>
                                    </>
                                )}
                            </div>

                            <p className="text-gray-600 mb-6">{product.description}</p>

                            <div className="flex items-center gap-4 mb-6">
                                <span className="text-gray-600">数量:</span>
                                <div className="flex items-center border rounded-lg">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="px-4 py-2 hover:bg-gray-100"
                                    >-</button>
                                    <span className="px-4 py-2 border-x">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="px-4 py-2 hover:bg-gray-100"
                                    >+</button>
                                </div>
                                <span className="text-gray-400 text-sm">库存: {product.stock}</span>
                            </div>

                            <div className="flex gap-4 mt-auto">
                                <button
                                    onClick={handleAddToCart}
                                    disabled={adding}
                                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${adding
                                        ? 'bg-green-500 text-white'
                                        : 'bg-red-500 text-white hover:bg-red-600'
                                        }`}
                                >
                                    {adding ? '✓ 已加入购物车' : '加入购物车'}
                                </button>
                                <Link to="/cart" className="flex-1 py-3 rounded-xl font-medium bg-gray-800 text-white text-center hover:bg-gray-900">
                                    立即购买
                                </Link>
                            </div>

                            <div className="mt-6 pt-6 border-t text-sm text-gray-500">
                                <p>✓ 正品保证</p>
                                <p>✓ 7天无理由退换</p>
                                <p>✓ 极速发货</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 商品评论 */}
                <div className="bg-white rounded-2xl shadow-sm mt-6 p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">商品评价 ({reviews.length})</h2>
                    {reviews.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">暂无评价</p>
                    ) : (
                        <div className="space-y-4">
                            {reviews.map((review, idx) => (
                                <div key={idx} className="border-b pb-4 last:border-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-medium">{review.user_name || '匿名用户'}</span>
                                        <span className="text-yellow-500">{'★'.repeat(review.rating || 5)}</span>
                                    </div>
                                    <p className="text-gray-600">{review.comment}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ============ 页面: 订单历史 ============
const OrdersPage = () => {
    const { user } = useCart()
    const navigate = useNavigate()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) {
            navigate('/login')
            return
        }

        const fetchOrders = async () => {
            try {
                const res = await api.get(`/orders?userId=${user.id}`)
                setOrders(res.data.orders || [])
            } catch (err) {
                console.error('加载订单失败:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchOrders()
    }, [user, navigate])

    const getStatusText = (status) => {
        const statusMap = {
            'pending': '待付款',
            'paid': '已付款',
            'shipped': '已发货',
            'delivered': '已送达',
            'completed': '已完成',
            'cancelled': '已取消'
        }
        return statusMap[status] || status
    }

    const getStatusColor = (status) => {
        const colorMap = {
            'pending': 'bg-yellow-100 text-yellow-600',
            'paid': 'bg-blue-100 text-blue-600',
            'shipped': 'bg-purple-100 text-purple-600',
            'delivered': 'bg-green-100 text-green-600',
            'completed': 'bg-gray-100 text-gray-600',
            'cancelled': 'bg-red-100 text-red-600'
        }
        return colorMap[status] || 'bg-gray-100 text-gray-600'
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="loading-spinner"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">我的订单</h1>

                {orders.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center">
                        <p className="text-5xl mb-4">📦</p>
                        <p className="text-gray-500 mb-4">暂无订单</p>
                        <Link to="/" className="btn-primary inline-block">去购物</Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map(order => (
                            <div key={order.id} className="bg-white rounded-xl p-6 shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-sm text-gray-500">订单号: {order.order_no}</p>
                                        <p className="text-sm text-gray-400">{new Date(order.created_at).toLocaleString('zh-CN')}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                                        {getStatusText(order.status)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t">
                                    <span className="text-gray-600">共 {order.item_count || 1} 件商品</span>
                                    <span className="text-xl font-bold text-red-500">¥{order.total_amount}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

// ============ 商家后台 ============
const MerchantDashboard = () => {
    const { user } = useCart()
    const navigate = useNavigate()
    const [stats, setStats] = useState({ totalSales: 0, totalOrders: 0, totalProducts: 0 })
    const [products, setProducts] = useState([])
    const [orders, setOrders] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingProduct, setEditingProduct] = useState(null)
    const [formData, setFormData] = useState({
        name: '', description: '', price: '', originalPrice: '', stock: '', categoryId: '', imageUrl: ''
    })

    useEffect(() => {
        if (!user || user.role !== 'merchant') {
            navigate('/login')
            return
        }
        fetchData()
    }, [user, navigate])

    const fetchData = async () => {
        try {
            const [productsRes, ordersRes, catsRes] = await Promise.all([
                api.get(`/merchant/products?merchantId=${user.id}`),
                api.get(`/merchant/orders?merchantId=${user.id}`),
                api.get('/categories')
            ])
            setProducts(productsRes.data.products || [])
            setOrders(ordersRes.data.orders || [])
            setCategories(catsRes.data || [])
            const totalSales = ordersRes.data.orders?.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0) || 0
            setStats({
                totalProducts: productsRes.data.pagination?.total || 0,
                totalOrders: ordersRes.data.pagination?.total || 0,
                totalSales: totalSales.toFixed(2)
            })
        } catch (err) {
            console.error('加载商家数据失败:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const payload = {
                merchantId: user.id,
                categoryId: formData.categoryId || null,
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
                stock: parseInt(formData.stock) || 0,
                imageUrl: formData.imageUrl
            }

            if (editingProduct) {
                await api.put(`/merchant/products/${editingProduct.id}`, payload)
                alert('商品更新成功')
            } else {
                await api.post('/merchant/products', payload)
                alert('商品添加成功')
            }
            setShowForm(false)
            setEditingProduct(null)
            setFormData({ name: '', description: '', price: '', originalPrice: '', stock: '', categoryId: '', imageUrl: '' })
            fetchData()
        } catch (error) {
            alert(error.response?.data?.error || '操作失败')
        }
    }

    const handleEdit = (product) => {
        setEditingProduct(product)
        setFormData({
            name: product.name,
            description: product.description || '',
            price: product.price,
            originalPrice: product.original_price || '',
            stock: product.stock,
            categoryId: product.category_id || '',
            imageUrl: product.image_url || ''
        })
        setShowForm(true)
    }

    const handleDelete = async (id) => {
        if (!confirm('确定下架该商品？')) return
        try {
            await api.delete(`/merchant/products/${id}?merchantId=${user.id}`)
            fetchData()
        } catch (error) {
            alert('删除失败')
        }
    }

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await api.put(`/merchant/orders/${orderId}/status`, { status: newStatus, merchantId: user.id })
            fetchData()
        } catch (error) {
            alert('更新失败')
        }
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="loading-spinner"></div></div>

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">商家后台</h1>

                {/* 统计卡片 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center"><span className="text-2xl">📦</span></div>
                            <div><p className="text-gray-500 text-sm">商品总数</p><p className="text-2xl font-bold">{stats.totalProducts}</p></div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center"><span className="text-2xl">🛒</span></div>
                            <div><p className="text-gray-500 text-sm">订单数量</p><p className="text-2xl font-bold">{stats.totalOrders}</p></div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center"><span className="text-2xl">💰</span></div>
                            <div><p className="text-gray-500 text-sm">销售额</p><p className="text-2xl font-bold">¥{stats.totalSales}</p></div>
                        </div>
                    </div>
                </div>

                {/* 商品管理 */}
                <div className="bg-white rounded-xl shadow-sm mb-8">
                    <div className="p-6 border-b flex justify-between items-center">
                        <h2 className="text-lg font-bold">商品管理</h2>
                        <button onClick={() => { setShowForm(true); setEditingProduct(null); setFormData({ name: '', description: '', price: '', originalPrice: '', stock: '', categoryId: '', imageUrl: '' }); }}
                            className="btn-primary">+ 添加商品</button>
                    </div>

                    {showForm && (
                        <form onSubmit={handleSubmit} className="p-6 border-b bg-gray-50 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" placeholder="商品名称*" required className="input-field" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                <select className="input-field" value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })}>
                                    <option value="">选择分类</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <textarea placeholder="商品描述" className="input-field w-full" rows="2" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            <div className="grid grid-cols-4 gap-4">
                                <input type="number" step="0.01" placeholder="售价*" required className="input-field" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                                <input type="number" step="0.01" placeholder="原价" className="input-field" value={formData.originalPrice} onChange={e => setFormData({ ...formData, originalPrice: e.target.value })} />
                                <input type="number" placeholder="库存*" required className="input-field" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} />
                                <input type="text" placeholder="图片URL" className="input-field" value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} />
                            </div>
                            <div className="flex gap-3">
                                <button type="submit" className="btn-primary">{editingProduct ? '更新商品' : '添加商品'}</button>
                                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>取消</button>
                            </div>
                        </form>
                    )}

                    <div className="divide-y">
                        {products.length === 0 ? (
                            <p className="p-6 text-center text-gray-500">暂无商品</p>
                        ) : products.map(product => (
                            <div key={product.id} className="p-4 flex items-center gap-4">
                                <img src={product.image_url || '/placeholder.svg'} alt={product.name} className="w-16 h-16 object-cover rounded" />
                                <div className="flex-1">
                                    <h3 className="font-medium">{product.name}</h3>
                                    <p className="text-sm text-gray-500">库存: {product.stock} | 分类: {product.category_name || '-'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-red-500 font-bold">¥{product.price}</p>
                                    <p className="text-sm text-gray-400">已售 {product.sales_count || 0}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(product)} className="text-blue-500 hover:underline text-sm">编辑</button>
                                    <button onClick={() => handleDelete(product.id)} className="text-red-500 hover:underline text-sm">下架</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 订单管理 */}
                <div className="bg-white rounded-xl shadow-sm">
                    <div className="p-6 border-b"><h2 className="text-lg font-bold">订单管理</h2></div>
                    <div className="divide-y">
                        {orders.length === 0 ? (
                            <p className="p-6 text-center text-gray-500">暂无订单</p>
                        ) : orders.map(order => (
                            <div key={order.id} className="p-4 flex items-center gap-4">
                                <div className="flex-1">
                                    <p className="font-medium">{order.order_no}</p>
                                    <p className="text-sm text-gray-500">{order.customer_name} | {order.item_count}件商品</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-red-500 font-bold">¥{order.total_amount}</p>
                                    <p className="text-sm text-gray-400">{new Date(order.created_at).toLocaleDateString()}</p>
                                </div>
                                <select value={order.status} onChange={e => handleStatusChange(order.id, e.target.value)} className="border rounded px-2 py-1 text-sm">
                                    <option value="pending">待付款</option>
                                    <option value="paid">已付款</option>
                                    <option value="shipped">已发货</option>
                                    <option value="delivered">已送达</option>
                                    <option value="cancelled">已取消</option>
                                </select>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ============ 管理员后台 ============
const AdminDashboard = () => {
    const { user } = useCart()
    const navigate = useNavigate()
    const [stats, setStats] = useState({ users: 0, merchants: 0, products: 0, orders: 0 })
    const [users, setUsers] = useState([])
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/login')
            return
        }
        fetchData()
    }, [user, navigate])

    const fetchData = async () => {
        try {
            const [productsRes, categoriesRes] = await Promise.all([
                api.get('/products?limit=100'),
                api.get('/categories')
            ])
            setStats({
                products: productsRes.data.pagination?.total || 0,
                categories: categoriesRes.data?.length || 0,
                orders: 10,
                users: 10
            })
        } catch (err) {
            console.error('加载数据失败:', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="loading-spinner"></div></div>

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">🔧 管理员控制台</h1>
                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                        Admin: {user?.name}
                    </span>
                </div>

                {/* 系统统计 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg">
                        <p className="text-blue-100 text-sm">商品总数</p>
                        <p className="text-3xl font-bold">{stats.products}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg">
                        <p className="text-green-100 text-sm">分类数量</p>
                        <p className="text-3xl font-bold">{stats.categories}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
                        <p className="text-purple-100 text-sm">用户数量</p>
                        <p className="text-3xl font-bold">{stats.users}</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-6 shadow-lg">
                        <p className="text-orange-100 text-sm">订单数量</p>
                        <p className="text-3xl font-bold">{stats.orders}</p>
                    </div>
                </div>

                {/* 管理功能 */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold mb-4">📊 系统状态</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">MySQL 数据库</span>
                                <span className="bg-green-100 text-green-600 px-2 py-0.5 rounded text-sm">✓ 运行中</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Redis 缓存</span>
                                <span className="bg-green-100 text-green-600 px-2 py-0.5 rounded text-sm">✓ 运行中</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">后端 API</span>
                                <span className="bg-green-100 text-green-600 px-2 py-0.5 rounded text-sm">✓ 运行中</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Prometheus 监控</span>
                                <span className="bg-green-100 text-green-600 px-2 py-0.5 rounded text-sm">✓ 运行中</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold mb-4">🔗 快捷链接</h2>
                        <div className="grid grid-cols-2 gap-3">
                            <a href="http://localhost:3001" target="_blank" rel="noopener noreferrer"
                                className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 text-center">
                                <span className="text-2xl">📈</span>
                                <p className="mt-1 text-sm text-gray-600">Grafana</p>
                            </a>
                            <a href="http://localhost:9090" target="_blank" rel="noopener noreferrer"
                                className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 text-center">
                                <span className="text-2xl">📊</span>
                                <p className="mt-1 text-sm text-gray-600">Prometheus</p>
                            </a>
                            <Link to="/merchant" className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 text-center">
                                <span className="text-2xl">🏪</span>
                                <p className="mt-1 text-sm text-gray-600">商家后台</p>
                            </Link>
                            <a href="http://localhost:3000/api/health" target="_blank" rel="noopener noreferrer"
                                className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 text-center">
                                <span className="text-2xl">💓</span>
                                <p className="mt-1 text-sm text-gray-600">API 健康</p>
                            </a>
                        </div>
                    </div>
                </div>

                {/* 用户角色说明 */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-bold mb-4">👥 系统角色</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="border rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">👤</span>
                                <span className="font-medium">普通用户</span>
                            </div>
                            <p className="text-sm text-gray-500">浏览商品、下单购买、管理订单</p>
                        </div>
                        <div className="border rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">🏪</span>
                                <span className="font-medium">商家</span>
                            </div>
                            <p className="text-sm text-gray-500">管理商品、处理订单、查看销售</p>
                        </div>
                        <div className="border border-purple-200 bg-purple-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">👑</span>
                                <span className="font-medium text-purple-700">管理员</span>
                            </div>
                            <p className="text-sm text-purple-600">系统监控、用户管理、数据统计</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ============ 分类浏览页面 ============
const CategoryPage = () => {
    const { id } = useParams()
    const [addToCart] = [useCart().addToCart]
    const [products, setProducts] = useState([])
    const [category, setCategory] = useState(null)
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [sort, setSort] = useState('sales')
    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 })

    useEffect(() => {
        fetchCategories()
    }, [])

    useEffect(() => {
        if (id) fetchProducts()
    }, [id, sort, page])

    const fetchCategories = async () => {
        try {
            const { data } = await api.get('/categories')
            setCategories(data)
            if (id) {
                const cat = data.find(c => c.id === parseInt(id))
                setCategory(cat)
            }
        } catch (error) {
            console.error('获取分类失败:', error)
        }
    }

    const fetchProducts = async () => {
        setLoading(true)
        try {
            const sortMap = { sales: '', price_asc: '&sort=price_asc', price_desc: '&sort=price_desc' }
            const { data } = await api.get(`/products?category=${id}&page=${page}&limit=20${sortMap[sort] || ''}`)
            setProducts(data.products)
            setPagination(data.pagination)
            const cat = categories.find(c => c.id === parseInt(id))
            setCategory(cat)
        } catch (error) {
            console.error('获取商品失败:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* 分类导航 */}
            <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
                {categories.map(cat => (
                    <Link
                        key={cat.id}
                        to={`/category/${cat.id}`}
                        className={`px-4 py-2 rounded-full whitespace-nowrap transition ${parseInt(id) === cat.id
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {cat.name}
                    </Link>
                ))}
            </div>

            {/* 标题和排序 */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">
                    {category?.name || '全部商品'}
                    <span className="text-gray-400 text-base font-normal ml-2">({pagination.total} 件商品)</span>
                </h1>
                <select
                    value={sort}
                    onChange={e => { setSort(e.target.value); setPage(1); }}
                    className="border rounded-lg px-3 py-2 text-sm"
                >
                    <option value="sales">按销量</option>
                    <option value="price_asc">价格从低到高</option>
                    <option value="price_desc">价格从高到低</option>
                </select>
            </div>

            {/* 商品列表 */}
            {loading ? (
                <div className="text-center py-20"><div className="loading-spinner mx-auto"></div></div>
            ) : products.length === 0 ? (
                <div className="text-center py-20 text-gray-500">暂无商品</div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {products.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}

            {/* 分页 */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                    {Array.from({ length: pagination.totalPages }, (_, i) => (
                        <button
                            key={i + 1}
                            onClick={() => setPage(i + 1)}
                            className={`px-4 py-2 rounded ${page === i + 1 ? 'bg-red-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

// ============ 搜索结果页面 ============
const SearchPage = () => {
    const [searchParams] = useSearchParams()
    const query = searchParams.get('q') || ''
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [responseTime, setResponseTime] = useState('')
    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 })

    useEffect(() => {
        if (query) searchProducts()
    }, [query, page])

    const searchProducts = async () => {
        setLoading(true)
        try {
            const { data } = await api.get(`/products?q=${encodeURIComponent(query)}&page=${page}&limit=20`)
            setProducts(data.products)
            setPagination(data.pagination)
            setResponseTime(data.responseTime)
        } catch (error) {
            console.error('搜索失败:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* 搜索信息 */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold">
                    搜索结果: "{query}"
                </h1>
                <p className="text-gray-500 mt-1">
                    找到 {pagination.total} 件商品
                    {responseTime && <span className="ml-2 text-xs">(耗时 {responseTime})</span>}
                </p>
            </div>

            {/* 商品列表 */}
            {loading ? (
                <div className="text-center py-20"><div className="loading-spinner mx-auto"></div></div>
            ) : products.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-gray-500 text-lg mb-4">未找到相关商品</p>
                    <Link to="/" className="text-red-500 hover:underline">返回首页</Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {products.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}

            {/* 分页 */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                    {Array.from({ length: Math.min(pagination.totalPages, 10) }, (_, i) => (
                        <button
                            key={i + 1}
                            onClick={() => setPage(i + 1)}
                            className={`px-4 py-2 rounded ${page === i + 1 ? 'bg-red-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

// ============ 结算页面 ============
const CheckoutPage = () => {
    const { cart, cartTotal, clearCart, user } = useCart()
    const navigate = useNavigate()
    const [addresses, setAddresses] = useState([])
    const [selectedAddress, setSelectedAddress] = useState(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [showAddForm, setShowAddForm] = useState(false)
    const [newAddress, setNewAddress] = useState({
        recipientName: '', phone: '', province: '', city: '', district: '', address: ''
    })

    useEffect(() => {
        if (!user) {
            navigate('/login')
            return
        }
        fetchAddresses()
    }, [user])

    const fetchAddresses = async () => {
        try {
            const { data } = await api.get(`/addresses?userId=${user.id}`)
            setAddresses(data.addresses)
            if (data.addresses.length > 0) {
                setSelectedAddress(data.addresses.find(a => a.is_default) || data.addresses[0])
            }
        } catch (error) {
            console.error('获取地址失败:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddAddress = async (e) => {
        e.preventDefault()
        try {
            await api.post('/addresses', {
                userId: user.id,
                ...newAddress,
                isDefault: addresses.length === 0
            })
            setShowAddForm(false)
            setNewAddress({ recipientName: '', phone: '', province: '', city: '', district: '', address: '' })
            fetchAddresses()
        } catch (error) {
            alert('添加地址失败')
        }
    }

    const handleSubmitOrder = async () => {
        if (!selectedAddress) {
            alert('请选择收货地址')
            return
        }
        if (cart.length === 0) {
            alert('购物车为空')
            return
        }

        setSubmitting(true)
        try {
            const { data } = await api.post('/orders', {
                userId: user.id,
                items: cart.map(item => ({ productId: item.id, quantity: item.quantity })),
                addressId: selectedAddress.id,
                paymentMethod: 'online'
            })
            clearCart()
            alert(`订单创建成功！订单号：${data.order.orderNo}`)
            navigate('/orders')
        } catch (error) {
            alert(error.response?.data?.error || '创建订单失败')
        } finally {
            setSubmitting(false)
        }
    }

    if (!user) return null
    if (loading) return <div className="max-w-4xl mx-auto p-8 text-center">加载中...</div>

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">确认订单</h1>

            {/* 收货地址 */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">收货地址</h2>

                {addresses.length === 0 ? (
                    <p className="text-gray-500 mb-4">暂无收货地址，请添加</p>
                ) : (
                    <div className="space-y-3 mb-4">
                        {addresses.map(addr => (
                            <label
                                key={addr.id}
                                className={`block p-4 border rounded-lg cursor-pointer transition ${selectedAddress?.id === addr.id ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    className="mr-3"
                                    checked={selectedAddress?.id === addr.id}
                                    onChange={() => setSelectedAddress(addr)}
                                />
                                <span className="font-medium">{addr.recipient_name}</span>
                                <span className="ml-4 text-gray-600">{addr.phone}</span>
                                <p className="mt-1 text-gray-500 ml-6">
                                    {addr.province}{addr.city}{addr.district}{addr.address}
                                </p>
                            </label>
                        ))}
                    </div>
                )}

                {showAddForm ? (
                    <form onSubmit={handleAddAddress} className="border-t pt-4 mt-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="收货人姓名"
                                className="input-field"
                                value={newAddress.recipientName}
                                onChange={e => setNewAddress({ ...newAddress, recipientName: e.target.value })}
                                required
                            />
                            <input
                                type="tel"
                                placeholder="手机号码"
                                className="input-field"
                                value={newAddress.phone}
                                onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <input type="text" placeholder="省份" className="input-field"
                                value={newAddress.province}
                                onChange={e => setNewAddress({ ...newAddress, province: e.target.value })} />
                            <input type="text" placeholder="城市" className="input-field"
                                value={newAddress.city}
                                onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} />
                            <input type="text" placeholder="区县" className="input-field"
                                value={newAddress.district}
                                onChange={e => setNewAddress({ ...newAddress, district: e.target.value })} />
                        </div>
                        <input
                            type="text"
                            placeholder="详细地址"
                            className="input-field w-full"
                            value={newAddress.address}
                            onChange={e => setNewAddress({ ...newAddress, address: e.target.value })}
                            required
                        />
                        <div className="flex gap-3">
                            <button type="submit" className="btn-primary">保存地址</button>
                            <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}>取消</button>
                        </div>
                    </form>
                ) : (
                    <button className="text-red-500 hover:text-red-600" onClick={() => setShowAddForm(true)}>
                        + 添加新地址
                    </button>
                )}
            </div>

            {/* 商品清单 */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">商品清单</h2>
                <div className="divide-y">
                    {cart.map(item => (
                        <div key={item.id} className="py-3 flex items-center gap-4">
                            <img src={item.image_url || '/placeholder.svg'} alt={item.name}
                                className="w-16 h-16 object-cover rounded" />
                            <div className="flex-1">
                                <p className="font-medium">{item.name}</p>
                                <p className="text-gray-500 text-sm">¥{item.price} × {item.quantity}</p>
                            </div>
                            <p className="text-red-500 font-bold">¥{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* 订单汇总 */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-lg">商品总额</span>
                    <span className="text-2xl font-bold text-red-500">¥{cartTotal.toFixed(2)}</span>
                </div>
                <button
                    onClick={handleSubmitOrder}
                    disabled={submitting || cart.length === 0}
                    className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {submitting ? '提交中...' : '提交订单'}
                </button>
            </div>
        </div>
    )
}

// ============ 用户中心页面 ============
const ProfilePage = () => {
    const { user, logout } = useCart()
    const navigate = useNavigate()
    const [profile, setProfile] = useState(null)
    const [addresses, setAddresses] = useState([])
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [editForm, setEditForm] = useState({ name: '', phone: '' })

    useEffect(() => {
        if (!user) {
            navigate('/login')
            return
        }
        fetchData()
    }, [user])

    const fetchData = async () => {
        try {
            const [profileRes, addressesRes] = await Promise.all([
                api.get(`/auth/profile?userId=${user.id}`),
                api.get(`/addresses?userId=${user.id}`)
            ])
            setProfile(profileRes.data.user)
            setAddresses(addressesRes.data.addresses)
            setEditForm({ name: profileRes.data.user.name, phone: profileRes.data.user.phone || '' })
        } catch (error) {
            console.error('获取数据失败:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateProfile = async (e) => {
        e.preventDefault()
        try {
            await api.put('/auth/profile', { userId: user.id, ...editForm })
            setProfile({ ...profile, ...editForm })
            setEditing(false)
            alert('信息更新成功')
        } catch (error) {
            alert('更新失败')
        }
    }

    const handleDeleteAddress = async (id) => {
        if (!confirm('确定删除该地址？')) return
        try {
            await api.delete(`/addresses/${id}?userId=${user.id}`)
            setAddresses(addresses.filter(a => a.id !== id))
        } catch (error) {
            alert('删除失败')
        }
    }

    if (!user) return null
    if (loading) return <div className="max-w-4xl mx-auto p-8 text-center">加载中...</div>

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">用户中心</h1>

            {/* 基本信息 */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">基本信息</h2>
                    {!editing && (
                        <button className="text-blue-500 hover:text-blue-600" onClick={() => setEditing(true)}>
                            编辑
                        </button>
                    )}
                </div>

                {editing ? (
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">昵称</label>
                            <input
                                type="text"
                                className="input-field w-full"
                                value={editForm.name}
                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">手机号</label>
                            <input
                                type="tel"
                                className="input-field w-full"
                                value={editForm.phone}
                                onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-3">
                            <button type="submit" className="btn-primary">保存</button>
                            <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>取消</button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-3">
                        <p><span className="text-gray-500">邮箱：</span>{profile?.email}</p>
                        <p><span className="text-gray-500">昵称：</span>{profile?.name}</p>
                        <p><span className="text-gray-500">手机：</span>{profile?.phone || '未设置'}</p>
                        <p><span className="text-gray-500">角色：</span>
                            {profile?.role === 'customer' ? '普通用户' : profile?.role === 'merchant' ? '商家' : '管理员'}
                        </p>
                    </div>
                )}
            </div>

            {/* 收货地址 */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">收货地址</h2>
                {addresses.length === 0 ? (
                    <p className="text-gray-500">暂无收货地址</p>
                ) : (
                    <div className="space-y-3">
                        {addresses.map(addr => (
                            <div key={addr.id} className="flex items-start justify-between p-4 border rounded-lg">
                                <div>
                                    <p className="font-medium">
                                        {addr.recipient_name}
                                        <span className="ml-3 text-gray-600">{addr.phone}</span>
                                        {addr.is_default && <span className="ml-2 text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded">默认</span>}
                                    </p>
                                    <p className="text-gray-500 mt-1">
                                        {addr.province}{addr.city}{addr.district}{addr.address}
                                    </p>
                                </div>
                                <button
                                    className="text-gray-400 hover:text-red-500"
                                    onClick={() => handleDeleteAddress(addr.id)}
                                >
                                    删除
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 退出登录 */}
            <button
                onClick={() => { logout(); navigate('/'); }}
                className="w-full bg-gray-100 text-gray-600 py-3 rounded-lg font-medium hover:bg-gray-200"
            >
                退出登录
            </button>
        </div>
    )
}

// ============ 主应用 ============
function App() {
    return (
        <CartProvider>
            <Router>
                <div className="min-h-screen bg-gray-50">
                    <Navbar />
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/product/:id" element={<ProductDetailPage />} />
                        <Route path="/category/:id" element={<CategoryPage />} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/cart" element={<CartPage />} />
                        <Route path="/checkout" element={<CheckoutPage />} />
                        <Route path="/orders" element={<OrdersPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/merchant" element={<MerchantDashboard />} />
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/login" element={<LoginPage />} />
                    </Routes>

                    {/* Footer */}
                    <footer className="bg-gray-800 text-gray-400 py-8 mt-12">
                        <div className="max-w-7xl mx-auto px-4 text-center">
                            <p className="mb-2">小型网店信息系统 - 高性能电商解决方案</p>
                            <p className="text-sm">© 2025 Small Online Store. All rights reserved.</p>
                        </div>
                    </footer>
                </div>
            </Router>
        </CartProvider>
    )
}

export default App

