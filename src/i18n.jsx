import React, { createContext, useContext } from 'react'
import { useLocalStorage } from './hooks'

const translations = {
  id: {
    // Top Ticker
    ticker1: '⚡ FLASH DEALS DISKON 50% HARI INI',
    ticker2: '✦ GRATIS ONGKIR KE SELURUH INDONESIA',
    ticker3: '⚡ GUNAKAN KUPON "SEMARKET10" UNTUK DISKON 10%',
    ticker4: '✦ 100% PRODUK ORIGINAL & TERVERIFIKASI',

    // Navbar
    searchPlaceholder: 'Cari produk, brand, gadget...',
    searchBtn: 'CARI 🔍',
    store: 'Toko',
    orders: 'Pesanan',
    wishlist: 'Favorit',
    cart: 'Keranjang',
    dept: 'KATEGORI:',
    signOut: 'Keluar',
    member: 'MEMBER',

    // Storefront & Banners
    flashSale: 'KILAT FLASH SALE',
    countdown: 'BERAKHIR DALAM',
    allProducts: 'Semua Produk',
    addToCart: 'TAMBAH KERANJANG',
    addedToCart: 'Masuk Keranjang!',
    sold: 'Terjual',
    sortBy: 'URUTKAN:',
    sortFeatured: 'Pilihan Terbaik',
    sortPriceLow: 'Harga: Termurah',
    sortPriceHigh: 'Harga: Termahal',
    sortRating: 'Rating Tertinggi',

    // Product Detail
    backToCatalog: '← Kembali Ke Katalog',
    stockAvailable: 'Stok Tersedia',
    criticalStock: 'Stok Kritis',
    reviews: 'Ulasan Pembeli',
    quantity: 'Jumlah',
    buyNow: 'BELI SEKARANG',
    warranty: 'Garansi Resmi 1 Tahun',
    freeDelivery: 'Gratis Pengiriman Kilat',

    // Cart Drawer
    cartTitle: 'KERANJANG BELANJA',
    cartEmpty: 'Keranjang Anda Masih Kosong',
    cartEmptyDesc: 'Jelajahi katalog dan temukan barang impian Anda sekarang!',
    promoVoucher: 'KUPON PROMO VOUCHER',
    apply: 'PAKAI',
    remove: 'HAPUS',
    subtotal: 'SUBTOTAL',
    discount: 'DISKON',
    tax: 'PAJAK ESTIMASI (10%)',
    shipping: 'PENGIRIMAN',
    freeShipping: 'GRATIS (RP 0)',
    totalPayable: 'TOTAL TAGIHAN',
    checkoutNow: 'CHECKOUT SEKARANG ➔',

    // Receipt (Order Confirmed)
    orderConfirmed: 'Pesanan Dikonfirmasi',
    orderThanks: 'Terima kasih telah berbelanja di SE-MARKET',
    orderNumber: 'NO. PESANAN',
    orderDate: 'TANGGAL',
    orderItems: 'BARANG',
    totalPaid: 'TOTAL DIBAYAR',
    myOrdersBtn: '📋 Pesanan Saya',
    finishShopping: 'Selesai Belanja ➔',

    // My Orders
    ordersHistory: 'Riwayat Pesanan',
    noOrders: 'Belum Ada Pesanan',
    noOrdersDesc: 'Transaksi Anda akan tercatat di sini setelah melakukan pembelian.',
    trackOrder: '📍 Lacak Pesanan',
    orderProcessed: 'Pesanan Diproses',
    shipped: 'Sedang Dikirim',
    delivered: 'Pesanan Tiba',

    // Footer
    footerDesc: 'Marketplace Neo-Brutalism berkecepatan tinggi. Produk terkurasi, transaksi aman, dan pengiriman kilat.',
    explore: 'JELAJAHI',
    paymentNodes: 'METODE PEMBAYARAN',
    paymentDesc: 'Transaksi aman terenkripsi via transfer bank & QRIS:',
    secretVouchers: 'Voucher Rahasia',
    voucherDesc: 'Dapatkan kode promo kilat & diskon spesial setiap minggu.',
    unlockDeals: 'DAPATKAN DISKON ➔',
    copyright: '© 2026 SEMARKETPLACE • HAK CIPTA DILINDUNGI',

    // AI Chat
    aiAssistant: 'SE-AI ASSISTANT',
    aiOnline: 'NEURAL CORE AKTIF',
    aiTyping: 'AI sedang mengetik…',
    aiPlaceholder: 'Tanya AI seputar promo, ongkir, produk…',
    aiSend: 'KIRIM',
    aiClose: 'TUTUP AI',
    aiLauncher: 'AI CHAT'
  },
  en: {
    // Top Ticker
    ticker1: '⚡ FLASH DEALS 50% OFF TODAY',
    ticker2: '✦ FREE SHIPPING ALL OVER INDONESIA',
    ticker3: '⚡ USE COUPON "SEMARKET10" FOR 10% OFF',
    ticker4: '✦ 100% AUTHENTIC & VERIFIED GOODS',

    // Navbar
    searchPlaceholder: 'Search kicks, tech, accessories...',
    searchBtn: 'SEARCH 🔍',
    store: 'Store',
    orders: 'Orders',
    wishlist: 'Wishlist',
    cart: 'Cart',
    dept: 'DEPT:',
    signOut: 'Sign Out',
    member: 'MEMBER',

    // Storefront & Banners
    flashSale: 'LIGHTNING FLASH SALE',
    countdown: 'ENDS IN',
    allProducts: 'All Products',
    addToCart: 'ADD TO CART',
    addedToCart: 'Added to Cart!',
    sold: 'Sold',
    sortBy: 'SORT BY:',
    sortFeatured: 'Featured Best',
    sortPriceLow: 'Price: Low to High',
    sortPriceHigh: 'Price: High to Low',
    sortRating: 'Highest Rating',

    // Product Detail
    backToCatalog: '← Back to Catalog',
    stockAvailable: 'Stock Available',
    criticalStock: 'Critical Stock',
    reviews: 'Customer Reviews',
    quantity: 'Quantity',
    buyNow: 'BUY NOW',
    warranty: '1-Year Official Warranty',
    freeDelivery: 'Complimentary Express Dispatch',

    // Cart Drawer
    cartTitle: 'SHOPPING CART',
    cartEmpty: 'Your Cart is Currently Empty',
    cartEmptyDesc: 'Explore our catalog and find the goods you love today!',
    promoVoucher: 'PROMO COUPON VOUCHER',
    apply: 'APPLY',
    remove: 'REMOVE',
    subtotal: 'SUBTOTAL',
    discount: 'DISCOUNT',
    tax: 'ESTIMATED TAX (10%)',
    shipping: 'SHIPPING',
    freeShipping: 'FREE (RP 0)',
    totalPayable: 'TOTAL PAYABLE',
    checkoutNow: 'CHECKOUT NOW ➔',

    // Receipt (Order Confirmed)
    orderConfirmed: 'Order Confirmed',
    orderThanks: 'Thank you for shopping at SE-MARKET',
    orderNumber: 'ORDER #',
    orderDate: 'DATE',
    orderItems: 'ITEMS',
    totalPaid: 'TOTAL PAID',
    myOrdersBtn: '📋 My Orders',
    finishShopping: 'Finish Shopping ➔',

    // My Orders
    ordersHistory: 'My Orders',
    noOrders: 'No Orders Recorded',
    noOrdersDesc: 'Your purchases will appear here after your first checkout from SE-MARKET.',
    trackOrder: '📍 Track Order',
    orderProcessed: 'Order Processed',
    shipped: 'Shipped & In Transit',
    delivered: 'Delivered Safely',

    // Footer
    footerDesc: 'The premier high-velocity Neo-Brutalist marketplace. Direct deals, verified quality goods, and lightning-fast fulfillment.',
    explore: 'EXPLORE',
    paymentNodes: 'PAYMENT NODES',
    paymentDesc: 'Encrypted settlements supported via instant banking & QRIS:',
    secretVouchers: 'Secret Vouchers',
    voucherDesc: 'Subscribe to unlock flash sale codes & 20% off coupons.',
    unlockDeals: 'UNLOCK DEALS ➔',
    copyright: '© 2026 SEMARKETPLACE • ALL RIGHTS RESERVED',

    // AI Chat
    aiAssistant: 'SE-AI ASSISTANT',
    aiOnline: 'NEURAL CORE READY',
    aiTyping: 'AI is typing…',
    aiPlaceholder: 'Ask AI about promos, shipping, goods…',
    aiSend: 'SEND',
    aiClose: 'CLOSE AI',
    aiLauncher: 'AI CHAT'
  }
}

const LanguageContext = createContext({
  lang: 'id',
  setLang: () => {},
  t: (key) => key
})

export function LanguageProvider({ children }) {
  const [lang, setLang] = useLocalStorage('semarket_lang', 'id')

  const t = (key) => {
    return translations[lang]?.[key] || translations['id']?.[key] || key
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
