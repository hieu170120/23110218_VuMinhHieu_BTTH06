import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from '../util/axios.customize';
import ProductCard from '../components/ProductCard';
import { Spin } from 'antd';
import { RightOutlined, FireOutlined, EyeOutlined, LeftOutlined } from '@ant-design/icons';

const SectionTitle = ({ title, sub, linkTo, linkLabel }) => (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '40px' }}>
        <div>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#111', margin: 0, letterSpacing: '-0.5px' }}>
                {title}
            </h2>
            {sub && <p style={{ color: '#6b7280', marginTop: '8px', fontSize: '16px' }}>{sub}</p>}
        </div>
        {linkTo && (
            <Link
                to={linkTo}
                style={{
                    color: '#2563eb',
                    fontWeight: 600,
                    fontSize: '14px',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap',
                    paddingBottom: '4px',
                    borderBottom: '1.5px solid transparent',
                    transition: 'border-color 0.2s',
                }}
                className="see-all-link"
            >
                {linkLabel || 'Xem tất cả'} <RightOutlined style={{ fontSize: '11px' }} />
            </Link>
        )}
    </div>
);

const ProductGrid = ({ products }) => (
    <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '24px',
    }}>
        {products.map(product => (
            <ProductCard key={product._id} product={product} />
        ))}
    </div>
);

const ProductSlider = ({ products, icon: Icon, accentColor }) => {
    const trackRef = useRef(null);
    const CARD_W = 240;
    const GAP    = 16;

    const scroll = (dir) => {
        if (!trackRef.current) return;
        const step = (CARD_W + GAP) * 2;
        trackRef.current.scrollBy({ left: dir === 'next' ? step : -step, behavior: 'smooth' });
    };

    if (!products || products.length === 0) return null;

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => scroll('prev')}
                className="slider-btn slider-btn-prev"
                style={{
                    position: 'absolute', left: '-20px', top: '50%', transform: 'translateY(-50%)',
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: '#fff', border: '1.5px solid #e5e7eb',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', zIndex: 10, fontSize: '16px', color: '#374151',
                    transition: 'all 0.2s',
                }}
            >
                <LeftOutlined />
            </button>

            <div
                ref={trackRef}
                style={{
                    display: 'flex',
                    gap: `${GAP}px`,
                    overflowX: 'auto',
                    scrollSnapType: 'x mandatory',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    paddingBottom: '8px',
                }}
                className="slider-track"
            >
                {products.map((product, index) => (
                    <div
                        key={product._id}
                        style={{
                            width: `${CARD_W}px`,
                            flexShrink: 0,
                            scrollSnapAlign: 'start',
                            position: 'relative',
                            paddingTop: '8px',
                        }}
                    >
                        <ProductCard product={product} />
                        <div style={{
                            position: 'absolute',
                            bottom: '60px', left: '12px',
                            zIndex: 5,
                            minWidth: '36px', height: '24px',
                            borderRadius: '8px',
                            background: index < 3 ? accentColor : '#6b7280',
                            color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '11px', fontWeight: 800,
                            padding: '0 8px',
                            boxShadow: index < 3 ? `0 2px 8px ${accentColor}80` : '0 2px 6px rgba(0,0,0,0.2)',
                            letterSpacing: '0.5px',
                        }}>
                            #{index + 1}
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={() => scroll('next')}
                className="slider-btn slider-btn-next"
                style={{
                    position: 'absolute', right: '-20px', top: '50%', transform: 'translateY(-50%)',
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: '#fff', border: '1.5px solid #e5e7eb',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', zIndex: 10, fontSize: '16px', color: '#374151',
                    transition: 'all 0.2s',
                }}
            >
                <RightOutlined />
            </button>
        </div>
    );
};

const HomePage = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        latestProducts: [],
        bestSellingProducts: [],
        promotionalProducts: [],
    });

    const [banners, setBanners] = useState({
        heroBanners: [],
        subBanners: [],
    });

    const [topSelling, setTopSelling] = useState([]);
    const [topViewed,  setTopViewed]  = useState([]);

    const trackRef = useRef(null);

    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                const [prodRes, bannerRes, topSellRes, topViewRes] = await Promise.all([
                    axios.get('/v1/api/products/home'),
                    axios.get('/v1/api/banners/active'),
                    axios.get('/v1/api/products/top-selling?limit=10'),
                    axios.get('/v1/api/products/top-viewed?limit=10'),
                ]);
                
                if (prodRes && prodRes.latestProducts) setData(prodRes);
                if (bannerRes && bannerRes.heroBanners) setBanners(bannerRes);
                if (topSellRes && topSellRes.products) setTopSelling(topSellRes.products);
                if (topViewRes && topViewRes.products)  setTopViewed(topViewRes.products);
            } catch (error) {
                console.error('Failed to fetch home data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchHomeData();
    }, []);

    useEffect(() => {
        if (banners.heroBanners.length < 2) return;
        let offset = 0;
        const total = banners.heroBanners.length;
        const interval = setInterval(() => {
            offset = (offset + 1) % (total + 1);
            if (trackRef.current) {
                trackRef.current.style.transition = 'transform 0.8s ease-in-out';
                trackRef.current.style.transform = `translateX(-${offset * 100}%)`;
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [banners.heroBanners.length]);

    const onTransitionEnd = () => {
        if (!trackRef.current) return;
        const total = banners.heroBanners.length;
        const currentOffset = Math.abs(parseInt(getComputedStyle(trackRef.current).transform.split(',')[4]) || 0)
            / (trackRef.current.scrollWidth / (total + 1));
        if (currentOffset >= total) {
            trackRef.current.style.transition = 'none';
            trackRef.current.style.transform = 'translateX(0)';
        }
    };

    const allSlides = banners.heroBanners.length > 0
        ? [...banners.heroBanners, banners.heroBanners[0]]
        : [];

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    const hero = banners.heroBanners?.[0] || null;

    return (
        <div style={{ background: '#fff', minHeight: '100vh' }}>

            <section style={{
                position: 'relative',
                height: '88vh',
                background: '#000',
                overflow: 'hidden',
            }}>
                <div
                    ref={trackRef}
                    style={{
                        display: 'flex',
                        width: `${allSlides.length * 100}%`,
                        height: '100%',
                        transform: 'translateX(0)',
                        transition: 'transform 0.8s ease-in-out',
                    }}
                    onTransitionEnd={onTransitionEnd}
                >
                    {allSlides.length > 0 ? (
                        allSlides.map((hero, idx) => (
                            <div
                                key={hero._id || `slide-${idx}`}
                                style={{
                                    width: `${100 / allSlides.length}%`,
                                    height: '100%',
                                    position: 'relative',
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textAlign: 'center',
                                }}
                            >
                                <img
                                    src={hero.imageUrl}
                                    alt={hero.title}
                                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.45 }}
                                />
                                <div style={{
                                    position: 'absolute', bottom: 0, left: 0, right: 0, height: '200px',
                                    background: 'linear-gradient(to bottom, transparent, #000)',
                                }} />
                                <div style={{ position: 'relative', zIndex: 10, maxWidth: '700px', padding: '0 24px', width: '100%' }}>
                                    <p style={{
                                        color: '#60a5fa', fontSize: '14px', fontWeight: 700,
                                        letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '16px',
                                    }}>
                                        Mới ra mắt
                                    </p>
                                    <h1 style={{
                                        fontSize: 'clamp(48px, 8vw, 80px)',
                                        fontWeight: 800,
                                        color: '#fff',
                                        letterSpacing: '-2px',
                                        lineHeight: 1.05,
                                        margin: '0 0 20px',
                                    }}>
                                        {hero.title}
                                    </h1>
                                    <p style={{ fontSize: '20px', color: '#d1d5db', marginBottom: '40px', fontWeight: 400 }}>
                                        {hero.description}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                            <img
                                src="https://images.unsplash.com/photo-1616348436168-de43ad0db179?q=80&w=2000&auto=format&fit=crop"
                                alt="Hero"
                                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.45 }}
                            />
                            <div style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0, height: '200px',
                                background: 'linear-gradient(to bottom, transparent, #000)',
                            }} />
                            <div style={{ position: 'relative', zIndex: 10, maxWidth: '700px', padding: '0 24px' }}>
                                <p style={{
                                    color: '#60a5fa', fontSize: '14px', fontWeight: 700,
                                    letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '16px',
                                }}>
                                    Mới ra mắt
                                </p>
                                <h1 style={{
                                    fontSize: 'clamp(48px, 8vw, 80px)',
                                    fontWeight: 800, color: '#fff',
                                    letterSpacing: '-2px', lineHeight: 1.05,
                                    margin: '0 0 20px',
                                }}>
                                    iPhone 15 Pro
                                </h1>
                                <p style={{ fontSize: '20px', color: '#d1d5db', marginBottom: '40px', fontWeight: 400 }}>
                                    Titan. Thật bền. Thật nhẹ. Thật Pro.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {banners.heroBanners.length > 1 && (
                    <div style={{
                        position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
                        display: 'flex', gap: '10px', zIndex: 20,
                    }}>
                        {banners.heroBanners.map((_, idx) => (
                            <div
                                key={idx}
                                style={{
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '9999px',
                                    background: 'rgba(255,255,255,0.4)',
                                    transition: 'background 0.3s',
                                }}
                            />
                        ))}
                    </div>
                )}

                <div style={{
                    position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 10,
                }}>
                    <div style={{
                        width: '1.5px', height: '48px',
                        background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.5))',
                        animation: 'scrollLine 1.5s ease-in-out infinite',
                    }} />
                </div>
            </section>

            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '80px 24px' }}>

                {data.promotionalProducts?.length > 0 && (
                    <section style={{ marginBottom: '96px' }}>
                        <SectionTitle
                            title="Ưu đãi cực sốc 🔥"
                            sub="Những sản phẩm đang giảm giá mạnh nhất tại TechStore"
                            linkTo="/search"
                            linkLabel="Xem tất cả"
                        />
                        <ProductGrid products={data.promotionalProducts} />
                    </section>
                )}

                <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '96px' }}>
                    {banners.subBanners?.length > 0 ? (
                        banners.subBanners.slice(0, 2).map((sub, idx) => (
                            <div key={sub._id || idx} style={{
                                background: idx === 0 ? '#f5f5f7' : 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%)',
                                borderRadius: '28px',
                                padding: '48px 40px',
                                textAlign: 'center',
                                minHeight: '420px',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                overflow: 'hidden',
                                position: 'relative',
                            }} className="banner-card">
                                <h3 style={{ fontSize: '26px', fontWeight: 800, color: idx === 0 ? '#111' : '#60a5fa', margin: '0 0 12px' }}>{sub.title}</h3>
                                <p style={{ fontSize: '16px', color: idx === 0 ? '#555' : '#9ca3af', marginBottom: '28px' }}>{sub.description}</p>
                                <Link
                                    to={sub.linkTo || '/search'}
                                    style={{
                                        background: idx === 0 ? '#111' : '#fff',
                                        color: idx === 0 ? '#fff' : '#111',
                                        padding: '12px 28px',
                                        borderRadius: '9999px',
                                        fontWeight: 700,
                                        fontSize: '14px',
                                        textDecoration: 'none',
                                        transition: 'background 0.2s',
                                        zIndex: 2,
                                    }}
                                >
                                    Xem chi tiết
                                </Link>
                                <img
                                    src={sub.imageUrl}
                                    alt={sub.title}
                                    style={{
                                        width: idx === 0 ? '80%' : '60%', 
                                        marginTop: '24px', 
                                        opacity: idx === 0 ? 1 : 0.75,
                                        transition: 'transform 0.6s ease',
                                    }}
                                    className="banner-img"
                                />
                            </div>
                        ))
                    ) : (
                        <>
                            <div style={{
                                background: '#f5f5f7',
                                borderRadius: '28px',
                                padding: '48px 40px',
                                textAlign: 'center',
                                minHeight: '420px',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                overflow: 'hidden',
                                position: 'relative',
                            }} className="banner-card">
                                <h3 style={{ fontSize: '26px', fontWeight: 800, color: '#111', margin: '0 0 12px' }}>MacBook Air M3</h3>
                                <p style={{ fontSize: '16px', color: '#555', marginBottom: '28px' }}>Siêu mỏng. Siêu mạnh. Siêu M3.</p>
                                <Link
                                    to="/search?category=laptop"
                                    style={{
                                        background: '#111',
                                        color: '#fff',
                                        padding: '12px 28px',
                                        borderRadius: '9999px',
                                        fontWeight: 700,
                                        fontSize: '14px',
                                        textDecoration: 'none',
                                        transition: 'background 0.2s',
                                        zIndex: 2,
                                    }}
                                >
                                    Xem chi tiết
                                </Link>
                                <img
                                    src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800&auto=format&fit=crop"
                                    alt="MacBook"
                                    style={{
                                        width: '80%', marginTop: '24px',
                                        transition: 'transform 0.6s ease',
                                    }}
                                    className="banner-img"
                                />
                            </div>
                        </>
                    )}
                </section>

                {data.latestProducts?.length > 0 && (
                    <section style={{ marginBottom: '96px' }}>
                        <SectionTitle
                            title="Mới nhất tại cửa hàng"
                            linkTo="/search"
                            linkLabel="Xem tất cả"
                        />
                        <ProductGrid products={data.latestProducts} />
                    </section>
                )}

                {data.bestSellingProducts?.length > 0 && (
                    <section style={{
                        background: 'linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%)',
                        borderRadius: '36px',
                        padding: '64px 48px',
                        marginBottom: '96px',
                    }}>
                        <SectionTitle
                            title="Được yêu thích nhất ❤️"
                            sub="Khám phá những lựa chọn hàng đầu từ cộng đồng iFan"
                            linkTo="/search"
                            linkLabel="Xem tất cả"
                        />
                        <ProductGrid products={data.bestSellingProducts} />
                    </section>
                )}

                {topSelling.length > 0 && (
                    <section style={{ marginBottom: '96px' }}>
                        <SectionTitle
                            title={<span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    width: '40px', height: '40px', borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #ef4444, #f97316)',
                                    color: '#fff', fontSize: '18px',
                                }}><FireOutlined /></span>
                                Top 10 Bán Chạy Nhất
                            </span>}
                            sub="Những sản phẩm được khách hàng tin yêu đặt mua nhiều nhất tại TechStore"
                        />
                        <ProductSlider
                            products={topSelling}
                            accentColor="#ef4444"
                        />
                    </section>
                )}

                {topViewed.length > 0 && (
                    <section style={{
                        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                        borderRadius: '36px',
                        padding: '64px 48px',
                        marginBottom: '96px',
                    }}>
                        <SectionTitle
                            title={<span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    width: '40px', height: '40px', borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                    color: '#fff', fontSize: '18px',
                                }}><EyeOutlined /></span>
                                Top 10 Xem Nhiều Nhất
                            </span>}
                            sub="Những sản phẩm được quan tâm và khám phá nhiều nhất trong tuần qua"
                        />
                        <ProductSlider
                            products={topViewed}
                            accentColor="#10b981"
                        />
                    </section>
                )}
            </div>

            <section style={{
                borderTop: '1px solid #f0f0f0',
                padding: '80px 24px',
                textAlign: 'center',
            }}>
                <div style={{ maxWidth: '640px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '36px', fontWeight: 800, margin: '0 0 16px', color: '#111' }}>Bạn cần hỗ trợ?</h2>
                    <p style={{ color: '#6b7280', fontSize: '18px', marginBottom: '48px', lineHeight: 1.6 }}>
                        Đội ngũ chuyên gia của chúng tôi luôn sẵn sàng hỗ trợ bạn tìm được sản phẩm Apple ưng ý nhất.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
                        {[
                            { title: '💬 Chat với chuyên gia', desc: 'Nhận tư vấn trực tuyến 24/7' },
                            { title: '📍 Tìm cửa hàng', desc: 'Ghé thăm địa chỉ gần bạn nhất' },
                        ].map(({ title, desc }) => (
                            <div key={title} className="support-card">
                                <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px', color: '#111' }}>{title}</h4>
                                <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <style>{`
                .see-all-link:hover { border-bottom-color: #2563eb !important; }
                .banner-card:hover .banner-img { transform: scale(1.04) translateY(-4px); }
                .support-card {
                    border: 1.5px solid #e5e7eb;
                    border-radius: 20px;
                    padding: 28px 32px;
                    min-width: 220px;
                    cursor: pointer;
                    transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
                }
                .support-card:hover {
                    border-color: #2563eb;
                    box-shadow: 0 4px 24px rgba(37,99,235,0.1);
                    transform: translateY(-2px);
                }
                .slider-track::-webkit-scrollbar { display: none; }
                .slider-btn:hover {
                    background: #2563eb !important;
                    color: #fff !important;
                    border-color: #2563eb !important;
                    transform: translateY(-50%) scale(1.1);
                }
                .hero-arrow-btn:hover {
                    background: rgba(255,255,255,0.3) !important;
                }
                @keyframes scrollLine {
                    0%   { opacity: 0; transform: scaleY(0); transform-origin: top; }
                    50%  { opacity: 1; transform: scaleY(1); transform-origin: top; }
                    100% { opacity: 0; transform: scaleY(1); transform-origin: bottom; }
                }
            `}</style>
        </div>
    );
};

export default HomePage;
