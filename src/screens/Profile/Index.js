import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  TouchableHighlight,
  RefreshControl,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import Fontisto from 'react-native-vector-icons/Fontisto';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { base_url } from '../../../App';

const BRAND_GRADIENT = ['#1E293B', '#334155', '#475569'];
const ACCENT = '#c9170a';

const Profile = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const [refreshing, setRefreshing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [profileDetails, setProfileDetails] = React.useState({});

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      getProfileDetails();
    }, 1200);
  }, []);

  const getProfileDetails = async () => {
    const access_token = await AsyncStorage.getItem('storeAccesstoken');
    setIsLoading(true);
    try {
      const response = await fetch(base_url + 'api/rider/details', {
        method: 'GET',
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setProfileDetails(data.data);
      } else {
        console.log('Failed to fetch Profile', data);
      }
    } catch (error) {
      console.log('Error', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) getProfileDetails();
  }, [isFocused]);

  const rider = profileDetails?.riderDetails || {};
  const avatar = rider?.rider_img
    ? { uri: rider.rider_img }
    : require('../../assets/images/user.png');

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <LinearGradient colors={BRAND_GRADIENT} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={{ width: 22 }} />{/* spacer to balance back icon */}
        </View>
        <Text style={styles.headerSub}>Manage your rider details</Text>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <LinearGradient colors={['#94A3B8', '#CBD5E1']} style={styles.avatarRing}>
              <Image source={avatar} style={styles.avatar} />
            </LinearGradient>
          </View>

          <Text style={styles.nameText} numberOfLines={1}>
            {rider?.rider_name || 'Rider'}
          </Text>
          {!!rider?.phone_number && (
            <Text style={styles.metaText}>📱 {rider.phone_number}</Text>
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#D1FAE5', borderColor: '#10B981' }]}>
              <FontAwesome5 name="leaf" color="#10B981" size={14} />
            </View>
            <Text style={styles.statCount}>{profileDetails?.totalDeliveries ?? 0}</Text>
            <Text style={styles.statLabel}>Total Deliveries</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
              <FontAwesome5 name="calendar-check" color="#F59E0B" size={14} />
            </View>
            <Text style={styles.statCount}>{profileDetails?.currentMonthDeliveries ?? 0}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
        </View>

        {/* Info List */}
        <View style={styles.infoList}>
          <InfoRow icon="id-card" title="Rider ID" value={String(rider?.rider_id || '—')} />
          <InfoRow icon="map-marker-alt" title="Hub / City" value={rider?.city || '—'} />
          <InfoRow icon="clock" title="Shift" value={rider?.shift || '—'} />
          {!!rider?.vehicle_number && (
            <InfoRow icon="motorcycle" title="Vehicle" value={rider.vehicle_number} />
          )}
        </View>
      </ScrollView>

      {/* Footer Navigation (same routes, themed) */}
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
            <TouchableHighlight onPressIn={() => navigation.navigate('Pickup')} activeOpacity={0.6} underlayColor="#DDDDDD" style={{ backgroundColor: '#fff', padding: 10, flexDirection: 'column', alignItems: 'center' }}>
              <View style={{ alignItems: 'center' }}>
                <FontAwesome5 name="truck-pickup" color={'#000'} size={21} />
                <Text style={{ color: '#000', fontSize: 11, fontWeight: '500', marginTop: 4, height: 17 }}>Pickup</Text>
              </View>
            </TouchableHighlight>
          </View>
          <View style={{ padding: 0, width: '30%' }}>
            <View activeOpacity={0.6} underlayColor="#DDDDDD" style={{ backgroundColor: '#fff', padding: 10, flexDirection: 'column', alignItems: 'center' }}>
              <View style={{ alignItems: 'center', marginTop: 3 }}>
                <Fontisto name="person" color={'#dc3545'} size={20} />
                <Text style={{ color: '#dc3545', fontSize: 11, fontWeight: '500', marginTop: 4, height: 17 }}>Profile</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

/* ---------- small presentational component ---------- */
const InfoRow = ({ icon, title, value }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoLeft}>
      <View style={styles.infoIcon}>
        <FontAwesome5 name={icon} size={12} color="#F97316" />
      </View>
      <Text style={styles.infoTitle}>{title}</Text>
    </View>
    <Text style={styles.infoValue} numberOfLines={1}>{value || '—'}</Text>
  </View>
);

export default Profile;

/* ---------------------- STYLES ---------------------- */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },

  /* Header */
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { color: '#fff', fontWeight: '900', fontSize: 20 },
  headerSub: { color: '#E2E8F0', marginTop: 8, fontWeight: '600' },

  /* Profile card */
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginTop: -18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    alignItems: 'center',
  },
  avatarWrap: { marginBottom: 10 },
  avatarRing: {
    width: 96, height: 96, borderRadius: 48, padding: 3,
    alignItems: 'center', justifyContent: 'center',
  },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#E5E7EB' },
  nameText: { color: '#0f172a', fontSize: 20, fontWeight: '900' },
  metaText: { color: '#64748B', fontWeight: '700', marginTop: 4 },

  /* Stats */
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statCount: { color: '#111827', fontWeight: '900', fontSize: 22 },
  statLabel: { color: '#334155', fontWeight: '700', marginTop: 2, fontSize: 12, textAlign: 'center' },

  /* Info list */
  infoList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1.2 },
  infoIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: { color: '#0f172a', fontWeight: '900' },
  infoValue: { flex: 1, color: '#334155', fontWeight: '700', textAlign: 'right' },

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
});