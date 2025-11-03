import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api'; // <--- ADDED IMPORTS

import './App.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
// Get the Google Maps API Key from environment variables
const MOCK_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE'; // <--- ADDED API KEY CONSTANT

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "FATAL ERROR: Supabase environment variables are missing! " +
    "Please ensure you have a .env.local file in your project root " +
    "with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY defined."
  );
}

export const supabase = createClient(supabaseUrl || 'http://missing-url.com', supabaseAnonKey || 'missing-key');

// Use CSS variables for consistent color referencing
export const ORANGE = 'var(--shopee-orange)';
export const NAVY = 'var(--shopee-navy)';
export const LIGHT_BG = 'var(--shopee-light-bg)';
export const GRAY_TEXT = 'var(--shopee-gray-text)';
export const BORDER = 'var(--shopee-border)';


// Mock Product Data (Used as fallback if DB fails)
export const MOCK_PRODUCTS = [
  { id: 'p1', name: 'Wireless Earbuds Pro', price: 49.99, stock: 15, image_url: 'https://placehold.co/100x100/EE4D2D/FFFFFF?text=EARBUDS' },
  { id: 'p2', name: 'Smart Watch X', price: 79.50, stock: 8, image_url: 'https://placehold.co/100x100/EE4D2D/FFFFFF?text=WATCH' },
  { id: 'p3', name: 'Ergonomic Mouse', price: 19.99, stock: 30, image_url: 'https://placehold.co/100x100/EE4D2D/FFFFFF?text=MOUSE' },
];

// Mock Order Status Stages
export const ORDER_STATUSES = [
  'To Ship', 'Shipped', 'To Receive', 'Completed', 'Cancelled',
];

// --- UTILITY COMPONENTS ---

// 1. Loading Spinner
export const Loading = () => (
  <div className="flex items-center justify-center p-8 h-full w-full">
    <div className="animate-spin rounded-full h-10 w-10 border-4 border-t-transparent" style={{borderColor: ORANGE}}></div>
    <span className="ml-4 text-lg font-medium" style={{color: NAVY}}>Loading Store Mall...</span>
  </div>
);

// 2. Store Button (Stylistically Enhanced)
export const ShopeeButton = ({ children, onClick, className = '', disabled = false, variant = 'primary' }) => {
  const baseStyle = 'w-full py-3 rounded-md font-bold text-base transition-all duration-300 shadow-lg';
  let variantStyle = '';
  let customStyle = {};

  if (variant === 'primary') {
    // Uses the new class from App.css
    variantStyle = 'btn-primary';
  } else {
    // Secondary button styles remain as Tailwind classes + custom color
    variantStyle = 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 shadow-md';
    customStyle = { color: NAVY };
  }
  
  const disabledStyle = disabled ?
  'opacity-60 cursor-not-allowed shadow-none' : '';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variantStyle} ${disabledStyle} ${className}`}
      style={customStyle} // Apply secondary color if needed
    >
      {children}
    </button>
  );
};

// 3. Section Title Component
export const SectionTitle = ({ icon, title }) => (
    <h3 className="flex items-center text-xl font-extrabold mb-4" style={{ color: NAVY }}>
        <span className="mr-2 text-2xl">{icon}</span>
        {title}
    </h3>
);

// 4. Input Field (Styled)
export const StyledInput = ({ type = "text", placeholder, value, onChange, rows = 1, required = false, isTextArea = false }) => {
    // Now uses the new focus ring class from App.css
    const commonClasses = "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-0 transition duration-150 ease-in-out input-focus-shopee";

    if (isTextArea) {
        return (
            <textarea
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                rows={rows}
                required={required}
                className={`${commonClasses} resize-none`}
            />
        );
    }

    return (
        <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            required={required}
            className={commonClasses}
        />
    );
};


// --- SUPABASE AND DATA HOOK ---

const useSupabase = () => {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setAuthReady(true);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);
  
  return { supabase, user, authReady };
};


// --- AUTHENTICATION COMPONENTS ---

const AuthPage = ({ supabase, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');

  const handleAuth = async () => {
    setError('');
    
    if (!email || !password) {
      setError('Please fill in both fields.');
      return;
    }
    

    try {
      let result;
      
      if (isLogin) {
        result = await supabase.auth.signInWithPassword({ email, password });
      } else {
        result = await supabase.auth.signUp({ email, password });
      }
      
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      

      if (result.data.user) {
        onSuccess();
      } else if (result.data.session === null && !isLogin) {
        setError('Account created. Please check your email to confirm your account before logging in.');
        setIsLogin(true); 
      }

    } catch (e) {
      console.error(e);
      setError(e.message || 'Authentication failed.');
    }
  };
  
  return (
    // FIX: AuthPage must take full height (h-full) and use flex centering 
    // to correctly sit inside the 'main' container's vertical space.
    <div className="flex justify-center items-center h-full w-full py-10"> 
        <div className="p-6 md:p-10 bg-white rounded-2xl shadow-2xl mx-4 w-full max-w-md">
            <h2 className="text-3xl font-extrabold mb-8 text-center" style={{ color: ORANGE }}>
                {isLogin ? 'Welcome Back to Shopee!' : 'Join the Store Family'}
            </h2>
            
            <div className='space-y-4'>
                <StyledInput
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <StyledInput
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>
            
            {error && <p className="text-sm text-red-500 mt-4 font-medium">{error}</p>}
            
            <div className='mt-8'>
                <ShopeeButton onClick={handleAuth}>
                    {isLogin ?
                    'Login Securely' : 'Sign Up Now'}
                </ShopeeButton>
            </div>
            
            <p className="mt-6 text-center text-gray-500 text-sm">
                {isLogin ?
                "Don't have an account?" : "Already have an account?"}
                <button 
                onClick={() => { setIsLogin(!isLogin);
                setError(''); }}
                className="ml-2 font-bold hover:underline"
                style={{ color: ORANGE }}
                >
                {isLogin ?
                'Sign Up' : 'Login'}
                </button>
            </p>
        </div>
    </div>
  );
};


// --- PRODUCT LISTING COMPONENT ---

const ProductListing = ({ setPage, cart, setCart }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*');
      
      if (error) {
        console.error("Error fetching products:", error);
        setProducts(MOCK_PRODUCTS);
      } else {
        setProducts(data);
      }
      setLoading(false);
    };
    
    fetchProducts();
  }, []);
  
  const addToCart = useCallback((product, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        return [...prevCart, { ...product, quantity }];
      }
    });
  }, [setCart]);
  
  const handleOrderNow = useCallback((product) => {
    setCart([{ ...product, quantity: 1 }]);
    setPage('checkout');
  }, [setCart, setPage]);
  
  const cartItemCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  if (loading) return <Loading />;
  
  return (
    
    <div className="p-4 md:p-6 mx-auto w-full max-w-3xl">
      <SectionTitle icon="⚡" title="Today's Flash Deals" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map(product => (
          <div 
            key={product.id} 
            className="bg-white p-3 rounded-xl shadow-lg flex flex-col items-center transition-transform duration-300 hover:shadow-xl hover:scale-[1.02]"
            style={{ border: `1px solid ${BORDER}` }}
          >
            <img 
                src={product.image_url} 
                alt={product.name} 
                className="w-full h-28 sm:h-36 object-cover mb-3 rounded-lg border" 
                style={{borderColor: BORDER}}
            />
            <p className="text-sm font-semibold text-center h-10 overflow-hidden">{product.name}</p>
            <p className="text-xl font-extrabold my-2" style={{ color: ORANGE }}>
              ${product.price.toFixed(2)}
            </p>
            
            <p className="text-xs text-gray-500 mb-3">Only {product.stock} left!</p>
            
            <div className="space-y-2 w-full">
              <ShopeeButton 
                  onClick={() => handleOrderNow(product)} 
                  className="text-sm py-2"
              >
                  Buy Now
              </ShopeeButton>
              <ShopeeButton 
                  onClick={() => addToCart(product)} 
                  variant="secondary"
                  className="text-sm TR py-2"
              >
                  + Cart
              </ShopeeButton>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <ShopeeButton 
          onClick={() => 
            setPage('cart')} 
          className="py-3"
          disabled={cartItemCount === 0}
        >
          View Cart ({cartItemCount}) →
        </ShopeeButton>
      </div>
    </div>
  );
};


// --- CART & CHECKOUT COMPONENTS ---

const Cart = ({ setPage, cart, setCart }) => {
  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  
  const updateQuantity = (id, change) => {
    
    setCart(prevCart => {
      const newCart = prevCart.map(item =>
        item.id === id ? { ...item, quantity: item.quantity + change } : item
      ).filter(item => item.quantity > 0);
      return newCart;
    });
  };

  if (cart.length === 0) {
    return (
      <div className="p-4 md:p-6 text-center h-full flex flex-col justify-center items-center mx-auto w-full max-w-3xl">
        <span className='text-6xl mb-4'>🛒</span>
        <h2 className="text-2xl font-bold mb-6" style={{ color: NAVY }}>Your Cart is Empty!</h2>
        <p className='text-gray-500 mb-8'>Time to explore our amazing deals.</p>
        <div className='w-full max-w-sm'>
            <ShopeeButton onClick={() => setPage('products')}>Start Shopping</ShopeeButton>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 mx-auto w-full max-w-3xl">
      <SectionTitle icon="🛍️" title="Review Your Items" />
      {cart.map(item => (
        <div key={item.id} className="flex items-center justify-between bg-white p-4 mb-3 rounded-xl shadow-md border" style={{borderColor: BORDER}}>
          <div className="flex items-center flex-grow">
            <img src={item.image_url} alt={item.name} className="w-16 h-16 object-cover rounded-md mr-4 border" style={{borderColor: BORDER}} />
            
            <div className='flex-grow min-w-0'>
              <p className="font-semibold text-gray-800 line-clamp-2">{item.name}</p>
              <p className="text-sm font-bold mt-1" style={{ color: ORANGE }}>${item.price.toFixed(2)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
            <button 
              onClick={() => updateQuantity(item.id, -1)} 
              className="w-7 h-7 flex items-center justify-center text-lg border rounded-full transition-colors"
              style={{color: ORANGE, borderColor: ORANGE}}
            >
              -
            </button>
            <span className="font-bold w-5 text-center">{item.quantity}</span>
            <button 
              onClick={() => updateQuantity(item.id, 1)} 
              className="w-7 h-7 flex items-center justify-center text-lg border rounded-full transition-colors"
              style={{backgroundColor: ORANGE, color: 'white', borderColor: ORANGE}}
            >
              +
            </button>
          </div>
        </div>
      ))}

      <div className="mt-8 p-5 bg-white rounded-xl shadow-lg border" style={{borderColor: BORDER}}>
        <p className="text-xl text-black font-extrabold flex justify-between">
          <span>Total Payable:</span>
          
          <span className="text-2xl" style={{ color: ORANGE }}>${total.toFixed(2)}</span>
        </p>
      </div>

      <div className="mt-6 space-y-3">
        <ShopeeButton onClick={() => setPage('checkout')}>Proceed to Checkout</ShopeeButton>
        <ShopeeButton onClick={() => setPage('products')} variant="secondary">Keep Shopping</ShopeeButton>
      </div>
    </div>
  );
};

const Checkout = ({ setPage, cart, setCart, user }) => {
  
  const [address, setAddress] = useState({ name: '', phone: '', street: '', payment: 'ShopeePay' });
  const [loading, setLoading] = useState(false);
  
  const [error, setError] = useState('');
  
  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  
  
  const handlePlaceOrder = async () => {
    
    if (!user) {
      setError('User not authenticated.');
      return;
    }
    if (!address.name || !address.phone || !address.street) {
      setError('Please fill in Recipient Name, Phone, and Full Address.');
      return;
    }
    setLoading(true);
    
    try {
      const orderData = {
        user_id: user.id, 
        total: total,
        shipping_address: address.street,
        contact_name: address.name,
        contact_phone: address.phone,
        payment_method: address.payment,
        status: ORDER_STATUSES[0], // 'To Ship'
      };
      
      const { data: orderResult, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select();
        
        
      if (orderError) throw orderError;
      
      
      const newOrderId = orderResult[0].id;

      const itemData = cart.map(item => ({
        order_id: newOrderId,
        product_id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemData);
        
        
      if (itemsError) throw itemsError;
      

      setCart([]); // Clear cart after successful order
      setPage('history');
    } catch (e) {
      console.error("Error placing order:", e);
      setError('Failed to place order. Please try again: ' + e.message);
      
    } finally {
      setLoading(false);
    }
  };
  
  // Mock Google Maps View for Address
  const AddressMapPreview = () => (
      <div className="w-full h-40 rounded-lg overflow-hidden mb-4 border" style={{borderColor: ORANGE}}>
        <div className='p-2 text-center text-sm font-semibold text-white' style={{backgroundColor: ORANGE}}>
          📍 Pin Location on Map (Mock)
        </div>
      </div>
  );
  
  return (
    
    <div className="p-4 md:p-6 mx-auto w-full max-w-3xl">
      <SectionTitle icon="🛒" title="Final Step: Place Order" />
      <div className="bg-white p-6 rounded-2xl shadow-xl space-y-6">
        
        {/* Shipping Information */}
        <div className='border-b pb-4' style={{borderColor: BORDER}}>
          <h3 className="font-bold text-lg mb-4" style={{ color: NAVY }}><span className='text-xl mr-2'>🚚</span>Shipping Address</h3>
          
          <AddressMapPreview />
          <div className='space-y-3'>
              <StyledInput
                  placeholder="Recipient Name"
                  value={address.name}
                  onChange={(e) => setAddress({ ...address, name: e.target.value })}
                  required
              />
              <StyledInput
                  type="tel"
                  
                  placeholder="Phone Number"
                  value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                  
                  required
              />
              <StyledInput
                  placeholder="Full Address (Street, City, Postal Code)"
                  value={address.street}
                  
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  rows="3"
                  isTextArea
                  
                  required
              />
          </div>
        </div>

        {/* Payment Method */}
        <div className='border-b pb-4' style={{borderColor: BORDER}}>
          
          <h3 className="font-bold text-lg mb-4" style={{ color: NAVY }}><span className='text-xl mr-2'>💳</span>Payment Method</h3>
          <div className="relative">
              {/* Now uses the new focus ring class from App.css */}
              <select
                  value={address.payment}
                  
                  onChange={(e) => setAddress({ ...address, payment: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg appearance-none bg-white font-semibold focus:ring-2 focus:ring-offset-0 input-focus-shopee"
                  style={{ paddingRight: '2.5rem'}}
                  
              >
                  <option value="ShopeePay">ShopeePay (Preferred)</option>
                  <option value="COD">Cash on Delivery (COD)</option>
                  <option value="CreditCard">Credit/Debit Card</option>
                  
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path 
                  d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  
              </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="pt-2">
          <h3 className="font-bold text-lg mb-3" style={{ color: NAVY }}><span className='text-xl mr-2'>🧾</span>Order Summary</h3>
          
          <p className="text-lg flex justify-between mb-2 text-gray-600">
            <span>Subtotal ({cart.length} items):</span>
            <span className="font-semibold">${total.toFixed(2)}</span>
          </p>
          <p className="text-lg flex justify-between text-gray-600 border-b pb-3 mb-3" style={{borderColor: BORDER}}>
              <span>Shipping Fee:</span>
              
            <span className="font-semibold text-green-500">Free!</span>
          </p>
          <p className="text-2xl font-extrabold flex justify-between">
            <span>TOTAL:</span>
            <span style={{ color: 
            ORANGE }}>${total.toFixed(2)}</span>
            
          </p>
        </div>
        
        {error && <p className="text-sm text-red-500 mt-4 font-medium">{error}</p>}
      </div>

      <div className="mt-6">
        <ShopeeButton onClick={handlePlaceOrder} disabled={loading}>
          {loading ? 'Processing...' : 'Place Order Now'}
          
        </ShopeeButton>
        <ShopeeButton onClick={() => setPage('cart')} variant='secondary' className='mt-2'>
            ← Back to Cart
            
        </ShopeeButton>
      </div>
    </div>
  );
};


// --- ORDER HISTORY AND TRACKING ---

// FIX: Renamed OrderDetails to OrderTracking for clarity and consistency.
// The component is modified here to include the enhanced MockMap logic.
const OrderTracking = ({ order, setPage, user }) => {
  const [currentOrder, setCurrentOrder] = useState(order);
  
  const isCompleted = currentOrder.status === 'Completed';
  const isShipped = ORDER_STATUSES.indexOf(currentOrder.status) >= ORDER_STATUSES.indexOf('Shipped');
  const isReceiving = ORDER_STATUSES.indexOf(currentOrder.status) === ORDER_STATUSES.indexOf('To Receive');
  const isCancellable = ORDER_STATUSES.indexOf(currentOrder.status) <= ORDER_STATUSES.indexOf('To Ship');
  
  
  // --- Constants for Map ---
  const MOCK_ORIGIN = "Cagayan de Oro, Philippines";
  const MOCK_DESTINATION = currentOrder.shipping_address; 
  
  // Default Map center for load
  const containerStyle = {
    width: '100%',
    height: '200px'
  };

  // Coordinates are mock for demonstration since we only have string addresses
  const center = useMemo(() => ({
    lat: 8.4735, 
    lng: 124.6415 
  }), []); 
  
  const destinationCoords = useMemo(() => ({
    lat: 8.2280, // Mock lat/lng for Iligan City/Shipping Address
    lng: 124.2452 
  }), []);

  // LOADER HOOK: This loads the Google Maps script using the API key
  const { isLoaded, loadError } = useJsApiLoader({ // <--- FIXED: uses useJsApiLoader
    googleMapsApiKey: MOCK_MAPS_API_KEY,
  });

  const handleUpdateStatus = async (newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', currentOrder.id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      
      setCurrentOrder(prev => ({...prev, status: newStatus}));

    } catch(e) {
      console.error("Error updating status:", e);
      
    }
  };

  // Status Indicator Component
  const StatusPill = ({ status }) => {
      const statusColors = {
          'To Ship': { bg: '#FFECEC', text: ORANGE },
          'Shipped': { bg: '#FFF5E0', text: '#FF9900' },
          'To Receive': { bg: '#E6F7FF', text: '#00BFFF' },
          'Completed': { bg: '#E6FFFA', text: '#00C46A' },
          
          'Cancelled': { bg: '#F5F5F5', text: GRAY_TEXT },
      };
      
      const color = statusColors[status] || statusColors['To Ship'];
      
      return (
          <span className="text-sm font-bold px-3 py-1 rounded-full" 
              style={{ backgroundColor: color.bg, color: color.text }}>
              {status}
          </span>
      );
  };
  

  // REAL Google Map using @react-google-maps/api
  const MockMap = () => {
    const trackingText = isCompleted 
      ? "Order Delivered Successfully!" 
      : isShipped 
        ? "Tracking: Package en route to your location."
        
        : "Pending Shipment: Awaiting seller processing.";
    
    // Progress calculation: Goes from 0% ('To Ship') to 100% ('To Receive')
    const statusIndex = ORDER_STATUSES.indexOf(currentOrder.status);
    const maxProgressIndex = ORDER_STATUSES.indexOf('To Receive');
    const progressPercent = maxProgressIndex > 0 
        ? Math.min(100, Math.max(0, (statusIndex / maxProgressIndex) * 100))
        : 0; 
    
    if (loadError) {
        return (
            <div className="h-48 bg-red-100 rounded-xl flex items-center justify-center text-center p-4">
                <p className='text-red-700 font-bold'>Map Error: Check your **Google Maps API Key** and **Console Errors**!</p>
            </div>
        );
    }
    
    if (!isLoaded) {
        return (
            <div className="h-48 bg-gray-100 rounded-xl flex items-center justify-center">
                <Loading />
            </div>
        );
    }
    
    // Determine the center for the map view
    const mapCenter = isShipped ? destinationCoords : center;


    return (
        <div className="mt-4 p-4 border rounded-xl bg-white shadow-inner">
            <h4 className="font-bold mb-2 text-lg" style={{ color: NAVY }}>Tracking Status</h4>
            <div className="relative">
                {/* INTERACTIVE GOOGLE MAP */}
                <div className="rounded-t-lg overflow-hidden border-b-2" style={{borderColor: NAVY}}>
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={mapCenter}
                        zoom={isShipped ? 11 : 9}
                        options={{
                            disableDefaultUI: true,
                            zoomControl: true,
                        }}
                    >
                        {/* Origin Marker */}
                        <Marker 
                            position={center} 
                            label={{
                                text: 'A',
                                className: 'map-label-origin',
                                color: 'white'
                            }}
                        />
                        {/* Destination Marker */}
                        <Marker 
                            position={destinationCoords}
                            label={{
                                text: 'B',
                                className: 'map-label-destination',
                                color: 'white'
                            }}
                        />
                    </GoogleMap>
                </div>
                
                {/* Progress Bar Visualization */}
                {isShipped && !isCompleted && (
                    <div className="absolute top-0 left-0 right-0 h-1 rounded-full z-10" style={{backgroundColor: NAVY}}>
                        <div 
                            className="h-full rounded-full transition-all duration-1000"
                            style={{ 
                                width: `${progressPercent}%`, 
                                backgroundColor: ORANGE 
                            }}
                        ></div>
                    </div>
                )}

                <div className="relative bottom-0 left-0 right-0 text-center py-2 rounded-b-lg text-white font-bold" 
                    style={{ backgroundColor: isShipped ? ORANGE : NAVY }}>
                    {trackingText}
                </div>
            </div>
            <div className="mt-3 text-sm text-gray-600">
                <p>Courier: J&T Express (Mock)</p>
                <p>Tracking ID: SHOPEE-MOCK-{currentOrder.id.slice(0, 8).toUpperCase()}</p>
                
                <p className='font-semibold mt-1'>Source: {MOCK_ORIGIN} | Destination: {MOCK_DESTINATION}</p>
            </div>
        </div>
    );
  };
  
  
  return (
    <div className="p-4 md:p-6 mx-auto w-full max-w-3xl">
      <div className="flex justify-between items-center mb-4 border-b pb-4" style={{borderColor: BORDER}}>
        <h2 className="text-2xl font-bold" style={{ color: NAVY }}>Order Details & Tracking</h2>
        <button onClick={() => setPage('history')} className="text-base font-bold flex items-center hover:underline" style={{ color: ORANGE }}>
          <span className='mr-1'>←</span> All Orders
          
        </button>
      </div>

      <div className='mb-6 p-4 bg-white rounded-xl shadow-md'>
          <div className="flex justify-between items-center mb-4">
              <p className="font-medium text-sm text-gray-600">Order ID: **{currentOrder.id.slice(-8)}**</p>
              <StatusPill status={currentOrder.status} />
          </div>
          
          <MockMap />
          
          <div className="mt-6 space-y-3">
            {/* Action Buttons */}
            {isReceiving && (
              <ShopeeButton onClick={() => handleUpdateStatus('Completed')}>
                  
                CONFIRM ORDER RECEIVED
              </ShopeeButton>
            )}
            {isCancellable && (
              <ShopeeButton onClick={() => handleUpdateStatus('Cancelled')} variant="secondary">
                  
                Cancel Order
              </ShopeeButton>
            )}

            {/* Seller Simulation Button (for demo purposes) */}
            {(!isCompleted && 
            !isCancellable && ORDER_STATUSES.indexOf(currentOrder.status) < ORDER_STATUSES.length - 2) && (
              
              <button
                onClick={() => handleUpdateStatus(ORDER_STATUSES[ORDER_STATUSES.indexOf(currentOrder.status) + 1])}
                className="w-full text-center text-sm py-2 border-2 border-dashed rounded-lg font-bold"
                style={{color: NAVY, borderColor: NAVY, opacity: 0.7}}
                
                title="Click to simulate seller/courier action"
              >
                [DEMO] Next Status: {ORDER_STATUSES[ORDER_STATUSES.indexOf(currentOrder.status) + 1]}
              </button>
            )}
            
          </div>
      </div>
      
      {/* Items Summary */}
      <div className="p-4 bg-white rounded-xl shadow-md mb-4">
        <h3 className="font-bold text-lg mb-3" style={{ color: NAVY }}>Items Ordered</h3>
        {currentOrder.order_items.map((item, index) => (
          
          <div key={index} className="flex justify-between border-b last:border-b-0 py-2 text-gray-700">
            <p className="text-base font-medium">{item.name} x{item.quantity}</p>
            <p className="font-semibold text-base">${(item.price * item.quantity).toFixed(2)}</p>
          </div>
        ))}
        <p className="text-xl text-black font-extrabold flex justify-between pt-4 mt-2">
            
          <span>FINAL TOTAL:</span>
          <span style={{ color: ORANGE }}>${currentOrder.total.toFixed(2)}</span>
        </p>
      </div>

      {/* Address */}
      <div className="p-4 bg-white rounded-xl shadow-md text-sm">
        <h3 className="font-bold text-lg mb-2" style={{ color: NAVY }}><span className='mr-1'>🏠</span>Delivery Details</h3>
        
        <p className='text-gray-700'>Recipient: {currentOrder.contact_name}</p>
        <p className='text-gray-700'>Phone: {currentOrder.contact_phone}</p>
        <p className="text-gray-600 mt-1">Address: {currentOrder.shipping_address}</p>
      </div>

    </div>
  );
};


const OrderHistory = ({ setPage, user, setSelectedOrder }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  

  const fetchOrders = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const { data: fetchedOrders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          product_id, name, price, quantity
        )
      `)
      
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) 
    {
      
      console.error("Error fetching orders:", error);
    } else {
      const mappedOrders = fetchedOrders.map(order => ({
        ...order,
        createdAt: new Date(order.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      }));
      setOrders(mappedOrders);
    }
    
    setLoading(false);
  }, [user]);
  
  useEffect(() => {
    
    fetchOrders();
    
    if (user) {
      const subscription = supabase
        .channel('orders_channel')
        .on(
          'postgres_changes', 
          { event: '*', schema: 'public', table: 
          'orders', filter: `user_id=eq.${user.id}` }, 
          
          (payload) => {
            fetchOrders();
          }
        )
        .subscribe();
      
      return () => {
          supabase.removeChannel(subscription);
          
      };
    }

  }, [user, fetchOrders]);
  
  const StatusPill = ({ status }) => {
    
      const statusColors = {
          'To Ship': { bg: '#FFECEC', text: ORANGE },
          'Shipped': { bg: '#FFF5E0', text: '#FF9900' },
          'To Receive': { bg: '#E6F7FF', text: '#00BFFF' },
          'Completed': { bg: '#E6FFFA', 
          text: '#00C46A' },
          
          'Cancelled': { bg: '#F5F5F5', text: GRAY_TEXT },
      };
      
      const color = statusColors[status] || statusColors['To Ship'];
      
      return (
          <span className="text-xs font-bold px-2 py-1 rounded" 
              style={{ backgroundColor: color.bg, color: color.text }}>
              {status}
          </span>
      );
  };
  


  if (loading) return <Loading />;
  if (orders.length === 0) {
    return (
      <div className="p-4 md:p-6 text-center h-full flex flex-col justify-center items-center mx-auto w-full max-w-3xl">
        <span className='text-6xl mb-4'>😴</span>
        <h2 className="text-2xl font-bold mb-6" style={{ color: NAVY }}>No Orders Yet</h2>
        <p className='text-gray-500 mb-8'>Your purchase history will appear here.</p>
        <div className='w-full max-w-sm'>
            <ShopeeButton onClick={() => setPage('products')}>Start Shopping!</ShopeeButton>
        </div>
        
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 mx-auto w-full max-w-3xl">
      <SectionTitle icon="📦" title={`My Orders (${orders.length})`} />
      <div className="space-y-4">
        {orders.map(order => (
          <div 
            key={order.id} 
            className="bg-white p-4 rounded-xl shadow-md cursor-pointer transition-all duration-200 hover:shadow-lg hover:border"
            
            style={{ borderColor: ORANGE, border: '1px solid white' }}
            onClick={() => {
              setSelectedOrder(order);
              setPage('details');
            }}
            
          >
            <div className="flex justify-between items-start border-b pb-2 mb-3" style={{borderColor: BORDER}}>
              <div>
                  <p className="font-bold text-lg text-gray-800">Order ID: #{order.id.slice(-8)}</p>
                  <p className="text-xs text-gray-500 mt-1">Date Placed: {order.createdAt}</p>
                  
              </div>
              <StatusPill status={order.status} />
            </div>
            
            <div className='flex justify-between items-center'>
                
                <p className='text-sm text-gray-700'>
                    {order.order_items.length} item{order.order_items.length > 1 ?
                    's' : ''}
                    
                </p>
                <p className="text-xl font-extrabold" style={{ color: ORANGE }}>
                    ${order.total.toFixed(2)}
                </p>
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
};


// --- MAIN APP COMPONENT ---

const App = () => {
  const { user, authReady } = useSupabase();
  const [page, setPage] = useState('products'); 
  
  const [cart, setCart] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const handleSignOut = useCallback(() => {
    
    supabase.auth.signOut().then(() => {
      setCart([]);
      setPage('auth'); 
    }).catch(console.error);
  }, []);
  
  useEffect(() => {
    
    if (authReady) {
      if (!user) {
        setPage('auth'); 
      } else if (page === 'auth' || page === 'details' && !selectedOrder) {
        setPage('products'); 
      }
    }
  }, [authReady, user, page, 
  selectedOrder]);
  
  
  const renderContent = () => {
    if (!supabaseUrl || !supabaseAnonKey) {
        return (
          <div className="p-6 text-center text-red-700 font-bold">
              Configuration Error: Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.
          </div>
       
          
        );
    }
    
    if (!authReady) return <Loading />;
    
    if (!user) {
      return <AuthPage supabase={supabase} onSuccess={() => setPage('products')} />;
      
    }

    switch (page) {
      case 'products':
        return <ProductListing setPage={setPage} cart={cart} setCart={setCart} />;
        
      case 'cart':
        return <Cart setPage={setPage} cart={cart} setCart={setCart} />;
        
      case 'checkout':
        if (cart.length === 0) {
            setPage('products');
            return null;
            
        }
        return <Checkout setPage={setPage} cart={cart} setCart={setCart} user={user} />;
        
      case 'history':
        return <OrderHistory setPage={setPage} user={user} setSelectedOrder={setSelectedOrder} />;
        
      case 'details':
        if (!selectedOrder) {
            setPage('history');
            return null;
            
        }
        // FIXED: Using the new OrderTracking component
        return <OrderTracking order={selectedOrder} setPage={setPage} user={user} />;
        
      default:
        return <ProductListing setPage={setPage} cart={cart} setCart={setCart} />;
        
    }
  };

  const cartItemCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  
  
  const navItems = [
    { key: 'products', label: 'Shop', icon: '🛍️' },
    { key: 'cart', label: 'Cart', icon: `🛒`, count: cartItemCount },
    { key: 'history', label: 'Orders', icon: '📦' },
  ];
  
  const displayUserId = useMemo(() => {
    
      if (user && user.email) return user.email.split('@')[0];
      if (user && user.id) return `User-${user.id.slice(0, 4)}`;
      return 'Guest';
  }, [user]);
  
  return (
    
    // FINAL FIX: h-screen flex flex-col is the core structure for full-screen fit
    <div className="h-screen flex flex-col items-center w-full" style={{ backgroundColor: LIGHT_BG }}>
      
      <header className="w-full shadow-lg p-3 z-20 sticky top-0" style={{ backgroundColor: ORANGE }}>
        <div className="flex justify-between items-center w-full max-w-3xl mx-auto"> 
          <h1 className="text-xl font-black text-white">STORE <span className='text-sm font-light italic'>Mall</span></h1>
          
          {user && (
            <div className="flex items-center text-white text-sm">
              <span className="mr-3 font-semibold hidden sm:inline">Hi, **{displayUserId}**</span>
              <button onClick={handleSignOut} className="px-3 py-1 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all font-bold">
                Logout
                
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area: flex-1 ensures 
      it takes all available height, and overflow-y-auto makes it scrollable */}
      
      <main className="w-full flex-1 overflow-y-auto"> 
        {renderContent()}
      </main>

      {user && (
        <nav className="flex-shrink-0 w-full shadow-2xl z-10" style={{ backgroundColor: 'white', borderTop: `1px solid ${BORDER}` }}>
          <div className="flex justify-around w-full 
          max-w-3xl mx-auto">
            
            {navItems.map(item => (
              <button
                key={item.key}
                onClick={() => setPage(item.key)}
                className={`flex 
                flex-col items-center p-2 pt-3 text-xs font-semibold w-full sm:w-1/3 transition-colors relative ${page === item.key ?
                'text-opacity-100' : 'text-opacity-60'}`}
                
                style={{ color: ORANGE }}
              >
                <span className="text-2xl mb-1">{item.icon}</span>
                {item.label}
                
                {item.count > 0 && item.key === 'cart' && (
                    <span className='absolute top-1 right-1/4 transform translate-x-1/2 bg-red-600 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center'>
                        {item.count}
                    </span>
                    
                )}
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
    
  );
};
    
export default App;
