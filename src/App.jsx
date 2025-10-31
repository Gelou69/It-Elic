import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---

// **Vite requires environment variables to be prefixed with VITE_**
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "FATAL ERROR: Supabase environment variables are missing! " +
    "Please ensure you have a .env.local file in your project root " +
    "with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY defined."
  );
  // Use fallback values to prevent build error, although runtime errors will still occur
}

// Supabase Client
const supabase = createClient(supabaseUrl || 'http://missing-url.com', supabaseAnonKey || 'missing-key');

// Shopee Brand Colors
const SHOPEE_ORANGE = '#EE4D2D';
const SHOPEE_LIGHT_BG = '#F5F5F5';
const SHOPEE_NAVY = '#113366';

// Mock Product Data (Used as fallback if DB fails)
const MOCK_PRODUCTS = [
  { id: 'p1', name: 'Wireless Earbuds Pro', price: 49.99, stock: 15, image_url: 'https://placehold.co/100x100/EE4D2D/FFFFFF?text=EARBUDS' },
  { id: 'p2', name: 'Smart Watch X', price: 79.50, stock: 8, image_url: 'https://placehold.co/100x100/EE4D2D/FFFFFF?text=WATCH' },
  { id: 'p3', name: 'Ergonomic Mouse', price: 19.99, stock: 30, image_url: 'https://placehold.co/100x100/EE4D2D/FFFFFF?text=MOUSE' },
];

// Mock Order Status Stages
const ORDER_STATUSES = [
  'To Ship',      // Seller needs to prepare the item
  'Shipped',      // Item is picked up by courier (Tracking active)
  'To Receive',   // Item is near or at destination
  'Completed',    // Buyer confirmed receipt
  'Cancelled',    // Order was cancelled
];


// --- UTILITY COMPONENTS ---

// 1. Loading Spinner
const Loading = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{borderColor: SHOPEE_ORANGE}}></div>
    <span className="ml-3 text-gray-600">Loading...</span>
  </div>
);

// 2. Shopee Button
const ShopeeButton = ({ children, onClick, className = '', disabled = false, variant = 'primary' }) => {
  const baseStyle = 'w-full py-2 rounded-lg font-bold transition-all duration-200 shadow-md transform hover:scale-[1.01]';
  
  // Tailwind classes for button variants
  const primaryStyle = `text-white`;
  const secondaryStyle = 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50';
  const disabledStyle = 'opacity-50 cursor-not-allowed transform-none hover:scale-100';

  // Use dynamic style prop for custom colors that Tailwind doesn't know about by default
  const getBackgroundColor = () => {
    if (disabled) return SHOPEE_ORANGE;
    return variant === 'primary' ? SHOPEE_ORANGE : 'white';
  };
  
  const getColor = () => {
    if (disabled) return 'white';
    return variant === 'primary' ? 'white' : SHOPEE_NAVY;
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variant === 'primary' ? primaryStyle : secondaryStyle} ${disabled ? disabledStyle : ''} ${className}`}
      style={{backgroundColor: getBackgroundColor(), color: getColor()}}
    >
      {children}
    </button>
  );
};


// --- SUPABASE AND DATA HOOK (FIXED) ---

const useSupabase = () => {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    // 💥 FIX APPLIED HERE: Correctly destructure the subscription object
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setAuthReady(true);
      }
    );

    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });

    return () => {
      // Use the subscription object to unsubscribe on cleanup
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
        // User created but needs email confirmation (standard Supabase behavior)
        setError('Account created. Please check your email to confirm your account before logging in.');
        setIsLogin(true); // Switch to login view
      }

    } catch (e) {
      console.error(e);
      setError(e.message || 'Authentication failed.');
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg m-4">
      <h2 className="text-2xl font-extrabold mb-6 text-center" style={{ color: SHOPEE_ORANGE }}>
        {isLogin ? 'Welcome Back!' : 'Create Account'}
      </h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-3 mb-4 border rounded-lg focus:ring-2 focus:ring-orange-500"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-3 mb-6 border rounded-lg focus:ring-2 focus:ring-orange-500"
      />
      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
      
      <ShopeeButton onClick={handleAuth}>
        {isLogin ? 'Login Securely' : 'Sign Up'}
      </ShopeeButton>
      
      <p className="mt-4 text-center text-black-600">
        {isLogin ? "Don't have an account?" : "Already have an account?"}
        <button 
          onClick={() => setIsLogin(!isLogin)}
          className="ml-2 font-semibold"
          style={{ color: SHOPEE_ORANGE }}
        >
          {isLogin ? 'Sign Up' : 'Login'}
        </button>
      </p>
    </div>
  );
};


// --- PRODUCT LISTING COMPONENT ---

const ProductListing = ({ setPage, cart, setCart }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch products from Supabase on mount
  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*');
      
      if (error) {
        console.error("Error fetching products:", error);
        // Fallback to mock data if DB fetch fails
        setProducts(MOCK_PRODUCTS);
      } else {
        // Ensure data keys match mock structure (i.e., use 'image_url')
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
  
  if (loading) return <Loading />;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4" style={{ color: SHOPEE_NAVY }}>Flash Sale Products</h2>
      <div className="grid grid-cols-2 gap-4">
        {products.map(product => (
          <div key={product.id} className="bg-white p-3 rounded-xl shadow-md flex flex-col items-center">
            <img src={product.image_url} alt={product.name} className="w-24 h-24 mb-2 rounded-lg" />
            <p className="text-sm font-semibold text-center">{product.name}</p>
            <p className="text-lg font-extrabold mb-3" style={{ color: SHOPEE_ORANGE }}>
              ${product.price.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mb-2">Stock: {product.stock}</p>
            
            <div className="space-y-2 w-full">
                <ShopeeButton onClick={() => handleOrderNow(product)} className="text-sm py-2">
                    Order Now
                </ShopeeButton>
                <ShopeeButton 
                    onClick={() => addToCart(product)} 
                    variant="secondary"
                    className="text-sm py-2"
                >
                    Add to Cart
                </ShopeeButton>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <ShopeeButton 
          onClick={() => setPage('cart')} 
          className="py-3"
          disabled={cart.length === 0}
        >
          View Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
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
      <div className="p-4 text-center">
        <h2 className="text-xl font-bold mb-4" style={{ color: SHOPEE_NAVY }}>Your Cart is Empty 🥺</h2>
        <ShopeeButton onClick={() => setPage('products')}>Continue Shopping</ShopeeButton>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4" style={{ color: SHOPEE_NAVY }}>Your Shopping Cart</h2>
      {cart.map(item => (
        <div key={item.id} className="flex items-center justify-between bg-white p-3 mb-3 rounded-lg shadow-sm">
          <div className="flex items-center">
            <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-md mr-3" />
            <div>
              <p className="font-semibold text-gray-800">{item.name}</p>
              <p className="text-xs text-gray-500">Price: ${item.price.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => updateQuantity(item.id, -1)} 
              className="px-2 border rounded"
              style={{color: SHOPEE_ORANGE, borderColor: SHOPEE_ORANGE}}
            >
              -
            </button>
            <span className="font-bold">{item.quantity}</span>
            <button 
              onClick={() => updateQuantity(item.id, 1)} 
              className="px-2 border rounded"
              style={{color: SHOPEE_ORANGE, borderColor: SHOPEE_ORANGE}}
            >
              +
            </button>
          </div>
        </div>
      ))}

      <div className="mt-6 p-4 bg-white rounded-lg shadow-inner">
        <p className="text-xl font-bold flex justify-between">
          <span>Total:</span>
          <span style={{ color: SHOPEE_ORANGE }}>${total.toFixed(2)}</span>
        </p>
      </div>

      <div className="mt-6 space-y-3">
        <ShopeeButton onClick={() => setPage('checkout')}>Proceed to Checkout</ShopeeButton>
        <ShopeeButton onClick={() => setPage('products')} variant="secondary">Back to Shopping</ShopeeButton>
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
      setError('Please fill in Name, Phone, and Address.');
      return;
    }
    setLoading(true);

    try {
      // 1. Insert the main order record
      const orderData = {
        user_id: user.id, // Supabase user ID
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

      // 2. Insert order items
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

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4" style={{ color: SHOPEE_NAVY }}>Checkout Details</h2>
      <div className="bg-white p-4 rounded-xl shadow-lg space-y-4">
        
        {/* Shipping Information */}
        <h3 className="font-bold text-lg border-b pb-2" style={{ borderColor: SHOPEE_LIGHT_BG }}>Shipping Information</h3>
        <input
          type="text"
          placeholder="Recipient Name"
          value={address.name}
          onChange={(e) => setAddress({ ...address, name: e.target.value })}
          className="w-full p-3 border rounded-lg"
        />
        <input
          type="tel"
          placeholder="Phone Number"
          value={address.phone}
          onChange={(e) => setAddress({ ...address, phone: e.target.value })}
          className="w-full p-3 border rounded-lg"
        />
        <textarea
          placeholder="Full Address (Street, City, Postal Code)"
          value={address.street}
          onChange={(e) => setAddress({ ...address, street: e.target.value })}
          rows="3"
          className="w-full p-3 border rounded-lg resize-none"
        />

        {/* Payment Method */}
        <h3 className="font-bold text-lg border-y py-2 mt-4" style={{ borderColor: SHOPEE_LIGHT_BG }}>Payment Method</h3>
        <select
          value={address.payment}
          onChange={(e) => setAddress({ ...address, payment: e.target.value })}
          className="w-full p-3 border rounded-lg appearance-none"
        >
          <option value="ShopeePay">ShopeePay (Prepaid)</option>
          <option value="COD">Cash on Delivery (COD)</option>
          <option value="CreditCard">Credit/Debit Card</option>
        </select>

        {/* Order Summary */}
        <div className="pt-4 border-t" style={{ borderColor: SHOPEE_LIGHT_BG }}>
          <p className="text-lg flex justify-between">
            <span>Items:</span>
            <span className="font-semibold">{cart.length}</span>
          </p>
          <p className="text-2xl font-bold flex justify-between mt-2">
            <span>Order Total:</span>
            <span style={{ color: SHOPEE_ORANGE }}>${total.toFixed(2)}</span>
          </p>
        </div>
        
        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
      </div>

      <div className="mt-6">
        <ShopeeButton onClick={handlePlaceOrder} disabled={loading}>
          {loading ? 'Placing Order...' : 'Place Order Now'}
        </ShopeeButton>
      </div>
    </div>
  );
};


// --- ORDER HISTORY AND TRACKING ---

const OrderDetails = ({ order, setPage, user }) => {
  const [currentOrder, setCurrentOrder] = useState(order);
  const isCompleted = currentOrder.status === 'Completed';
  const isShipped = ORDER_STATUSES.indexOf(currentOrder.status) >= ORDER_STATUSES.indexOf('Shipped');
  const isReceiving = ORDER_STATUSES.indexOf(currentOrder.status) === ORDER_STATUSES.indexOf('To Receive');
  const isCancellable = ORDER_STATUSES.indexOf(currentOrder.status) <= ORDER_STATUSES.indexOf('To Ship');

  const handleUpdateStatus = async (newStatus) => {
    try {
      // Supabase Update
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', currentOrder.id)
        .eq('user_id', user.id); // RLS/Security check
        
      if (error) throw error;
      
      // Update the local state for immediate feedback
      setCurrentOrder(prev => ({...prev, status: newStatus}));

    } catch(e) {
      console.error("Error updating status:", e);
    }
  };

  // Mock Google Map for tracking (using a placeholder image)
  const MockMap = () => {
    const trackingText = isCompleted 
      ? "Order Delivered Successfully!" 
      : isShipped 
        ? "Tracking: Package en route to delivery hub."
        : "Pending Shipment: Awaiting courier pickup.";
        
    const mockMapUrl = `https://placehold.co/400x200/F5F5F5/333333?text=Order+Tracking+Map`;

    return (
      <div className="mt-4 p-4 border rounded-xl bg-white shadow-inner">
        <h4 className="font-bold mb-2 text-lg" style={{ color: SHOPEE_NAVY }}>Live Status: {currentOrder.status}</h4>
        <div className="relative">
          <img src={mockMapUrl} alt="Order Tracking Map" className="w-full h-48 object-cover rounded-lg" />
          <p className="absolute bottom-2 left-2 right-2 text-center py-1 rounded text-white font-semibold" 
              style={{ backgroundColor: isShipped ? SHOPEE_ORANGE : SHOPEE_NAVY }}>
            {trackingText}
          </p>
        </div>
        <div className="mt-3 text-sm text-gray-600">
            <p>Courier: J&T Express (Mock)</p>
            <p>Tracking ID: SHOPEE-MOCK-{currentOrder.id.slice(0, 8).toUpperCase()}</p>
        </div>
      </div>
    );
  };
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold" style={{ color: SHOPEE_NAVY }}>Order #{currentOrder.id.slice(-8)}</h2>
        <button onClick={() => setPage('history')} className="text-sm font-semibold" style={{ color: SHOPEE_ORANGE }}>
          ← Back
        </button>
      </div>

      {/* Order Status Tracker */}
      <div className="mb-6 p-4 bg-white rounded-xl shadow-md">
        <MockMap />
        
        <div className="mt-4 space-y-3">
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
          {(!isCompleted && !isCancellable && ORDER_STATUSES.indexOf(currentOrder.status) < ORDER_STATUSES.length - 2) && (
            <button
              onClick={() => handleUpdateStatus(ORDER_STATUSES[ORDER_STATUSES.indexOf(currentOrder.status) + 1])}
              className="w-full text-center text-sm py-1 border border-dashed rounded"
              style={{color: SHOPEE_NAVY, borderColor: SHOPEE_NAVY}}
              title="Click to simulate seller/courier action"
            >
              [DEMO] Next Status: {ORDER_STATUSES[ORDER_STATUSES.indexOf(currentOrder.status) + 1]}
            </button>
          )}

        </div>
      </div>
      
      {/* Items Summary */}
      <div className="p-4 bg-white rounded-xl shadow-md">
        <h3 className="font-bold text-xl mb-3" style={{ color: SHOPEE_NAVY }}>Items Ordered</h3>
        {currentOrder.order_items.map((item, index) => (
          <div key={index} className="flex justify-between border-b last:border-b-0 py-2">
            <p className="text-sm">{item.name} x{item.quantity}</p>
            <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
          </div>
        ))}
        <p className="text-xl font-extrabold flex justify-between pt-3">
          <span>TOTAL:</span>
          <span style={{ color: SHOPEE_ORANGE }}>${currentOrder.total.toFixed(2)}</span>
        </p>
      </div>

      {/* Address */}
      <div className="mt-4 p-4 bg-white rounded-xl shadow-md text-sm">
        <h3 className="font-bold text-lg mb-2" style={{ color: SHOPEE_NAVY }}>Shipping To</h3>
        <p><strong>{currentOrder.contact_name}</strong> ({currentOrder.contact_phone})</p>
        <p className="text-gray-600">{currentOrder.shipping_address}</p>
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
      // Select order details AND all related order items
      .select(`
        *,
        order_items (
          product_id, name, price, quantity
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
    } else {
      const mappedOrders = fetchedOrders.map(order => ({
        ...order,
        // Convert Supabase ISO date string to a readable date
        createdAt: new Date(order.created_at).toLocaleDateString(),
      }));
      setOrders(mappedOrders);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    // Initial fetch
    fetchOrders();
    
    // Supabase Realtime Subscription for orders and their items
    if (user) {
      const subscription = supabase
        .channel('orders_channel')
        .on(
          'postgres_changes', 
          { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` }, 
          (payload) => {
            // Re-fetch orders when an order related to the user changes
            fetchOrders();
          }
        )
        .subscribe();
      
      return () => {
        // Cleanup subscription on unmount
        supabase.removeChannel(subscription);
      };
    }

  }, [user, fetchOrders]);


  if (loading) return <Loading />;
  if (orders.length === 0) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-xl font-bold mb-4" style={{ color: SHOPEE_NAVY }}>No Orders Found</h2>
        <ShopeeButton onClick={() => setPage('products')}>Start Shopping!</ShopeeButton>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4" style={{ color: SHOPEE_NAVY }}>My Orders ({orders.length})</h2>
      <div className="space-y-3">
        {orders.map(order => (
          <div 
            key={order.id} 
            className="bg-white p-4 rounded-xl shadow-md cursor-pointer transition-shadow hover:shadow-lg"
            onClick={() => {
              setSelectedOrder(order);
              setPage('details');
            }}
          >
            <div className="flex justify-between items-center border-b pb-2 mb-2">
              <p className="font-semibold text-sm text-gray-600">Order ID: {order.id.slice(-8)}</p>
              <span className="text-xs font-medium px-2 py-1 rounded" 
                    style={{ backgroundColor: SHOPEE_LIGHT_BG, color: SHOPEE_ORANGE }}>
                {order.status}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-lg font-bold" style={{ color: SHOPEE_ORANGE }}>
                ${order.total.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500">{order.createdAt}</p>
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
  const [page, setPage] = useState('products'); // Default view
  const [cart, setCart] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Sign out function
  const handleSignOut = useCallback(() => {
    supabase.auth.signOut().then(() => {
      setCart([]);
      setPage('auth'); // Navigate back to login
    }).catch(console.error);
  }, []);

  // Handle navigation based on auth status
  useEffect(() => {
    if (authReady) {
      if (!user) {
        setPage('auth'); // Force login/signup for non-authenticated users
      } else {
        setPage('products'); // Start shopping once authenticated
      }
    }
  }, [authReady, user]);
  
  // Conditionally render the correct component (Routing)
  const renderContent = () => {
    // If Supabase client failed to initialize due to missing keys, show an error
    if (!supabaseUrl || !supabaseAnonKey) {
        return (
            <div className="p-6 text-center text-red-700 font-bold">
                Configuration Error: Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.
                **Remember to restart your server after setting environment variables.**
            </div>
        );
    }
    
    if (!authReady) return <Loading />;

    // 1. Auth required
    if (!user) {
      return <AuthPage supabase={supabase} onSuccess={() => setPage('products')} />;
    }

    // 2. Main content based on page state
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
        return <OrderDetails order={selectedOrder} setPage={setPage} user={user} />;
      default:
        return <ProductListing setPage={setPage} cart={cart} setCart={setCart} />;
    }
  };

  const navItems = [
    { key: 'products', label: 'Shop', icon: '🛍️' },
    { key: 'cart', label: 'Cart', icon: `🛒${cart.length > 0 ? `(${cart.reduce((sum, item) => sum + item.quantity, 0)})` : ''}` },
    { key: 'history', label: 'Orders', icon: '📦' },
  ];
  
  // Custom Hook to get the current user ID for display
  const displayUserId = useMemo(() => {
      if (user && user.email) return user.email.split('@')[0];
      if (user && user.id) return `User-${user.id.slice(0, 4)}...`;
      return 'Guest';
  }, [user]);


  return (
    <div className="min-h-screen flex flex-col items-center p-0" style={{ backgroundColor: SHOPEE_LIGHT_BG }}>
      {/* Header/Navbar */}
      <header className="w-full shadow-lg p-3 z-10 sticky top-0" style={{ backgroundColor: SHOPEE_ORANGE }}>
        <div className="flex justify-between items-center max-w-xl mx-auto">
          {user && (
            <div className="flex items-center text-white text-sm">
              <span className="mr-2">Welcome, **{displayUserId}**</span>
              <button onClick={handleSignOut} className="px-2 py-1 rounded bg-white bg-opacity-20 hover:bg-opacity-30 transition-all">
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-xl flex-grow pb-16">
        {renderContent()}
      </main>

      {/* Footer Navigation (Mobile App Style) */}
      {user && (
        <nav className="fixed bottom-0 w-full shadow-2xl z-10" style={{ backgroundColor: 'white', borderTop: `1px solid #ddd` }}>
          <div className="flex justify-around max-w-xl mx-auto">
            {navItems.map(item => (
              <button
                key={item.key}
                onClick={() => setPage(item.key)}
                className={`flex flex-col items-center p-2 text-xs font-semibold w-1/3 transition-colors ${page === item.key ? 'text-opacity-100' : 'text-opacity-50'}`}
                style={{ color: SHOPEE_ORANGE }}
              >
                <span className="text-xl mb-1">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
};
    
export default App;