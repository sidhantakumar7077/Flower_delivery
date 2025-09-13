import {
  SafeAreaView,
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

const BRAND_GRADIENT = ['#1E293B', '#334155', '#475569'];
const ACCENT = '#c9170a';

const Index = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const [refreshing, setRefreshing] = React.useState(false);
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

  const scaleAnim = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    React.useCallback(() => {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.12,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      anim.start();
      return () => anim.stop();
    }, [scaleAnim])
  );

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 50,
      useNativeDriver: true,
    }).start(() => {
      startDelivery();
    });
  };

  const startDelivery = async () => {
    const access_token = await AsyncStorage.getItem('storeAccesstoken');
    try {
      const response = await fetch(base_url + 'api/start-delivery', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (response.ok) {
        getAllOrders();
      } else {
        console.log('Failed to start delivery', data);
      }
    } catch (error) {
      console.log('Error', error);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([getAllOrders(), getRequestOrders(), getProfileDetails()]);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    const handleBackPress = () => {
      if (backPressCount === 1) {
        BackHandler.exitApp();
        return true;
      }
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
        setAllOrders(data.data);
        setNotDeliveredSubCount(data.data.filter(item => item.delivery === null).length);
      } else {
        console.log('Failed to fetch orders', data);
      }
    } catch (error) {
      console.log('Error', error);
    } finally {
      setIsLoading(false);
    }
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
        setRequestOrders(data.data);
        setNotDeliveredReqCount(
          data.data.filter(item => item.delivery_customize_history === null).length
        );
      } else {
        console.log('Failed to fetch orders', data);
      }
    } catch (error) {
      console.log('Error', error);
    } finally {
      setIsLoading(false);
    }
  };

  const [profileDetails, setProfileDetails] = React.useState({});

  const getProfileDetails = async () => {
    const access_token = await AsyncStorage.getItem('storeAccesstoken');
    try {
      const response = await fetch(base_url + 'api/rider/details', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${access_token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setProfileDetails(data.data);
      } else {
        console.log('Failed to fetch Profile', data);
      }
    } catch (error) {
      console.log('Error', error);
    }
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) return true;
      Alert.alert('Permission Denied', 'Location permission is required to proceed.');
      return false;
    }
    return true;
  };

  const getLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return null;
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => {
          Alert.alert('Error fetching location', error.message);
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });
  };

  const openConfirmModal = (oid, dType) => {
    setDeliveryCategory(dType);
    setOrder_id(oid);
    openConfirmDeliverModal();
  };
  const openConfirmReqModal = (rid, dType) => {
    setDeliveryCategory(dType);
    setReqId(rid);
    openConfirmDeliverModal();
  };

  const delivered = async () => {
    const access_token = await AsyncStorage.getItem('storeAccesstoken');
    closeConfirmDeliverModal();
    setSpinner(true);
    try {
      const location = await getLocation();
      if (!location) return;
      const { latitude, longitude } = location.coords;
      const response = await fetch(base_url + `api/rider/deliver/${order_id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latitude, longitude }),
      });
      const data = await response.json();
      if (response.ok) {
        getAllOrders();
        getRequestOrders();
      } else {
        Alert.alert('Failed to deliver order', data.message || 'Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSpinner(false);
    }
  };

  const deliveredReq = async () => {
    const access_token = await AsyncStorage.getItem('storeAccesstoken');
    closeConfirmDeliverModal();
    setSpinner(true);
    try {
      const location = await getLocation();
      if (!location) return;
      const { latitude, longitude } = location.coords;
      const response = await fetch(base_url + `api/rider/requested-deliver/${req_id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latitude, longitude }),
      });
      const data = await response.json();
      if (response.ok) {
        getAllOrders();
        getRequestOrders();
      } else {
        Alert.alert('Failed to deliver order', data.message || 'Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSpinner(false);
    }
  };

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (isFocused) {
      getAllOrders();
      getRequestOrders();
      getProfileDetails();
    }
  }, [isFocused]);

  useEffect(() => {
    const interval = setInterval(() => {
      getAllOrders();
      getRequestOrders();
      getProfileDetails();
    }, 600000);
    return () => clearInterval(interval);
  }, []);

  // --- Row renderers (theming only) ---
  const renderTableRow = ({ item, index }) => {
    const phone = item?.order?.user?.mobile_number?.replace('+91', '') || '';
    const address = item?.order?.address?.apartment_flat_plot || '';
    const deliveredStatus = item?.order?.delivery?.delivery_status === 'delivered';

    return (
      <View>
        <View style={styles.cardRow}>
          <View style={styles.cardRowLeft}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{index + 1}</Text>
            </View>
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
            <TouchableOpacity
              onPress={() => openConfirmModal(item.order_id, 'subscription')}
              style={[styles.actionPill, { backgroundColor: ACCENT }]}
              activeOpacity={0.9}
            >
              <Text style={styles.actionPillText}>Delivery</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Collapsible */}
        {expandedRow === item.id ? (
          <View style={styles.collapseCard}>
            <Text style={styles.sectionTitle}>Order Details</Text>
            <Row label="Order Id" value={String(item.order_id)} />
            <Row label="Phone" value={phone} />

            <Text style={styles.sectionTitle}>Product Details</Text>
            <Row label="Name" value={item?.order?.flower_product?.name} />
            <Row label="Price" value={String(item?.order?.flower_product?.price ?? '')} />

            <Text style={styles.sectionTitle}>Address</Text>
            <Row label="Flat/Plot" value={item?.order?.address?.apartment_flat_plot} />
            <Row label="Landmark" value={item?.order?.address?.landmark} />
            <Row label="Locality" value={item?.order?.address?.locality_details?.locality_name} />
            <Row label="City" value={item?.order?.address?.city} />
            <Row label="Pincode" value={String(item?.order?.address?.pincode ?? '')} />
          </View>
        ) : null}

        <TouchableOpacity
          onPress={() => toggleExpandRow(item.id)}
          activeOpacity={0.7}
          style={styles.expandBtn}
        >
          <Text style={styles.expandText}>
            {expandedRow === item.id ? 'Hide details' : 'View details'}
          </Text>
          <MaterialIcons
            name={expandedRow === item.id ? 'expand-less' : 'expand-more'}
            size={18}
            color="#334155"
          />
        </TouchableOpacity>
      </View>
    );
  };

  const renderRequestTableRow = ({ item, index }) => {
    const phone = item?.user?.mobile_number?.replace('+91', '') || '';
    const address = item?.address?.apartment_flat_plot || '';
    const deliveredStatus = item?.delivery_customize_history?.delivery_status === 'delivered';

    return (
      <View>
        <View style={styles.cardRow}>
          <View style={styles.cardRowLeft}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{index + 1}</Text>
            </View>
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
            <TouchableOpacity
              onPress={() => openConfirmReqModal(item.order_id, 'request')}
              style={[styles.actionPill, { backgroundColor: ACCENT }]}
              activeOpacity={0.9}
            >
              <Text style={styles.actionPillText}>Delivery</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Collapsible */}
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

        <TouchableOpacity
          onPress={() => toggleExpandRow(item.id)}
          activeOpacity={0.7}
          style={styles.expandBtn}
        >
          <Text style={styles.expandText}>
            {expandedRow === item.id ? 'Hide details' : 'View details'}
          </Text>
          <MaterialIcons
            name={expandedRow === item.id ? 'expand-less' : 'expand-more'}
            size={18}
            color="#334155"
          />
        </TouchableOpacity>
      </View>
    );
  };

  const Row = ({ label, value }) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={styles.detailValue} numberOfLines={1}>{value || '—'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <LinearGradient colors={BRAND_GRADIENT} style={styles.header}>
        <View style={styles.headerRowTop}>
          <Text style={styles.helloText}>
            Hey, <Text style={styles.helloName}>{profileDetails?.riderDetails?.rider_name || 'Rider'}</Text>
          </Text>
        </View>

        <View style={styles.headerStats}>
          <StatPill
            icon="truck"
            text="Subscriptions"
            count={notDeliveredSubCount}
            tint="#0EA5E9"
          />
          <StatPill
            icon="box"
            text="Requests"
            count={notDeliveredReqCount}
            tint="#F59E0B"
          />
        </View>

        {/* Segmented Tabs */}
        <View style={styles.tabsWrap}>
          <TouchableOpacity
            onPress={() => setActiveTab('sub_list')}
            style={[styles.tabBtn, activeTab === 'sub_list' && styles.tabBtnActive]}
            activeOpacity={0.9}
          >
            <Text style={[styles.tabText, activeTab === 'sub_list' && styles.tabTextActive]}>
              Subscription
            </Text>
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
            <Text style={[styles.tabText, activeTab === 'req_list' && styles.tabTextActive]}>
              Request
            </Text>
            {notDeliveredReqCount > 0 && (
              <View style={[styles.counter, activeTab === 'req_list' && styles.counterActive]}>
                <Text style={styles.counterText}>{notDeliveredReqCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content */}
      {activeTab === 'sub_list' ? (
        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loaderBox}>
              <Text style={styles.loaderText}>Loading...</Text>
            </View>
          ) : allOrders.length > 0 ? (
            <>
              <ListHeader />
              <FlatList
                data={allOrders}
                renderItem={renderTableRow}
                keyExtractor={(item) => String(item.id)}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={{ paddingBottom: 16 }}
              />
            </>
          ) : (
            <View style={styles.emptyBox}>
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <TouchableOpacity
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  activeOpacity={0.9}
                >
                  <LinearGradient colors={['#F97316', '#EF4444']} style={styles.startBtn}>
                    <Text style={styles.startText}>Start Delivery</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
              <Text style={styles.emptyHint}>No assigned subscriptions yet</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loaderBox}>
              <Text style={styles.loaderText}>Loading...</Text>
            </View>
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
            <View style={styles.emptyBox}>
              <Text style={styles.emptyHint}>No requests available</Text>
            </View>
          )}
        </View>
      )}

      {/* Bottom nav (unchanged actions; themed spacing) */}
      <View style={{ padding: 0, height: 58, borderRadius: 0, backgroundColor: '#fff', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', margin: 0 }}>
          <View style={{ padding: 0, width: '30%' }}>
            <View activeOpacity={0.6} underlayColor="#DDDDDD" style={{ backgroundColor: '#fff', padding: 10, flexDirection: 'column', alignItems: 'center' }}>
              <View style={{ alignItems: 'center' }}>
                <MaterialIcons name="delivery-dining" color={'#dc3545'} size={26} />
                <Text style={{ color: '#dc3545', fontSize: 11, fontWeight: '500', height: 17 }}>Delivery</Text>
              </View>
            </View>
          </View>
          <View style={{ padding: 0, width: '30%' }}>
            <TouchableHighlight onPressIn={() => navigation.navigate('Pickup')} activeOpacity={0.6} underlayColor="#DDDDDD" style={{ backgroundColor: '#fff', padding: 10, flexDirection: 'column', alignItems: 'center' }}>
              <View style={{ alignItems: 'center' }}>
                <FontAwesome5 name="truck-pickup" color={'#000'} size={21} />
                <Text style={{ color: '#000', fontSize: 11, fontWeight: '500', marginTop: 4, height: 17 }}>Pickup</Text>
              </View>
            </TouchableHighlight>
          </View>
          <View style={{ padding: 0, width: '30%' }}>
            <TouchableHighlight onPressIn={() => navigation.navigate('Profile')} activeOpacity={0.6} underlayColor="#DDDDDD" style={{ backgroundColor: '#fff', padding: 10, flexDirection: 'column', alignItems: 'center' }}>
              <View style={{ alignItems: 'center', marginTop: 3 }}>
                <Fontisto name="person" color={'#000'} size={20} />
                <Text style={{ color: '#000', fontSize: 11, fontWeight: '500', marginTop: 4, height: 17 }}>Profile</Text>
              </View>
            </TouchableHighlight>
          </View>
        </View>
      </View>

      {/* Confirm Delivery Modal — branded theme */}
      <Modal
        animationType="fade"
        transparent
        visible={confirmDeliverModal}
        onRequestClose={closeConfirmDeliverModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <LinearGradient colors={['#F87171', '#DC2626']} style={styles.modalHeader}>
              <MaterialIcons name="local-shipping" size={28} color="#fff" />
              <Text style={styles.modalTitle}>Confirm Delivery</Text>
            </LinearGradient>

            <View style={styles.modalBody}>
              <Text style={styles.modalQuestion}>
                Are you sure you delivered this order?
              </Text>
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
    </SafeAreaView>
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

  /* Header */
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRowTop: { paddingVertical: 8 },
  helloText: { color: '#E2E8F0', fontSize: 14, fontWeight: '700' },
  helloName: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', textTransform: 'capitalize' },

  headerStats: { flexDirection: 'row', gap: 10, marginTop: 12 },
  statPill: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statIcon: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10, borderWidth: 1,
  },
  statText: { color: '#334155', fontWeight: '800', fontSize: 12 },
  statCount: { color: '#111827', fontWeight: '900', fontSize: 18, marginTop: 2 },

  /* Tabs */
  tabsWrap: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    padding: 4,
    gap: 6,
    marginTop: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'transparent',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  tabBtnActive: { backgroundColor: '#FFFFFF' },
  tabText: { color: '#E5E7EB', fontWeight: '800' },
  tabTextActive: { color: '#0f172a' },
  counter: {
    minWidth: 22, height: 22, paddingHorizontal: 6,
    borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  counterActive: { backgroundColor: '#E2E8F0' },
  counterText: { color: '#0f172a', fontWeight: '900', fontSize: 12 },

  /* Content area */
  content: { flex: 1, paddingHorizontal: 12, paddingTop: 12 },

  listHeader: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  listHeaderText: { color: '#334155', fontWeight: '900', fontSize: 12 },

  /* Row card */
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginBottom: 6,
  },
  cardRowLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1, borderColor: '#E2E8F0',
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: '#0f172a', fontWeight: '900', fontSize: 12 },
  primaryText: { color: '#0f172a', fontWeight: '900' },
  secondaryText: { color: '#64748B', fontWeight: '600', marginTop: 2 },

  actionPill: {
    height: 36, minWidth: 90, paddingHorizontal: 14,
    borderRadius: 999, alignItems: 'center', justifyContent: 'center',
  },
  actionPillText: { color: '#fff', fontWeight: '900' },

  /* Collapse */
  collapseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginTop: 4,
  },
  sectionTitle: { color: '#111827', fontWeight: '900', marginTop: 6, marginBottom: 8, textDecorationLine: 'underline' },
  detailRow: { flexDirection: 'row', marginBottom: 6 },
  detailLabel: { width: '40%', color: '#334155', fontWeight: '800' },
  detailValue: { width: '60%', color: '#0f172a', fontWeight: '700' },

  expandBtn: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 6, marginBottom: 8 },
  expandText: { color: '#334155', fontWeight: '800' },

  /* Empty / loader */
  loaderBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { color: '#FFCB44', fontSize: 16, fontWeight: '800' },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  startBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 999 },
  startText: { color: '#fff', fontWeight: '900', letterSpacing: 0.3 },
  emptyHint: { color: '#64748B', fontWeight: '700', marginTop: 10 },

  /* Bottom bar */
  bottomBar: { paddingTop: 4, height: 62, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  bottomItem: { width: '33.33%' },
  bottomInner: { backgroundColor: '#fff', padding: 10, alignItems: 'center' },
  bottomText: { color: '#111827', fontSize: 12, fontWeight: '700', marginTop: 2 },

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
});
