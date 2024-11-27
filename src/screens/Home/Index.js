import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, TouchableHighlight, FlatList, Animated } from 'react-native'
import React, { useState, useEffect } from 'react'
import { useNavigation, useIsFocused } from '@react-navigation/native';
// import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Fontisto from 'react-native-vector-icons/Fontisto';

const Index = () => {

  const data = [
    { id: '1', phone: '9876543210', address: '123, Park Street, NY' },
    { id: '2', phone: '8765432109', address: '456, Main Street, LA' },
    { id: '3', phone: '7654321098', address: '789, Elm Street, TX' },
  ];

  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [expandedRow, setExpandedRow] = useState(null);

  const toggleExpandRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id); // Toggle row expansion
  };

  const renderTableRow = ({ item, index }) => (
    <View>
      {/* Main Row */}
      <TouchableOpacity onPress={() => toggleExpandRow(item.id)} style={styles.tableRow}>
        <Text style={[styles.tableCell, styles.slNumber]}>{index + 1}</Text>
        <Text style={[styles.tableCell, styles.phone]}>{item.phone}</Text>
        <Text style={[styles.tableCell, styles.address]}>{item.address}</Text>
        <TouchableOpacity
          style={styles.deliveredButton}
          onPress={() => alert(`Delivered to ${item.phone}`)}
        >
          <Text style={styles.deliveredButtonText}>Delivered</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Collapsible Section */}
      {expandedRow === item.id && (
        <Animated.View style={styles.collapsibleContent}>
          <Text style={styles.detailsText}>{item.phone}</Text>
          <Text style={styles.detailsText}>{item.address}</Text>
          {/* <Text style={styles.detailsText}>{item.phone}</Text> */}
        </Animated.View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, flexDirection: 'column' }}>
      <View style={{ width: '100%', alignItems: 'center', paddingVertical: 10, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, shadowRadius: 13, elevation: 5 }}>
        <View style={{ width: '90%', alignSelf: 'center', alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: '#000', fontSize: 17 }}>Hey, <Text style={{ color: 'red', fontSize: 20, fontWeight: 'bold', textTransform: 'capitalize', textShadowColor: '#000', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>Sidhanta</Text></Text>
          <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
            {/* <TouchableOpacity style={{ marginLeft: 8 }}>
              <Octicons name="three-bars" color={'#000'} size={28} />
            </TouchableOpacity> */}
          </View>
        </View>
      </View>
      <View style={styles.container}>
        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>Sl No</Text>
          <Text style={styles.tableHeaderText}>Phone</Text>
          <Text style={styles.tableHeaderText}>Address</Text>
          <Text style={styles.tableHeaderText}>Action</Text>
        </View>
        {/* Table Rows */}
        <FlatList
          data={data}
          renderItem={renderTableRow}
          keyExtractor={(item) => item.id}
        />
      </View>
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
            <TouchableHighlight onPressIn={()=> navigation.navigate('Pickup')} activeOpacity={0.6} underlayColor="#DDDDDD" style={{ backgroundColor: '#fff', padding: 10, flexDirection: 'column', alignItems: 'center' }}>
              <View style={{ alignItems: 'center' }}>
                <FontAwesome5 name="truck-pickup" color={'#000'} size={21} />
                <Text style={{ color: '#000', fontSize: 11, fontWeight: '500', marginTop: 4, height: 17 }}>Pickup</Text>
              </View>
            </TouchableHighlight>
          </View>
          <View style={{ padding: 0, width: '30%' }}>
            <TouchableHighlight onPressIn={()=> navigation.navigate('Profile')} activeOpacity={0.6} underlayColor="#DDDDDD" style={{ backgroundColor: '#fff', padding: 10, flexDirection: 'column', alignItems: 'center' }}>
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
    backgroundColor: '#28a745',
    padding: 5,
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
})