import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView, Image, TouchableHighlight, RefreshControl } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Feather from 'react-native-vector-icons/Feather';
import Fontisto from 'react-native-vector-icons/Fontisto';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { base_url } from '../../../App';

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
      console.log("Refreshing Successful");
    }, 2000);
  }, []);

  const getProfileDetails = async () => {
    const access_token = await AsyncStorage.getItem('storeAccesstoken');
    setIsLoading(true);
    try {
      const response = await fetch(base_url + 'api/rider/details', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setIsLoading(false);
        // console.log('Profile fetched successfully', data.data);
        setProfileDetails(data.data);
      } else {
        setIsLoading(false);
        console.log('Failed to fetch Profile', data);
      }
    } catch (error) {
      setIsLoading(false);
      console.log('Error', error);
    }
  };

  useEffect(() => {
    if (isFocused) {
      getProfileDetails();
    }
  }, [isFocused]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <View style={styles.headerPart}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Feather name="chevron-left" color={'#555454'} size={30} />
          <Text style={styles.headerTitle}>Profile</Text>
        </TouchableOpacity>
      </View>
      {!isLoading ?
        <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} showsVerticalScrollIndicator={false}>
          {/* User Info */}
          <View style={styles.profileContainer}>
            {profileDetails?.riderDetails?.rider_img ?
              <Image
                source={{ uri: profileDetails.riderDetails.rider_img }}
                style={styles.profileImage}
              />
              :
              <Image
                source={require('../../assets/images/user.png')}
                style={styles.profileImage}
              />
            }
            <Text style={styles.userName}>{profileDetails?.riderDetails?.rider_name}</Text>
            <Text style={styles.userDetails}>📱 {profileDetails?.riderDetails?.phone_number}</Text>
            {/* <Text style={styles.userDetails}>📧 john.doe@example.com</Text> */}
          </View>

          {/* Statistics */}
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statCount}>{profileDetails?.totalDeliveries}</Text>
              <Text style={styles.statLabel}>Total Flowers Deliveries</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statCount}>{profileDetails?.currentMonthDeliveries}</Text>
              <Text style={styles.statLabel}>Current Month Deliveries</Text>
            </View>
          </View>
        </ScrollView>
        :
        <View style={{ flex: 1, alignSelf: 'center', top: '30%' }}>
          <Text style={{ color: '#ffcb44', fontSize: 17 }}>Loading...</Text>
        </View>
      }

      {/* Footer Navigation */}
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

export default Profile;

const styles = StyleSheet.create({
  headerPart: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 10,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 5,
    color: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  profileContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userDetails: {
    fontSize: 16,
    color: '#666',
    marginBottom: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  statCount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#28a745',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
});
