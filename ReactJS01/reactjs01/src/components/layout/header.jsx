import React, { useContext, useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/auth.context';
import { useCart } from '../context/cart.context';
import { ShoppingCartOutlined, UserOutlined, SearchOutlined, DownOutlined, LoginOutlined, LogoutOutlined } from '@ant-design/icons';

const navLinks = [
    { label: 'Điện thoại', href: '/search?category=dien-thoai' },
    { label: 'Laptop',      href: '/search?category=laptop' },
    { label: 'Phụ kiện',    href: '/search?category=phu-kien' },
];

const Header = () => {
    const navigate = useNavigate();
    const { auth, setAuth } = useContext(AuthContext);
    const { cartCount } = useCart();
    const [scrolled, setScrolled] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        setAuth({ isAuthenticated: false, user: { email: '', name: '', role: '' } });
        setShowDropdown(false);
        navigate('/');
    };

    return (
        <header
            style={{
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                transition: 'background 0.3s, backdrop-filter 0.3s, box-shadow 0.3s',
                background: scrolled
                    ? 'rgba(0,0,0,0.95)'
                    : 'rgba(0,0,0,1)',
                backdropFilter: scrolled ? 'blur(16px)' : 'none',
                boxShadow: scrolled ? '0 2px 24px rgba(0,0,0,0.5)' : 'none',
                color: '#fff',
            }}
        >
            {/* 3-column grid: logo | nav | actions */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    alignItems: 'center',
                    height: '60px',
                    maxWidth: '1280px',
                    margin: '0 auto',
                    padding: '0 24px',
                }}
            >
                {/* ── Column 1: Logo (left) */}
                <Link
                    to="/"
                    style={{
                        justifySelf: 'start',
                        fontSize: '20px',
                        fontWeight: 700,
                        letterSpacing: '-0.5px',
                        color: '#fff',
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                    }}
                >
                    TechStore
                </Link>

                {/* ── Column 2: Nav (center) */}
                <nav style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                    {navLinks.map(({ label, href }) => (
                        <Link
                            key={label}
                            to={href}
                            style={{
                                color: '#d1d5db',
                                fontSize: '14px',
                                fontWeight: 500,
                                textDecoration: 'none',
                                whiteSpace: 'nowrap',
                                letterSpacing: '0.01em',
                                transition: 'color 0.2s',
                                position: 'relative',
                                paddingBottom: '4px',
                            }}
                            className="nav-link"
                        >
                            {label}
                        </Link>
                    ))}
                </nav>

                {/* ── Column 3: Icons (right) */}
                <div
                    style={{
                        justifySelf: 'end',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '24px',
                        fontSize: '18px',
                    }}
                >
                    <Link
                        to="/search"
                        style={{ color: '#d1d5db', transition: 'color 0.2s' }}
                        className="icon-btn"
                    >
                        <SearchOutlined />
                    </Link>

                    <div style={{ position: 'relative', cursor: 'pointer' }} className="icon-btn">
                        <Link to="/cart" style={{ color: '#d1d5db' }}>
                            <ShoppingCartOutlined />
                        </Link>
                        <span
                            style={{
                                position: 'absolute',
                                top: '-8px',
                                right: '-8px',
                                background: '#2563eb',
                                color: '#fff',
                                fontSize: '10px',
                                borderRadius: '9999px',
                                width: '16px',
                                height: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                            }}
                        >
                            {cartCount || 0}
                        </span>
                    </div>

                    {/* User Dropdown */}
                    <div ref={dropdownRef} style={{ position: 'relative' }}>
                        <div
                            onClick={() => setShowDropdown(!showDropdown)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                cursor: 'pointer',
                                color: '#d1d5db',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                transition: 'all 0.2s',
                                background: showDropdown ? 'rgba(255,255,255,0.1)' : 'transparent',
                            }}
                            className="user-btn"
                        >
                            <UserOutlined style={{ fontSize: '18px' }} />
                            {auth.isAuthenticated && (
                                <span style={{ fontSize: '13px', fontWeight: 500, maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {auth.user.name || auth.user.email?.split('@')[0]}
                                </span>
                            )}
                            <DownOutlined style={{ fontSize: '10px', transition: 'transform 0.2s', transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                        </div>

                        {/* Dropdown Menu */}
                        <div
                            style={{
                                position: 'absolute',
                                right: 0,
                                top: 'calc(100% + 8px)',
                                background: '#fff',
                                color: '#111',
                                borderRadius: '12px',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                                minWidth: '200px',
                                padding: '8px 0',
                                opacity: showDropdown ? 1 : 0,
                                visibility: showDropdown ? 'visible' : 'hidden',
                                transform: showDropdown ? 'translateY(0)' : 'translateY(-10px)',
                                transition: 'all 0.2s ease',
                                zIndex: 9999,
                            }}
                        >
                            {auth.isAuthenticated ? (
                                <>
                                    {/* User info header */}
                                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', marginBottom: '8px' }}>
                                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#111' }}>
                                            {auth.user.name || 'User'}
                                        </p>
                                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>
                                            {auth.user.email}
                                        </p>
                                        {auth.user.role === 'admin' && (
                                            <span style={{
                                                display: 'inline-block',
                                                marginTop: '6px',
                                                padding: '2px 8px',
                                                background: '#059669',
                                                color: '#fff',
                                                fontSize: '10px',
                                                fontWeight: 700,
                                                borderRadius: '4px'
                                            }}>
                                                ADMIN
                                            </span>
                                        )}
                                    </div>

                                    {auth.user.role === 'admin' && (
                                        <>
                                            <Link to="/admin/products" className="dropdown-item" style={{ color: '#059669', fontWeight: 600 }}>
                                                Quản lý Sản phẩm
                                            </Link>
                                            <Link to="/admin/banners" className="dropdown-item" style={{ color: '#059669', fontWeight: 600 }}>
                                                Quản lý Banner
                                            </Link>
                                            <Link to="/admin/orders" className="dropdown-item" style={{ color: '#059669', fontWeight: 600 }}>
                                                Quản lý Đơn hàng
                                            </Link>
                                        </>
                                    )}
                                    <Link to="/user" className="dropdown-item">Tài khoản</Link>
                                    <Link to="/orders" className="dropdown-item">Đơn hàng của tôi</Link>
                                    <div style={{ borderTop: '1px solid #f0f0f0', marginTop: '8px', paddingTop: '8px' }}>
                                        <div onClick={handleLogout} className="dropdown-item danger">
                                            <LogoutOutlined style={{ marginRight: '8px' }} />
                                            Đăng xuất
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', marginBottom: '8px' }}>
                                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#111' }}>
                                            Chào khách hàng
                                        </p>
                                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>
                                            Đăng nhập để quản lý đơn hàng
                                        </p>
                                    </div>
                                    <Link to="/login" className="dropdown-item primary">
                                        <LoginOutlined style={{ marginRight: '8px' }} />
                                        Đăng nhập
                                    </Link>
                                    <Link to="/register" className="dropdown-item">
                                        Đăng ký tài khoản
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Inline styles for hover & dropdown */}
            <style>{`
                .nav-link:hover { color: #fff !important; }
                .nav-link::after {
                    content: '';
                    position: absolute;
                    bottom: 0; left: 0; right: 0;
                    height: 1.5px;
                    background: #fff;
                    transform: scaleX(0);
                    transition: transform 0.25s ease;
                    transform-origin: center;
                    border-radius: 2px;
                }
                .nav-link:hover::after { transform: scaleX(1); }

                .icon-btn:hover { color: #fff !important; }
                .user-btn:hover { background: rgba(255,255,255,0.1) !important; }

                .dropdown-item {
                    display: flex;
                    align-items: center;
                    padding: 10px 16px;
                    font-size: 14px;
                    font-weight: 500;
                    color: #111;
                    text-decoration: none;
                    cursor: pointer;
                    transition: background 0.15s;
                }
                .dropdown-item:hover { background: #f3f4f6; }
                .dropdown-item.primary {
                    background: #2563eb;
                    color: #fff;
                    margin: 0 8px;
                    border-radius: 8px;
                    justify-content: center;
                }
                .dropdown-item.primary:hover { background: #1d4ed8; }
                .dropdown-item.danger { color: #dc2626; }
                .dropdown-item.danger:hover { background: #fef2f2; }
            `}</style>
        </header>
    );
};

export default Header;