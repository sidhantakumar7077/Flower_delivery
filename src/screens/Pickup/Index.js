import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TouchableHighlight,
  FlatList,
  TextInput,
  RefreshControl,
  Modal,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Fontisto from 'react-native-vector-icons/Fontisto';
import { Calendar } from 'react-native-calendars';
import { base_url } from '../../../App';
import moment from 'moment';

const BRAND = ['#1E293B', '#334155', '#475569'];
const ACCENT = '#c9170a';

const Index = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const [refreshing, setRefreshing] = React.useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [allPickups, setAllPickups] = useState([]);
  const [flowerPrices, setFlowerPrices] = useState({});

  // “Other” request modal
  const [otherTextmodal, setOtherTextmodal] = useState(false);
  const openOtherTextmodal = () => setOtherTextmodal(true);
  const closeOtherTextmodal = () => setOtherTextmodal(false);
  const [otherDate, setOtherDate] = useState(null);
  const [otherText, setOtherText] = useState('');
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const openDatePicker = () => setDatePickerVisible(true);
  const closeDatePicker = () => setDatePickerVisible(false);
  const [otherPickupError, setOtherPickupError] = useState('');

  const handleDayPress = (day) => {
    setOtherDate(day.dateString);
    closeDatePicker();
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      fetchPickups();
    }, 1200);
  }, []);

  const fetchPickups = async () => {
    const access_token = await AsyncStorage.getItem('storeAccesstoken');
    setIsLoading(true);
    try {
      const response = await fetch(base_url + 'api/rider/get-assign-pickup', {
        method: 'GET',
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setAllPickups(data.data || []);
      } else {
        console.log('Failed to fetch pickups', data);
      }
    } catch (error) {
      console.log('Error', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) fetchPickups();
  }, [isFocused]);

  useEffect(() => {
    const interval = setInterval(fetchPickups, 600000); // 10 min
    return () => clearInterval(interval);
  }, []);

  const handlePriceChange = (flowerId, price) => {
    setFlowerPrices((prev) => ({ ...prev, [flowerId]: price }));
  };

  const calculateTotalPrice = (flowerPickupItems) => {
    return flowerPickupItems
      .reduce((total, flowerItem) => total + parseFloat(flowerPrices[flowerItem.id] || 0), 0)
      .toFixed(2);
  };

  const handleSave = async (pickupId) => {
    const flowerItems = allPickups.find((p) => p.pick_up_id === pickupId)?.flower_pickup_items || [];
    const pricesToSave = flowerItems.map((flowerItem) => ({
      flower_id: flowerItem.flower?.product_id,
      id: flowerItem.id,
      price: parseFloat(flowerPrices[flowerItem.id] || 0).toFixed(2),
    }));
    const totalPrice = pricesToSave
      .reduce((total, item) => total + parseFloat(item.price), 0)
      .toFixed(2);

    const payload = {
      total_price: parseFloat(totalPrice),
      flower_pickup_items: pricesToSave,
    };

    try {
      const access_token = await AsyncStorage.getItem('storeAccesstoken');
      const response = await fetch(`${base_url}api/rider/update-flower-prices/${pickupId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        fetchPickups();
      } else {
        console.log('Failed to save prices:', data);
        alert('Failed to save prices. Please try again.');
      }
    } catch (error) {
      console.error('Error saving prices:', error);
      alert('An error occurred while saving prices.');
    }
  };

  const handleOtherTextSave = async () => {
    if (!otherDate || !otherText.trim()) {
      setOtherPickupError('Please fill in all fields.');
      setTimeout(() => setOtherPickupError(''), 5000);
      return;
    }

    try {
      const access_token = await AsyncStorage.getItem('storeAccesstoken');
      const response = await fetch(`${base_url}api/rider/flower-pickup-request`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pickup_date: otherDate, pickdetails: otherText }),
      });
      const data = await response.json();
      if (response.ok) {
        fetchPickups();
        closeOtherTextmodal();
        setOtherDate(null);
        setOtherText('');
      } else {
        console.log('Failed to save other text:', data);
      }
    } catch (error) {
      console.error('Error saving other text:', error);
      alert('An error occurred while saving other text.');
    }
  };

  /* ------------ UI ------------- */
  const renderItem = ({ item }) => {
    return (
      <View style={styles.card}>
        {/* Header row: vendor & date */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.vendorBadge}>
            <FontAwesome5 name="store" size={12} color="#0f172a" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item?.vendor?.vendor_name || 'Vendor'}
            </Text>
            <Text style={styles.cardSub} numberOfLines={1}>
              ID: {item.pick_up_id} • {item.pickup_date}
            </Text>
          </View>
        </View>

        {/* Address */}
        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <FontAwesome5 name="map-marker-alt" size={10} color="#F97316" />
          </View>
          <Text style={styles.infoText} numberOfLines={2}>
            {item?.vendor?.vendor_address || '—'}
          </Text>
        </View>

        {/* Table */}
        {item.flower_pickup_items?.length > 0 && (
          <View style={styles.tableWrap}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { width: '40%' }]}>Flower</Text>
              <Text style={[styles.th, { width: '25%' }]}>Qty</Text>
              <Text style={[styles.th, { width: '35%' }]}>Price</Text>
            </View>

            {item.flower_pickup_items.map((flowerItem) => {
              const hasPrice =
                flowerItem.price && parseFloat(flowerItem.price) > 0;
              return (
                <View key={flowerItem.id} style={styles.tr}>
                  <Text style={[styles.td, { width: '40%' }]} numberOfLines={1}>
                    {flowerItem?.flower?.name || 'N/A'}
                  </Text>
                  <Text style={[styles.td, { width: '25%' }]} numberOfLines={1}>
                    {flowerItem.quantity || '0'} {flowerItem?.unit?.unit_name || ''}
                  </Text>

                  {hasPrice ? (
                    <Text style={[styles.priceFixed, { width: '35%' }]} numberOfLines={1}>
                      ₹{flowerItem.price}
                    </Text>
                  ) : (
                    <TextInput
                      style={[styles.priceInput, { width: '35%' }]}
                      placeholder="₹ Price"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      value={flowerPrices[flowerItem.id] || ''}
                      onChangeText={(t) => handlePriceChange(flowerItem.id, t)}
                    />
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            ₹{' '}
            {item.total_price && parseFloat(item.total_price) > 0
              ? Number(item.total_price).toFixed(2)
              : calculateTotalPrice(item.flower_pickup_items || [])}
          </Text>
        </View>

        {/* Save */}
        {(item.total_price === null ||
          parseFloat(item.total_price) === 0) && (
            <TouchableOpacity
              style={styles.cta}
              activeOpacity={0.9}
              onPress={() => handleSave(item.pick_up_id)}
            >
              <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.ctaGrad}>
                <MaterialIcons name="save" size={16} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.ctaText}>Save</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <LinearGradient colors={BRAND} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="arrow-left" color="#fff" size={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pickup</Text>
          <TouchableOpacity onPress={openOtherTextmodal} style={styles.otherBtn} activeOpacity={0.9}>
            <LinearGradient colors={['#F97316', '#EA580C']} style={styles.otherGrad}>
              <MaterialIcons name="add" size={16} color="#fff" />
              <Text style={styles.otherText}>Other</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* List */}
      {!isLoading ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {allPickups?.length > 0 ? (
            <FlatList
              data={allPickups}
              keyExtractor={(item) => String(item.pick_up_id)}
              renderItem={renderItem}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No pickups available</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}

      {/* Bottom Bar */}
      <View style={{ padding: 0, height: 58, borderRadius: 0, backgroundColor: '#fff', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', margin: 0 }}>
          <View style={{ padding: 0, width: '30%' }}>
            <TouchableHighlight onPressIn={() => navigation.navigate('Home')} activeOpacity={0.6} underlayColor="#DDDDDD" style={{ backgroundColor: '#fff', padding: 10, flexDirection: 'column', alignItems: 'center' }}>
              <View style={{ alignItems: 'center' }}>
                <MaterialIcons name="delivery-dining" color={'#000'} size={26} />
                <Text style={{ color: '#000', fontSize: 11, fontWeight: '500', height: 17 }}>Delivery</Text>
              </View>
            </TouchableHighlight>
          </View>
          <View style={{ padding: 0, width: '30%' }}>
            <View activeOpacity={0.6} underlayColor="#DDDDDD" style={{ backgroundColor: '#fff', padding: 10, flexDirection: 'column', alignItems: 'center' }}>
              <View style={{ alignItems: 'center' }}>
                <FontAwesome5 name="truck-pickup" color={'#dc3545'} size={21} />
                <Text style={{ color: '#dc3545', fontSize: 11, fontWeight: '500', marginTop: 4, height: 17 }}>Pickup</Text>
              </View>
            </View>
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

      {/* Other Text Modal (themed) */}
      <Modal transparent visible={otherTextmodal} animationType="fade" onRequestClose={closeOtherTextmodal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalBadge}>
                <MaterialIcons name="assignment" size={14} color="#EA580C" />
              </View>
              <Text style={styles.modalTitle}>Other Pickup</Text>
              <TouchableOpacity onPress={closeOtherTextmodal} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="x" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Date</Text>
            <TouchableOpacity onPress={openDatePicker} activeOpacity={0.85} style={styles.fieldBox}>
              <Text style={[styles.fieldValue, { color: otherDate ? '#111827' : '#94A3B8' }]}>
                {otherDate ? moment(otherDate).format('DD-MM-YYYY') : 'Select date'}
              </Text>
              <MaterialCommunityIcons name="calendar-month" color={'#64748B'} size={22} />
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Details</Text>
            <TextInput
              style={styles.multiline}
              placeholder="Enter other pickup details"
              placeholderTextColor="#94A3B8"
              value={otherText}
              onChangeText={setOtherText}
              multiline
              numberOfLines={4}
            />

            {!!otherPickupError && <Text style={styles.errorText}>{otherPickupError}</Text>}

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={closeOtherTextmodal} style={styles.secondaryBtn} activeOpacity={0.9}>
                <Text style={styles.secondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleOtherTextSave} style={styles.primaryBtn} activeOpacity={0.9}>
                <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.primaryGrad}>
                  <Text style={styles.primaryText}>Save</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Calendar Modal (themed) */}
      <Modal transparent visible={isDatePickerVisible} animationType="fade" onRequestClose={closeDatePicker}>
        <View style={styles.modalOverlay}>
          <View style={styles.calendarCard}>
            <Calendar
              onDayPress={handleDayPress}
              minDate={moment().format('YYYY-MM-DD')}
              markedDates={
                otherDate
                  ? {
                    [moment(otherDate).format('YYYY-MM-DD')]: {
                      selected: true,
                      marked: true,
                      selectedColor: '#6366F1',
                    },
                  }
                  : {}
              }
              theme={{
                backgroundColor: '#FFFFFF',
                calendarBackground: '#FFFFFF',
                todayTextColor: '#8B5CF6',
                selectedDayBackgroundColor: '#6366F1',
                selectedDayTextColor: '#FFFFFF',
                arrowColor: '#6366F1',
                monthTextColor: '#111827',
                textMonthFontWeight: '800',
                textDayFontWeight: '600',
                textSectionTitleColor: '#6B7280',
                textDayHeaderFontWeight: '700',
              }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Index;

/* ------------------------- STYLES ------------------------- */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },

  /* Header */
  header: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  otherBtn: { borderRadius: 12, overflow: 'hidden' },
  otherGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  otherText: { color: '#fff', fontWeight: '800' },

  /* Cards */
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 10 },
  vendorBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { color: '#0f172a', fontWeight: '900' },
  cardSub: { color: '#64748B', fontWeight: '700', marginTop: 2, fontSize: 12 },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  infoIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: { flex: 1, color: '#334155', fontWeight: '700' },

  /* Table */
  tableWrap: { marginTop: 12, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F1F5F9', paddingVertical: 8, paddingHorizontal: 10 },
  th: { color: '#475569', fontWeight: '900', fontSize: 12 },
  tr: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    alignItems: 'center',
    gap: 8,
  },
  td: { color: '#334155', fontWeight: '700', fontSize: 13 },
  priceInput: {
    height: 38,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 10,
    color: '#111827',
    fontWeight: '700',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
  },
  priceFixed: { color: '#111827', fontWeight: '900', textAlign: 'center' },

  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  totalLabel: { color: '#334155', fontWeight: '900' },
  totalValue: { color: '#111827', fontWeight: '900', fontSize: 16 },

  cta: { height: 44, borderRadius: 12, overflow: 'hidden', marginTop: 12 },
  ctaGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  ctaText: { color: '#fff', fontWeight: '900' },

  /* Empty & Loading */
  emptyWrap: { alignItems: 'center', paddingTop: 140 },
  emptyText: { color: '#64748B', fontWeight: '700' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#ffcb44', fontWeight: '800' },

  /* Bottom bar */
  bottomBar: {
    paddingTop: 4,
    height: 62,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  bottomItem: { width: '33.33%' },
  bottomInner: { backgroundColor: '#fff', padding: 10, alignItems: 'center' },
  bottomText: { color: '#111827', fontSize: 12, fontWeight: '800', marginTop: 2 },

  /* Modals (shared) */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17,24,39,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  /* Other modal */
  modalCard: {
    width: '92%',
    maxWidth: 460,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  modalBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA',
    alignItems: 'center', justifyContent: 'center',
  },
  modalTitle: { color: '#0f172a', fontWeight: '900', fontSize: 16 },

  fieldLabel: { color: '#0f172a', fontWeight: '800', marginTop: 10, marginBottom: 6 },
  fieldBox: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldValue: { fontWeight: '700' },
  multiline: {
    minHeight: 96,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111827',
    backgroundColor: '#fff',
  },
  errorText: { marginTop: 6, color: '#EF4444', fontWeight: '700' },

  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 14 },
  secondaryBtn: {
    height: 44, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB',
    paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff',
  },
  secondaryText: { color: '#111827', fontWeight: '800' },
  primaryBtn: { height: 44, borderRadius: 12, overflow: 'hidden' },
  primaryGrad: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  primaryText: { color: '#fff', fontWeight: '900' },

  /* Calendar modal */
  calendarCard: {
    width: '92%',
    maxWidth: 460,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 10,
  },
});