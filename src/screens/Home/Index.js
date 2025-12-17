import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TouchableHighlight,
  FlatList,
  Animated,
  Easing,
  BackHandler,
  ToastAndroid,
  PermissionsAndroid,
  Modal,
  Alert,
  RefreshControl,
  LayoutAnimation,
  ActivityIndicator,
  Platform,
  ScrollView, // ⬅️ new
} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigation, useIsFocused, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from 'react-native-geolocation-service';
import LinearGradient from 'react-native-linear-gradient';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Fontisto from 'react-native-vector-icons/Fontisto';
import { base_url } from '../../../App';

const BRAND_GRADIENT = ['#0F172A', '#1E293B', '#334155'];
const ACCENT = '#c9170a';

const Index = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const [refreshing, setRefreshing] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [backPressCount, setBackPressCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [spinner, setSpinner] = useState(false);

  const [allOrders, setAllOrders] = useState([]);
  const [requestOrders, setRequestOrders] = useState([]);
  const [order_id, setOrder_id] = useState(null);
  const [req_id, setReqId] = useState(null);
  const [delivery_category, setDeliveryCategory] = useState(null);

  const [confirmDeliverModal, setConfirmDeliverModal] = useState(false);
  const openConfirmDeliverModal = () => setConfirmDeliverModal(true);
  const closeConfirmDeliverModal = () => setConfirmDeliverModal(false);

  const [activeTab, setActiveTab] = useState('sub_list');
  const [notDeliveredSubCount, setNotDeliveredSubCount] = useState(0);
  const [notDeliveredReqCount, setNotDeliveredReqCount] = useState(0);

  // 🔑 filter state
  const [selectedPrice, setSelectedPrice] = useState(null);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    React.useCallback(() => {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.12, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      );
      anim.start();
      return () => anim.stop();
    }, [scaleAnim])
  );

  const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 50, useNativeDriver: true }).start(() => startDelivery());
  };

  const startDelivery = async () => {
    const access_token = await AsyncStorage.getItem('storeAccesstoken');
    try {
      const response = await fetch(base_url + 'api/start-delivery', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${access_token}`, 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (response.ok) getAllOrders();
      else console.log('Failed to start delivery', data);
    } catch (error) { console.log('Error', error); }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([getAllOrders(), getRequestOrders(), getProfileDetails()]);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    const handleBackPress = () => {
      if (backPressCount === 1) { BackHandler.exitApp(); return true; }
      ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
      setBackPressCount(1);
      setTimeout(() => setBackPressCount(0), 2000);
      return true;
    };
    if (isFocused) {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
      return () => backHandler.remove();
    }
  }, [backPressCount, isFocused]);

  const toggleExpandRow = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedRow(expandedRow === id ? null : id);
  };

  const getPerDayPriceCounts = () => {
    if (!allOrders || allOrders.length === 0) return [];
    const map = {};
    allOrders.forEach((it) => {
      const p = it?.order?.flower_product?.per_day_price;
      if (p !== undefined && p !== null) { const k = String(p); map[k] = (map[k] || 0) + 1; }
    });
    return Object.entries(map).map(([price, count]) => ({ price, count }));
  };

  const getAllOrders = async () => {
    const access_token = await AsyncStorage.getItem('storeAccesstoken');
    setIsLoading(true);
    try {
      const response = await fetch(base_url + 'api/rider/get-assign-orders', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${access_token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setAllOrders(data.data || []);
        const pend = (data.data || []).filter(
          (it) => it?.delivery_status === 'pending' || it?.order?.delivery?.delivery_status === 'pending'
        );
        setNotDeliveredSubCount(pend.length);
      } else console.log('Failed to fetch orders', data);
    } catch (e) { console.log('Error', e); }
    finally { setIsLoading(false); }
  };

  const getRequestOrders = async () => {
    const access_token = await AsyncStorage.getItem('storeAccesstoken');
    setIsLoading(true);
    try {
      const response = await fetch(base_url + 'api/rider/requested-today-orders', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${access_token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setRequestOrders(data.data || []);
        const pend = (data.data || []).filter((it) => it?.delivery_customize_history?.delivery_status === 'pending');
        setNotDeliveredReqCount(pend.length);
      } else console.log('Failed to fetch requests', data);
    } catch (e) { console.log('Error', e); }
    finally { setIsLoading(false); }
  };

  const [profileDetails, setProfileDetails] = useState({});
  const getProfileDetails = async () => {
    const access_token = await AsyncStorage.getItem('storeAccesstoken');
    try {
      const response = await fetch(base_url + 'api/rider/details', {
        method: 'GET', headers: { 'Authorization': `Bearer ${access_token}` },
      });
      const data = await response.json();
      if (response.ok) setProfileDetails(data.data);
      else console.log('Failed to fetch profile', data);
    } catch (e) { console.log('Error', e); }
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      if (granted === PermissionsAndroid.RESULTS.GRANTED) return true;
      Alert.alert('Permission Denied', 'Location permission is required to proceed.');
      return false;
    }
    return true;
  };

  const getLocation = async () => {
    const ok = await requestLocationPermission();
    if (!ok) return null;
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (pos) => resolve(pos),
        (err) => { Alert.alert('Error fetching location', err.message); reject(err); },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });
  };

  const openConfirmModal = (oid, dType) => { setDeliveryCategory(dType); setOrder_id(oid); openConfirmDeliverModal(); };
  const openConfirmReqModal = (rid, dType) => { setDeliveryCategory(dType); setReqId(rid); openConfirmDeliverModal(); };

  const isPastNineAM = () => {
    const now = new Date();
    return now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 0);
  };

  const delivered = async () => {
    const access_token = await AsyncStorage.getItem('storeAccesstoken');
    closeConfirmDeliverModal(); setSpinner(true);
    try {
      const loc = await getLocation(); if (!loc) return;
      const { latitude, longitude } = loc.coords;
      const response = await fetch(base_url + `api/rider/deliver/${order_id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude, longitude }),
      });
      const data = await response.json();
      if (response.ok) { getAllOrders(); getRequestOrders(); }
      else Alert.alert('Failed to deliver order', data.message || 'Please try again.');
    } catch (e) { Alert.alert('Error', 'Something went wrong. Please try again.'); }
    finally { setSpinner(false); }
  };

  const deliveredReq = async () => {
    const access_token = await AsyncStorage.getItem('storeAccesstoken');
    closeConfirmDeliverModal(); setSpinner(true);
    try {
      const loc = await getLocation(); if (!loc) return;
      const { latitude, longitude } = loc.coords;
      const response = await fetch(base_url + `api/rider/requested-deliver/${req_id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude, longitude }),
      });
      const data = await response.json();
      if (response.ok) { getAllOrders(); getRequestOrders(); }
      else Alert.alert('Failed to deliver order', data.message || 'Please try again.');
    } catch (e) { Alert.alert('Error', 'Something went wrong. Please try again.'); }
    finally { setSpinner(false); }
  };

  useEffect(() => { requestLocationPermission(); }, []);
  useEffect(() => { if (isFocused) { getAllOrders(); getRequestOrders(); getProfileDetails(); } }, [isFocused]);
  useEffect(() => { const t = setInterval(() => { getAllOrders(); getRequestOrders(); getProfileDetails(); }, 600000); return () => clearInterval(t); }, []);

  const Row = ({ label, value }) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={styles.detailValue} numberOfLines={1}>{value || '—'}</Text>
    </View>
  );

  const filteredOrders = selectedPrice
    ? allOrders.filter((o) => String(o?.order?.flower_product?.per_day_price) === String(selectedPrice))
    : allOrders;

  // Separate pending and delivered orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const aDelivered = a?.delivery_status === 'delivered' || a?.order?.delivery?.delivery_status === 'delivered';
    const bDelivered = b?.delivery_status === 'delivered' || b?.order?.delivery?.delivery_status === 'delivered';

    if (aDelivered === bDelivered) return 0;   // both same status → keep original order
    return aDelivered ? 1 : -1;               // push delivered ones down
  });

  /* ---------- Subscriptions card ---------- */
  const renderSubOrderCard = ({ item }) => {
    const phone = item?.order?.user?.mobile_number?.replace('+91', '') || '';
    const address = `${item?.order?.address?.apartment_name || item?.order?.address?.landmark || ''}${item?.order?.address?.apartment_flat_plot ? ', ' + item?.order?.address?.apartment_flat_plot : ''}`;
    const productName = item?.order?.flower_product?.name || '—';
    const price = item?.order?.flower_product?.price ?? null;
    const perDay = item?.order?.flower_product?.per_day_price ?? null;
    const deliveredStatus = item?.delivery_status === 'delivered' || item?.order?.delivery?.delivery_status === 'delivered';

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderStripe} />
        <View style={styles.orderHeader}>
          <View style={styles.chipRow}>
            <View style={[styles.chip, { backgroundColor: '#0EA5E920', borderColor: '#0EA5E955' }]}>
              <FontAwesome5 name="user" size={10} color="#0EA5E9" />
              <Text style={[styles.chipText, { color: '#075985' }]}>
                {item?.order?.user?.name ? item?.order?.user?.name : phone}
              </Text>
            </View>
            {perDay ? (
              <View style={[styles.chip, { backgroundColor: '#FDE68A30', borderColor: '#F59E0B66' }]}>
                <FontAwesome5 name="clock" size={10} color="#B45309" />
                <Text style={[styles.chipText, { color: '#92400E' }]}>₹{perDay}/day</Text>
              </View>
            ) : null}
          </View>

          {deliveredStatus ? (
            <View style={[styles.statusPill, { backgroundColor: '#E2E8F0' }]}>
              <Text style={[styles.statusPillText, { color: '#0f172a' }]}>Delivered</Text>
            </View>
          ) : spinner ? (
            <ActivityIndicator size="small" color={ACCENT} />
          ) : isPastNineAM() ? (
            <View style={[styles.primaryBtn, { opacity: 0.5 }]}>
              <LinearGradient colors={['#CBD5E1', '#94A3B8']} style={styles.primaryGrad}>
                <MaterialIcons name="block" size={16} color="#3b3a3aff" />
                <Text style={[styles.primaryBtnText, { color: '#3b3a3aff' }]}>Disabled</Text>
              </LinearGradient>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => openConfirmModal(item.order_id, 'subscription')}
              activeOpacity={0.9}
              style={styles.primaryBtn}
            >
              <LinearGradient colors={['#F97316', '#EF4444']} style={styles.primaryGrad}>
                <MaterialIcons name="local-shipping" size={16} color="#fff" />
                <Text style={styles.primaryBtnText}>Delivery</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.addrRow}>
          <View style={styles.addrIcon}><FontAwesome5 name="map-marker-alt" size={10} color="#F97316" /></View>
          <Text style={styles.addrText} numberOfLines={2}>{address || '—'}</Text>
        </View>

        <TouchableOpacity onPress={() => toggleExpandRow(item.id)} activeOpacity={0.7} style={styles.expandBar}>
          <Text style={styles.expandText}>{expandedRow === item.id ? 'Hide details' : 'View details'}</Text>
          <MaterialIcons name={expandedRow === item.id ? 'expand-less' : 'expand-more'} size={18} color="#334155" />
        </TouchableOpacity>

        {expandedRow === item.id && (
          <View style={styles.collapseBody}>
            <Text style={styles.sectionTitle}>Order Details</Text>
            <Row label="Order Id" value={String(item.order_id)} />
            <Row label="Phone" value={phone} />
            <Text style={styles.sectionTitle}>Product Details</Text>
            <Row label="Name" value={productName} />
            {/* <Row label="Price" value={price ? `₹${price}` : '—'} /> */}
            <Row label="Per Day Price" value={perDay ? `₹${perDay}` : '—'} />
            <Text style={styles.sectionTitle}>Address</Text>
            <Row label="Flat/Plot" value={item?.order?.address?.apartment_flat_plot} />
            <Row label="Landmark" value={item?.order?.address?.landmark} />
            <Row label="Locality" value={item?.order?.address?.locality_details?.locality_name} />
            <Row label="City" value={item?.order?.address?.city} />
            <Row label="Pincode" value={String(item?.order?.address?.pincode ?? '')} />
          </View>
        )}
      </View>
    );
  };

  /* ---------- Requests list row (unchanged) ---------- */
  const renderRequestTableRow = ({ item, index }) => {
    const phone = item?.user?.mobile_number?.replace('+91', '') || '';
    const address = item?.address?.apartment_flat_plot || '';
    const deliveredStatus = item?.delivery_customize_history?.delivery_status === 'delivered';

    return (
      <View>
        <View style={styles.cardRow}>
          <View style={styles.cardRowLeft}>
            <View style={styles.badge}><Text style={styles.badgeText}>{index + 1}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.primaryText}>{phone}</Text>
              <Text style={styles.secondaryText} numberOfLines={1}>{address}</Text>
            </View>
          </View>
          {deliveredStatus ? (
            <View style={[styles.actionPill, { backgroundColor: '#CBD5E1' }]}>
              <Text style={[styles.actionPillText, { color: '#0f172a' }]}>Delivered</Text>
            </View>
          ) : spinner ? (
            <ActivityIndicator size="small" color={ACCENT} />
          ) : (
            <TouchableOpacity onPress={() => openConfirmReqModal(item.order_id, 'request')} style={[styles.actionPill, { backgroundColor: ACCENT }]} activeOpacity={0.9}>
              <Text style={styles.actionPillText}>Delivery</Text>
            </TouchableOpacity>
          )}
        </View>

        {expandedRow === item.id ? (
          <View style={styles.collapseCard}>
            <Text style={styles.sectionTitle}>Order Details</Text>
            <Row label="Order Id" value={String(item.order_id)} />
            <Row label="Phone" value={phone} />
            <Text style={styles.sectionTitle}>Product Details</Text>
            <Row label="Name" value={item?.flower_product?.name} />
            <Row label="Price" value={String(item?.flower_product?.price ?? '')} />
            <Text style={styles.sectionTitle}>Address</Text>
            <Row label="Flat/Plot" value={item?.address?.apartment_flat_plot} />
            <Row label="Landmark" value={item?.address?.landmark} />
            <Row label="Locality" value={item?.address?.locality_details?.locality_name} />
            <Row label="City" value={item?.address?.city} />
            <Row label="Pincode" value={String(item?.address?.pincode ?? '')} />
          </View>
        ) : null}

        <TouchableOpacity onPress={() => toggleExpandRow(item.id)} activeOpacity={0.7} style={styles.expandBtn}>
          <Text style={styles.expandText}>{expandedRow === item.id ? 'Hide details' : 'View details'}</Text>
          <MaterialIcons name={expandedRow === item.id ? 'expand-less' : 'expand-more'} size={18} color="#334155" />
        </TouchableOpacity>
      </View>
    );
  };

  /* ---- Header helpers ---- */
  const riderName = profileDetails?.riderDetails?.rider_name || 'Rider';
  const avatarInitial = riderName?.[0]?.toUpperCase() || 'R';
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();
  const prettyDate = new Date().toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short' });

  return (
    <View style={styles.screen}>
      {/* ===== HEADER (new look) ===== */}
      <LinearGradient colors={BRAND_GRADIENT} style={styles.header}>
        {/* Decorations */}
        <View style={styles.bubbleLg} />
        <View style={styles.bubbleSm} />

        {/* Top row: avatar + greeting + refresh */}
        <View style={styles.topBar}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>{avatarInitial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.greetText}>{greeting},</Text>
            <Text style={styles.nameText}>{riderName}</Text>
          </View>
          <TouchableOpacity onPress={onRefresh} activeOpacity={0.8} style={styles.iconBtn}>
            <MaterialIcons name="refresh" size={20} color="#E2E8F0" />
          </TouchableOpacity>
        </View>

        {/* Date line */}
        <Text style={styles.dateText}>{prettyDate}</Text>

        {/* Quick stats */}
        <View style={styles.headerStats}>
          <StatPill icon="truck" text="Subscriptions" count={allOrders?.length} tint="#0EA5E9" />
          <StatPill icon="box" text="Customized" count={requestOrders?.length} tint="#F59E0B" />
        </View>

        {/* Price chips */}
        <View style={styles.priceSummaryWrap}>
          {getPerDayPriceCounts().map((it, idx) => {
            const active = selectedPrice === it.price;
            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.9}
                onPress={() => setSelectedPrice(active ? null : it.price)}
                style={[styles.priceCard, active && styles.priceCardActive]}
              >
                <Text style={[styles.priceText, active && { color: '#0C4A6E' }]}>
                  ₹{it.price}/day
                </Text>
                <Text style={[styles.priceCount, active && { color: '#0C4A6E' }]}>
                  {it.count}
                </Text>
              </TouchableOpacity>
            );
          })}
          {selectedPrice && (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setSelectedPrice(null)}
              style={[styles.priceCard, styles.clearCard]}
            >
              <MaterialIcons name="close" size={14} color="#7C2D12" />
              <Text style={[styles.priceText, { color: '#7C2D12', marginLeft: 4 }]}>
                Clear
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Segmented tabs */}
        <View style={styles.tabsWrap}>
          <TouchableOpacity
            onPress={() => setActiveTab('sub_list')}
            style={[styles.tabBtn, activeTab === 'sub_list' && styles.tabBtnActive]}
            activeOpacity={0.9}
          >
            <Text style={[styles.tabText, activeTab === 'sub_list' && styles.tabTextActive]}>Subscription</Text>
            {notDeliveredSubCount > 0 && (
              <View style={[styles.counter, activeTab === 'sub_list' && styles.counterActive]}>
                <Text style={styles.counterText}>{notDeliveredSubCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('req_list')}
            style={[styles.tabBtn, activeTab === 'req_list' && styles.tabBtnActive]}
            activeOpacity={0.9}
          >
            <Text style={[styles.tabText, activeTab === 'req_list' && styles.tabTextActive]}>Customized</Text>
            {notDeliveredReqCount > 0 && (
              <View style={[styles.counter, activeTab === 'req_list' && styles.counterActive]}>
                <Text style={styles.counterText}>{notDeliveredReqCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ===== CONTENT ===== */}
      {activeTab === 'sub_list' ? (
        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loaderBox}><Text style={styles.loaderText}>Loading...</Text></View>
          ) : filteredOrders.length > 0 ? (
            <FlatList
              data={sortedOrders}
              renderItem={renderSubOrderCard}
              keyExtractor={(item) => String(item.id)}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              contentContainerStyle={{ paddingBottom: 16, paddingHorizontal: 8, paddingTop: 8 }}
            />
          ) : (
            <View style={styles.emptyBox}>
              {!selectedPrice ? (
                <>
                  <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                    <TouchableOpacity onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={0.9}>
                      <LinearGradient colors={['#F97316', '#EF4444']} style={styles.startBtn}>
                        <Text style={styles.startText}>Start Delivery</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>
                  <Text style={styles.emptyHint}>No assigned subscriptions yet</Text>
                </>
              ) : (
                <Text style={styles.emptyHint}>No orders for this price</Text>
              )}
            </View>
          )}
        </View>
      ) : (
        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loaderBox}><Text style={styles.loaderText}>Loading...</Text></View>
          ) : requestOrders.length > 0 ? (
            <>
              <ListHeader />
              <FlatList
                data={requestOrders}
                renderItem={renderRequestTableRow}
                keyExtractor={(item) => String(item.id)}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={{ paddingBottom: 16 }}
              />
            </>
          ) : (
            <View style={styles.emptyBox}><Text style={styles.emptyHint}>No requests available</Text></View>
          )}
        </View>
      )}

      {/* Footer Navigation */}
      <View style={styles.footer}>
        <View style={[styles.footerItem, { borderTopWidth: 2, borderTopColor: ACCENT }]}>
          <View style={{ alignItems: 'center' }}>
            <MaterialIcons name="delivery-dining" color={ACCENT} size={24} />
            <Text style={[styles.footerText, { color: ACCENT }]}>Delivery</Text>
          </View>
        </View>

        <TouchableHighlight onPressIn={() => navigation.navigate('Pickup')} underlayColor="#F1F5F9" style={styles.footerItem}>
          <View style={{ alignItems: 'center' }}>
            <FontAwesome5 name="truck-pickup" color={'#000'} size={20} />
            <Text style={styles.footerText}>Pickup</Text>
          </View>
        </TouchableHighlight>

        <TouchableHighlight onPressIn={() => navigation.navigate('Profile')} underlayColor="#F1F5F9" style={styles.footerItem}>
          <View style={{ alignItems: 'center' }}>
            <Fontisto name="person" color={'#000'} size={20} />
            <Text style={styles.footerText}>Profile</Text>
          </View>
        </TouchableHighlight>
      </View>

      {/* ===== Confirm Delivery Modal ===== */}
      <Modal animationType="fade" transparent visible={confirmDeliverModal} onRequestClose={closeConfirmDeliverModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <LinearGradient colors={['#F87171', '#DC2626']} style={styles.modalHeader}>
              <MaterialIcons name="local-shipping" size={28} color="#fff" />
              <Text style={styles.modalTitle}>Confirm Delivery</Text>
            </LinearGradient>
            <View style={styles.modalBody}>
              <Text style={styles.modalQuestion}>Are you sure you delivered this order?</Text>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalCancel]} onPress={closeConfirmDeliverModal}>
                <Text style={[styles.modalBtnText, { color: '#0f172a' }]}>Cancel</Text>
              </TouchableOpacity>
              {delivery_category === 'subscription' && (
                <TouchableOpacity style={[styles.modalBtn, styles.modalConfirm]} onPress={delivered}>
                  <Text style={styles.modalBtnText}>Yes, Deliver</Text>
                </TouchableOpacity>
              )}
              {delivery_category === 'request' && (
                <TouchableOpacity style={[styles.modalBtn, styles.modalConfirm]} onPress={deliveredReq}>
                  <Text style={styles.modalBtnText}>Yes, Deliver</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const StatPill = ({ icon, text, count, tint }) => (
  <View style={styles.statPill}>
    <View style={[styles.statIcon, { backgroundColor: `${tint}20`, borderColor: `${tint}55` }]}>
      <FontAwesome5 name={icon} size={14} color={tint} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.statText}>{text}</Text>
      <Text style={styles.statCount}>{count}</Text>
    </View>
  </View>
);

const ListHeader = () => (
  <View style={styles.listHeader}>
    <Text style={[styles.listHeaderText, { flex: 0.8 }]}>#</Text>
    <Text style={[styles.listHeaderText, { flex: 2 }]}>Phone</Text>
    <Text style={[styles.listHeaderText, { flex: 3 }]}>Address</Text>
    <Text style={[styles.listHeaderText, { flex: 1.5, textAlign: 'right' }]}>Action</Text>
  </View>
);

export default Index;

/* ---------------------- STYLES ---------------------- */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },

  /* Header (new) */
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  bubbleLg: {
    position: 'absolute', right: -30, top: -20, width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  bubbleSm: {
    position: 'absolute', left: -25, bottom: -30, width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  topBar: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#0B1220', borderWidth: 1, borderColor: '#1F2937',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  avatarTxt: { color: '#E5E7EB', fontWeight: '900', fontSize: 18, letterSpacing: 0.5 },
  greetText: { color: '#93C5FD', fontWeight: '700', fontSize: 12, opacity: 0.95 },
  nameText: { color: '#FFFFFF', fontWeight: '900', fontSize: 18, textTransform: 'capitalize', marginTop: 2 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)',
  },

  dateText: { color: '#C7D2FE', fontWeight: '800', marginTop: 10, marginBottom: 6, opacity: 0.9 },

  headerStats: { flexDirection: 'row', gap: 10, marginTop: 6 },

  statPill: {
    flex: 1, flexDirection: 'row', backgroundColor: '#FFFFFF',
    padding: 10, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB',
  },
  statIcon: {
    width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginRight: 10, borderWidth: 1,
  },
  statText: { color: '#334155', fontWeight: '800', fontSize: 12 },
  statCount: { color: '#111827', fontWeight: '900', fontSize: 18, marginTop: 2 },

  priceSummaryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },

  priceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexBasis: '48%',        // two per row like headerStats
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },

  priceCardActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#93C5FD',
  },

  clearCard: {
    backgroundColor: '#FFEDE5',
    borderColor: '#FDBA74',
  },

  priceText: {
    color: '#0f172a',
    fontWeight: '800',
  },

  priceCount: {
    color: '#1E293B',
    fontWeight: '900',
  },

  /* Tabs */
  tabsWrap: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    padding: 4,
    gap: 6,
    marginTop: 12,
  },
  tabBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 999, backgroundColor: 'transparent',
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
  },
  tabBtnActive: { backgroundColor: '#FFFFFF' },
  tabText: { color: '#E5E7EB', fontWeight: '800' },
  tabTextActive: { color: '#0f172a' },
  counter: {
    minWidth: 22, height: 22, paddingHorizontal: 6, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  counterActive: { backgroundColor: '#E2E8F0' },
  counterText: { color: '#0f172a', fontWeight: '900', fontSize: 12 },

  /* Content */
  content: { flex: 1 },

  listHeader: {
    flexDirection: 'row', backgroundColor: '#EEF2FF',
    borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10,
    marginBottom: 8, marginTop: 8, marginHorizontal: 12,
  },
  listHeaderText: { color: '#334155', fontWeight: '900', fontSize: 12 },

  /* Requests compact card */
  cardRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB',
    padding: 12, marginBottom: 6, marginHorizontal: 12,
  },
  cardRowLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#0f172a', fontWeight: '900', fontSize: 12 },
  primaryText: { color: '#0f172a', fontWeight: '900' },
  secondaryText: { color: '#64748B', fontWeight: '600', marginTop: 2 },

  actionPill: { height: 36, minWidth: 90, paddingHorizontal: 14, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  actionPillText: { color: '#fff', fontWeight: '900' },

  /* Shared collapse */
  collapseCard: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', padding: 12, marginTop: 4, marginHorizontal: 12 },
  sectionTitle: { color: '#111827', fontWeight: '900', marginTop: 6, marginBottom: 8, textDecorationLine: 'underline' },
  detailRow: { flexDirection: 'row', marginBottom: 6 },
  detailLabel: { width: '40%', color: '#334155', fontWeight: '800' },
  detailValue: { width: '60%', color: '#0f172a', fontWeight: '700' },
  expandBtn: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 6, marginBottom: 8, marginLeft: 12 },
  expandText: { color: '#334155', fontWeight: '800' },

  /* Empty / loader */
  loaderBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { color: '#FFCB44', fontSize: 16, fontWeight: '800' },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  startBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 999 },
  startText: { color: '#fff', fontWeight: '900', letterSpacing: 0.3 },
  emptyHint: { color: '#64748B', fontWeight: '700', marginTop: 10 },

  /* Modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '92%', borderRadius: 18, overflow: 'hidden', backgroundColor: '#fff', elevation: 10 },
  modalHeader: { paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalTitle: { color: '#fff', fontWeight: '900', fontSize: 16 },
  modalBody: { paddingHorizontal: 16, paddingVertical: 16 },
  modalQuestion: { color: '#0f172a', fontWeight: '800', textAlign: 'center' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  modalCancel: { backgroundColor: '#E2E8F0' },
  modalConfirm: { backgroundColor: ACCENT },
  modalBtnText: { color: '#fff', fontWeight: '900' },

  /* Subscription card */
  orderCard: {
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB',
    padding: 12, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3, overflow: 'hidden',
  },
  orderStripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: '#F97316', opacity: 0.95 },
  orderHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chipRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  chipText: { color: '#0f172a', fontWeight: '800', fontSize: 12, textTransform: 'capitalize' },
  statusPill: { height: 32, paddingHorizontal: 12, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  statusPillText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  primaryBtn: { borderRadius: 999, overflow: 'hidden' },
  primaryGrad: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, gap: 6 },
  primaryBtnText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  addrRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  addrIcon: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA', alignItems: 'center', justifyContent: 'center' },
  addrText: { flex: 1, color: '#334155', fontWeight: '700', textTransform: 'capitalize' },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  metaPill: { flex: 1, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 },
  metaLabel: { color: '#64748B', fontWeight: '800', fontSize: 11 },
  metaValue: { color: '#0f172a', fontWeight: '900', marginTop: 2 },
  expandBar: { marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, paddingVertical: 4 },
  collapseBody: { marginTop: 6, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 10 },

  // Footer
  footer: { flexDirection: 'row', justifyContent: 'space-between', height: 60, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  footerItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  footerText: { fontSize: 11, fontWeight: '600', marginTop: 4, color: '#111827' },
});