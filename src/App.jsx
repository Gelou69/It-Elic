    // App.jsx (Food Delivery - Iligan City Localized)
    // This file is now fixed to use real Supabase queries based on your schema.
    import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
    import { createClient } from '@supabase/supabase-js';
    import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
    import './App.css';

    // --- CONFIGURATION ---
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    // Get the Google Maps API Key from environment variables
    const MOCK_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE';

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error(
        "FATAL ERROR: Supabase environment variables are missing! " +
        "Please ensure you have a .env.local file in your project root " +
        "with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY defined."
      );
    }

    if (MOCK_MAPS_API_KEY === 'YOUR_API_KEY_HERE') {
      console.warn(
        "MAPS WARNING: VITE_GOOGLE_MAPS_API_KEY is not set in your .env.local file. " +
        "The map will not load."
      );
    }

    export const supabase = createClient(supabaseUrl || 'http://missing-url.com', supabaseAnonKey || 'missing-key');


    export const ORANGE = 'var(--shopee-orange)';
    export const NAVY = 'black';
    export const LIGHT_BG = 'var(--shopee-light-bg)';
    export const GRAY_TEXT = 'var(--shopee-gray-text)';
    export const BORDER = 'var(--shopee-border)';


    export const MOCK_ILIGAN_CENTER = { lat: 8.2280, lng: 124.2452 };


    export const ORDER_STATUSES = [
      'Preparing', 'Out for Delivery', 'Delivered', 'Completed', 'Cancelled',
    ];


    export const Loading = () => (
      <div className="flex items-center justify-center p-8 h-full w-full">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-t-transparent" style={{borderColor: ORANGE}}></div>
        <span className="ml-4 text-lg font-medium" style={{color: NAVY}}>Loading Iligan Food...</span>
      </div>
    );

    // 2. Store Button (ShopeeButton renamed to FoodButton for context)
    export const FoodButton = ({ children, onClick, className = '', disabled = false, variant = 'primary' }) => {
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


    // --- SUPABASE AND DATA HOOK (Unchanged) ---

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

    // --- AUTHENTICATION COMPONENTS (Text updated for Food app) ---

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
        <div className="flex justify-center items-center h-full w-full py-10"> 
            <div className="p-6 md:p-10 bg-white rounded-2xl shadow-2xl mx-4 w-full max-w-md">
                <h2 className="text-3xl font-extrabold mb-8 text-center" style={{ color: ORANGE }}>
                    {isLogin ? 'Welcome Back to Iligan Food!' : 'Join the Food Delivery Family'}
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
                    <FoodButton onClick={handleAuth}>
                        {isLogin ? 'Login Securely' : 'Sign Up Now'}
                    </FoodButton>
                </div>
                
                <p className="mt-6 text-center text-gray-500 text-sm">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button 
                    onClick={() => { setIsLogin(!isLogin); setError(''); }}
                    className="ml-2 font-bold hover:underline"
                    style={{ color: ORANGE }}
                    >
                    {isLogin ? 'Sign Up' : 'Login'}
                    </button>
                </p>
            </div>
        </div>
      );
    };

    // --- PRODUCT LISTING COMPONENT (Now Restaurant Listing) ---

    const RestaurantListing = ({ setPage, cart, setCart }) => {
      const [allFoodItems, setAllFoodItems] = useState([]);
      const [categories, setCategories] = useState([]); // <-- NEW: State for categories
      const [loading, setLoading] = useState(true);
      const [selectedRestaurant, setSelectedRestaurant] = useState(null);
      const [selectedCategory, setSelectedCategory] = useState(null);
      
      // --- FIXED: REAL SUPABASE FETCH ---
      useEffect(() => {
        const fetchFoodData = async () => {
          setLoading(true);
          
          // 1. Fetch Categories
          const { data: categoryData, error: categoryError } = await supabase
            .from('categories')
            .select('*')
            .order('name', { ascending: true });
            
          if (categoryError) console.error('Error fetching categories:', categoryError);
          else setCategories(categoryData);
      
          // 2. Fetch Food Items (joining restaurant and category details)
          const { data: foodData, error: foodError } = await supabase
            .from('food_items')
            .select(`
              food_item_id,
              name,
              price,
              stock,
              image_url,
              description,
              restaurants (
                id,
                name,
                image_url,
                address_barangay,
                is_open,
                categories (
                  id,
                  name,
                  icon_url
                )
              )
            `)
            // Only show items from restaurants that are open
            .eq('restaurants.is_open', true); 
      
          if (foodError) {
            console.error('Error fetching food items:', foodError);
          } else {
            // Map the data to the flat structure your component expects
            const combinedData = foodData
              // ---
              // --- THIS IS THE FIX ---
              // --- Filter out any food items where the restaurant is null
              .filter(food => food.restaurants) 
              // ---
              .map(food => ({
                ...food,
                // Use 'food_item_id' from your schema as the 'id'
                id: food.food_item_id, 
                restaurant_id: food.restaurants.id, // Now this is safe
                restaurant_name: food.restaurants.name,
                restaurant_image_url: food.restaurants.image_url,
                // Use the category name from the nested restaurant data
                category_name: food.restaurants.categories?.name || 'Uncategorized',
              }));
            setAllFoodItems(combinedData);
          }
          
          setLoading(false);
        };
        
        fetchFoodData();
      }, []); // Keep empty dependency array

      const filteredItems = useMemo(() => {
        let items = allFoodItems;
        
        // 1. Filter by Category
        if (selectedCategory) {
          items = items.filter(item => item.category_name === selectedCategory.name);
        }
        
        // 2. Filter by Restaurant
        if (selectedRestaurant) {
            items = items.filter(item => item.restaurant_id === selectedRestaurant.id);
        }
        
        return items;
      }, [allFoodItems, selectedCategory, selectedRestaurant]);

      // Group items by restaurant for display
      const foodItemsByRestaurant = useMemo(() => {
        return filteredItems.reduce((acc, item) => {
          const { restaurant_id, restaurant_name, restaurant_image_url } = item;
          if (!acc[restaurant_id]) {
            acc[restaurant_id] = { 
              id: restaurant_id, 
              name: restaurant_name, 
              image_url: restaurant_image_url,
              items: []
            };
          }
          acc[restaurant_id].items.push(item);
          return acc;
        }, {});
      }, [filteredItems]);

      // Get a unique list of restaurants for the view
      const displayRestaurants = useMemo(() => Object.values(foodItemsByRestaurant), [foodItemsByRestaurant]);

      const addToCart = useCallback((foodItem, quantity = 1) => {
        setCart(prevCart => {
          const existingItem = prevCart.find(item => item.id === foodItem.id);
          if (existingItem) {
            return prevCart.map(item =>
              item.id === foodItem.id ? { ...item, quantity: item.quantity + quantity } : item
            );
          } else {
            // Include restaurant name in cart item for easy display
            return [...prevCart, { ...foodItem, quantity, restaurant_name: foodItem.restaurant_name }];
          }
        });
      }, [setCart]);

      const handleOrderNow = useCallback((foodItem) => {
        setCart([{ ...foodItem, quantity: 1, restaurant_name: foodItem.restaurant_name }]);
        setPage('checkout');
      }, [setCart, setPage]);

      const cartItemCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

      if (loading) return <Loading />;

      return (
        <div className="p-4 md:p-6 mx-auto w-full max-w-3xl">
          <SectionTitle icon="🍽️" title="Local Iligan City Delivers" />
          
          {/* Category Filter --- FIXED --- */}
          <div className='flex overflow-x-auto space-x-2 pb-4 border-b mb-6' style={{borderColor: BORDER}}>
            <button 
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-bold flex-shrink-0 transition-colors ${!selectedCategory ? 'text-white' : 'bg-white text-gray-700'}`}
              style={{ backgroundColor: !selectedCategory ? ORANGE : 'white', border: `1px solid ${ORANGE}` }}
            >
              All Shops
            </button>
            {/* Map over the new 'categories' state variable */}
            {categories.map(category => ( 
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-bold flex-shrink-0 transition-colors flex items-center ${selectedCategory?.id === category.id ? 'text-white' : 'bg-white text-gray-700'}`}
                style={{ backgroundColor: selectedCategory?.id === category.id ? ORANGE : 'white', border: `1px solid ${ORANGE}` }}
              >
                {/* NOTE: Your schema has 'icon_url'. You'll need an <img> tag here.
                    This is a placeholder emoji. */}
                {category.icon_url ? (
                  <img src={category.icon_url} alt="" className="w-4 h-4 mr-1" />
                ) : (
                  <span className='mr-1'>🍔</span> 
                )}
                {category.name}
              </button>
            ))}
          </div>
          
          {/* Restaurant and Menu Listing */}
          <div className='space-y-8'>
            {displayRestaurants.map(restaurant => (
              <div key={restaurant.id} className="bg-white p-4 rounded-xl shadow-lg">
                <div className="flex items-center mb-4">
                  <img src={restaurant.image_url} alt={restaurant.name} className="w-12 h-12 object-cover rounded-full mr-4 border" style={{borderColor: BORDER}} />
                  <h3 className="text-xl font-extrabold" style={{ color: NAVY }}>{restaurant.name}</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {restaurant.items.map(foodItem => (
                    <div 
                      key={foodItem.id} 
                      className="p-3 rounded-lg border flex justify-between items-center" 
                      style={{ border: `1px solid ${BORDER}` }}
                    >
                      <div className="flex items-center">
                        <img 
                            src={foodItem.image_url} 
                            alt={foodItem.name} 
                            className="w-12 h-12 object-cover mr-3 rounded" 
                            style={{borderColor: BORDER}}
                        />
                        <div>
                          <p className="text-sm font-semibold line-clamp-2">{foodItem.name}</p>
                          <p className="text-base font-extrabold mt-1" style={{ color: ORANGE }}>
                            ₱{foodItem.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      
                      <FoodButton 
                          onClick={() => addToCart(foodItem)} 
                          variant="secondary"
      
                      >
                        + Add
                      </FoodButton>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {/* View Cart Button */}
          <div className="mt-8">
            <FoodButton 
              onClick={() => setPage('cart')} 
              className="py-3"
              disabled={cartItemCount === 0}
            >
              View Basket ({cartItemCount}) →
            </FoodButton>
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
            <span className='text-6xl mb-4'>🛵</span>
            <h2 className="text-2xl font-bold mb-6" style={{ color: NAVY }}>Your Basket is Empty!</h2>
            <p className='text-gray-500 mb-8'>Time to order from Iligan's finest.</p>
            <div className='w-full max-w-sm'>
                <FoodButton onClick={() => setPage('products')}>Start Ordering</FoodButton>
            </div>
          </div>
        );
      }

      // Group cart items by restaurant
      const cartByRestaurant = useMemo(() => {
        return cart.reduce((acc, item) => {
          const restaurantName = item.restaurant_name || 'Unspecified Restaurant';
          if (!acc[restaurantName]) {
            acc[restaurantName] = [];
          }
          acc[restaurantName].push(item);
          return acc;
        }, {});
      }, [cart]);

      return (
        <div className="p-4 md:p-6 mx-auto w-full max-w-3xl">
          <SectionTitle icon="🍜" title="Review Your Order" />
          
          {Object.entries(cartByRestaurant).map(([restaurantName, items]) => (
            <div key={restaurantName} className="mb-6 p-4 bg-white rounded-xl shadow-md border" style={{borderColor: BORDER}}>
              <h4 className="font-bold text-lg mb-3" style={{ color: NAVY }}>{restaurantName}</h4>
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between pb-3 mb-3 border-b last:border-b-0 last:pb-0">
                  <div className="flex items-center flex-grow">
                    <img src={item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded-md mr-4 border" style={{borderColor: BORDER}} />
                    
                    <div className='flex-grow min-w-0'>
                      <p className="font-semibold text-gray-800 line-clamp-2">{item.name}</p>
                      <p className="text-sm font-bold mt-1" style={{ color: ORANGE }}>₱{item.price.toFixed(2)}</p>
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
            </div>
          ))}

          <div className="mt-8 p-5 bg-white rounded-xl shadow-lg border" style={{borderColor: BORDER}}>
            <p className="text-xl text-black font-extrabold flex justify-between ">
              <span>Total Payable:</span>
              <span className="text-2xl" style={{ color: ORANGE }}>₱{total.toFixed(2)}</span>
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <FoodButton onClick={() => setPage('checkout')}>Proceed to Checkout</FoodButton>
            <FoodButton  onClick={() => setPage('products')} variant="secondary">Add More</FoodButton>
          </div>
        </div>
      );
    };


    const Checkout = ({ setPage, cart, setCart, user }) => {
      
      // --- FIXED: Removed ILIGAN_BARANGAYS from initial state ---
      const [address, setAddress] = useState({ 
        name: '', phone: '', addressDetail: '', barangay: '', payment: 'COD' 
      });
      
      // --- NEW: State for fetched delivery zones ---
      const [barangays, setBarangays] = useState([]);
      
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState('');
      
      const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);

      // --- NEW: useEffect to fetch barangays ---
      useEffect(() => {
        const fetchBarangays = async () => {
          const { data, error } = await supabase
            .from('delivery_zones')
            .select('barangay_name')
            .eq('is_active', true) // Only get active zones
            .order('barangay_name', { ascending: true });
            
          if (data) {
            const barangayNames = data.map(b => b.barangay_name);
            setBarangays(barangayNames);
            // Set default barangay once fetched
            if (barangayNames.length > 0) {
              setAddress(prev => ({ ...prev, barangay: barangayNames[0] }));
            }
          } else {
            console.error('Error fetching barangays:', error);
          }
        };
        
        fetchBarangays();
      }, []); // Runs once on component mount

      // Build the combined shipping_address string
      const buildShippingAddress = () => {
        const { barangay, addressDetail } = address;
        return `Iligan City, Brgy. ${barangay} • ${addressDetail}`;
      };

      // --- FIXED: REAL SUPABASE ORDER PLACEMENT ---
      const handlePlaceOrder = async () => {
        if (!user) {
          setError('User not authenticated.');
          return;
        }
        if (!address.name || !address.phone || !address.barangay || !address.addressDetail) {
          setError('Please fill in Recipient Name, Phone, Barangay, and Full Address details.');
          return;
        }
        setLoading(true);
        
        try {
          const shipping_address_combined = buildShippingAddress();
          
          // 1. Define the main order data
          const orderData = {
            user_id: user.id,
            total: total, // This is the subtotal (delivery fee is separate)
            shipping_address: shipping_address_combined,
            contact_name: address.name,
            contact_phone: address.phone,
            payment_method: address.payment,
            status: ORDER_STATUSES[0], // 'Preparing'
          };

          // --- REAL SUPABASE INSERT (Orders) ---
          const { data: newOrder, error: orderError } = await supabase
            .from('orders')
            .insert(orderData)
            .select() // 'select()' returns the newly created row
            .single(); // We expect a single row back

          if (orderError) throw orderError;
          if (!newOrder) throw new Error("Failed to create order, no data returned.");

          const newOrderId = newOrder.id;
          
          // 2. Map cart items to the 'order_items' schema
          const itemData = cart.map(item => ({
            order_id: newOrderId,
            // 'id' in our cart is the 'food_item_id'
            food_item_id: item.id, 
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          }));

          // --- REAL SUPABASE INSERT (Order Items) ---
          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(itemData);
            
          if (itemsError) {
            // If items fail, we should try to delete the order
            // This is better handled in a DB transaction or Edge Function
            console.error("Failed to insert items, attempting rollback...", itemsError);
            await supabase.from('orders').delete().eq('id', newOrderId);
            throw itemsError;
          }
          
          // --- END REAL INSERTS ---

          console.log("Real Order Placed:", { newOrder, itemData });
          
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
              📍 Iligan City (Mock Location Pin)
            </div>
          </div>
      );

      return (
        <div className="p-4 md:p-6 mx-auto w-full max-w-3xl">
          <SectionTitle icon="🛵" title="Final Step: Confirm Delivery" />
          <div className="bg-white p-6 rounded-2xl shadow-xl space-y-6">
            
            {/* Shipping Information */}
            <div className='border-b pb-4' style={{borderColor: BORDER}}>
              <h3 className="font-bold text-lg mb-4" style={{ color: NAVY }}><span className='text-xl mr-2'>🏠</span>Delivery Details</h3>
              
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

                  {/* NEW: Iligan Barangay Dropdown --- FIXED --- */}
                  <div>
                    <label className='text-xs font-semibold text-gray-600'>Barangay (Iligan City Only)</label>
                    <select
                      value={address.barangay}
                      onChange={(e) => setAddress({ ...address, barangay: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg appearance-none bg-white font-semibold focus:ring-2 focus:ring-offset-0 input-focus-shopee"
                      disabled={barangays.length === 0} // Disable if still loading
                    >
                      {/* Map over the new 'barangays' state variable */}
                      {barangays.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>

                  <StyledInput
                      placeholder="Street / Unit / House No."
                      value={address.addressDetail}
                      onChange={(e) => setAddress({ ...address, addressDetail: e.target.value })}
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
                  <select
                      value={address.payment}
                      onChange={(e) => setAddress({ ...address, payment: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg appearance-none bg-white font-semibold focus:ring-2 focus:ring-offset-0 input-focus-shopee"
                      style={{ paddingRight: '2.5rem'}}
                  >
                      <option value="COD">Cash on Delivery (COD) - Preferred</option>
                      <option value="E-Wallet">GCash/Maya (E-Wallet)</option>
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
                <span className="font-semibold">₱{total.toFixed(2)}</span>
              </p>
              <p className="text-lg flex justify-between text-gray-600 border-b pb-3 mb-3" style={{borderColor: BORDER}}>
                  <span>Delivery Fee:</span>
                <span className="font-semibold">₱50.00</span> {/* Hardcoded fee */}
              </p>
              <p className="text-2xl font-extrabold flex justify-between">
                <span>TOTAL:</span>
                <span style={{ color: ORANGE }}>₱{(total + 50).toFixed(2)}</span>
              </p>
            </div>
            
            {error && <p className="text-sm text-red-500 mt-4 font-medium">{error}</p>}
          </div>

          <div className="mt-6">
            <FoodButton onClick={handlePlaceOrder} disabled={loading || barangays.length === 0}>
              {loading ? 'Processing...' : 'Place Order Now'}
            </FoodButton>
            <FoodButton onClick={() => setPage('cart')} variant='secondary' className='mt-2'>
                ← Back to Basket
            </FoodButton>
          </div>
        </div>
      );
    };


    // --- ORDER HISTORY AND TRACKING ---

    // Component for Order Tracking, including the animated map
    const OrderTracking = ({ order, setPage, user }) => {
      const [currentOrder, setCurrentOrder] = useState(order);
      const isCompleted = currentOrder.status === 'Delivered' || currentOrder.status === 'Completed';
      const isShipped = ORDER_STATUSES.indexOf(currentOrder.status) >= ORDER_STATUSES.indexOf('Out for Delivery');
      const isReceiving = ORDER_STATUSES.indexOf(currentOrder.status) === ORDER_STATUSES.indexOf('Delivered');
      const isCancellable = ORDER_STATUSES.indexOf(currentOrder.status) <= ORDER_STATUSES.indexOf('Preparing');

      // --- Constants for Map (Mock, as no real coordinate data is available) ---
      const MOCK_ORIGIN = "Iligan City, Lanao del Norte, Philippines";
      const MOCK_DESTINATION = currentOrder.shipping_address; 
      
      const containerStyle = {
        width: '100%',
        height: '200px'
      };

      const center = useMemo(() => MOCK_ILIGAN_CENTER, []);
      
      // This remains mock as we don't have a 'barangay_coordinates' table
      const barangayCoords = useMemo(() => {
        const baseLat = 8.2280;
        const baseLng = 124.2452;
        const offset = 0.01;
        const coords = { 'default': MOCK_ILIGAN_CENTER };
        // This part is a mock, it just generates semi-random coords for demo
        // In a real app, you'd fetch this or use the Geocoding API
        const barangayNames = [
          'Abuno', 'Acmac', 'Bagong Silang', 'Bonbonon', 'Bunawan', 'Buru-un', 
          'Dalipuga', 'Del Carmen', 'Digkilaan', 'Ditucalan', 'Dulag', 'Hinaplanon', 
          'Hindang', 'Kabacsanan', 'Kalilangan', 'Kiwalan', 'Lanipao', 'Luinab', 
          'Mahayahay', 'Mainit', 'Mandulog', 'Maria Cristina', 'Palao', 'Panoroganan', 
          'Poblacion', 'Puga-an', 'Rogongon', 'San Miguel', 'San Roque', 'Santiago', 
          'Saray', 'Santa Elena', 'Santa Filomena', 'Santo Rosario', 'Suarez', 
          'Tambacan', 'Tibanga', 'Tipanoy', 'Tomas L. Cabili', 'Tubod', 'Ubaldo Laya', 
          'Upper Hinaplanon', 'Upper Tominobo', 'Villa Verde'
        ];
        barangayNames.forEach((b, index) => {
            if (!coords[b]) {
                coords[b] = { 
                    lat: baseLat + (index % 5) * offset * 0.1, 
                    lng: baseLng + (Math.floor(index / 5) % 5) * offset * 0.1 
                };
            }
        });
        return coords;
      }, []);

      const destinationCoords = useMemo(() => {
        const addressText = (currentOrder.shipping_address || '').toString();
        let foundKey = 'default';
        for (const k of Object.keys(barangayCoords)) {
          if (k !== 'default' && addressText.includes(`Brgy. ${k}`)) {
            foundKey = k;
            break;
          }
        }
        return barangayCoords[foundKey] || barangayCoords['default'];
      }, [currentOrder.shipping_address, barangayCoords]);

      // LOADER HOOK: This loads the Google Maps script using the API key
      const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: MOCK_MAPS_API_KEY,
      });

      // --- FIXED: REAL SUPABASE STATUS UPDATE ---
      const handleUpdateStatus = async (newStatus) => {
        // Only allow user to Cancel or mark as Completed
        const allowedUserUpdates = ['Cancelled', 'Completed'];
        if (!allowedUserUpdates.includes(newStatus) && newStatus !== ORDER_STATUSES[ORDER_STATUSES.indexOf(currentOrder.status) + 1]) {
          // The second check allows the demo button to work
          console.warn(`User status update to ${newStatus} is not allowed.`);
          // but we'll allow it for the demo button.
        }

        try {
          // --- REAL SUPABASE UPDATE ---
          const { data, error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', currentOrder.id)
            .eq('user_id', user.id); // Security check
            
          if (error) throw error;
          
          setCurrentOrder(prev => ({...prev, status: newStatus}));

        } catch(e) {
          console.error("Error updating status:", e);
        }
      };

      // Status Indicator Component
      const StatusPill = ({ status }) => {
          const statusColors = {
              'Preparing': { bg: '#FFF5E0', text: '#FF9900' },
              'Out for Delivery': { bg: '#E6F7FF', text: '#00BFFF' },
              'Delivered': { bg: '#E6FFFA', text: '#00C46A' },
              'Completed': { bg: '#E6FFFA', text: '#00C46A' },
              'Cancelled': { bg: '#F5F5F5', text: GRAY_TEXT },
          };
          const color = statusColors[status] || statusColors['Preparing'];

          return (
              <span className="text-sm font-bold px-3 py-1 rounded-full" 
                  style={{ backgroundColor: color.bg, color: color.text }}>
                  {status}
              </span>
          );
      };
      
      // REAL Google Map using @react-google-maps/api (with mock coordinates)
      const MockMap = () => {
        const trackingText = isCompleted 
          ? "Order Delivered Successfully!" 
          : isShipped 
            ? "Tracking: Rider is en route to your location."
            : "Pending: Restaurant is preparing your food.";

        const statusIndex = ORDER_STATUSES.indexOf(currentOrder.status);
        const maxProgressIndex = ORDER_STATUSES.indexOf('Delivered');
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
        
        const mapCenter = isShipped ? destinationCoords : center;

        // RIDER ANIMATION (Mock)
        const [riderPos, setRiderPos] = useState(center);
        const animRef = useRef(null);
        const progressRef = useRef(0); 

        const riderSvg = encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="20" fill="${encodeURIComponent(ORANGE)}" stroke="#fff" stroke-width="2"/>
            <path fill="#fff" d="M18 25c0 1.66 1.34 3 3 3s3-1.34 3-3V19h-6v6zm6 0c0 1.66 1.34 3 3 3s3-1.34 3-3V19h-6v6zM24 8c-4.42 0-8 3.58-8 8v16h16V16c0-4.42-3.58-8-8-8z"/>
            <text x="24" y="30" font-family="Arial" font-size="12" fill="#fff" text-anchor="middle">🛵</text>
          </svg>
        `);
        const riderIcon = {
          url: `data:image/svg+xml;utf8,${riderSvg}`,
          scaledSize: { width: 48, height: 48 },
          anchor: { x: 24, y: 24 },
        };

        useEffect(() => {
          setRiderPos(center);
          progressRef.current = isShipped ? 0 : 0;
          if (!isShipped || isCompleted) {
            if (animRef.current) {
              clearInterval(animRef.current);
              animRef.current = null;
            }
            return;
          }

          const duration = 8000; 
          const stepMs = 50;
          const steps = Math.max(1, Math.floor(duration / stepMs));
          let step = 0;

          if (animRef.current) {
            clearInterval(animRef.current);
            animRef.current = null;
          }
          
          animRef.current = setInterval(() => {
            step++;
            const t = Math.min(1, step / steps); // 0..1
            progressRef.current = t;
            const lat = center.lat + (destinationCoords.lat - center.lat) * t;
            const lng = center.lng + (destinationCoords.lng - center.lng) * t;
            setRiderPos({ lat, lng });

            if (t >= 1) {
              clearInterval(animRef.current);
              animRef.current = null;
            }
          }, stepMs);

          return () => {
            if (animRef.current) {
              clearInterval(animRef.current);
              animRef.current = null;
            }
          };
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [isShipped, destinationCoords.lat, destinationCoords.lng, center.lat, center.lng]);

        return (
            <div className="mt-4 p-4 border rounded-xl bg-white shadow-inner">
                <h4 className="font-bold mb-2 text-lg" style={{ color: NAVY }}>Tracking Status</h4>
                <div className="relative">
                    {/* INTERACTIVE GOOGLE MAP */}
                    <div className="rounded-t-lg overflow-hidden border-b-2" style={{borderColor: NAVY}}>
                        <GoogleMap
                            mapContainerStyle={containerStyle}
                            center={isShipped ? riderPos : mapCenter}
                            zoom={isShipped ? 14 : 12}
                            options={{
                                disableDefaultUI: true,
                                zoomControl: true,
                            }}
                        >
                            {/* Origin Marker (Restaurant/Rider Start) */}
                            <Marker 
                                position={center}
                                label={{
                                    text: 'Shop',
                                    className: 'map-label-origin',
                                    color: 'white'
                                }}
                            />
                            
                            {/* Destination Marker (Home) */}
                            <Marker 
                                position={destinationCoords}
                                label={{
                                    text: 'You',
                                    className: 'map-label-destination',
                                    color: 'white'
                                }}
                            />

                            {/* Rider Marker (animated) */}
                            {isShipped && !isCompleted && (
                                <Marker
                                    position={riderPos}
                                    icon={riderIcon}
                                />
                            )}
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
                    <p>Delivery Partner: Local Iligan Rider (Mock)</p>
                    <p>Reference No: FOOD-ILIGAN-{currentOrder.id.slice(0, 8).toUpperCase()}</p>
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
                  <p className="font-medium text-sm text-gray-600">Order ID: **{currentOrder.id.slice(-6)}**</p>
                  <StatusPill status={currentOrder.status} />
              </div>
              
              <MockMap />
              
              <div className="mt-6 space-y-3">
                {/* Action Buttons */}
                {isReceiving && (
                  <FoodButton onClick={() => handleUpdateStatus('Completed')}>
                    CONFIRM ORDER RECEIVED & RATE
                  </FoodButton>
                )}
                
                {isCancellable && (
                  <FoodButton onClick={() => handleUpdateStatus('Cancelled')} variant="secondary">
                    Cancel Order
                  </FoodButton>
                )}

                {/* Seller Simulation Button (for demo purposes) */}
                {(!isCompleted && 
                !isCancellable && ORDER_STATUSES.indexOf(currentOrder.status) < ORDER_STATUSES.length - 2) && (
                  
                  <button
                    onClick={() => handleUpdateStatus(ORDER_STATUSES[ORDER_STATUSES.indexOf(currentOrder.status) + 1])}
                    className="w-full text-center text-sm py-2 border-2 border-dashed rounded-lg font-bold"
                    style={{color: NAVY, borderColor: NAVY, opacity: 0.7}}
                    title="Click to simulate restaurant/rider action"
                  >
                    [DEMO] Next Status: {ORDER_STATUSES[ORDER_STATUSES.indexOf(currentOrder.status) + 1]}
                  </button>
                )}
              </div>
          </div>
          
          {/* Items Summary */}
          <div className="p-4 bg-white rounded-xl shadow-md mb-4">
            <h3 className="font-bold text-lg mb-3" style={{ color: NAVY }}>Items Ordered</h3>
            {/* Use order_items from your schema */}
            {currentOrder.order_items.map((item, index) => (
              <div key={item.food_item_id || index} className="flex justify-between border-b last:border-b-0 py-2 text-gray-700">
                <p className="text-base font-medium">{item.name} x{item.quantity}</p>
                <p className="font-semibold text-base">₱{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
            <p className="text-xl text-black font-extrabold flex justify-between pt-4 mt-2">
              <span>FINAL TOTAL:</span>
              {/* 'total' from your 'orders' table *is* the final total, add mock delivery fee */}
              <span style={{ color: ORANGE }}>₱{(currentOrder.total + 50).toFixed(2)}</span> 
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
      
      // --- FIXED: REAL SUPABASE ORDER FETCH ---
      const fetchOrders = useCallback(async () => {
        if (!user) {
          setLoading(false);
          return;
        }

        setLoading(true);
        
        // This query selects all orders for the user
        // and nests all 'order_items' associated with each order.
        const { data: fetchedOrders, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              food_item_id,
              name,
              price,
              quantity
            )
          `)
          .eq('user_id', user.id) // Filter by the currently logged-in user
          .order('created_at', { ascending: false }); // Show newest orders first
        
        if (error) {
          console.error("Error fetching orders:", error);
          setOrders([]);
        } else {
          // Map data to add 'createdAt' formatting
          const mappedOrders = fetchedOrders.map(order => ({
            ...order,
            createdAt: new Date(order.created_at).toLocaleDateString('en-US', { 
              day: 'numeric', month: 'short', year: 'numeric' 
            }),
          }));
          setOrders(mappedOrders);
        }
        
        setLoading(false);
      }, [user]); // Dependency is 'user'

      useEffect(() => {
        fetchOrders();
        // You can re-add Supabase subscriptions here if needed
      }, [user, fetchOrders]);

      const StatusPill = ({ status }) => {
          const statusColors = {
              'Preparing': { bg: '#FFF5E0', text: '#FF9900' },
              'Out for Delivery': { bg: '#E6F7FF', text: '#00BFFF' },
              'Delivered': { bg: '#E6FFFA', text: '#00C46A' },
              'Completed': { bg: '#E6FFFA', text: '#00C46A' },
              'Cancelled': { bg: '#F5F5F5', text: GRAY_TEXT },
          };
          const color = statusColors[status] || statusColors['Preparing'];
          
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
            <p className='text-gray-500 mb-8'>Your food order history will appear here.</p>
            <div className='w-full max-w-sm'>
                <FoodButton onClick={() => setPage('products')}>Start Ordering!</FoodButton>
            </div>
          </div>
        );
      }

      return (
        <div className="p-4 md:p-6 mx-auto w-full max-w-3xl">
          <SectionTitle icon="🛵" title={`My Iligan Orders (${orders.length})`} />
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
                      <p className="font-bold text-lg text-gray-800">Order ID: #{order.id.slice(-6)}</p>
                      <p className="text-xs text-gray-500 mt-1">Date Placed: {order.createdAt}</p>
                  </div>
                  <StatusPill status={order.status} />
                </div>
                
                <div className='flex justify-between items-center'>
                    <p className='text-sm text-gray-700'>
                      {order.order_items.length} item{order.order_items.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-xl font-extrabold" style={{ color: ORANGE }}>
                        {/* Add mock delivery fee */}
                        ₱{(order.total + 50).toFixed(2)} 
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

      // FIX FOR INFINITE LOOP AND NAVIGATION
      useEffect(() => {
        if (!authReady) return;

        if (!user) {
          // 1. If not authenticated, always go to auth page.
          if (page !== 'auth') {
            setPage('auth');
          }
          return;
        } 

        // 2. If authenticated, handle page redirection.
        if (page === 'auth') {
          // If user logs in successfully, redirect them to products.
          setPage('products');
        } else if (page === 'details' && !selectedOrder) {
          // 3. If the user is on 'details' but no order is selected, go to history.
          setPage('history');
        }
        
        // Cleanup: If the page is not 'details', clear selectedOrder state
        if (page !== 'details' && selectedOrder) {
            setSelectedOrder(null);
        }
      }, [authReady, user, page, selectedOrder]); 

      const renderContent = () => {
        if (!authReady) return <Loading />;
        
        if (!user) {
          return <AuthPage supabase={supabase} onSuccess={() => setPage('products')} />;
        }

        switch (page) {
          case 'products':
            return <RestaurantListing setPage={setPage} cart={cart} setCart={setCart} />;
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
            return <OrderTracking order={selectedOrder} setPage={setPage} user={user} />;
          default:
            // Ensures unknown pages default to products
            return <RestaurantListing setPage={setPage} cart={cart} setCart={setCart} />;
        }
      };

      const cartItemCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
      
      const navItems = [
        { key: 'products', label: 'Shops', icon: '🍔' },
        { key: 'cart', label: 'Basket', icon: `🧺`, count: cartItemCount },
        { key: 'history', label: 'Orders', icon: '🛵' },
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
              <h1 className="text-xl font-black text-white">ILIGAN <span className='text-sm font-light italic'>Food</span></h1>
              
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

          {/* Main Content Area: flex-1 ensures it takes all available height, and overflow-y-auto makes it scrollable */}
          <main className="w-full flex-1 overflow-y-auto"> 
            {renderContent()}
          </main>

          {user && (
            <nav className="flex-shrink-0 w-full shadow-2xl z-10" style={{ backgroundColor: 'white', borderTop: `1px solid ${BORDER}` }}>
              <div className="flex justify-around w-full max-w-3xl mx-auto">
                {navItems.map(item => (
                  <button
                    key={item.key}
                    onClick={() => setPage(item.key)}
                    className={`flex flex-col items-center p-2 pt-3 text-xs font-semibold w-full sm:w-3/4 transition-colors relative ${page === item.key ? 'text-opacity-100' : 'text-opacity-60'}`}
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
