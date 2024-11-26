import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, TouchableHighlight } from 'react-native'
import React from 'react'
// import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Fontisto from 'react-native-vector-icons/Fontisto';

const Index = () => {
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
            <TouchableHighlight activeOpacity={0.6} underlayColor="#DDDDDD" onPress={() => props.navigation.navigate('PoojaPending')} style={{ backgroundColor: '#fff', padding: 10, flexDirection: 'column', alignItems: 'center' }}>
              <View style={{ alignItems: 'center' }}>
                <FontAwesome5 name="truck-pickup" color={'#000'} size={21} />
                <Text style={{ color: '#000', fontSize: 11, fontWeight: '500', marginTop: 4, height: 17 }}>Pickup</Text>
              </View>
            </TouchableHighlight>
          </View>
          <View style={{ padding: 0, width: '30%' }}>
            <TouchableHighlight activeOpacity={0.6} underlayColor="#DDDDDD" style={{ backgroundColor: '#fff', padding: 10, flexDirection: 'column', alignItems: 'center' }}>
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
    // backgroundColor: '#f0ebeb'
  }
})