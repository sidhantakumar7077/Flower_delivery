import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, TouchableHighlight, FlatList, Animated, BackHandler, ToastAndroid, PermissionsAndroid, Modal, Alert } from 'react-native'
import React, { useState, useEffect } from 'react'
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from 'react-native-geolocation-service';
// import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Fontisto from 'react-native-vector-icons/Fontisto';
import { base_url } from '../../../App';

const Index = () => {

  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [expandedRow, setExpandedRow] = useState(null);
  const [backPressCount, setBackPressCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [allOrders, setAllOrders] = useState([]);
  const [order_id, setOrder_id] = useState(null);
  const [confirmDeliverModal, setConfirmDeliverModal] = useState(false);
  const openConfirmDeliverModal = () => setConfirmDeliverModal(true);
  const closeConfirmDeliverModal = () => setConfirmDeliverModal(false);

  useEffect(() => {
    const handleBackPress = () => {
      if (backPressCount === 1) {
        BackHandler.exitApp(); // Exit the app if back button is pressed twice within 2 seconds
        return true;
      }
      ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
      setBackPressCount(1);
      const timeout = setTimeout(() => {
        setBackPressCount(0);
      }, 2000); // Reset back press count after 2 seconds
      return true; // Prevent default behavior
    };

    if (isFocused) {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
      return () => backHandler.remove(); // Cleanup the event listener when the component unmounts or navigates away
    }
  }, [backPressCount, isFocused]);

  const toggleExpandRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id); // Toggle row expansion
  };

  const getAllOrders = async () => {
    const access_token = await AsyncStorage.getItem('storeAccesstoken');
    setIsLoading(true);
    try {
      const response = await fetch(base_url + 'api/rider/get-assign-orders', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setIsLoading(false);
        // console.log('Orders fetched successfully', data.data);
        setAllOrders(data.data);
      } else {
        setIsLoading(false);
        console.log('Failed to fetch orders', data);
      }
    } catch (error) {
      setIsLoading(false);
      console.log('Error', error);
    }
  };

  // Function to request location permissions
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      } else {
        Alert.alert('Permission Denied', 'Location permission is required to proceed.');
        return false;
      }
    }
    return true; // iOS permissions are handled automatically in most cases
  };

  // Function to get location
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

  const openConfirmModal = (order_id) => {
    setOrder_id(order_id);
    openConfirmDeliverModal();
  };

  // Update the delivered function
  const delivered = async () => {
    const access_token = await AsyncStorage.getItem('storeAccesstoken');
    closeConfirmDeliverModal();
    try {
      const location = await getLocation();
      if (!location) return;

      const { latitude, longitude } = location.coords;

      console.log("delivering order", order_id, latitude, longitude);
      // return;

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
        console.log('Order delivered successfully', data);
        getAllOrders();
      } else {
        console.log('Failed to deliver order', data);
        Alert.alert('Failed to deliver order', data.message);
      }
    } catch (error) {
      console.log('Error', error);
      Alert.alert('Error', error);
    }
  };

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (isFocused) {
      getAllOrders();
    }
  }, [isFocused]);

  const renderTableRow = ({ item, index }) => (
    <View>
      {/* Main Row */}
      <TouchableOpacity onPress={() => toggleExpandRow(item.id)} style={styles.tableRow}>
        <Text style={[styles.tableCell, styles.slNumber]}>{index + 1}</Text>
        <Text style={[styles.tableCell, styles.phone]}>{item.user.mobile_number.replace('+91', '')}</Text>
        <Text style={[styles.tableCell, styles.address]}>{item.address.apartment_flat_plot}</Text>
        {item.delivery && item.delivery.delivery_status === 'delivered' ?
          <View style={styles.deliveredButton}>
            <Text style={styles.deliveredButtonText}>Delivered</Text>
          </View>
          :
          <TouchableOpacity style={[styles.deliveredButton, { backgroundColor: '#c9170a' }]} onPress={() => openConfirmModal(item.order_id)}>
            <Text style={styles.deliveredButtonText}>Delivery</Text>
          </TouchableOpacity>
        }
      </TouchableOpacity>

      {/* Collapsible Section */}
      {expandedRow === item.id && (
        <Animated.View style={styles.collapsibleContent}>
          <View style={{ width: '100%' }}>
            <Text style={{ color: '#000', fontSize: 17, fontWeight: '600', marginBottom: 8, textDecorationLine: 'underline' }}>Order Details</Text>
            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: '40%' }}>
                <Text style={styles.detailsText}>Order Id:</Text>
              </View>
              <View style={{ width: '60%' }}>
                <Text style={styles.detailsText}>{item.order_id}</Text>
              </View>
            </View>
            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: '40%' }}>
                <Text style={styles.detailsText}>Phone:</Text>
              </View>
              <View style={{ width: '60%' }}>
                <Text style={styles.detailsText}>{item.user.mobile_number.replace('+91', '')}</Text>
              </View>
            </View>
            <Text style={{ color: '#000', fontSize: 17, fontWeight: '600', marginBottom: 8, textDecorationLine: 'underline' }}>Product Details</Text>
            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: '40%' }}>
                <Text style={styles.detailsText}>Name:</Text>
              </View>
              <View style={{ width: '60%' }}>
                <Text style={styles.detailsText}>{item.flower_product.name}</Text>
              </View>
            </View>
            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: '40%' }}>
                <Text style={styles.detailsText}>Price:</Text>
              </View>
              <View style={{ width: '60%' }}>
                <Text style={styles.detailsText}>{item.flower_product.price}</Text>
              </View>
            </View>
            <Text style={{ color: '#000', fontSize: 17, fontWeight: '600', marginBottom: 8, textDecorationLine: 'underline' }}>Address</Text>
            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: '40%' }}>
                <Text style={styles.detailsText}>Flat/Plot:</Text>
              </View>
              <View style={{ width: '60%' }}>
                <Text style={styles.detailsText}>{item.address.apartment_flat_plot}</Text>
              </View>
            </View>
            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: '40%' }}>
                <Text style={styles.detailsText}>Landmark:</Text>
              </View>
              <View style={{ width: '60%' }}>
                <Text style={styles.detailsText}>{item.address.landmark}</Text>
              </View>
            </View>
            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: '40%' }}>
                <Text style={styles.detailsText}>Locality:</Text>
              </View>
              <View style={{ width: '60%' }}>
                <Text style={styles.detailsText}>{item.address.locality_details.locality_name}</Text>
              </View>
            </View>
            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: '40%' }}>
                <Text style={styles.detailsText}>City:</Text>
              </View>
              <View style={{ width: '60%' }}>
                <Text style={styles.detailsText}>{item.address.city}</Text>
              </View>
            </View>
            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: '40%' }}>
                <Text style={styles.detailsText}>Pincode:</Text>
              </View>
              <View style={{ width: '60%' }}>
                <Text style={styles.detailsText}>{item.address.pincode}</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, flexDirection: 'column' }}>
      <View style={{ width: '100%', alignItems: 'center', paddingVertical: 10, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, shadowRadius: 13, elevation: 5 }}>
        <View style={{ width: '90%', alignSelf: 'center', alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: '#000', fontSize: 17 }}>Hey, <Text style={{ color: 'red', fontSize: 20, fontWeight: 'bold', textTransform: 'capitalize', textShadowColor: '#000', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>Sidhanta</Text></Text>
        </View>
      </View>
      {!isLoading ?
        <View style={styles.container}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.slNumber]}>Sl No</Text>
            <Text style={[styles.tableCell, styles.phone]}>Phone</Text>
            <Text style={[styles.tableCell, styles.address]}>Address</Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Action</Text>
          </View>
          {allOrders.length > 0 ?
            <FlatList
              data={allOrders}
              renderItem={renderTableRow}
              keyExtractor={(item) => item.id}
            />
            :
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#555', fontSize: 17 }}>No Orders available</Text>
            </View>
          }
        </View>
        :
        <View style={{ flex: 1, alignSelf: 'center', top: '30%' }}>
          <Text style={{ color: '#ffcb44', fontSize: 17 }}>Loading...</Text>
        </View>
      }
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

      <Modal
        animationType="slide"
        transparent={true}
        visible={confirmDeliverModal}
        onRequestClose={closeConfirmDeliverModal}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContainer}>
            <View style={{ width: '90%', alignSelf: 'center', marginBottom: 10 }}>
              <View style={{ alignItems: 'center' }}>
                <MaterialIcons name="report-gmailerrorred" size={100} color="red" />
                <Text style={{ color: '#000', fontSize: 23, fontWeight: 'bold', textAlign: 'center', letterSpacing: 0.3 }}>Are You Sure, You deliver this?</Text>
                {/* <Text style={{ color: 'gray', fontSize: 17, fontWeight: '500', marginTop: 4 }}>You won't be able to revert this!</Text> */}
              </View>
            </View>
            <View style={{ width: '95%', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', marginTop: 10 }}>
              <TouchableOpacity onPress={closeConfirmDeliverModal} style={styles.cancelDeleteBtn}>
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={delivered} style={styles.confirmDeleteBtn}>
                <Text style={styles.btnText}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

export default Index

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    // backgroundColor: '#f0ebeb'
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#e0e0e0',
  },
  tableHeaderText: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#000',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  tableCell: {
    textAlign: 'center',
    color: '#000',
  },
  slNumber: {
    flex: 0.5, // Smaller width for Sl Number
    textAlign: 'center',
  },
  phone: {
    flex: 1.5,
    textAlign: 'center',
  },
  address: {
    flex: 2,
    textAlign: 'center',
  },
  action: {
    flex: 1,
    textAlign: 'center',
  },
  deliveredButton: {
    width: 70,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#28a745',
    borderRadius: 5,
  },
  deliveredButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  collapsibleContent: {
    backgroundColor: '#f1f1f1',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  detailsText: {
    color: '#000',
    fontSize: 14,
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 15, // Slightly more rounded corners
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 }, // More pronounced shadow
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    padding: 20,
  },
  cancelDeleteBtn: {
    backgroundColor: 'red',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 7
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  confirmDeleteBtn: {
    backgroundColor: 'green',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 7
  },
})