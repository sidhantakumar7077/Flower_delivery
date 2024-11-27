import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, TouchableHighlight, FlatList, TextInput } from 'react-native'
import React, { useState, useEffect } from 'react'
import { useNavigation, useIsFocused } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Fontisto from 'react-native-vector-icons/Fontisto';

const Index = (props) => {

  const navigation = useNavigation();
  const isFocused = useIsFocused();

  return (
    <SafeAreaView style={{ flex: 1, flexDirection: 'column' }}>
      <View style={styles.headerPart}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Feather name="chevron-left" color={'#555454'} size={30} />
          <Text style={styles.headerTitle}>Pickup</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        <View style={styles.cardView}>
          {/* Flower Name */}
          <View style={styles.row}>
            <Text style={styles.label}>🌸 Flower Name:</Text>
            <Text style={styles.value}>Rose</Text>
          </View>
          {/* Quantity */}
          <View style={styles.row}>
            <Text style={styles.label}>📦 Quantity:</Text>
            <Text style={styles.value}>20 pieces</Text>
          </View>
          {/* Vendor Name */}
          <View style={styles.row}>
            <Text style={styles.label}>🏪 Vendor Name:</Text>
            <Text style={styles.value}>Flower Shop</Text>
          </View>
          {/* Pickup Location */}
          <View style={styles.row}>
            <Text style={styles.label}>📍 Pickup Location:</Text>
            <Text style={styles.value}>123 Flower St.</Text>
          </View>
          {/* Total Price */}
          <View style={[styles.row, styles.inputRow]}>
            <Text style={styles.label}>💰 Total Price:</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter total price"
              keyboardType="numeric"
            />
          </View>
          {/* Submit Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.submitButton}>
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.cardView}>
          {/* Flower Name */}
          <View style={styles.row}>
            <Text style={styles.label}>🌸 Flower Name:</Text>
            <Text style={styles.value}>Rose</Text>
          </View>
          {/* Quantity */}
          <View style={styles.row}>
            <Text style={styles.label}>📦 Quantity:</Text>
            <Text style={styles.value}>20 pieces</Text>
          </View>
          {/* Vendor Name */}
          <View style={styles.row}>
            <Text style={styles.label}>🏪 Vendor Name:</Text>
            <Text style={styles.value}>Flower Shop</Text>
          </View>
          {/* Pickup Location */}
          <View style={styles.row}>
            <Text style={styles.label}>📍 Pickup Location:</Text>
            <Text style={styles.value}>123 Flower St.</Text>
          </View>
          {/* Total Price */}
          <View style={[styles.row, styles.inputRow]}>
            <Text style={styles.label}>💰 Total Price:</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter total price"
              keyboardType="numeric"
            />
          </View>
          {/* Submit Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.submitButton}>
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    padding: 10,
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
    width: '50%',
    textAlign: 'left',
  },
  inputRow: {
    alignItems: 'flex-start',
  },
  input: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    width: '50%',
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 15,
  },
  submitButton: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
})