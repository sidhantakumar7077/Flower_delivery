import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, TouchableHighlight, FlatList, TextInput, RefreshControl } from 'react-native'
import React, { useState, useEffect } from 'react'
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Fontisto from 'react-native-vector-icons/Fontisto';
import { base_url } from '../../../App';

const Index = (props) => {

  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [refreshing, setRefreshing] = React.useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [allPickups, setAllPickups] = useState([]);
  const [flowerPrices, setFlowerPrices] = useState({});

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      fetchPickups();
      console.log("Refreshing Successful");
    }, 2000);
  }, []);

  const fetchPickups = async () => {
    const access_token = await AsyncStorage.getItem('storeAccesstoken');
    setIsLoading(true);
    try {
      const response = await fetch(base_url + 'api/rider/get-assign-pickup', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setIsLoading(false);
        // console.log('Pickups fetched successfully', data.data);
        setAllPickups(data.data);
      } else {
        setIsLoading(false);
        console.log('Failed to fetch pickups', data);
      }
    } catch (error) {
      setIsLoading(false);
      console.log('Error', error);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchPickups();
    }
  }, [isFocused]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchPickups();
    }, 10000); // Call every 10 seconds

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  const handlePriceChange = (flowerId, price) => {
    setFlowerPrices((prevPrices) => ({
      ...prevPrices,
      [flowerId]: price,
    }));
  };

  const calculateTotalPrice = (flowerPickupItems) => {
    return flowerPickupItems.reduce((total, flowerItem) => {
      const flowerPrice = parseFloat(flowerPrices[flowerItem.flower?.id] || 0);
      const quantity = parseInt(flowerItem.quantity || 0);
      return total + flowerPrice;
    }, 0).toFixed(2);
  };

  const handleSave = async (pickupId) => {
    const flowerItems = allPickups.find((pickup) => pickup.pick_up_id === pickupId)?.flower_pickup_items || [];

    // Construct the request payload
    const pricesToSave = flowerItems.map((flowerItem) => ({
      flower_id: flowerItem.flower?.product_id,
      price: parseFloat(flowerPrices[flowerItem.flower?.id] || 0).toFixed(2),
    }));

    const totalPrice = pricesToSave.reduce((total, item) => total + parseFloat(item.price), 0).toFixed(2);

    const payload = {
      total_price: parseFloat(totalPrice),
      flower_pickup_items: pricesToSave,
    };

    console.log('Saving prices for pickup:', pickupId, payload);

    try {
      const access_token = await AsyncStorage.getItem('storeAccesstoken');
      const response = await fetch(`${base_url}api/rider/update-flower-prices/${pickupId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Prices saved successfully!", data);
        // Optionally refresh the pickup list
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

  return (
    <SafeAreaView style={{ flex: 1, flexDirection: 'column' }}>
      <View style={styles.headerPart}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Feather name="chevron-left" color={'#555454'} size={30} />
          <Text style={styles.headerTitle}>Pickup</Text>
        </TouchableOpacity>
      </View>
      {!isLoading ?
        <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} showsVerticalScrollIndicator={false}>
          {allPickups.length > 0 ?
            <FlatList
              data={allPickups}
              keyExtractor={(item) => item.pick_up_id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.cardView}>
                  {/* Pickup Info */}
                  <View style={styles.row}>
                    <Text style={styles.label}>📦 Pickup ID:</Text>
                    <Text style={styles.value}>{item.pick_up_id}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>🏪 Vendor Name:</Text>
                    <Text style={styles.value}>{item.vendor.vendor_name}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>📍 Address:</Text>
                    <Text style={styles.value}>{item.vendor.vendor_address}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>📅 Pickup Date:</Text>
                    <Text style={styles.value}>{item.pickup_date}</Text>
                  </View>

                  {/* Flower Items */}
                  {item.flower_pickup_items?.length > 0 && (
                    <View style={{ marginTop: 10 }}>
                      {/* Table Header */}
                      <View style={[styles.row, styles.tableHeader]}>
                        <Text style={[styles.tableHeaderText, { width: '30%' }]}>Flower Name</Text>
                        <Text style={[styles.tableHeaderText, { width: '30%' }]}>Quantity</Text>
                        <Text style={[styles.tableHeaderText, { width: '30%' }]}>Price</Text>
                      </View>

                      {/* Table Rows */}
                      {item.flower_pickup_items.map((flowerItem, index) => (
                        <View key={index} style={[styles.row, styles.tableRow]}>
                          {/* Flower Name */}
                          <Text style={[styles.tableText, { width: '30%' }]}>{flowerItem.flower?.name || 'N/A'}</Text>
                          {/* Quantity */}
                          <Text style={[styles.tableText, { width: '30%' }]}>
                            {flowerItem.quantity || '0'} {flowerItem.unit?.unit_name || ''}
                          </Text>
                          {/* Price Input */}
                          {flowerItem.price && parseFloat(flowerItem.price) > 0 ?
                            <Text style={[styles.value, { width: '30%', textAlign: 'center' }]}>₹{flowerItem.price}</Text>
                            :
                            <TextInput
                              style={[styles.input, { width: '30%', marginVertical: 0 }]}
                              placeholder="Enter price"
                              placeholderTextColor="#999"
                              keyboardType="numeric"
                              value={flowerPrices[flowerItem.flower?.id] || ''}
                              onChangeText={(text) => handlePriceChange(flowerItem.flower?.id, text)}
                            />
                          }
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Total Price */}
                  <View style={styles.row}>
                    <Text style={styles.label}>💰 Total Price:</Text>
                    {item.total_price && parseFloat(item.total_price) > 0 ?
                      <Text style={[styles.value, { width: '30%', textAlign: 'center' }]}>₹{item.total_price}</Text>
                      :
                      <Text style={[styles.value, { width: '30%', textAlign: 'center' }]}>
                        ₹ {calculateTotalPrice(item.flower_pickup_items)}
                      </Text>
                    }
                  </View>

                  {/* Save Button */}
                  {item.total_price === null || parseFloat(item.total_price) === 0 &&
                    <View style={styles.buttonContainer}>
                      <TouchableOpacity
                        style={styles.saveButton}
                        onPress={() => handleSave(item.pick_up_id)}
                      >
                        <Text style={styles.saveButtonText}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  }
                </View>
              )}
            />
            :
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', top: 250 }}>
              <Text style={{ color: '#555', fontSize: 17 }}>No pickups available</Text>
            </View>
          }
        </ScrollView>
        :
        <View style={{ flex: 1, alignSelf: 'center', top: '30%' }}>
          <Text style={{ color: '#ffcb44', fontSize: 17 }}>Loading...</Text>
        </View>
      }
      {/* Bottom Tab */}
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
    </SafeAreaView>

  )
}

export default Index

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // padding: 10,
    // backgroundColor: '#f0ebeb'
  },
  headerPart: {
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 13,
    paddingHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  headerTitle: {
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 5,
  },
  cardView: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    margin: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    width: '45%',
  },
  value: {
    fontSize: 15,
    fontWeight: '400',
    color: '#555',
    width: '55%',
    textAlign: 'left',
  },
  inputRow: {
    alignItems: 'flex-start',
  },
  input: {
    height: 40,
    color: '#000',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    width: '50%',
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  tableRow: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  tableText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#555',
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 15,
  },
  saveButton: {
    width: 150,
    backgroundColor: '#c9170a',
    padding: 10,
    borderRadius: 5,
    // marginTop: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
})