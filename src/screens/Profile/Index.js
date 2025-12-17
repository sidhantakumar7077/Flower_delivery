import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
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
    <View style={styles.screen}>
      {/* Header with Gradient */}
      <LinearGradient colors={BRAND_GRADIENT} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 22 }} />
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Rider Info Card */}
        <View style={styles.profileCard}>
          <Image source={avatar} style={styles.avatar} />
          <Text style={styles.nameText}>{rider?.rider_name || 'Rider'}</Text>
          {!!rider?.description && (
            <Text style={styles.descText}>{rider.description}</Text>
          )}
          {!!rider?.phone_number && (
            <Text style={styles.metaText}>📱 {rider.phone_number}</Text>
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatBox
            icon="box"
            color="#0EA5E9"
            count={profileDetails?.totalDeliveries ?? 0}
            label="Total Deliveries"
          />
          <StatBox
            icon="calendar-check"
            color="#F59E0B"
            count={profileDetails?.currentMonthDeliveries ?? 0}
            label="This Month"
          />
        </View>

        {/* Info Section */}
        <View style={styles.infoList}>
          <InfoRow icon="id-card" title="Rider ID" value={String(rider?.rider_id || '—')} />
          <InfoRow icon="map-marker-alt" title="City" value={rider?.city || '—'} />
          <InfoRow icon="clock" title="Status" value={rider?.status || '—'} />
          <InfoRow icon="calendar" title="Joined" value={new Date(rider?.created_at).toDateString()} />
        </View>
      </ScrollView>

      {/* Footer Navigation */}
      <View style={styles.footer}>
        <TouchableHighlight onPressIn={() => navigation.navigate('Home')} underlayColor="#F1F5F9" style={styles.footerItem}>
          <View style={{ alignItems: 'center' }}>
            <MaterialIcons name="delivery-dining" color={'#000'} size={24} />
            <Text style={styles.footerText}>Delivery</Text>
          </View>
        </TouchableHighlight>

        <TouchableHighlight onPressIn={() => navigation.navigate('Pickup')} underlayColor="#F1F5F9" style={styles.footerItem}>
          <View style={{ alignItems: 'center' }}>
            <FontAwesome5 name="truck-pickup" color={'#000'} size={20} />
            <Text style={styles.footerText}>Pickup</Text>
          </View>
        </TouchableHighlight>

        <View style={[styles.footerItem, { borderTopWidth: 2, borderTopColor: ACCENT }]}>
          <View style={{ alignItems: 'center' }}>
            <Fontisto name="person" color={ACCENT} size={20} />
            <Text style={[styles.footerText, { color: ACCENT }]}>Profile</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

/* ---------- Reusable Components ---------- */
const StatBox = ({ icon, color, count, label }) => (
  <View style={[styles.statBox, { borderColor: color + '55' }]}>
    <View style={[styles.statIcon, { backgroundColor: color + '20', borderColor: color + '55' }]}>
      <FontAwesome5 name={icon} size={14} color={color} />
    </View>
    <Text style={[styles.statCount, { color }]}>{count}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const InfoRow = ({ icon, title, value }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoLeft}>
      <FontAwesome5 name={icon} size={14} color="#F97316" />
      <Text style={styles.infoTitle}>{title}</Text>
    </View>
    <Text style={styles.infoValue}>{value || '—'}</Text>
  </View>
);

/* ---------------------- STYLES ---------------------- */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },

  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: '#fff', fontWeight: '900', fontSize: 20 },

  profileCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    marginTop: -10,
    marginHorizontal: 16,
    paddingVertical: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
  nameText: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  descText: { fontSize: 14, color: '#64748B', fontWeight: '600', marginTop: 2, textAlign: 'center' },
  metaText: { fontSize: 13, color: '#475569', fontWeight: '600', marginTop: 4 },

  statsRow: { flexDirection: 'row', gap: 12, marginTop: 20, marginHorizontal: 16 },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statCount: { fontSize: 22, fontWeight: '900' },
  statLabel: { fontSize: 12, fontWeight: '700', color: '#334155', textAlign: 'center' },

  infoList: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoTitle: { fontWeight: '800', color: '#0f172a' },
  infoValue: { fontWeight: '700', color: '#334155' },

  footer: { flexDirection: 'row', justifyContent: 'space-between', height: 60, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  footerItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  footerText: { fontSize: 11, fontWeight: '600', marginTop: 4, color: '#111827' },
});

export default Profile;